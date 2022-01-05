import 'dotenv/config'

import app from './src/app.js'

if (process.argv.length !== 4) {
  console.log('Usage: node index.js <port> <username>')
  process.exit(1)
}

// todo: missing arg validation

const port = process.argv[2]
const username = process.argv[3]

app(username, port).listen(port)
