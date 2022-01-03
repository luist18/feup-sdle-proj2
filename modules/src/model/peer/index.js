import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import Auth from '../auth/index.js'
import * as protocols from './protocols.js'
import boot from './boot.js'
import { pipe } from 'it-pipe'
import Message from '../message/index.js'

class Peer {
  constructor() {
    this.status = 'offline'

    this.auth = new Auth()
  }

  subscribeProtocols() {
    this.peer.handle('/usernameExists', protocols.usernameExists)
  }

  getStatus() {
    return this.status
  }

  token() {
    // TODO make token
    return `${this.peer.multiaddrs[0].toString()}/p2p/${this.peer.peerId.toB58String()}`
  }

  async start(multiaddr) {
    this.peer = await boot()

    await this.peer.start()

    this.status = 'online'

    // happens when peer is invited to the network
    if (multiaddr)
      await this.connect(multiaddr)

    this.subscribeProtocols()

    // prints this peer's addresses
    this.peer.multiaddrs.forEach((ma) => console.log(`${ma.toString()}/p2p/${this.peer.peerId.toB58String()}`))
  }

  async connect(multiaddr) {
    const conn = await this.peer.dial(multiaddr)

    console.log(`connected to ${conn.remotePeer.toB58String()}`)
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

  async usernameExists(username) {
    // gets the neighbors
    const neighbors = this.#neighbors()

    let bestDatabaseId = 0
    let bestReply = false

    // sends the username to the neighbors
    for await (const neighbor of neighbors) {
      await this.sendTo(neighbor,
        '/usernameExists',
        { "username": username },
        async (source) => {
          for await (const data of source) {
            // it will always only be one message

            // deals with the reply
            const rep = JSON.parse(data)
            console.log(rep.data)
            if (rep.data.databaseId >= bestDatabaseId) {
              bestDatabaseId = rep.data.databaseId
              bestReply = rep.data.usernameExists
            }
          }
        })
    }

    return bestReply
  }

  async sendTo(dest, protocol, body, sink) {
    const { stream } = await this.peer.dialProtocol(dest, protocol)

    await this.send(stream, body, sink)
  }

  async send(stream, body, sink = null) {
    const message = new Message(body)

    if (sink)
      await pipe(
        // Source data
        [JSON.stringify(message)],
        // Write to the stream, and pass its output to the next function
        stream,
        // Sink function
        sink
      )
    else
      await pipe(
        // Source data
        [JSON.stringify(message)],
        // Write to the stream, and pass its output to the next function
        stream
      )

  }

  // returns the IDs of the known peers
  #neighbors() {
    const peersMap = this.peer.peerStore.peers
    const peers = [...peersMap.values()]
    // get only one attribute from the objects
    return peers.map((peer) => peer.id)
  }
}

export default Peer