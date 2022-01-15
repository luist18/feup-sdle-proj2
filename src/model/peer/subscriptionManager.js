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

    this.following = this.following.filter(u => u !== username)
    return true
  }

  has(username) {
    return this.following.includes(username)
  }
}

export default SubscriptionManager
