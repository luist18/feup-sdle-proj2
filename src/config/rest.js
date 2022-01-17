export default {
  status: {
    /**
     * The request succeeded. The result meaning of "success" depends on the HTTP method:
     *  - GET: The resource has been fetched and transmitted in the message body.
     *  - HEAD: The representation headers are included in the response without any message body.
     *  - PUT or POST: The resource describing the result of the action is transmitted in the message body.
     *  - TRACE: The message body contains the request message as received by the server.
     */
    OK: 200,

    /**
     * The request succeeded, and a new resource was created as a result. This is typically the response sent after POST requests, or some PUT requests.
     */
    CREATED: 201,

    /**
     * There is no content to send for this request, but the headers may be useful. The user agent may update its cached headers for this resource with the new ones.
     */
    NO_CONTENT: 204,

    /**
     * The server could not understand the request due to invalid syntax.
     */
    BAD_REQUEST: 400,

    /**
     * Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated". That is, the client must authenticate itself to get the requested response.
     */
    UNAUTHORIZED: 401,

    /**
     * This response is sent when a request conflicts with the current state of the server.
     */
    CONFLICT: 409
  },

  message: {
    peer: {
      ALREADY_ONLINE: 'Peer is already online',
      ALREADY_OFFLINE: 'Peer is already offline',
      STARTED: 'Peer started',
      STOPPED: 'Peer stopped',
      OFFLINE: 'Peer is offline',
      REMOVED: 'Username removed from network',
      CANT_START: 'Peer can\'t start',
      NEW_NETWORK: 'New network created'
    },

    token: {
      INVALID: 'Invalid token'
    },

    credentials: {
      INVALID: 'Invalid credentials'
    },

    username: {
      ALREADY_EXISTS: 'Username already exists'
    },

    subscription: {
      ALREADY_IN: 'Already following user',
      ALREADY_OUT: "You didn't follow this user",
      ADDED: 'Followed user',
      DELETED: 'Unfollowed user'
    },

    post: {
      SENT: 'Post sent'
    },

    body: {
      missing: (field) => `Missing '${field}'`
    }
  }
}
