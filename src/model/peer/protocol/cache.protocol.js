import topics from '../../message/topics.js'

import Protocol from './protocol.js'
import { send, receive, trade } from '../communication/streaming.js'

class CacheProtocol extends Protocol {
  register() {
    super._subscribe(
      topics.topic(topics.prefix.CACHE, 'add'),
      this._handleAdd.bind(this)
    )
    super._subscribe(
      topics.topic(topics.prefix.CACHE, 'get'),
      this._handleGetFromUser.bind(this)
    )
    super._subscribe(
      topics.topic(topics.prefix.CACHE, 'send-to'),
      this._handleSendTo.bind(this)
    )
  }

  add(message) {
    const messageBuilder = this.peer.messageBuilder

    const cachedMessage = messageBuilder.fromMessage(message)

    console.log(JSON.stringify(cachedMessage))

    this.peer.neighbors().forEach((neighbor) => {
      console.log(`sending cache to ${neighbor}`)

      this.peer
        ._libp2p()
        .dialProtocol(neighbor, topics.topic(topics.prefix.CACHE, 'add'))
        .then(({ stream }) => {
          send(stream, cachedMessage)
        })
    })
  }

  async getFromUser(user, since) {
    const messageBuilder = this.peer.messageBuilder

    const cachedRequest = messageBuilder.buildCacheRequest(user, since)

    const cachedData = new Map()

    for await (const neighbor of this.peer.neighbors()) {
      const { stream } = await this.peer
        ._libp2p()
        .dialProtocol(neighbor, topics.topic(topics.prefix.CACHE, 'get'))

      const message = await trade(stream, cachedRequest)

      const cache = message.data

      cache.forEach((cachedMessage) => {
        const { id } = cachedMessage._metadata

        if (cachedData.has(id)) return

        cachedData.set(id, cachedMessage)
      })
    }

    return cachedData.values()
  }

  async sendTo(peerId, data) {
    console.log(peerId)
    const messageBuilder = this.peer.messageBuilder

    const cacheMessage = messageBuilder.buildCached(data)

    try {
      const { stream } = await this.peer._libp2p().dialProtocol(peerId, topics.topic(topics.prefix.CACHE, 'send-to'))
      console.log('debug')
      send(stream, cacheMessage)
    } catch (err) {
      console.log('fds', err)
    }

  }

  async _handleAdd(stream) {
    const message = await receive(stream)

    console.log(message)

    const { owner } = message._metadata

    if (owner === this.peer.username) return

    this.peer.cache.add(message)
  }

  async _handleGetFromUser(stream) {
    const message = await receive(stream)

    const { user, since } = message.data

    const cached = this.peer.cache.get(user, since)

    const cacheMessage = this.peer.messageBuilder.buildCache(cached)

    send(stream, cacheMessage)
  }

  async _handleSendTo(stream) {
    const message = await receive(stream)

    const { data } = message

    data.forEach((post) => { this.peer._storePost(post) })
  }
}

export default CacheProtocol
