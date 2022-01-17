import debug from 'debug'
import topics from '../../message/topics.js'
import Protocol from './protocol.js'
import { send, receive, trade } from '../communication/streaming.js'

export const profiledebugger = debug('tp2p:protocol:profile')

class ProfileProtocol extends Protocol {
  register() {
    super._subscribe(
      topics.topic(topics.prefix.PROFILE, 'request'),
      this._handleRequest.bind(this)
    )
  }

  async request(username, peerId) {
    const { stream } = await this.peer._libp2p().dialProtocol(peerId, topics.topic(topics.prefix.PROFILE, 'request'))

    const message = this.peer.messageBuilder.buildProfileRequest(username)

    return await trade(stream, message)
  }

  async _handleRequest(stream) {
    const message = await receive(stream)

    const { user } = message.data

    if (this.peer.username !== user) {
      profiledebugger(`received profile request for ${user} but my username is ${this.peer.username}`)
      return
    }

    const data = await this.peer.profile()

    const profileMessage = this.peer.messageBuilder.buildProfile(data)

    send(stream, profileMessage)
  }
}

export default ProfileProtocol
