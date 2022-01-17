import { v4 as uuidv4 } from 'uuid'
import * as signature from '../utils/signature.js'
import debug from 'debug'

export const messagedebuger = debug('tp2p:message')

// wrapper for exchanged messages between peers
// in the future can hold things like IDs or timestamps
export default class Message {
  /**
   * Creates a new message object.
   *
   * @param {Object} data the qualitative content of the message
   * @param {string} type the type of the message
   * @param {string} owner the username of the peer that originally created the message
   * @param {int} ownerTimestamp the timestamp in which the message was originally created
   * @param {string} from the username of the peer that sent the message
   * @param {int} sentTimestamp the timestamp in which the message was lastly sent
   * @param {string} originalId the uuid of the message
   */
  constructor(
    data,
    type,
    owner,
    ownerTimestamp,
    from,
    sentTimestamp,
    originalId
  ) {
    this.data = data
    this._metadata = {
      id: originalId || uuidv4(),
      type,
      owner,
      from: from || owner,
      ownerTimestamp,
      sentTimestamp: sentTimestamp || ownerTimestamp
    }
  }

  /**
   * Updates the timestamp of the message.
   */
  updateTimestamp() {
    this._metadata.sentTimestamp = Date.now()
  }

  /**
   * Updates the username of the message.
   *
   * @param {string} username the username of the peer
   */
  updateUser(username) {
    this._metadata.from = username
  }

  /**
   * Signs the message, adding a signature to the metadata.
   * The signature is made over the whole data body.
   *
   * @param {string} privateKey the private key of the peer
   */
  sign(privateKey) {
    this._metadata.signature = signature.signObject(this.data, privateKey)
  }

  /**
   * Converts a json object into a Message object.
   *
   * @param {object} json the json object to convert to a message
   * @returns {Message} the message object
   */
  static fromJson(json) {
    const message = new Message(
      json.data,
      json._metadata.type,
      json._metadata.owner,
      json._metadata.ownerTimestamp,
      json._metadata.from,
      json._metadata.sentTimestamp,
      json._metadata.id
    )
    message.data = json.data
    message._metadata = json._metadata
    return message
  }
}
