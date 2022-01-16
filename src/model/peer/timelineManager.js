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

    if (
      userPosts.find((post) => post._metadata.id === message._metadata.id) !==
      undefined
    ) {
      return false
    }

    userPosts.push(message)

    return true
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
  deleteAllFrom(username) {
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
}
