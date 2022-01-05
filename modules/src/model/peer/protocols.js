import { pipe } from 'it-pipe'
import Database from '../auth/database.js'
import Message from '../message/index.js'
import * as crypto from 'crypto'

const SIGN_ALGORITHM = 'SHA256'

// protocols are messages exchanged between single peers
export default class Protocols {
  constructor(peer) {
    this.peer = peer
  }

  // handles the subscriptions to peer protocol
  subscribeAll() {
    this.subscribe('/usernameExists', this.handleUsernameExists.bind(this))
    this.subscribe('/database', this.handleDatabase.bind(this))
    this.subscribe('/checkCredentials', this.handleCheckCredentials.bind(this))
  }

  // dest: peerId or multiaddr
  // protocol: string
  // body: object (will be wrapped in Message.data)
  // sink: function that receives a Message
  // returns whatever sink returns
  async sendTo(dest, protocol, body, sink) {
    console.log(`dialing protocol: ${protocol}`)
    const { stream } = await this.peer.libp2p.dialProtocol(dest, protocol)

    return await this.send(stream, body, sink)
  }

  // stream: stream
  // body: object (will be wrapped in Message.data)
  // sink: function that receives a Message
  // returns whatever sink returns or null
  async send(stream, body, sink = null) {
    const message = new Message(body)

    let res = null

    console.log(`sending: ${JSON.stringify(message)}`)

    if (sink) {
      await pipe(
      // Source data
        [JSON.stringify(message)],
        // Write to the stream, and pass its output to the next function
        stream,
        // Sink function
        async(source) => {
          for await (const data of source) {
            console.log(`received answer: ${data}`)
            res = sink(data)
          }
        }
      )
    } else {
      await pipe(
      // Source data
        [JSON.stringify(message)],
        // Write to the stream, and pass its output to the next function
        stream
      )
    }

    return res
  }

  async usernameExists(username) {
    // gets the neighbors
    const neighbors = this.peer.neighbors()

    console.log(neighbors)
    let bestDatabaseId = -1
    let bestReply = false
    let bestNeighbor = null

    // sends the username to the neighbors
    for await (const neighbor of neighbors) {
      const { databaseId, usernameExists } = await this.sendTo(neighbor,
        '/usernameExists',
        { username: username },
        async(data) => {
          // deals with the reply
          const rep = JSON.parse(data)

          return { databaseId: rep.data.databaseId, usernameExists: rep.data.usernameExists }
        })

      if (databaseId > bestDatabaseId) {
        bestDatabaseId = databaseId
        bestReply = usernameExists
        bestNeighbor = neighbor
      }
    }

    return { bestNeighbor, bestReply }
  }

  async database(peerId) {
    const db = await this.sendTo(
      peerId,
      '/database',
      {},
      async(data) => {
        const message = JSON.parse(data)

        const entries = message.data.entries
        const id = message.data.id
        return new Database(id, entries)
      }
    )

    return db
  }

  async checkCredentials(username, privateKey) {
    // gets the neighbors
    const neighbors = this.peer.neighbors()

    let bestDatabaseId = -1
    let bestReply = false
    let bestNeighbor = null

    const signature = crypto.sign(SIGN_ALGORITHM, Buffer.from(username), privateKey).toString('base64')

    // sends the username to the neighbors
    for await (const neighbor of neighbors) {
      const { databaseId, credentialsCorrect } = await this.sendTo(neighbor,
        '/checkCredentials',
        {
          username: username,
          signature: signature
        },
        async(data) => {
          // deals with the reply
          const rep = JSON.parse(data)

          return { databaseId: rep.data.databaseId, credentialsCorrect: rep.data.credentialsCorrect }
        })

      if (databaseId > bestDatabaseId) {
        bestDatabaseId = databaseId
        bestReply = credentialsCorrect
        bestNeighbor = neighbor
      }
    }

    return { bestNeighbor, bestReply }
  }

  subscribe(protocol, handler) {
    this.peer.libp2p.handle(protocol, ({ stream }) => {
      console.log(`received protocol: ${protocol}`)
      handler({ stream }).bind(this)()
    })
  }

  // returns the object that was returned by the handler function
  async receive(stream, handler) {
    let object = null
    await pipe(stream,
      async function(source) {
        for await (const msg of source) {
          const message = JSON.parse(msg)
          console.log(`received: ${JSON.stringify(message)}`)
          object = handler(message)
        }
      })

    return object
  }

  async handleUsernameExists({ stream }) {
    const { usernameExists, databaseId } = await this.receive(stream, (message) => {
      const { data } = message
      const { username } = data

      // verifies if the username exists
      const usernameExists = this.peer.auth.db.usernameExists(username)
      const databaseId = this.peer.auth.db.id

      return { usernameExists, databaseId }
    })

    // TODO check if the variables are null
    this.send(stream,
      {
        usernameExists: usernameExists,
        databaseId: databaseId
      })
  }

  async handleDatabase({ stream }) {
    this.send(stream,
      {
        entries: this.peer.auth.db.entries,
        id: this.peer.auth.db.id
      })
  }

  async handleCheckCredentials({ stream }) {
    const { credentialsCorrect, databaseId } = await this.receive(stream, (message) => {
      const { data } = message
      const { username, signature } = data

      // verifies if the username exists
      const userPublicKey = this.peer.auth.db.get(username)
      const databaseId = this.peer.auth.db.id

      if (!userPublicKey) { return { credentialsCorrect: false, databaseId } }

      const credentialsCorrect = crypto.verify(SIGN_ALGORITHM, Buffer.from(username), userPublicKey, Buffer.from(signature, 'base64'))
      return { credentialsCorrect, databaseId }
    })

    this.send(stream,
      {
        credentialsCorrect: credentialsCorrect,
        databaseId: databaseId
      })
  }
}
