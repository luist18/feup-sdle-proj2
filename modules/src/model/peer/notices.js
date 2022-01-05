import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import Message from '../message/index.js'

// notices are messages that are sent to all the network
export default class Notices {
  constructor(peer) {
    this.peer = peer
  }

  subscribeAll() {
    this.subscribeNotice('/db/post', this.handleDbPost)
  }

  publishDbPost(username, publicKey, databaseId) {
    this.publish('/db/post', { username, publicKey, databaseId })
  }

  publish(channel, object) {
    const message = new Message(object)
    console.log(`publishing to ${channel}: ${JSON.stringify(message)}`)
    this.peer.libp2p.pubsub.publish(channel, uint8ArrayFromString(JSON.stringify(message)))
  }

  subscribeNotice(channel, handler) {
    this.peer.libp2p.pubsub.on(channel, handler.bind(this))
    this.peer.libp2p.pubsub.subscribe(channel)
  }

  handleDbPost(msg) {
    console.log('received /db/post')

    const message = JSON.parse(uint8ArrayToString(msg.data))

    // TODO accept IDs that are not the one exactly above
    //     if it is even higher, question about the updated database
    //     if it is lower, do something as well

    const { username, publicKey, databaseId } = message.data
    if (databaseId !== this.peer.auth.db.id + 1) { return }

    this.peer.auth.db.set(username, publicKey)
  }
}
