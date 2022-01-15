// eslint-disable-next-line no-unused-vars
import Message from '../message/index.js'

/**
 * This class stores all posts from all other peers
 */
export default class TimelineManager {
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

    userPosts.push(message)

    return true
  }

  /**
   * Deletes all posts from a user.
   *
   * @param {string} username the username
   * @returns {boolean} whether the posts were removed or not
   */
  deleteAllFrom(username) {
    if (!this.posts.has(username)) {
      return false
    }

    return this.posts.delete(username)
  }
}
