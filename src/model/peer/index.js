import { NOISE } from '@chainsafe/libp2p-noise'
import libp2p from 'libp2p'
import Gossipsub from 'libp2p-gossipsub'
import kadDHT from 'libp2p-kad-dht'
import Mplex from 'libp2p-mplex'
import TCP from 'libp2p-tcp'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

import peerConfig from '../../config/peer.js'
import AuthManager from '../auth/index.js'
import topics from '../message/topics.js'
import MessageBuilder from '../message/builder.js'
import TimelineManager from '../timeline/index.js'
import CacheProtocol from './protocol/cache.protocol.js'
import ProfileProtocol from './protocol/profile.protocol.js'
import AuthProtocol from './protocol/auth.protocol.js'
import Notices from './notices.js'
import Cache from './cache.js'
import PostManager from './postManager.js'
import SubscriptionManager from './subscriptionManager.js'

const PEER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline'
}

export default class Peer {
  /**
   * Enum representing the status of the peer.
   */
  static get STATUS() {
    return PEER_STATUS
  }

  /**
   * Peer.
   *
   * @param {string} username - the username of the peer
   * @param {number} port - the port of the peer
   */
  constructor(username, port) {
    this.username = username
    this.port = port

    this.libp2p = null

    this.status = Peer.STATUS.OFFLINE

    // message builder
    this.messageBuilder = new MessageBuilder(this.username)

    // managers and cache
    this.authManager = new AuthManager()
    this.postManager = new PostManager()
    this.subscriptionManager = new SubscriptionManager(this)
    this.timeline = new TimelineManager()
    this.cache = new Cache()

    // protocols
    this.notices = new Notices(this)
    this.authProtocol = new AuthProtocol(this)
    this.cacheProtocol = new CacheProtocol(this)
    this.profileProtocol = new ProfileProtocol(this)
  }

  /**
   * Gets the libp2p instance.
   *
   * @throws {Error} if the libp2p instance is not initialized,
   * this happens when the peer is offline.
   *
   * @returns {libp2p} the libp2p instance
   */
  _libp2p() {
    if (this.libp2p === null) {
      throw new Error(peerConfig.error.LIBP2P_OFFLINE)
    }

    return this.libp2p
  }

  /**
   * Registers the protocols.
   */
  _registerProtocols() {
    this.authProtocol.register()
    this.cacheProtocol.register()
    this.profileProtocol.register()
  }

  /**
     * Performs a timed stop.
     *
     * @param {number} timeout the timeout in milliseconds
     * @returns a promise that resolves when the peer is offline
     */
  async _timedStop(timeout) {
    this.status = Peer.STATUS.OFFLINE

    // stops the libp2p instance after timeout
    return new Promise((resolve) => {
      setTimeout(() => {
        this._libp2p()
          .stop()
          .then(() => resolve(true))
          .catch(() => resolve(false))
      }, timeout)
    })
  }

  /**
   * Stores the post in the timeline and cache.
   *
   * @param {Message} message the message
   */
  _storePost(message) {
    this.timeline.add(message)
    this.cache.add(message)
  }

  /**
     * Handles a received post message.
     *
     * @param {Object} data the data
     */
  async _handlePost(data) {
    const raw = uint8ArrayToString(data)

    const message = JSON.parse(raw)

    // TODO: verify authenticity

    this._storePost(message)

    // send the post to neighbors to cache it
    this.cacheProtocol.add(message)
  }

  /**
   * Gets the peer id object of the peer.
   *
   * @returns {PeerId} the peer id
   */
  id() {
    return this._libp2p().peerId
  }

  /**
   * Checks whether the peer is online or not.
   *
   * @returns {boolean} true if the peer is online, false otherwise
   */
  isOnline() {
    return this.status === Peer.STATUS.ONLINE
  }

