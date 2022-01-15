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
      this._handleDatabasePost.bind(this)
    )
    this._subscribe(
      topics.topic(topics.prefix.NOTICE, 'db', 'delete'),
      this._handleDatabaseDelete.bind(this)
    )
    this._subscribe(
      topics.topic(topics.prefix.NOTICE, 'profile', 'request'),
      this._handleProfileRequest.bind(this)
    )
  }

  _subscribe(channel, handler) {
    this.peer.libp2p.pubsub.on(channel, (message) => {
      const json = JSON.parse(uint8ArrayToString(message.data))
      const parsedMessage = Message.fromJson(json)
      handler(parsedMessage)()
    })
    this.peer.libp2p.pubsub.subscribe(channel)
  }

  async publish(channel, body, sign = false) {
    // todo create a specific build for a notice
    const message = this.peer.messageBuilder.build(body, 'notice', sign)
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
    await this.publish(
      topics.topic(topics.prefix.NOTICE, 'db', 'delete'),
      {
        username,
        databaseId
      },
      true
    )
  }

  /**
   * Publishes a profile request.
   *
   * @param {string[]} usernames the usernames
   * @param {number} timestamp the timestamp
   */
  async publishProfileRequest(usernames, timestamp = -1) {
    const filteredUsernames = usernames.filter((current) => current !== this.peer.username)

    if (filteredUsernames.length === 0) {
      return
    }

    await this.publish(
      topics.topic(topics.prefix.NOTICE, 'profile', 'request'),
      {
        usernames: filteredUsernames,
        since: timestamp
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

  async _handleDatabaseDelete(message) {
    console.log('received notice:db:delete')

    // TODO accept IDs that are not the one exactly above
    //     if it is even higher, question about the updated database
    //     if it is lower, do something as well

    if (!this.peer.messageBuilder.isSigned(message)) {
      console.log(`Message by ${message._metadata.owner} is not signed`)
      return
    }

    const { username, databaseId } = message.data

    if (databaseId !== this.peer.authManager.getDatabaseId() + 1) {
      return
    }

    // removes data from database
    this.peer.authManager.delete(username)
    // remove data from cache and unsubscribes the user
    await this.peer.unsubscribe(username)
    this.peer.cache.deleteEntry(username)
  }

  /**
   * Handles the profile request notice
   *
   * @param {Message} message
   * @returns {void}
   */
  async _handleProfileRequest(message) {
    console.log('received notice:db:profile:request')

    const { usernames, since } = message.data
    const { owner } = message._metadata

    if (
      usernames?.length === 0
    ) {
      return
    }

    try {
      const requester = this.peer.authManager.getIdByUsername(owner)

      // verify if i have the information about the peer

      const cache = this.peer.cache

      const map = cache.getAll(usernames, since)

      if ([...map.values()].length === 0) {
        return
      }

      const data = Object.fromEntries(map)

      await this.peer.cacheProtocol.sendTo(requester, data)
    } catch (err) {
      // todo: log the error
      console.log(err)
    }
  }
}
