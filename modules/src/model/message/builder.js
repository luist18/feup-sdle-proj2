import Message from './index.js'
import Post from './post.js'

export default class MessageBuilder {
  constructor(username) {
    this.username = username
  }

  build(data) {
    return new Message(data, this.username, Date.now())
  }

  buildFromMessage(message) {
    return new Message(message.data, message._metadata.owner, this.username, message._metadata.ownerTimestamp, Date.now())
  }

  buildPost(content) {
    return new Post(content, this.username, Date.now())
  }
}
