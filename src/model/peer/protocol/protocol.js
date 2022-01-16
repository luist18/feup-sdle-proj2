class Protocol {
  constructor(peer) {
    this.peer = peer
  }

  register() {
    throw new Error('Protocol.register() is not implemented')
  }

  _subscribe(protocol, handler) {
    this.peer._libp2p().handle(protocol, ({ stream }) => {
      // TODO: replace with debug
      console.log(`Received protocol ${protocol}`)
      handler(stream).bind(this)
    })
  }
}

export default Protocol
