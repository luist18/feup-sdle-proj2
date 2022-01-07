import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import morgan from 'morgan'

import peerRoute from './routes/peer.js'
import Peer from './model/peer/index.js'

function app(username, port) {
  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(cookieParser())
  app.use(morgan('dev'))

  app.use('/peer', peerRoute)

  const peer = new Peer(username, port)

  app.set('peer', peer)

  return app
}

export default app
