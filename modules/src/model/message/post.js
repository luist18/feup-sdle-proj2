import Message from './index.js'

export default class Post extends Message {
  constructor(content, owner, ownerTimestamp, from, timestamp) {
    super({
      user: owner,
      content,
      timestamp: ownerTimestamp
    }, owner, ownerTimestamp, from || owner, timestamp || ownerTimestamp)
  }
}
