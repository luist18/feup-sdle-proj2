import Message from './index.js'

const _MESSAGE_TYPE = 'profile-request'

export default class ProfileRequest extends Message {
  constructor(user, since, owner, ownerTimestamp, from, timestamp) {
    super(
      {
        user
      },
      _MESSAGE_TYPE,
      owner,
      ownerTimestamp,
      from || owner,
      timestamp || ownerTimestamp
    )
  }
}
