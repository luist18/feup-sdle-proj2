import express from 'express'

import { start, status, stop, subscribe, unsubscribe, post, token, database } from '../controller/peer.controller.js'
const router = express.Router()

router.delete('/stop', stop)
router.delete('/unsubscribe', unsubscribe)

router.get('/database', database)
router.get('/status', status)
router.get('/token', token)

router.post('/post', post)

router.put('/start', start)
router.put('/subscribe', subscribe)

export default router
