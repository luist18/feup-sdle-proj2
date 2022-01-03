import 'dotenv/config'

import Client from './src/model/client/client.js'

if (process.argv.length != 4) {
    console.log('Usage: node index.js <port> <username>')
    process.exit(1)
}

// todo: missing arg validation

const port = process.argv[2]
const username = process.argv[3]

const client = new Client(username, port)

export { client }