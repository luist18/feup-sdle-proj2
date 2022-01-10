import { v4 as uuidv4 } from 'uuid'

// wrapper for exchanged messages between peers
// in the future can hold things like IDs or timestamps
export default class Message {
  constructor(data, owner, ownerTimestamp, from, timestamp, originalId) {
    this.data = data
    this._metadata = {
      id: originalId || uuidv4(),
      owner,
      from: from || owner,
      ownerTimestamp,
      timestamp: timestamp || ownerTimestamp
    }
  }

  static fromJson(json) {
    return new Message(
      json.data,
      json._metadata.owner,
      json._metadata.ownerTimestamp,
      json._metadata.from,
      json._metadata.timestamp,
      json._metadata.id
    )
  }
}
