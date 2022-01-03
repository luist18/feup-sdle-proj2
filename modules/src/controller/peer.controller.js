import { client } from '../../index.js'

export async function status(req, res) {
    const peer = client.peer
    const status = peer.getStatus()

    return res.status(200).json({ "message": status })
}

export async function start(req, res) {
    const peer = client.peer

    // todo: missing validation
    const { inviteToken, privateKey } = req.body

    // TODO get InviteToken from storage with persistence
    const isNewNetwork = inviteToken === undefined

    if (!isNewNetwork) {
        if (!await peer.start(inviteToken))
            return res.status(400).json({ "message": "invalid token" })

        const isNewUser = privateKey === undefined

        if (isNewUser) {
            if (!await createNewUser(peer))
                return res.status(409).json({ "message": "username already exists" })
        }
        else
            console.log("LOGIN") // TODO
    } else {
        // if the network is new, the user is also new, ignores the secret key
        peer.auth.createCredentials()
        peer.auth.createDatabase(client.name)

        await peer.start()
    }

    return res.status(200).json({
        "message": "Peer started",
        "auth": {
            "publicKey": peer.auth.publicKey,
            "privateKey": peer.auth.privateKey
        }
    })
}

// creates a new user in the network
async function createNewUser(peer) {
    // asks neighbors if the username already exists
    const { bestNeighbor: bestNeighborId, bestReply: usernameAlreadyExists } = await peer.protocols.usernameExists(client.name)
    if (usernameAlreadyExists)
    return false
    
    // gets the database from the neighbor
    const database = await peer.protocols.database(bestNeighborId)
    
    // creates the credentials
    peer.auth.createCredentials()
    // TODO persistence
    
    // adds the user to the database
    database.set(client.name, peer.auth.publicKey)
    
    // sets it as the current database
    peer.auth.setDatabase(database)
    
    // floods the new user to the network
    peer.notices.publishDbPost(client.name, peer.auth.publicKey, peer.auth.db.id)

    return true
}

export async function stop(req, res) {
    // todo: missing validation
    throw new Error('Not implemented')
}

export async function subscribe(req, res) {
    const peer = client.peer

    // todo: missing validation
    const { channel } = req.body

    await peer.subscribe(channel)

    return res.status(200).json({ "message": "Subscribed to channel" })
}

export async function unsubscribe(req, res) {
    // todo: missing validation
    throw new Error('Not implemented')
}

export async function post(req, res) {
    const peer = client.peer

    // todo: missing validation
    const { message } = req.body

    await peer.send(message)

    return res.status(200).json({ "message": "Message sent" })
}

export function token(req, res) {
    const peer = client.peer

    if (peer.status !== "online") {
        return res.status(406).json({ "message": "Peer is not online" })
    }

    return res.status(200).json({ "token": peer.token() })
}

export function database(req, res) {
    const peer = client.peer

    if (peer.status !== "online") {
        return res.status(406).json({ "message": "Peer is not online" })
    }

    return res.status(200).json({ "database": peer.auth.db })
}
