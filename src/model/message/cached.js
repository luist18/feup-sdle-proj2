import Message from './index.js'

const _MESSAGE_TYPE = 'cached'

export default class Cached extends Message {
  constructor(content, owner, ownerTimestamp, from, timestamp) {
    super(
      content,
      _MESSAGE_TYPE,
      owner,
      ownerTimestamp,
      from || owner,
      timestamp || ownerTimestamp
    )
  }
}
