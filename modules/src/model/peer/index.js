import PeerId from 'peer-id'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

import boot from './boot.js'

class Peer {
  constructor(username) {
    this.online = false
    this.username = username
    this.followedUsers = [] // TODO: optimize
  }

  isOnline() {
    return this.online
  }

  async start(multiaddr) {
    // Peer is already online
    if (this.online){
      console.log("Peer is already online")
      return
    }
    
    this.peer = await boot()

    await this.peer.start()

    this.online = true

    // Peer is invited to the network
    if (multiaddr)
      await this.connect(multiaddr)

    // Prints this peer's addresses
    this.peer.multiaddrs.forEach((ma) => console.log(`${ma.toString()}/p2p/${this.peer.peerId.toB58String()}`))
  }

  async connect(multiaddr) {
    // Connects to peer that invited
    const conn = await this.peer.dial(multiaddr)

    console.log(`Connected to ${conn.remotePeer.toB58String()}`)
  }

  async subscribe(username) {
    // Assures idempotent subscribe
    if (this.followedUsers.includes(username))
      return true

    // Adds listener
    this.peer.pubsub.on(username, (post) => {
      // TODO: save post
      // Idea: create a dispatcher, send this message to the dispatcher and dispatcher provides a websocket to communicate with clients
      console.log(`User ${username} posted ${uint8ArrayToString(post.data)}`)
    })

    // Adds to followed to users
    this.followedUsers.push(username)
    this.followedUsers.forEach((item) => console.log(item))

    this.peer.pubsub.subscribe(username)
    
    console.log(`User ${this.username} followed user ${username}`)
    return false
  }

  async unsubscribe(username) {
    // Verifies if user is subscribed to the user that he wants to unsubscribe
    if (!this.followedUsers.includes(username))
      return true

    this.peer.pubsub.unsubscribe(username)
    
    console.log(`User ${this.username} unfollowed user ${username}`)
    return false
  }

  async send(data) {
    // TODO: think about this what should the channel be?
    await this.peer.pubsub.publish(this.username, uint8ArrayFromString(data))

    console.log(`User ${this.username} published message ${data}`)
  }
}

export default Peer