import * as crypto from 'crypto'
import Database from './database.js'

// holds a peer's auth database as well as its own auth information
// holds functions to deal with these
class AuthManager {
  constructor() {
    this._db = null

    this.publicKey = null
    this.privateKey = null
  }

  /**
   * Gets the database id.
   *
   * @returns {number} the database id
   */
  getDatabaseId() {
    return this._db.id
  }

  /**
   * Gets the database entries.
   *
   * @returns {Object} the database entries
   */
  getDatabaseEntries() {
    return this._db.entries
  }

  /**
   * Checks if the username exists in the database.
   *
   * @param {string} username the username to lookup
   * @returns {boolean} whether the username exists in the database
   */
  hasUsername(username) {
    return this._db.has(username)
  }

  /**
   * Gets the public key associated with a username.
   *
   * @param {string} username the username to lookup
   * @returns the username's public key
   */
  getKeyByUsermame(username) {
    return this._db.get(username)
  }

  /**
   * Sets a database entry.
   *
   * @param {string} username the username
   * @param {string} publicKey the public key
   */
  setEntry(username, publicKey) {
    this._db.set(username, publicKey)
  }

  // creates new credentials
  createCredentials() {
    // copy pasted from https://stackoverflow.com/questions/8520973/how-to-create-a-pair-private-public-keys-using-node-js-crypto
    // TODO: make this more secure (and understand it)
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })

    this.publicKey = publicKey
    this.privateKey = privateKey
  }

  getPublicKey(username){
    return this.db.get(username)
  }

  // creates new database
  createDatabase(username) {
    this._db = new Database()

    this._db.set(username, this.publicKey)
  }

  // sets the database
  setDatabase(db) {
    this._db = db
  }

  updateKeys(username, privateKey) {
    this.publicKey = this._db.get(username)
    this.privateKey = privateKey
  }
}

export default AuthManager
