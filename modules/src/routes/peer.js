import express from 'express'
const router = express.Router()

import { start, status, stop, subscribe, unsubscribe, post } from '../controller/peer.controller.js'

router.delete("/stop", stop)
router.delete("/unsubscribe", unsubscribe)

router.get("/status", status)

router.post("/post", post)

router.put("/start", start)
router.put("/subscribe", subscribe)

export default router
