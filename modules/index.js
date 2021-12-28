import 'dotenv/config'
import app from './src/app.js'
import Peer from './src/peer/index.js'

const PORT = process.env.PORT || 8081

const peer = new Peer()
const server = app.listen(PORT)

export { server, peer }