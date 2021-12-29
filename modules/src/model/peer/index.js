import PeerId from 'peer-id'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

import boot from './boot.js'

class Peer {
  constructor() {
    this.status = 'offline'
  }

  getStatus() {
    return this.status
  }

  async start(multiaddr) {
    if (this.status === 'online'){
      console.log("Peer is already online")
      return
    }
    
    this.peer = await boot()

    await this.peer.start()

    this.status = 'online'

    // happens when peer is invited to the network
    if (multiaddr)
      await this.connect(multiaddr)

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

  async unsubscribe(channel) {
    // todo: missing implementation
    throw new Error('Not implemented')
  }

  async send(data) {
    // todo: think about this what should the channel be?
    const channel = this.peer.peerId.toB58String()

    await this.peer.pubsub.publish(channel, uint8ArrayFromString(data))

    console.log(`sent message ${data} to channel ${channel}`)
  }
}

export default Peer