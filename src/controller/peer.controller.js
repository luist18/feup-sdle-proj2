import rest from '../config/rest.js'

export async function status(req, res) {
  const peer = req.app.get('peer')

  const status = peer.status
  console.log(peer.followedUsers)

  return res.status(rest.status.OK).json({ message: status })
}

export async function start(req, res) {
  const peer = req.app.get('peer')

  if (peer.isOnline()) {
    return res
      .status(rest.status.OK)
      .json({ message: rest.message.peer.ALREADY_ONLINE })
  }

  const username = peer.username

  // TODO missing validation
  let { inviteToken, token, privateKey } = req.body

  // allow both inviteToken and token
  if (!token) {
    token = inviteToken
  }

  // TODO I think this could be refactored in the future
  if (!token) {
    // if the network is new, the user is also new, ignores the secret key
    peer.authManager.createCredentials()
    peer.authManager.createDatabase(username)

    await peer.start()
  } else {
    let started = false
    try {
      // tries to join the network with the token
      started = await peer.start(token)
    } catch (err) {
      // peer.start raises exception if the token is invalid
      started = false
    }

    if (!started) {
      return res
        .status(rest.status.BAD_REQUEST)
        .json({ message: rest.message.token.INVALID })
    }

    if (privateKey) {
      // if the user inserts its private key, then it is supposed to login
      if (!(await peer.login(privateKey))) {
        await peer.stop()
        return res
          .status(rest.status.UNAUTHORIZED)
          .json({ message: rest.message.credentials.INVALID })
      } // if the credentials (username + pk) are incorrect
    } else {
      if (!(await peer.createCredentials())) {
        await peer.stop()
        return res
          .status(rest.status.CONFLICT)
          .json({ message: rest.message.username.ALREADY_EXISTS })
      }
    }
  }

  return res.status(rest.status.CREATED).json({
    message: rest.message.peer.STARTED,
    auth: {
      publicKey: peer.authManager.publicKey,
      privateKey: peer.authManager.privateKey
    }
  })
}

export async function stop(req, res) {
  const peer = req.app.get('peer')

  const stopped = await peer.stop()

  if (!stopped) {
    return res
      .status(rest.status.OK)
      .json({ message: rest.message.peer.ALREADY_OFFLINE })
  }

  return res.status(rest.status.OK).json({ message: rest.message.peer.STOPPED })
}

export async function subscribe(req, res) {
  const peer = req.app.get('peer')

  // Subscription through usernames
  const { username } = req.body

  if (username === undefined) {
    return res
      .status(rest.status.BAD_REQUEST)
      .json({ error: rest.message.body.missing('username') })
  }

  // TODO: check if user is in the network (works if offline, doesn't work if inexistent)

  try {
    if (!(await peer.subscribe(username))) {
      return res
        .status(rest.status.OK)
        .json({ message: rest.message.subscription.ALREADY_IN })
    } else {
      return res
        .status(rest.status.CREATED)
        .json({ message: rest.message.subscription.ADDED })
    }
  } catch (err) {
    return res.status(rest.status.BAD_REQUEST).json({ message: err.message })
  }
}

export async function unsubscribe(req, res) {
  const peer = req.app.get('peer')

  const { username } = req.body

  if (username === undefined) {
    return res
      .status(rest.status.BAD_REQUEST)
      .json({ error: rest.message.body.missing('username') })
  }

  // TODO: check if user is in the network (works if offline, doesn't work if inexistent)

  if (await peer.unsubscribe(username)) {
    return res
      .status(rest.status.OK)
      .json({ message: rest.message.subscription.DELETED })
  } else {
    return res
      .status(rest.status.CREATED)
      .json({ message: rest.message.subscription.ALREADY_OUT })
  }
}

export async function post(req, res) {
  const peer = req.app.get('peer')

  const { message } = req.body

  // Validation
  if (message === undefined) {
    return res
      .status(rest.status.BAD_REQUEST)
      .json({ error: rest.message.body.missing('message') })
  }

  await peer.post(message)

  return res
    .status(rest.status.CREATED)
    .json({ message: rest.message.post.SENT })
}

export function token(req, res) {
  const peer = req.app.get('peer')

  return res.status(rest.status.OK).json({ token: peer.token() })
}

export function database(req, res) {
  const peer = req.app.get('peer')

  return res.status(rest.status.OK).json({
    database: {
      id: peer.authManager.getDatabaseId(),
      entries: peer.authManager.getDatabaseEntries()
    }
  })
}

export function cache(req, res) {
  const peer = req.app.get('peer')

  return res.status(rest.status.OK).json({
    cache: Object.fromEntries(peer.cache.cache)
  })
}

export async function remove(req, res) {
  const peer = req.app.get('peer')

  peer.authManager.delete(peer.username)
  await peer.notices.publishDbDelete(
    peer.username,
    peer.authManager.getDatabaseId()
  )

  peer.stop(2 * 1000)

  return res.status(rest.status.OK).json({ message: rest.message.peer.REMOVED })
}
