class SubscriptionManager {
  constructor() {
    this.following = []
    this.changed = false
  }

  add(username) {
    if (this.following.includes(username)) {
      return false
    }

    this.following.push(username)
    this.changed = true
    return true
  }

  remove(username) {
    if (!this.following.includes(username)) {
      return false
    }

    this.following = this.following.filter((u) => u !== username)
    this.changed = true
    return true
  }

  isChanged() {
    return this.changed
  }

  backedUp() {
    this.changed = false
  }

  clear() {
    this.following = []
  }

  has(username) {
    return this.following.includes(username)
  }

  /**
   * Gets the list of usernames that the peer is following.
   *
   * @returns {Array} the array of usernames
   */
  get() {
    return this.following
  }
}

export default SubscriptionManager
