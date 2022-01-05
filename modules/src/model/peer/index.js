import libp2p from 'libp2p'
import kadDHT from 'libp2p-kad-dht'
import TCP from 'libp2p-tcp'
import Mplex from 'libp2p-mplex'
import Gossipsub from 'libp2p-gossipsub'
import { NOISE } from '@chainsafe/libp2p-noise'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

import Auth from '../auth/index.js'
import Protocols from './protocols.js'
import Notices from './notices.js'

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
    this.followedUsers = []

    this.libp2p = null

    this.status = Peer.STATUS.OFFLINE

    this.auth = new Auth()

    this.protocols = new Protocols(this)
    this.notices = new Notices(this)
  }

  /**
   * Gets the libpo2p instance.
   *
   * @throws {Error} if the libp2p instance is not initialized,
   * this happens when the peer is offline.
   *
   * @returns {libp2p} the libp2p instance
   */
  _libp2p() {
    if (this.libp2p === null) { throw new Error('libp2p is not initialized') }

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
   * comunication components of the peer. If this method recieves an
   * argument then it will try to connect the peer to the given multiaddr.
   *
   * @param {PeerId|Multiaddr|string} multiaddr the identifier of the invitation peer
   * @returns {Promise<boolean>} a promise that resolves when the peer is online
   */
  async start(multiaddr) {
    this.libp2p = await libp2p.create({
      addresses: {
        listen: [`/ip4/0.0.0.0/tcp/${this.port}`]
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
      if (!await this.connect(multiaddr)) { return false }
    }

    this.protocols.subscribeAll()
    this.notices.subscribeAll()

    return true
  }

  /**
   * Stops the peer. This method will stop the libp2p instance.
   *
   * @returns {Promise<boolean>} a promise that resolves when the peer is offline
   */
  async stop() {
    await this._libp2p().stop()

    this.status = Peer.STATUS.OFFLINE
  }

  /**
   * Connects the peer to another peer.
   *
   * @param {PeerId|Multiaddr|string} multiaddr the identifier of the peer to connect to
   * @returns {Promise<boolean>} a promise that resolves when the connection is established or failed
   */
  async connect(multiaddr) {
    try {
      const conn = await this._libp2p().dial(multiaddr)
      console.log(`connected to ${conn.remotePeer.toB58String()}`)
      return true
    } catch (e) {
      // if the multiaddr is incorrect
      return false
    }
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
    // Assures idempotent subscribe
    if (this.followedUsers.includes(username)) { return false }

    // Adds listener
    this._libp2p().pubsub.on(username, (post) => {
      // TODO: save post
      // Idea: create a dispatcher, send this message to the dispatcher and dispatcher provides a websocket to communicate with clients
      console.log(`User ${username} posted ${uint8ArrayToString(post.data)}`)
    })

    // Adds to followed to users
    this.followedUsers.push(username)

    this._libp2p().pubsub.subscribe(username)

    console.log(`User ${this.username} followed user ${username}`)
    return true
  }

  async unsubscribe(username) {
    // Verifies if user is subscribed to the user that he wants to unsubscribe
    if (!this.followedUsers.includes(username)) { return false }

    this._libp2p().pubsub.unsubscribe(username)

    console.log(`User ${this.username} unfollowed user ${username}`)
    return true
  }

  async send(data) {
    // TODO: think about this what should the channel be?
    await this._libp2p().pubsub.publish(this.username, uint8ArrayFromString(data))

    console.log(`User ${this.username} published message ${data}`)
  }
}
