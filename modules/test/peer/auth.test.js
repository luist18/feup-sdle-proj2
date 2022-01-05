import request from 'supertest'

import Client from '../../src/model/client/client.js'

function createClients(number) {
  return [...Array(number).keys()].map(i => new Client(`client${i}`, 7000 + i))
}

describe('auth test', () => {
  const clients = createClients(3)

  test('turn on clients', (done) => {
    Promise.all(clients.map((client) => client.start())).then(() => {
      request(clients[0].app).post('/peer/start').then((res) => {
        expect(res.statusCode).toBe(200)
      })

      done()
    })
  })

  test('turn off clients', (done) => {
    Promise.all(clients.map((client) => client.stop())).then(() => {
      done()
    })
  })
})
