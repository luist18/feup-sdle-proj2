import Message from './index.js'
import Post from './post.js'
import Cached from './cached.js'
import CacheRequest from './cacheRequest.js'

/**
 * Builds messages to send.
 */
export default class MessageBuilder {
  /**
   * Messages have the username of the sender in its metadata.
   * In order to build a message, the username of the sender is required.
   * This method sets the username of the sender, so that one does not have to be always passing it.
   *
   * @param {string} username the own peer's username
   */
  constructor(username) {
    this.username = username
  }

  /**
   * Builds a new simple message, with the given data content.
   *
   * @param {object} data the data to send
   * @param {string} type the type of the message
   * @returns the message object
   */
  build(data, type) {
    return new Message(data, type, this.username, Date.now())
  }

  /**
   * Messages that contribute to the timeline are special.
   * This builds them.
   *
   * @param {string} content the message to include in the post
   * @returns the Post message
   */
  buildPost(content) {
    return new Post(content, this.username, Date.now())
  }

  /**
   * Messages that contain information cached in a peer.
   *
   * @param {string} content the cached value
   * @returns the Cached message
   */
  buildCached(content) {
    return new Cached(content, this.username, Date.now())
  }

  /**
   * Messages that will ask peers for cached data.
   *
   * @param {string} user the owner of the cached data
   * @param {Data} since the timestamp of the cached data
   * @returns the CacheRequest message
   */
  buildCacheRequest(user, since) {
    return new CacheRequest(user, since, this.username, Date.now())
  }

  /**
   * Messages can come from a peer which is not its owner.
   * For example, for caching purposes, a peer can send a message to other peers,
   *   if those other peers end up sending that message to anyone else,
   *   both the owner (the original peer) and the sender (the peer who sent the message)
   *   are present in the metadata. The same for their timestamps.
   *
   * @param {Message} message the original message
   * @returns the new message
   */
  fromMessage(message) {
    return new Message(
      message.data,
      message._metadata.type,
      message._metadata.owner,
      message._metadata.ownerTimestamp,
      this.username,
      Date.now(),
      message._metadata.id
    )
  }
}
