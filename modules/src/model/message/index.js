// wrapper for exchanged messages between peers
// in the future can hold things like IDs or timestamps
class Message {
  constructor(data) {
    this.data = data
  }
}

export default Message
