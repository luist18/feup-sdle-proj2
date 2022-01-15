import Message from './index.js'

const _MESSAGE_TYPE = 'profile'

export default class Profile extends Message {
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
