import * as SignatureUtils from './signatureUtils.js'

export default class SubscriptionManager {
  handlePost(username, message) {
    console.log('Received post: ' + message.data)

    const post = JSON.parse(message.data)

    const publicKey = this.authManager.getKeyByUsermame(username)

    // Verifies if peer has user public key
    if (!publicKey) {
      console.log('Ignoring post received from unknown username.')
      return
    }

    const verifyAuthenticity = SignatureUtils.verify(
      post.message,
      post.signature,
      publicKey
    )

    if (!verifyAuthenticity) {
      console.log("User signature doesn't match. Ignoring post.")
      return
    }
    // Adds message to the timeline
    this.timeline.addMessage(username, post.message)
  }
}
