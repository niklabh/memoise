'use strict'

const { isNil } = require('lodash')
const redis = require('redis')
const { ONE_HOUR, PENDING, LISTEN_TTL } = require('./constant')

// one client per service
let redisClient

const getClient = (options) => {
  if (!isNil(redisClient)) {
    return redisClient
  }

  const { host, port } = options

  if (isNil(options)) {
    console.error('(memoise) redis options not provided')

    return
  }

  if (isNil(host)) {
    console.error('(memoise) REDIS_HOST env variable not set')

    return
  }

  if (isNil(port)) {
    console.error('(memoise) REDIS_PORT env variable not set')

    return
  }

  redisClient = redis.createClient({ host, port })

  redisClient.on('error', (error) => {
    console.error({ error }, 'redis error')
  })

  return redisClient
}

const getKey = (key) => `memo:${key}`

const init = (options) => {
  const maxAge = (options.maxAge) || ONE_HOUR
  const ttl = parseInt(maxAge / 1000, 10)
  const client = getClient(options.redis)

  if (isNil(client)) {
    return
  }

  const store = {
    get: (key) => new Promise((resolve, reject) => {
      client.get(getKey(key), (err, data) => {
        let result

        if (!isNil(err)) {
          return reject(err)
        }

        if (isNil(data)) {
          return resolve(data)
        }

        data = data.toString()

        try {
          result = JSON.parse(data)
        } catch (e) {
          return reject(e)
        }

        return resolve(result)
      })
    }),

    reserve: (key) => new Promise((resolve, reject) => {
      key = getKey(key)

      client.get(key, (err, val) => {
        if (!isNil(err)) {
          return reject(err)
        }

        if (val === PENDING) {
          return resolve(false)
        }

        client.set(key, PENDING, (err) => {
          if (!isNil(err)) {
            return reject(err)
          }

          return resolve(true)
        })
      })
    }),

    set: (key, val) => new Promise((resolve, reject) => {
      key = getKey(key)

      try {
        const obj = JSON.stringify(val)

        client.setex(key, ttl, obj, (err) => {
          if (!isNil(err)) {
            return reject(err)
          }

          return resolve(val)
        })
      } catch (err) {
        return reject(err)
      }
    }),

    listen: (key) => new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        client.get(getKey(key), (err, data) => {
          let result

          if (!isNil(err)) {
            return reject(err)
          }

          if (isNil(data)) {
            clearInterval(interval)
            return resolve(data)
          }

          data = data.toString()

          if (data !== PENDING) {
            try {
              result = JSON.parse(data)
            } catch (e) {
              return reject(e)
            }

            clearInterval(interval)
            return resolve(result)
          }
        })
      }, LISTEN_TTL)
    }),

    expire: (key) => new Promise((resolve, reject) => {
      client.expire(getKey(key), 0, resolve)
    }),

    reset: () => client.flushdb()
  }

  return store
}

module.exports = { init }
