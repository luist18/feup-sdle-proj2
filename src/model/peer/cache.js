class Cache {
  constructor() {
    this.cache = new Map()
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

    return true
  }

  get(owner, since) {
    const cached = this.cache.get(owner)

    if (since === undefined) {
      return cached
    }

    return cached.filter((message) => message._metadata.ownerTimestamp > since)
  }
}

export default Cache
