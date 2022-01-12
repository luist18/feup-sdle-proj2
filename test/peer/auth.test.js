import request from 'supertest'

import App from '../../src/app.js'

function createApps(number) {
  return [...Array(number).keys()].map((i) => App(`peer${i}`, 7000 + i))
}

describe('auth test', () => {
  const apps = createApps(3)

  test(
    'turn on app 1 ✅',
    (done) => {
      Promise.all(
        apps.slice(0, 1).map((app) =>
          request(app)
            .put('/peer/start')
            .then((res) => {
              expect(res.statusCode).toBe(201)
              expect(res.body).toHaveProperty('message')
              expect(res.body.message).toBe('Peer started')
            })
        )
      )
        .then(() => done())
        .catch((err) => done(err))
    },
    10 * 1000
  )

  test(
    'connect app 2 and app 3 to app 1',
    (done) => {
      request(apps[0])
        .get('/peer/token')
        .then((res) => {
          expect(res.statusCode).toBe(200)
          expect(res.body).toHaveProperty('token')

          const { token } = res.body

          Promise.all(
            apps.slice(1).map((app) =>
              request(app)
                .put('/peer/start')
                .send({ inviteToken: token })
                .then((res) => {
                  expect(res.statusCode).toBe(201)
                  expect(res.body).toHaveProperty('message')
                  expect(res.body.message).toBe('Peer started')
                })
            )
          )
            .then(() => done())
            .catch((err) => done(err))
        })
    },
    20 * 1000
  )

  test(
    'check if indirectly connected apps have information about each other',
    async() => {
      await new Promise((resolve) => {
        setTimeout(() => {
          expect(
            apps[2]
              .get('peer')
              .neighbors()
              .map((element) => element.id)
          ).toContainEqual(apps[1].get('peer').id().id)
          expect(
            apps[1]
              .get('peer')
              .neighbors()
              .map((element) => element.id)
          ).toContainEqual(apps[2].get('peer').id().id)
          resolve()
        }, 10000)
      })
    },
    5 * 15000
  )

  test(
    'turn off apps 🛑',
    (done) => {
      Promise.all(
        apps.map((app) =>
          request(app)
            .delete('/peer/stop')
            .then((req) => {
              expect(req.status).toBe(200)
              expect(req.body).toHaveProperty('message')
              expect(req.body.message).toBe('Peer stopped')
            })
        )
      )
        .then(() => done())
        .catch((err) => done(err))
    },
    30 * 1000
  )
})
