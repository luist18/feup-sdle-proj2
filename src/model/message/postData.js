/**
 * The actual content of a post.
 */
export default class PostData {
  constructor(content, user, timestamp) {
    this.content = content
    this.user = user
    this.timestamp = timestamp
  }
}
