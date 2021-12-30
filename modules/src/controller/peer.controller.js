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

    return res.status(200).json({ "message": "Peer started" })
}

export async function stop(req, res) {
    // todo: missing validation
    throw new Error('Not implemented')
}

export async function subscribe(req, res) {
    const peer = client.peer
    
    if (peer.status !== "online")
        return res.status(404).json({ "message": "Peer is offline" })

    const { channel } = req.body
   
    // todo: fix validation
    /*try {
        await peer.peer.peerRouting.findPeer(PeerId.createFromB58String(channel))
    } catch (err) {
        console.log(err)
        console.log("Channel could not be established: Peer not found")
        return res.status(404).json({ "message": "Peer not found" })
    }*/

    await peer.subscribe(channel)

    return res.status(200).json({ "message": "Subscribed to channel" })
}

export async function unsubscribe(req, res) {
    const peer = client.peer
    
    if (peer.status !== "online")
        return res.status(404).json({ "message": "Peer is offline" })

    const { channel } = req.body

    // todo: missing validation
    await peer.unsubscribe(channel)

    return res.status(200).json({ "message": "Unsubscribed from channel" })
}

export async function post(req, res) {
    const peer = client.peer

    // todo: missing validation
    const { message } = req.body

    await peer.send(message)

    return res.status(200).json({ "message": "Message sent" })
}