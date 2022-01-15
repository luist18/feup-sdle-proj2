import Message from './index.js'
import PostData from './postData.js'

const _MESSAGE_TYPE = 'post'

/**
 * Messages that contribute to the timeline (posts) are special.
 * They hold post data, which is the actual content of a post.
 */
export default class Post extends Message {
  /**
   * Instantiates a new post message.
   * The from and the timestamp are not mandatory and are set automatically if not provided.
   *
   * @param {string} content what to send in the post
   * @param {string} owner the username of the owner of the post
   * @param {number} ownerTimestamp the timestamp in which the post was created
   * @param {string} from the username of the peer that sent the post
   * @param {number} timestamp the timestamp in which the post was lastly sent
   */
  constructor(content, owner, ownerTimestamp, from, timestamp) {
    super(
      new PostData(content, owner, ownerTimestamp),
      _MESSAGE_TYPE,
      owner,
      ownerTimestamp,
      from || owner,
      timestamp || ownerTimestamp
    )
  }
}
