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

    if (
      cached.find((curr) => curr._metadata.id === message._metadata.id) !==
      undefined
    ) {
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

  /**
   * Creates string containing the JSON of the cached posts
   *
   * @return {string} JSON string of the cache
   */
  toJSON() {
    return JSON.stringify(Object.fromEntries(this.posts))
  }

  /**
   * Uses provided string to create map of the cached posts
   *
   * @param {string} json JSON string of the cache
   */
  fromJSON(json) {
    this.posts = new Map(Object.entries(JSON.parse(json)))
  }

  /**
   * Checks if the cache was changed since the last backup.
   *
   * @returns {Boolean} true if changes happened since the last backup.
   */
  isChanged() {
    return this.changed
  }

  /**
   * Gets the cached posts of a list of owners.
   *
   * @param {string[]} owners the owners to check
   * @param {number} since the minimum timestamp of the posts
   *
   * @returns {Map<string, Message[]>} the cached posts of the owners
   */
  getAll(owners, since = -1) {
    const cached = new Map()

    owners.forEach((owner) => {
      if (this.posts.has(owner)) {
        const cachedPosts = this.posts.get(owner).filter((message) => message._metadata.ownerTimestamp > since)

        cached.set(owner, cachedPosts)
      }
    })

    return cached
  }

  /**
   * Deletes the cache entries of a user.
   *
   * @param {string} owner the owner identifier
   * @returns {boolean} true if the user was deleted, false otherwise
   */
  deleteEntry(owner) {
    if (!this.posts.has(owner)) {
      return false
    }

    return this.posts.delete(owner)
  }

  has(owner) {
    return this.posts.has(owner)
  }
}

export default Cache
