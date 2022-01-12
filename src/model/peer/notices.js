import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import Message from '../message/index.js'
import topics from '../message/topics.js'

// notices are messages that are sent to all the network
export default class Notices {
  constructor(peer) {
    this.peer = peer
  }

  subscribeAll() {
    this.subscribeNotice(
      topics.topic(topics.prefix.NOTICE, 'db', 'post'),
      this.handleDbPost
    )
  }

  publishDbPost(username, publicKey, databaseId) {
    this.publish(topics.topic(topics.prefix.NOTICE, 'db', 'post'), {
      username,
      publicKey,
      databaseId
    })
  }

  publish(channel, body) {
    const message = this.peer.messageBuilder.build(body)
    console.log(`publishing to ${channel}: ${JSON.stringify(message)}`)
    this.peer.libp2p.pubsub.publish(
      channel,
      uint8ArrayFromString(JSON.stringify(message))
    )
  }

  subscribeNotice(channel, handler) {
    this.peer.libp2p.pubsub.on(channel, handler.bind(this))
    this.peer.libp2p.pubsub.subscribe(channel)
  }

  handleDbPost(msg) {
    console.log('received notice:db:post')

    const json = JSON.parse(uint8ArrayToString(msg.data))
    const message = Message.fromJson(json)

    // TODO accept IDs that are not the one exactly above
    //     if it is even higher, question about the updated database
    //     if it is lower, do something as well

    const { username, publicKey, databaseId } = message.data
    if (databaseId !== this.peer.authManager.getDatabaseId() + 1) {
      return
    }

    this.peer.authManager.setEntry(username, publicKey)
  }
}
