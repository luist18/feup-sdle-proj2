/**
 * This class stores all messages from all other peers, in chronological order
 */
export default class TimelineManager {
  constructor() {
    this.messages = new Map()
  }

  addMessage(username, message) {
    if (!this.messages.has(username)) {
      this.messages.set(username, [])
    }

    const messagesFromUser = this.messages.get(username)

    messagesFromUser.push(message)

    this.messages.set(username, messagesFromUser)

    console.log(`User ${username} posted ${message}`)
  }

  getMessagesFromUser(username) {
    return this.messages.get(username)
  }
  getMessages(){return this.messages}
}
