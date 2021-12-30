import app from '../../app.js'
import Peer from '../peer/index.js'

class Client {
    constructor(username, port = 7000) {
        this.username = username

        this.peer = new Peer(username)
        this.server = app.listen(port)
    }
}

export default Client