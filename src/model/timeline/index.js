/**
 * This class stores all posts from all other peers
 */
export default class TimelineManager {
  constructor() {
    this.posts = new Map()
  }

  get(user) {
    return this.posts.get(user)
  }

  add(message) {
    const { user } = message.data

    if (!this.posts.has(user)) {
      this.posts.set(user, [])
    }

    const userPosts = this.posts.get(user)

    if (
      userPosts.find((post) => post._metadata.id === message._metadata.id) !==
      undefined
    ) { return false }

    userPosts.push(message)

    return true
  }

  replace(user, timeline) {
    this.posts.set(user, [...timeline])
  }
}
