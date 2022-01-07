export async function status(req, res) {
  const peer = req.app.get('peer')  

  console.log(peer.messages)

  return res.status(200).json({ message: peer.status })
}

export async function start(req, res) {
  const peer = req.app.get('peer')

  if (peer.isOnline()) {
    return res.status(200).json({ message: 'peer is already online' })
  }

  const username = peer.username

  // todo: missing validation
  const { inviteToken, privateKey } = req.body

  // TODO get InviteToken from storage with persistence
  const isNewNetwork = inviteToken === undefined

  if (!isNewNetwork) {
    if (!await peer.start(inviteToken)) { return res.status(400).json({ message: 'invalid token' }) }

    const isNewUser = privateKey === undefined

    if (isNewUser) {
      if (!await peer.createCredentials()) { return res.status(409).json({ message: 'username already exists' }) }
    } else { await peer.login(privateKey) }
  } else {
    // if the network is new, the user is also new, ignores the secret key
    peer.auth.createCredentials()
    peer.auth.createDatabase(username)

    await peer.start()
  }

  return res.status(201).json({
    message: 'Peer started',
    auth: {
      publicKey: peer.auth.publicKey,
      privateKey: peer.auth.privateKey
    }
  })
}

export async function stop(req, res) {
  // TODO: missing validation
  throw new Error('Not implemented')
}

export async function subscribe(req, res) {
  const peer = req.app.get('peer')

  // Subscription through usernames
  const { username } = req.body

  // Validation
  if (!peer.isOnline()) { return res.status(401).json({ error: 'You are offline' }) }

  if (username === undefined) { return res.status(400).json({ error: 'Username not provided' }) }

  // TODO: check if user is in the network (works if offline, doesn't work if inexistent)

  if (!await peer.subscribe(username)) { return res.status(200).json({ message: ' Already followed user' }) } else { return res.status(201).json({ message: 'Followed user' }) }
}

export async function unsubscribe(req, res) {
  const peer = req.app.get('peer')

  const { username } = req.body

  // Validation
  if (!peer.isOnline()) { return res.status(401).json({ error: 'You are offline' }) }

  if (username === undefined) { return res.status(400).json({ error: 'Username not provided' }) }

  // TODO: check if user is in the network (works if offline, doesn't work if inexistent)

  if (await peer.unsubscribe(username)) { return res.status(200).json({ message: 'Unfollowed user' }) } else { return res.status(201).json({ message: "You didn't follow the user" }) }
}

export async function post(req, res) {
  const peer = req.app.get('peer')

  const { message } = req.body

  // Validation
  if (message === undefined) { return res.status(400).json({ error: 'Message not provided' }) }

  await peer.send(message)

  return res.status(200).json({ message: 'Message sent' })
}

export function token(req, res) {
  const peer = req.app.get('peer')

  if (!peer.isOnline()) {
    return res.status(406).json({ message: 'Peer is not online' })
  }

  return res.status(200).json({ token: peer.token() })
}

export function database(req, res) {
  const peer = req.app.get('peer')

  if (!peer.isOnline()) {
    return res.status(406).json({ message: 'Peer is not online' })
  }

  return res.status(200).json({ database: peer.auth.db })
}
