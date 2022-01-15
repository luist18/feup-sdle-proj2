/**
 * This class stores all posts from all other peers
 */
export default class TimelineManager {
  constructor() {
    this.posts = new Map()
    this.changed = false
  }

  add(post) {
    const { user } = post.data

    if (!this.posts.has(user)) {
      this.posts.set(user, [])
    }

    const userPosts = this.posts.get(user)

    userPosts.push(post)

    this.changed = true
  }

  toJSON() {
    return JSON.stringify(Object.fromEntries(this.posts))
  }

  fromJSON(json) {
    this.posts = new Map(Object.entries(JSON.parse(json)))
  }

  isChanged() {
    return this.changed
  }
}
