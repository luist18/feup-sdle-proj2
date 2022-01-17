// eslint-disable-next-line no-unused-vars
import Message from '../message/index.js'
import config from '../../config/peer.js'

/**
 * This class stores all posts from all other peers
 */
export default class Timeline {
  constructor() {
    this.posts = new Map()
  }

  /**
   * Adds a post to the timeline.
   *
   * @param {Message} message the message
   * @returns {boolean} whether the post is new or not
   */
  add(message) {
    const { user } = message.data

    if (!this.posts.has(user)) {
      this.posts.set(user, [])
    }

    const userPosts = this.posts.get(user)

    if (
      userPosts.find((post) => post._metadata.id === message._metadata.id) !==
      undefined
    ) {
      return false
    }

    userPosts.push(message)
    return true
  }

  removeOld() {
    for (const [user, posts] of this.posts.entries()) {
      const filtered = [...posts].filter((post) => post._metadata.ownerTimestamp >= Date.now() - config.delay.removeRate)
      this.posts.set(user, filtered)
    }
  }

  /**
   * The timeline of a user.
   *
   * @param {string} user the username
   * @returns {Message[]} the posts
   */
  get(user) {
    return this.posts.get(user)
  }

  /**
   * Gets a post given its id.
   *
   * @param {string} id the post id
   * @returns {Post} the post correspondent to the ID, or undefined if it does not exist
   */
  getPost(id) {
    for (const [, posts] of this.posts) {
      const post = posts.find((post) => post._metadata.id === id)

      if (post !== undefined) {
        return post
      }
    }

    return undefined
  }

  /**
   * Deletes all posts from a user.
   *
   * @param {string} username the username
   * @returns {boolean} whether the posts were removed or not
   */
  deleteEntry(username) {
    if (!this.posts.has(username)) {
      return false
    }

    return this.posts.delete(username)
  }

  /**
   * Replaces the timeline of a user.
   *
   * @param {string} user the username
   * @param {Message[]} timeline the timeline
   */
  replace(user, timeline) {
    this.posts.set(user, [...timeline])
  }

  /**
   * Gets the posts in the timeline after a certain timestamp.
   *
   * @param {number} timestamp the maximum not acceptable timestamp of the posts. Default -1
   * @returns {Post[]} the posts
   */
  getAll(timestamp = -1) {
    const posts = []

    for (const [, userPosts] of this.posts) {
      posts.push(...userPosts.filter((post) => post._metadata.ownerTimestamp > timestamp))
    }

    return posts
  }

  /**
   * Gets the last timestamp of the timeline.
   *
   * @returns {number} the highest timestamp of the posts
   */
  getLastTimestamp() {
    const posts = this.getAll()

    // gets the max timestamp
    const maxTimestamp = posts.reduce((max, post) => {
      if (post._metadata.ownerTimestamp > max) {
        return post._metadata.ownerTimestamp
      }

      return max
    }, -1)

    return maxTimestamp
  }

  /**
   * Creates string containing the JSON of the timeline posts
   *
   * @param {string} json string of the timeline
   */
  fromJSON(json) {
    this.posts = new Map(Object.entries(JSON.parse(json)))
  }
}
