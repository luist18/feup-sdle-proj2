import 'dotenv/config'

import app from './src/app.js'

if (process.argv.length !== 4) {
  // eslint-disable-next-line no-console
  console.log('Usage: node index.js <port> <username>')
  process.exit(1)
}

const port = process.argv[2]
const username = process.argv[3]

if (typeof port !== 'string' || Number.isInteger(Number(port)) === false) {
  // eslint-disable-next-line no-console
  console.log('Usage: node index.js <port> <username>')
  process.exit(1)
}

app(username, port).listen(port)
