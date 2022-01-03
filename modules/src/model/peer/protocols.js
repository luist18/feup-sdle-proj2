import { client } from '../../../index.js'
import { pipe } from 'it-pipe'

async function usernameExists({ stream }) {
    let usernameExists = null
    let databaseId = null

    await pipe(stream,
        async function (source) {
            for await (const msg of source) {
                // it will always be one me
                const { data } = JSON.parse(msg)
                const { username } = data

                // verifies if the username exists
                usernameExists = client.peer.auth.db.usernameExists(username)
                databaseId = client.peer.auth.db.id
            }
        })

    // TODO check if the variables are null
    client.peer.send(stream,
    {
        "usernameExists": usernameExists,
        "databaseId": databaseId
    })

}

export { usernameExists }