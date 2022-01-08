import express from 'express'

import { validateOnlineStatus } from '../middleware/peer.js'
import { start, status, stop, subscribe, unsubscribe, post, token, database } from '../controller/peer.controller.js'

const router = express.Router()

router.delete('/stop', validateOnlineStatus, stop)
router.delete('/unsubscribe', validateOnlineStatus, unsubscribe)

router.get('/database', validateOnlineStatus, database)
router.get('/status', validateOnlineStatus, status)
router.get('/token', validateOnlineStatus, token)

router.post('/post', validateOnlineStatus, post)

router.put('/start', start)
router.put('/subscribe', validateOnlineStatus, subscribe)

export default router
