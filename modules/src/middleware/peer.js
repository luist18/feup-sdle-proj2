import rest from '../config/rest.js'

export function validateOnlineStatus(req, res, next) {
  const peer = req.app.get('peer')

  if (!peer.isOnline()) {
    return res.status(rest.status.UNAUTHORIZED).json({ error: rest.message.peer.OFFLINE })
  }

  next()
}
