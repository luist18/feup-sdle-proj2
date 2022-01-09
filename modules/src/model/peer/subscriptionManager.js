import SignatureManager from "./signitureManager.js";

export default class SubscriptionManager{

    constructor(peer){
        this.peer = peer
    }


    handlePost(message){

        console.log("Received post: " + message.data);

        const post = JSON.parse(message.data);

        const publicKey = this.authManager.getKeyByUsermame(username);

        // Verifies if peer has user public key
        if (!publicKey) {
            console.log("Ignoring post received from unknown username.");
            return;
        }

        const verifyAuthenticity = SignatureManager.verify(
          post.message,
          post.signature,
          publicKey,
        );

        if (!verifyAuthenticity) {
            console.log("User signature doesn't match. Ignoring post.");
            return;
        }

        // Adds message to the timeline
        this.timeline.addMessage(this.peer.username, post.message);
        
    }
}