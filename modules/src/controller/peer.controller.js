import PeerId from 'peer-id'
import { client } from '../../index.js'

export async function status(req, res) {
    const peer = client.peer
    const status = peer.getStatus()

    return res.status(200).json({ "message": status })
}

export async function start(req, res) {
    const peer = client.peer

    // todo: missing validation
    const { inviteToken } = req.body

    if (inviteToken)
        await peer.start(inviteToken)
    else
        await peer.start()

    return res.status(200).json({ "message": "You are now online" })
}

export async function stop(req, res) {
    // todo: missing validation
    throw new Error('Not implemented')
}

export async function subscribe(req, res) {
    const peer = client.peer
    
    const { username } = req.body

   
    if (peer.status !== "online")
        return res.status(404).json({ "error": "You are not online" })

    if (username === undefined)
        return res.status(400).json({ "error": "Username not provided" })

    // todo: fix validation
    /*try {
        await peer.peer.peerRouting.findPeer(PeerId.createFromB58String(username))
    } catch (err) {
        console.log(err)
        console.log("Channel could not be established: Peer not found")
        return res.status(404).json({ "message": "Peer not found" })
    }*/

    await peer.subscribe(username)

    return res.status(200).json({ "message": "Followed user" })
}

export async function unsubscribe(req, res) {
    const peer = client.peer
    
    if (peer.status !== "online")
        return res.status(404).json({ "message": "You are not online" })

    if (username === undefined)
        return res.status(400).json({ "error": "Username not provided" })

    const { username } = req.body

    // todo: missing validation
    await peer.unsubscribe(username)

    return res.status(200).json({ "message": "Unfollowed user"})
}

export async function post(req, res) {
    const peer = client.peer

    // todo: missing validation
    const { message } = req.body
    if (message === undefined)
        return res.status(400).json({ "error": "Message not provided" })


    await peer.send(message)

    return res.status(200).json({ "message": "Message successfuly sent" })
}