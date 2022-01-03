import { pipe } from 'it-pipe'
import Database from '../auth/database.js'
import Message from '../message/index.js'

// protocols are messages exchanged between single peers
export default class Protocols {
    constructor(peer) {
        this.peer = peer
    }

    // handles the subscriptions to peer protocol
    subscribeAll() {
        this.peer.peer.handle('/usernameExists', this.#handleUsernameExists.bind(this))
        this.peer.peer.handle('/database', this.#handleDatabase.bind(this))
    }

    // dest: peerId or multiaddr
    // protocol: string
    // body: object (will be wrapped in Message.data)
    // sink: function that receives a Message
    // returns whatever sink returns
    async sendTo(dest, protocol, body, sink) {
        const { stream } = await this.peer.peer.dialProtocol(dest, protocol)

        return await this.send(stream, body, sink)
    }

    // stream: stream
    // body: object (will be wrapped in Message.data)
    // sink: function that receives a Message
    // returns whatever sink returns or null
    async send(stream, body, sink = null) {
        const message = new Message(body)

        let res = null

        if (sink)
            await pipe(
                // Source data
                [JSON.stringify(message)],
                // Write to the stream, and pass its output to the next function
                stream,
                // Sink function
                async (source) => {
                    for await (const data of source) {
                        res = sink(data)
                    }
                }
            )
        else
            await pipe(
                // Source data
                [JSON.stringify(message)],
                // Write to the stream, and pass its output to the next function
                stream
            )

        return res
    }

    async usernameExists(username) {
        // gets the neighbors
        const neighbors = this.peer.neighbors()

        let bestDatabaseId = -1
        let bestReply = false
        let bestNeighbor = null

        // sends the username to the neighbors
        for await (const neighbor of neighbors) {
            const {databaseId, usernameExists } = await this.sendTo(neighbor,
                '/usernameExists',
                { "username": username },
                async (data) => {
                    // deals with the reply
                    const rep = JSON.parse(data)

                    return { databaseId: rep.data.databaseId, usernameExists: rep.data.usernameExists }
                })

            if (databaseId > bestDatabaseId) {
                bestDatabaseId = databaseId
                bestReply = usernameExists
                bestNeighbor = neighbor
            }
        }

        return { bestNeighbor, bestReply }
    }

    async database(peerId) {
        const db = await this.sendTo(
            peerId,
            '/database',
            {},
            async (data) => {
                const message = JSON.parse(data)

                const entries = message.data.entries
                const id = message.data.id
                return new Database(id, entries)
            }
        )

        return db
    }

    // returns the object that was returned by the handler function
    async #receive(stream, handler) {
        let object = null
        await pipe(stream,
            async function (source) {
                for await (const msg of source) {
                    const message = JSON.parse(msg)
                    object = handler(message)
                }
            }.bind(this))

        return object
    }

    async #handleUsernameExists({ stream }) {
        const { usernameExists, databaseId } = await this.#receive(stream, (message) => {
            const { data } = message
            const { username } = data

            // verifies if the username exists
            const usernameExists = this.peer.auth.db.usernameExists(username)
            const databaseId = this.peer.auth.db.id

            return { usernameExists, databaseId }
        })

        // TODO check if the variables are null
        this.send(stream,
            {
                "usernameExists": usernameExists,
                "databaseId": databaseId
            })
    }

    async #handleDatabase({ stream }) {
        this.send(stream,
            {
                "entries": this.peer.auth.db.entries,
                "id": this.peer.auth.db.id
            })
    }
}