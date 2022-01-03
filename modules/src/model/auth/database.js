// stores the information about the authentication of every user in the network
class Database {
    constructor(id = 0, entries = {}) {
        // sequential ID, largest ID = more recent database
        this.id = id
        // map that relates usernames with their public keys
        this.entries = entries
    }

    // creates a new empty database
    static fresh() {
        return new Database()
    }

    usernameExists(username) {
        return this.entries[username] !== undefined
    }

    set(username, publicKey) {
        this.entries[username] = publicKey
        this.id++
    }

    get(username) {
        return this.entries[username]
    }
}

export default Database