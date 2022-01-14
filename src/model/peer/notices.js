import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import Message from '../message/index.js'
import topics from '../message/topics.js'
// eslint-disable-next-line no-unused-vars
import Peer from './index.js'

// notices are messages that are sent to all the network
export default class Notices {
  /**
   * Creates the notice manager for a peer.
   *
   * @param {Peer} peer the peer
   */
  constructor(peer) {
    this.peer = peer
  }

  register() {
    this._subscribe(
      topics.topic(topics.prefix.NOTICE, 'db', 'post'),
      this._handleDatabasePost
    )
    this._subscribe(
      topics.topic(topics.prefix.NOTICE, 'db', 'delete'),
      this._handleDatabaseDelete
    )
    this._subscribe(
      topics.topic(topics.prefix.NOTICE, 'profile', 'request'),
      this._handleProfileRequest
    )
  }

  _subscribe(channel, handler) {
    this.peer.libp2p.pubsub.on(channel, (message) => {
      const json = JSON.parse(uint8ArrayToString(message.data))
      const parsedMessage = Message.fromJson(json)
      handler(parsedMessage).bind(this)
    })
    this.peer.libp2p.pubsub.subscribe(channel)
  }

  async publish(channel, body) {
    // todo create a specific build for a notice
    const message = this.peer.messageBuilder.build(body, 'notice')
    console.log(`publishing to ${channel}: ${JSON.stringify(message)}`)
    await this.peer.libp2p.pubsub.publish(
      channel,
      uint8ArrayFromString(JSON.stringify(message))
    )
  }

  async publishDatabasePost(username, publicKey, databaseId) {
    await this.publish(topics.topic(topics.prefix.NOTICE, 'db', 'post'), {
      username,
      publicKey,
      databaseId,
      peerId: this.peer.id().toB58String()
    })
  }

  async publishDatabaseDelete(username, databaseId) {
    await this.publish(topics.topic(topics.prefix.NOTICE, 'db', 'delete'), {
      username,
      databaseId
    })
  }

  async publishProfileRequest(username) {
    await this.publish(
      topics.topic(topics.prefix.NOTICE, 'profile', 'request'),
      {
        username
      }
    )
  }

  _handleDatabasePost(message) {
    console.log('received notice:db:post')

    // TODO accept IDs that are not the one exactly above
    //     if it is even higher, question about the updated database
    //     if it is lower, do something as well

    const { username, publicKey, databaseId, peerId } = message.data

    if (databaseId !== this.peer.authManager.getDatabaseId() + 1) {
      return
    }

    this.peer.authManager.setEntry(username, publicKey, peerId)
  }

  _handleDatabaseDelete(message) {
    console.log('received notice:db:delete')

    // TODO accept IDs that are not the one exactly above
    //     if it is even higher, question about the updated database
    //     if it is lower, do something as well

    const { username, databaseId } = message.data

    if (databaseId !== this.peer.authManager.getDatabaseId() + 1) {
      return
    }

    this.peer.authManager.delete(username)
  }

  /**
   * Handles the profile request notice
   *
   * @param {Message} message
   * @returns {void}
   */
  _handleProfileRequest(message) {
    console.log('received notice:db:profile:request')

    const { username } = message.data
    const { owner } = message._metadata

    try {
      const requester = this.peer.authManager.getIdByUsername(owner)

      // verify if i have the information about the peer

      const cache = this.peer.cache

      if (!cache.has(username)) {
        return
      }

      // get data and send to requester

      const data = cache.get(username)

      this.peer.cacheProtocol.sendTo(requester, data)
    } catch (err) {
      // todo: log the error
    }
  }
}