  /**
   * Starts the peer. This method will start the libp2p instance and
   * communication components of the peer. If this method receives an
   * argument then it will try to connect the peer to the given multiaddr.
   *
   * @param {PeerId|Multiaddr|string} multiaddr the identifier of the invitation peer
   * @returns {Promise<boolean>} a promise that resolves when the peer is online
   */
  async start(multiaddr) {
    if (this.isOnline()) {
      return false
    }

    this.libp2p = await libp2p.create({
      addresses: {
        listen: ['/ip4/0.0.0.0/tcp/0']
      },
      modules: {
        transport: [TCP],
        streamMuxer: [Mplex],
        connEncryption: [NOISE],
        pubsub: Gossipsub,
        // we add the DHT module that will enable Peer and Content Routing
        dht: kadDHT
      },
      config: {
        dht: {
          // dht must be enabled
          enabled: true
        }
      }
    })

    await this._libp2p().start()

    this.status = Peer.STATUS.ONLINE

    // happens when peer is invited to the network
    if (multiaddr) {
      try {
        await this.connect(multiaddr)
      } catch (e) {
        await this.stop()
        throw new Error(peerConfig.error.PEER_CONNECTION_FAILED)
      }
    }

    this._registerProtocols()
    this.notices.register()

    return true
  }

  /**
   * Stops the peer. This method will stop the libp2p instance.
   *
   * @returns {Promise<boolean>} a promise that resolves when the peer is offline
   */
  async stop(timeout = 0) {
    if (!this.isOnline()) {
      return false
    }

    if (timeout > 0) {
      this._timedStop(timeout)
      return true
    }

    await this._libp2p().stop()

    this.status = Peer.STATUS.OFFLINE

    return true
  }

  /**
   * Deletes the information about a peer.
   */
  async delete() {
    this.authManager.delete(this.username)
    await this.notices.publishDatabaseDelete(
      this.username,
      this.authManager.getDatabaseId()
    )
  }

  /**
   * Connects the peer to another peer.
   *
   * @param {PeerId|Multiaddr|string} multiaddr the identifier of the peer to connect to
   * @returns {Promise<Connection>} a promise that resolves when the connection is established or failed
   */
  async connect(multiaddr) {
    const conn = await this._libp2p().dial(multiaddr)

    return conn
  }

  /**
   * Attempts to login the user.
   *
   * @param {string} privateKey the private key
   * @returns a promise that resolves when the peer is logged in
   */
  async login(privateKey) {
    // TODO verify with persistence if the credentials are valid

    // asks neighbors if the credentials are correct
    const { bestNeighbor: bestNeighborId, bestReply: credentialsCorrect } =
      await this.authProtocol.verifyAuth(this.username, privateKey)

    if (!credentialsCorrect) {
      return false
    }

    // TODO additional measures (like ask to sign random string)

    // TODO not get the database right away, but check persistence first
    // and check the ID

    // gets the database from the neighbor
    const database = await this.authProtocol.database(bestNeighborId)

    // sets it as the current database
    this.authManager.setDatabase(database)

    this.authManager.updateKeys(this.username, privateKey)

    return true
  }

  /**
   * Creates the credentials of a peer.
   *
   * @returns {Promise<boolean>} a promise that resolves when the peer credentials are created
   */
  async createCredentials() {
    // asks neighbors if the username already exists
    const { bestNeighbor: bestNeighborId, bestReply: usernameAlreadyExists } =
      await this.authProtocol.hasUsername(this.username)
    if (usernameAlreadyExists) {
      return false
    }

    // gets the database from the neighbor
    const database = await this.authProtocol.database(bestNeighborId)

    // creates the credentials
    this.authManager.createCredentials()
    // TODO persistence

    // adds the user to the database
    database.set(this.username, this.authManager.publicKey, this.id().toB58String())

    // sets it as the current database
    this.authManager.setDatabase(database)

    // floods the new user to the network
    this.notices.publishDatabasePost(
      this.username,
      this.authManager.publicKey,
      this.authManager.getDatabaseId()
    )

    return true
  }

