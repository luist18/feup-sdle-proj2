import 'dotenv/config'

import Client from './src/model/client/client.js'

if (process.argv.length != 5) {
    console.log('Usage: node index.js <username> <password> <port>')
    process.exit(1)
}

// todo: missing arg validation

const username = process.argv[2]
const password = process.argv[3]
const port = process.argv[4]

const client = new Client(username, port)

export { client }