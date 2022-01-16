import { NOISE } from '@chainsafe/libp2p-noise'
import libp2p from 'libp2p'
import Gossipsub from 'libp2p-gossipsub'
import kadDHT from 'libp2p-kad-dht'
import Mplex from 'libp2p-mplex'
import TCP from 'libp2p-tcp'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { readFileSync, writeFileSync } from 'fs'
import PeerId from 'peer-id'
import cron from 'cron'
import CacheProtocol from './protocol/cache.protocol.js'
import peerConfig from '../../config/peer.js'
import AuthManager from '../auth/index.js'
import Notices from './notices.js'
import Protocols from './protocols.js'
import Cache from './cache.js'
import topics from '../message/topics.js'
import MessageBuilder from '../message/builder.js'
import PostManager from '../timeline/postManager.js'
import TimelineManager from '../timeline/index.js'
import SubscriptionManager from './subscriptionManager.js'

const PEER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline'
}

const jsonPath = './src/model/peer/metadata/'

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
    this.followedUsers = []
    this.addedUser = false

    this.libp2p = null

    this.status = Peer.STATUS.OFFLINE

    this.authManager = new AuthManager()
    this.postManager = new PostManager()

    this.subManager = new SubscriptionManager(this)
    this.messageBuilder = new MessageBuilder(this.username)

    this.cache = new Cache()

    this.cacheProtocol = new CacheProtocol(this)
    this.protocols = new Protocols(this)
    this.notices = new Notices(this)

    this.timeline = new TimelineManager()

    // Stores subs in 5 second interval, if changes occurred
    this.job = new cron.CronJob(
      '*/5 * * * * *',
      this.storeData.bind(this)
    )
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

    // Imports peerId, if exists
    let peerID
    try {
      peerID = await PeerId.createFromJSON(JSON.parse(readFileSync(`${jsonPath}${this.username}_id.json`)))
    } catch (err) {
      console.log('Peer ID file not found.')
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
      peerId: peerID,
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

    this.protocols.subscribeAll()
    this.notices.subscribeAll()
    this.cacheProtocol.register()

    this.job.start()

    // Imports cache of followed users and itself, if exists
    try {
      const jsonData = readFileSync(`${jsonPath}${this.username}_cache.json`)
      this.cache.fromJSON(jsonData)
    } catch (err) {
      console.log('Cache file not found.')
    }

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

    writeFileSync(
      `${jsonPath}${this.username}_id.json`,
      JSON.stringify(this.id()),
      'utf8'
    )

    this.job.stop()

    this.followedUsers = []

    this.status = Peer.STATUS.OFFLINE

    return true
  }

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
   * Connects the peer to another peer.
   *
   * @param {PeerId|Multiaddr|string} multiaddr the identifier of the peer to connect to
   * @returns {Promise<Connection>} a promise that resolves when the connection is established or failed
   */
  async connect(multiaddr) {
    const conn = await this._libp2p().dial(multiaddr)

    return conn
  }

  async login(privateKey) {
    // TODO verify with persistence if the credentials are valid

    // asks neighbors if the credentials are correct
    const { bestNeighbor: bestNeighborId, bestReply: credentialsCorrect } =
      await this.protocols.checkCredentials(this.username, privateKey)

    if (!credentialsCorrect) {
      return false
    }

    // TODO additional measures (like ask to sign random string)

    // TODO not get the database right away, but check persistence first
    // and check the ID

    // gets the database from the neighbor
    const database = await this.protocols.database(bestNeighborId)

    // sets it as the current database
    this.authManager.setDatabase(database)

    this.authManager.updateKeys(this.username, privateKey)

    return true
  }

  // creates a new user in the network
  async createCredentials() {
    // asks neighbors if the username already exists
    const { bestNeighbor: bestNeighborId, bestReply: usernameAlreadyExists } =
      await this.protocols.usernameExists(this.username)
    if (usernameAlreadyExists) {
      return false
    }

    // gets the database from the neighbor
    const database = await this.protocols.database(bestNeighborId)

    // creates the credentials
    this.authManager.createCredentials()
    // TODO persistence

    // adds the user to the database
    database.set(this.username, this.authManager.publicKey)

    // sets it as the current database
    this.authManager.setDatabase(database)

    // floods the new user to the network
    this.notices.publishDbPost(
      this.username,
      this.authManager.publicKey,
      this.authManager.getDatabaseId()
    )

    return true
  }

  token() {
    // TODO make token
    return `${this._libp2p().multiaddrs[0].toString()}/p2p/${this._libp2p().peerId.toB58String()}`
  }

  addresses() {
    return this._libp2p().multiaddrs.map((multiaddr) => multiaddr.toString())
  }

  neighbors() {
    const peersMap = this._libp2p().peerStore.peers

    return [...peersMap.values()].map((peer) => peer.id)
  }

  async subscribe(username) {
    if (username === this.username) {
      throw new Error(peerConfig.error.SELF_SUBSCRIPTION)
    }

    if (!this.authManager.hasUsername(username)) {
      throw new Error(peerConfig.error.USERNAME_NOT_FOUND)
    }

    // Assures idempotent subscribe
    if (this.followedUsers.includes(username)) {
      return false
    }

    // Adds listener
    this._libp2p().pubsub.on(
      topics.topic(topics.prefix.POST, username),
      ({ data }) => this._handlePost(data).bind(this)
    )

    // Adds to followed to users
    this.followedUsers.push(username)
    this.addedUser = true

    this._libp2p().pubsub.subscribe(topics.topic(topics.prefix.POST, username))

    console.log(`User ${this.username} followed user ${username}`)
    return true
  }

  async unsubscribe(username) {
    // Verifies if user is subscribed to the user that he wants to unsubscribe
    if (!this.followedUsers.includes(username)) {
      return false
    }

    this._libp2p().pubsub.unsubscribe(username)

    console.log(`User ${this.username} unfollowed user ${username}`)
    return true
  }

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
    console.log('Received message: ' + data)

    // TODO: verify authenticity

    this._storePost(message)

    // send the post to neighbors to cache it
    this.cacheProtocol.add(message)
  }

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
   * Stores the current peer subscriptions in a metadata file.
   *
   */
  storeData() {
    if (this.addedUser) {
      const subs = JSON.stringify(this.followedUsers)
      writeFileSync(`${jsonPath}${this.username}_sub.json`, subs)
      this.addedUser = false
      console.log('Backed up all users')
    }

    if (this.cache.isChanged()) {
      writeFileSync(
        `${jsonPath}${this.username}_cache.json`,
        this.cache.toJSON(),
        'utf8'
      )
      console.log('Backed up cache')
      this.cache.changed = false
    }

    if (this.postManager.isChanged()) {
      const posts = JSON.stringify(this.postManager.getPosts())
      writeFileSync(`${jsonPath}${this.username}_posts.json`, posts)
      console.log('Backed up post managers')
      this.postManager.backedUp()
    }
  }

  /**
   * Recovers the current peer subscriptions from metadata file.
   *
   */
  async recoverSubscriptions() {
    try {
      const followed = JSON.parse(
        readFileSync(`${jsonPath}${this.username}_sub.json`)
      )
      followed.forEach(this.arg.bind(this))
    } catch (err) {
      console.log('Subscriptions file not found.')
    }
  }

  /**
   * Recovers the previous posts sent by the peer.
   *
   */
  recoverOwnPosts() {
    try {
      const ownPosts = JSON.parse(
        readFileSync(`${jsonPath}${this.username}_posts.json`)
      )
      ownPosts.forEach((post) => this.postManager.push(post))
    } catch (err) {
      console.log('Post file not found.')
    }
  }

  async arg(user) {
    await this.subscribe(user)
  }

  /**
   * Creates timeline from cache
   *
   */
  createTimeline() {
    this.cache.posts.forEach((posts, user) => {
      if (this.followedUsers.includes(user)) {
        this.timeline.posts.set(user, posts.slice())
      }
    })
  }
}
