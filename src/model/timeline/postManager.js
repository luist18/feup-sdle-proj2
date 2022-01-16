// TODO probably same class as the one that handles cache

/**
 * Stores the sent posts.
 */
export default class PostManager {
  constructor() {
    this.posts = []
    this.changed = false
  }

  push(post) {
    this.posts.push(post)
    this.changed = true
  }

  setPosts(posts) {
    this.posts = posts
  }

  isChanged() {
    return this.changed
  }

  backedUp() {
    this.changed = false
  }

  getPosts() {
    return this.posts
  }
}
