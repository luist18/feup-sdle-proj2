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