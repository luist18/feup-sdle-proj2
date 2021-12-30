import PeerId from 'peer-id'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

import boot from './boot.js'

class Peer {
  constructor(username) {
    this.status = 'offline'
    this.username = username
    this.subscribedUsers = [] // todo: optimize
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

    // peer is invited to the network
    if (multiaddr)
      await this.connect(multiaddr)

    // prints this peer's addresses
    this.peer.multiaddrs.forEach((ma) => console.log(`${ma.toString()}/p2p/${this.peer.peerId.toB58String()}`))
  }

  async connect(multiaddr) {
    const conn = await this.peer.dial(multiaddr)

    console.log(`Connected to ${conn.remotePeer.toB58String()}`)
  }

  async subscribe(username) {
    if (this.subscribedUsers.includes(username))
      return

    this.peer.pubsub.on(username, (msg) => {
      // missing handler
      // idea: create a dispatcher, send this message to the dispatcher and dispatcher provides a websocket to communicate with clients
      console.log(`User ${username} posted ${uint8ArrayToString(msg.data)}`)
    })

    this.peer.pubsub.subscribe(username)
    this.subscribedUsers.push(username)
    this.subscribedUsers.forEach((item) => console.log(item))
    
    console.log(`User ${this.username} followed user ${username}`)
  }

  async unsubscribe(username) {
    // this.peer.pubsub.removeListener(username, this.handler)
    this.peer.pubsub.unsubscribe(username)
    
    console.log(`User ${this.username} unfollowed user ${username}`)
  }

  async send(data) {
    // todo: think about this what should the channel be?
    await this.peer.pubsub.publish(this.username, uint8ArrayFromString(data))

    console.log(`User ${this.username} published message ${data}`)
  }
}

export default Peer