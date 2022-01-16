class Cache {
  constructor() {
    this.posts = new Map()
    this.changed = false
  }

  add(message) {
    const { owner } = message._metadata

    if (!this.posts.has(owner)) {
      this.posts.set(owner, [])
    }

    const cached = this.posts.get(owner)

    if (cached.find((curr) => curr._metadata.id === message._metadata.id) !== undefined) {
      console.log('Received duplicate message')
      return false
    }

    cached.push(message)
    this.changed = true
    return true
  }

  get(owner, since) {
    const cached = this.posts.get(owner)

    if (since === undefined) {
      return cached
    }

    return cached.filter((message) => message._metadata.ownerTimestamp > since)
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

export default Cache