  /**
   * Gets the token of the user.
   *
   * @returns {string} the token
   */
  token() {
    // TODO make token
    return `${this._libp2p().multiaddrs[0].toString()}/p2p/${this._libp2p().peerId.toB58String()}`
  }

  /**
   * Gets the address of the peer.
   *
   * @returns {string[]} the addresses of the peer
   */
  addresses() {
    return this._libp2p().multiaddrs.map((multiaddr) => multiaddr.toString())
  }

  /**
   * Gets the neighbors of the peer.
   *
   * @returns {PeerId[]} the neighbors of the peer
   */
  neighbors() {
    const peersMap = this._libp2p().peerStore.peers

    return [...peersMap.values()].map((peer) => peer.id)
  }

  /**
   * Attempts to subscribe a peer.
   *
   * @param {string} username the username
   * @returns {Promise<boolean>} a promise that resolves when a user is subscribed
   */
  async subscribe(username) {
    if (username === this.username) {
      throw new Error(peerConfig.error.SELF_SUBSCRIPTION)
    }

    if (!this.authManager.hasUsername(username)) {
      throw new Error(peerConfig.error.USERNAME_NOT_FOUND)
    }

    // assures idempotent subscribe
    if (this.subscriptionManager.has(username)) {
      return false
    }

    // adds listener
    this._libp2p().pubsub.on(
      topics.topic(topics.prefix.POST, username),
      ({ data }) => this._handlePost(data).bind(this)
    )

    // subscribes to topic
    this._libp2p().pubsub.subscribe(topics.topic(topics.prefix.POST, username))

    this.subscriptionManager.add(username)

    console.log(`User ${this.username} followed user ${username}`)
    return true
  }

  /**
   * Attempts to unsubscribe a peer.
   *
   * @param {string} username the username
   * @returns {Promise<boolean>} a promise that resolves when a user is unsubscribed
   */
  async unsubscribe(username) {
    // Verifies if user is subscribed to the user that he wants to unsubscribe
    if (!this.subscriptionManager.has(username)) {
      return false
    }

    this._libp2p().pubsub.unsubscribe(username)

    console.log(`User ${this.username} unfollowed user ${username}`)
    return true
  }

  /**
   * Posts a post to the network.
   *
   * @param {string} content the content of a post
   */
  async post(content) {
    const post = this.messageBuilder.buildPost(content)

    // TODO: sign data

    await this._libp2p().pubsub.publish(
      topics.topic(topics.prefix.POST, this.username),
      uint8ArrayFromString(JSON.stringify(post))
    )

    this.postManager.push(post)

    console.log(`User ${this.username} published message ${content}`)
  }

  /**
   * Gets the posts of a user.
   *
   * @param {string} username the username
   * @returns {Promise<Message[]>} a promise that resolves when the posts are retrieved
   */
  async profile(username) {
    // if self return own profile
    if (username === undefined || username === this.username) {
      return this.postManager.posts
    }

    if (!this.subscriptionManager.has(username)) {
      throw new Error(peerConfig.error.NOT_FOLLOWING_USER)
    }

    // try to connect to the destination
    // if not possible ask for more information,
    // merge with the current information and return

    if (!this.authManager.hasUsername(username)) {
      throw new Error(peerConfig.error.USERNAME_NOT_FOUND)
    }

    const destinationId = this.authManager.getIdByUsername(username)

    try {
      this.connect(destinationId)

      const message = await this.profileProtocol.request(username, destinationId)
      const posts = message.data

      this.timeline.replace(username, posts)

      console.log(posts)

      return this.timeline.get(username)
    } catch (err) {
      // asks the data
      await this.notices.publishProfileRequest(username)

      // wait timeout and return the data
      // wait 5 seconds
      await new Promise((resolve) => setTimeout(resolve, peerConfig.protocols.cache.PROFILE_REQUEST_TIMEOUT))

      return this.timeline.get(username)
    }
  }
}
