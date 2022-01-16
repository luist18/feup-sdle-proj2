// TODO probably same class as the one that handles cache

/**
 * Stores the sent posts.
 */
export default class PostManager {
  constructor() {
    this.posts = []
  }

  push(post) {
    this.posts.push(post)
  }

  /**
   * Gets a post given its id.
   *
   * @param {string} id the post id
   * @returns {Post} the post correspondent to the ID, or undefined if it does not exist
   */
  get(id) {
    return this.posts.find((post) => post._metadata.id === id)
  }

  getAll(timestamp = -1) {
    return this.posts.filter(post => post.data.timestamp > timestamp)
  }
}
