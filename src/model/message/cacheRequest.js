import Message from './index.js'

const _MESSAGE_TYPE = 'cache-request'

export default class CacheRequest extends Message {
  constructor(user, since, owner, ownerTimestamp, from, timestamp) {
    super(
      {
        user,
        since
      },
      _MESSAGE_TYPE,
      owner,
      ownerTimestamp,
      from || owner,
      timestamp || ownerTimestamp
    )
  }
}
