import Message from '../../message/index.js'
import pipe from 'it-pipe'

/**
 * Sends a Message to a stream.
 *
 * @param {MutexStream} stream the stream
 * @param {Message} message the message to send
 * @returns {Promise<void>} a promise that resolves when the message is sent
 */
export async function send(stream, message) {
  return new Promise((resolve, reject) => {
    try {
      console.log('sending message:', message)
      message.updateTimestamp()
      pipe([JSON.stringify(message)], stream).then(() => resolve())
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Receives a Message from a stream.
 *
 * @param {MutexStream} stream the stream
 * @returns {Promise<Message>} a promise that resolves when the message is received
 */
export async function receive(stream) {
  return new Promise((resolve, reject) => {
    try {
      pipe(stream, async(source) => {
        for await (const chunk of source) {
          const json = JSON.parse(chunk)
          console.log('received message:', json)

          const message = Message.fromJson(json)
          resolve(message)
        }

        reject(new Error('Did not receive data'))
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Sends a Message to a stream and expects an answer.
 *
 * @param {MutexStream} stream the stream
 * @param {Message} message the message to send
 * @returns {Promise<Message>} a promise that resolves when the message is received
 */
export async function trade(stream, message) {
  await send(stream, message)
  return await receive(stream)
}
