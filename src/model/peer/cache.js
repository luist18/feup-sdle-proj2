class Cache {
  constructor() {
    this.cache = new Map()
    this.changed = false
  }

  add(message) {
    const { owner } = message._metadata

    if (!this.cache.has(owner)) {
      this.cache.set(owner, [])
    }

    const cached = this.cache.get(owner)

    if (cached.find((curr) => curr._metadata.id === message._metadata.id) !== undefined) {
      return false
    }

    cached.push(message)
    this.changed = true
    return true
  }

  get(owner, since) {
    const cached = this.cache.get(owner)

    if (since === undefined) {
      return cached
    }

    return cached.filter((message) => message._metadata.ownerTimestamp > since)
  }

  toJSON() {
    return JSON.stringify(Object.fromEntries(this.cache))
  }

  fromJSON(json) {
    this.cache = new Map(Object.entries(JSON.parse(json)))
  }

  isChanged() {
    return this.changed
  }
}

export default Cache
