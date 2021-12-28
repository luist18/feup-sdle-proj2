import app from '../../app.js'
import Peer from '../peer/index.js'

class Client {
    constructor(name, port = 7000) {
        this.name = name

        this.peer = new Peer()
        this.server = app.listen(port)
    }
}

export default Client