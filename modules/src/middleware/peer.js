export function validateOnlineStatus(req, res, next) {
  const peer = req.app.get('peer')

  if (!peer.isOnline()) {
    return res.status(401).json({ message: 'You are offline' })
  }

  next()
}
