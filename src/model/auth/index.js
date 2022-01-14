import PeerId from 'peer-id'

import { generateKeyPairSync } from '../utils/signature.js'
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
   * Deletes an entry.
   *
   * @param {string} username the username to delete
   */
  delete(username) {
    this._db.delete(username)
  }

  /**
   * Gets the public key associated with a username.
   *
   * @param {string} username the username to lookup
   * @returns the username's public key
   */
  getKeyByUsername(username) {
    return this._db.get(username).publicKey
  }

  /**
   * Gets the B58 string of the username.
   *
   * @param {string} username the username
   * @returns {string} the B58 string of the peer id
   */
  getB58IdByUsername(username) {
    return this._db.get(username).peerId
  }

  /**
   * Gets the PeerId of a username.
   *
   * @param {string} username the username
   * @returns {PeerId} the peer id
   */
  getIdByUsername(username) {
    return PeerId.createFromB58String(this.getB58IdByUsername(username))
  }

  /**
   * Sets a database entry.
   *
   * @param {string} username the username
   * @param {string} publicKey the public key
   * @param {string} peerId the peer id
   */
  setEntry(username, publicKey, peerId) {
    this._db.set(username, publicKey, peerId)
  }

  // creates new credentials
  createCredentials() {
    const { publicKey, privateKey } = generateKeyPairSync()

    this.publicKey = publicKey
    this.privateKey = privateKey
  }

  // creates new database
  createDatabase(username, peerId) {
    this._db = new Database()

    this._db.set(username, this.publicKey, peerId)
  }

  // sets the database
  setDatabase(db) {
    this._db = db
  }

  updateKeys(username, privateKey) {
    this.publicKey = this._db.get(username).publicKey
    this.privateKey = privateKey
  }
}

export default AuthManager
