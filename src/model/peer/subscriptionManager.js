class SubscriptionManager {
  constructor() {
    this.following = []
  }

  add(username) {
    if (this.following.includes(username)) {
      return false
    }

    this.following.push(username)
    return true
  }

  remove(username) {
    if (!this.following.includes(username)) {
      return false
    }

    this.following = this.following.filter((u) => u !== username)
    return true
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
