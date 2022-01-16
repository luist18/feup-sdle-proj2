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

  getAll(timestamp = -1) {
    return this.posts.filter(post => post.data.timestamp > timestamp)
  }
}
