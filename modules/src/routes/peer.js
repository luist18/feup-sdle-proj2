import express from 'express'
const router = express.Router()

import { start, status, stop, subscribe, unsubscribe, post, token, database } from '../controller/peer.controller.js'

// todo: start/stop/subscribe/unsubscribe could be a put

router.get("/status", status)
router.get("/token", token)
router.get("/database", database)

/*
    /start
    body:
        [inviteToken]: string
        [secretKey]: string
    returns:
        200
 */
router.post("/start", start)
router.post("/stop", stop)
router.post("/subscribe", subscribe)
router.post("/unsubscribe", unsubscribe)
router.post("/post", post)

export default router