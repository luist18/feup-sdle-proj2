// stores the information about the authentication of every user in the network
class Database {
  constructor(id = 0, entries = {}) {
    // sequential ID, largest ID = more recent database
    this.id = id
    // map that relates usernames with their public keys
    this.entries = entries
  }

  has(username) {
    console.log(this.entries)
    return this.entries[username] !== undefined
  }

  set(username, publicKey, peerId) {
    this.entries[username] = { publicKey, peerId }
    this.id++
  }

  get(username) {
    return this.entries[username]
  }

  delete(username) {
    delete this.entries[username]
    this.id++
  }
}

export default Database
