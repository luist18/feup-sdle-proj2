import debug from 'debug'

export const protocoldebuggger = debug('tp2p:protocol')

class Protocol {
  constructor(peer) {
    this.peer = peer
  }

  register() {
    throw new Error('Protocol.register() is not implemented')
  }

  _subscribe(protocol, handler) {
    this.peer._libp2p().handle(protocol, ({ stream }) => {
      protocoldebuggger(`received message on protocol ${protocol}`)
      handler(stream).bind(this)
    })
  }
}

export default Protocol
