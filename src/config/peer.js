const SECOND = 1000

export default {
  error: {
    LIBP2P_OFFLINE: 'libp2p is not initialized',
    PEER_CONNECTION_FAILED: 'Could not connect to the peer',
    SELF_SUBSCRIPTION: 'You cannot follow yourself',
    USERNAME_NOT_FOUND: 'User does not exist',
    NOT_FOLLOWING_USER: 'You are not following that user'
  },
  protocols: {
    cache: {
      PROFILE_REQUEST_TIMEOUT: 5 * SECOND
    }
  },
  notices: {
    FLOOD_DELAY: 5 * SECOND
  },
  path: {
    JSONPATH: './metadata/'
  }
}
