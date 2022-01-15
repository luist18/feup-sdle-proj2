import topics from '../../message/topics.js'
import Database from '../../auth/database.js'
import { sign, verify } from '../../utils/signature.js'
import { send, receive, trade } from '../communication/streaming.js'
import Protocol from './protocol.js'

class AuthProtocol extends Protocol {
  register() {
    super._subscribe(
      topics.topic(topics.prefix.PROTOCOL, 'has-username'),
      this._handleHasUsername.bind(this)
    )
    super._subscribe(
      topics.topic(topics.prefix.PROTOCOL, 'database'),
      this._handleDatabase.bind(this)
    )
    super._subscribe(
      topics.topic(topics.prefix.PROTOCOL, 'verify-auth'),
      this._handleVerifyAuth.bind(this)
    )
  }

  async hasUsername(username) {
    const messageBuilder = this.peer.messageBuilder

    const neighbors = this.peer.neighbors()

    let bestDatabaseId = -1
    let bestReply = false
    let bestNeighbor = null

    // sends the username to the neighbors
    for await (const neighbor of neighbors) {
      const { stream } = await this.peer
        ._libp2p()
        .dialProtocol(
          neighbor,
          topics.topic(topics.prefix.PROTOCOL, 'has-username')
        )

      const message = messageBuilder.build({ username })
      const response = await trade(stream, message)
      const { databaseId, usernameExists } = response.data

      if (databaseId > bestDatabaseId) {
        bestDatabaseId = databaseId
        bestReply = usernameExists
        bestNeighbor = neighbor
      }
    }

    return { bestNeighbor, bestReply }
  }

  async database(peerId) {
    const messageBuilder = this.peer.messageBuilder

    const { stream } = await this.peer
      ._libp2p()
      .dialProtocol(peerId, topics.topic(topics.prefix.PROTOCOL, 'database'))

    const message = messageBuilder.build({})

    const response = await trade(stream, message)

    const { entries, id } = response.data

    return new Database(id, entries)
  }

  async verifyAuth(username, privateKey) {
    const messageBuilder = this.peer.messageBuilder

    const neighbors = this.peer.neighbors()

    let bestDatabaseId = -1
    let bestReply = false
    let bestNeighbor = null

    const signature = sign(username, privateKey)

    // sends the username to the neighbors
    for await (const neighbor of neighbors) {
      const { stream } = await this.peer
        ._libp2p()
        .dialProtocol(
          neighbor,
          topics.topic(topics.prefix.PROTOCOL, 'verify-auth')
        )

      const message = messageBuilder.build({ username, signature })
      const response = await trade(stream, message)
      const { databaseId, credentialsCorrect } = response.data

      if (databaseId > bestDatabaseId) {
        bestDatabaseId = databaseId
        bestReply = credentialsCorrect
        bestNeighbor = neighbor
      }
    }

    return { bestNeighbor, bestReply }
  }

  async _handleHasUsername(stream) {
    const messageBuilder = this.peer.messageBuilder

    const message = await receive(stream)

    const { username } = message.data

    const usernameExists = this.peer.authManager.hasUsername(username)
    const databaseId = this.peer.authManager.getDatabaseId()

    const reply = messageBuilder.build({ usernameExists, databaseId })

    send(stream, reply)
  }

  async _handleDatabase(stream) {
    const messageBuilder = this.peer.messageBuilder

    const message = messageBuilder.build({
      entries: this.peer.authManager.getDatabaseEntries(),
      id: this.peer.authManager.getDatabaseId()
    })

    await send(stream, message)
  }

  async _handleVerifyAuth(stream) {
    const messageBuilder = this.peer.messageBuilder

    const message = await receive(stream)

    const { username, signature } = message.data

    const userPublicKey = this.peer.authManager.getKeyByUsername(username)
    const databaseId = this.peer.authManager.getDatabaseId()

    if (!userPublicKey) {
      const reply = messageBuilder.build({ credentialsCorrect: false, databaseId })
      send(stream, reply)
      return
    }

    const credentialsCorrect = verify(username, signature, userPublicKey)

    const reply = messageBuilder.build({ credentialsCorrect, databaseId })

    send(stream, reply)
  }
}

export default AuthProtocol
