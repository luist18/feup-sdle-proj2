import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import Auth from '../auth/index.js'
import Protocols from './protocols.js'
import Notices from './notices.js'
import boot from './boot.js'

const PEER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline'
}

export default class Peer {
  constructor(username, port) {
    this.username = username
    this.port = port

    this.status = Peer.STATUS.OFFLINE

    this.auth = new Auth()

    this.protocols = new Protocols(this)
    this.notices = new Notices(this)
  }

  static get STATUS() {
    return PEER_STATUS
  }

  async start(multiaddr) {
    this.peer = await boot()

    await this.peer.start()

    this.status = Peer.STATUS.ONLINE

    // happens when peer is invited to the network
    if (multiaddr) {
      if (!await this.connect(multiaddr)) { return false }
    }

    this.protocols.subscribeAll()
    this.notices.subscribeAll()

    // prints this peer's addresses
    this.peer.multiaddrs.forEach((ma) => console.log(`${ma.toString()}/p2p/${this.peer.peerId.toB58String()}`))

    return true
  }

  async stop() {
    await this.peer.stop()

    this.status = Peer.STATUS.OFFLINE
  }

  async connect(multiaddr) {
    try {
      const conn = await this.peer.dial(multiaddr)
      console.log(`connected to ${conn.remotePeer.toB58String()}`)
    } catch (e) {
      // if the multiaddr is incorrect
      return false
    }

    return true
  }

  token() {
    // TODO make token
    return `${this.peer.multiaddrs[0].toString()}/p2p/${this.peer.peerId.toB58String()}`
  }

  async subscribe(channel) {
    this.peer.pubsub.on(channel, (msg) => {
      // missing handler
      // idea: create a dispatcher, send this message to the dispatcher and dispatcher provides a websocket to communicate with clients
      console.log(`received: ${uint8ArrayToString(msg.data)}`)
    })

    this.peer.pubsub.subscribe(channel)

    console.log(`subscribed to channel ${channel}`)
  }

  async send(data) {
    // todo: think about this what should the channel be?
    const channel = this.peer.peerId.toB58String()

    await this.peer.pubsub.publish(channel, uint8ArrayFromString(data))

    console.log(`sent message ${data} to channel ${channel}`)
  }

  neighbors() {
    const peersMap = this.peer.peerStore.peers
    const peers = [...peersMap.values()]
    // get only one attribute from the objects
    return peers.map((peer) => peer.id)
  }
}
