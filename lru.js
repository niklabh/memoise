'use strict'

const LRU = require('lru-cache')
const {isNil} = require('lodash')
const { ONE_HOUR, LISTEN_TTL, PENDING, TEN_THOUSAND } = require('./constant')

const init = (options) => {
  const lruOptions = {
    length: (value) => JSON.stringify(value).length,
    max: options.max || TEN_THOUSAND,
    maxAge: options.maxAge || ONE_HOUR
  }
  const lru = LRU(lruOptions)
  const store = {
    get: (key) => lru.get(key),

    set: (key, val) => lru.set(key, val),

    reserve: (key) => {
      const val = lru.get(key)

      if (val === PENDING) {
        return false
      }

      lru.set(key, PENDING)

      return true
    },

    expire: (key) => lru.del(key),

    listen: (key) => new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const data = lru.get(key)

        if (isNil(data)) {
          clearInterval(interval)
          return resolve(data)
        }

        if (data !== PENDING) {
          clearInterval(interval)
          return resolve(data)
        }
      }, LISTEN_TTL)
    }),

    reset: () => lru.reset()
  }

  return store
}

module.exports = { init }
