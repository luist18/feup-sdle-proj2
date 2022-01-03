import * as crypto from 'crypto'
import Database from './database.js'

// holds a peer's auth database as well as its own auth information
// holds functions to deal with these
class Auth {
    constructor() {
        this.db = null

        this.publicKey = null
        this.privateKey = null
    }

    // creates new credentials
    createCredentials() {
        // copy pasted from https://stackoverflow.com/questions/8520973/how-to-create-a-pair-private-public-keys-using-node-js-crypto
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: 'top secret'
            }
        });

        this.publicKey = publicKey
        this.privateKey = privateKey
    }

    // creates new database
    createDatabase(username) {
        this.db = Database.fresh()

        this.db.set(username, this.publicKey)
    }

    // sets the database
    setDatabase(db) {
        this.db = db
    }
}

export default Auth