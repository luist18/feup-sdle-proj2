/**
 * This class stores all posts from all other peers
 */
export default class TimelineManager {
  constructor() {
    this.posts = new Map()
  }

  add(message) {
    const { user } = message.data

    if (!this.posts.has(user)) {
      this.posts.set(user, [])
    }

    const userPosts = this.posts.get(user)

    userPosts.push(message)
  }
}
