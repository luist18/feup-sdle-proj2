import { pipe } from 'it-pipe'
import Database from '../auth/database.js'
import Message from '../message/index.js'
import * as crypto from 'crypto'
import topics from '../message/topics.js'

const SIGN_ALGORITHM = 'SHA256'

// protocols are messages exchanged between single peers
export default class Protocols {
  constructor(peer) {
    this.peer = peer
  }

  // handles the subscriptions to peer protocol
  subscribeAll() {
    this.subscribe(
      topics.topic(topics.prefix.PROTOCOL, 'has-username'),
      this.handleUsernameExists.bind(this)
    )
    this.subscribe(
      topics.topic(topics.prefix.PROTOCOL, 'database'),
      this.handleDatabase.bind(this)
    )
    this.subscribe(
      topics.topic(topics.prefix.PROTOCOL, 'verify-auth'),
      this.handleCheckCredentials.bind(this)
    )
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
    // todo: create a specific build function for protocol
    const message = this.peer.messageBuilder.build(body, 'protocol')

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

    let bestDatabaseId = -1
    let bestReply = false
    let bestNeighbor = null

    // sends the username to the neighbors
    for await (const neighbor of neighbors) {
      const { databaseId, usernameExists } = await this.sendTo(
        neighbor,
        topics.topic(topics.prefix.PROTOCOL, 'has-username'),
        { username: username },
        async(data) => {
          // deals with the reply
          const json = JSON.parse(data)
          const rep = Message.fromJson(json)

          return {
            databaseId: rep.data.databaseId,
            usernameExists: rep.data.usernameExists
          }
        }
      )

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
      topics.topic(topics.prefix.PROTOCOL, 'database'),
      {},
      async(data) => {
        const json = JSON.parse(data)
        const message = Message.fromJson(json)

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

    const signature = crypto
      .sign(SIGN_ALGORITHM, Buffer.from(username), privateKey)
      .toString('base64')

    // sends the username to the neighbors
    for await (const neighbor of neighbors) {
      const { databaseId, credentialsCorrect } = await this.sendTo(
        neighbor,
        topics.topic(topics.prefix.PROTOCOL, 'verify-auth'),
        {
          username: username,
          signature: signature
        },
        async(data) => {
          // deals with the reply
          const json = JSON.parse(data)
          const message = Message.fromJson(json)

          return {
            databaseId: message.data.databaseId,
            credentialsCorrect: message.data.credentialsCorrect
          }
        }
      )

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
    await pipe(stream, async function(source) {
      for await (const msg of source) {
        const json = JSON.parse(msg)
        const message = Message.fromJson(json)

        console.log(`received: ${JSON.stringify(message)}`)
        object = handler(message)
      }
    })

    return object
  }

  async handleUsernameExists({ stream }) {
    const { usernameExists, databaseId } = await this.receive(
      stream,
      (message) => {
        const { data } = message
        const { username } = data

        // verifies if the username exists
        const usernameExists = this.peer.authManager.hasUsername(username)
        const databaseId = this.peer.authManager.getDatabaseId()

        return { usernameExists, databaseId }
      }
    )

    // TODO check if the variables are null
    this.send(stream, {
      usernameExists: usernameExists,
      databaseId: databaseId
    })
  }

  async handleDatabase({ stream }) {
    this.send(stream, {
      entries: this.peer.authManager.getDatabaseEntries(),
      id: this.peer.authManager.getDatabaseId()
    })
  }

  async handleCheckCredentials({ stream }) {
    const { credentialsCorrect, databaseId } = await this.receive(
      stream,
      (message) => {
        const { data } = message
        const { username, signature } = data

        // verifies if the username exists
        const userPublicKey = this.peer.authManager.getKeyByUsername(username)
        const databaseId = this.peer.authManager.getDatabaseId()

        if (!userPublicKey) {
          return { credentialsCorrect: false, databaseId }
        }

        const credentialsCorrect = crypto.verify(
          SIGN_ALGORITHM,
          Buffer.from(username),
          userPublicKey,
          Buffer.from(signature, 'base64')
        )
        return { credentialsCorrect, databaseId }
      }
    )

    this.send(stream, {
      credentialsCorrect: credentialsCorrect,
      databaseId: databaseId
    })
  }
}
