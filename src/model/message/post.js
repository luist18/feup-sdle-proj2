import Message from './index.js'
import PostData from './postData.js'

const _MESSAGE_TYPE = 'post'

/**
 * Messages that contribute to the timeline (posts) are special.
 * They hold post data, which is the actual content of a post.
 */
export default class Post extends Message {
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
