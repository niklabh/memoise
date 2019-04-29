'use strict'

const sigmund = require('sigmund')
const { isNil } = require('lodash')
const redis = require('./redis')
const lru = require('./lru')

const keygen = (name, args) => {
  const input = { f: name, a: args }

  return sigmund(input, 8)
}

let anonFnId = 0

class Memoise {
  /**
   *
   * Constructor
   *
   * Creates a new cache instance with redis if env vars are set or lru
   *
   * @param {Object} Cache Options
   * ```js
   * {
   *   maxAge: Number // cache age
   *   max: Number // max number of item which can fit
   * }
   * ```
   *
   **/
  constructor (options = {}) {
    let store = redis.init(options)

    if (isNil(store)) {
      console.log('(memoise) redis store not initialised. falling back to lru')
      store = lru.init(options)
    }

    if (isNil(store)) {
      throw new Error('(memoise) No store initialised')
    }

    this.store = store
    this.fname = ''
    this.stats = { hit: 0, miss: 0, error: 0 }
  }

  /**
    *
    * ## wrap
    *
    * @param {Function} function to be wrapped
    * @return {Function} Wrapped function that is cache aware
    *
    * Given a function, generates a cache aware version of it.
    * The given function must be an async function
    *
    **/
  wrap (fn) {
    const stats = this.stats
    const fname = `${__filename}_${fn.name || anonFnId++}`

    this.fname = fname

    const cachedFunc = async (...args) => {
      const key = keygen(fname, args)
      let data

      try {
        data = await this.store.get(key)
      } catch (error) {
        console.error(error)

        stats.error++
      }

      if (!isNil(data)) {
        stats.hit++

        return data
      }

      stats.miss++

      const reserved = await this.store.reserve(key)

      let result

      if (reserved) {
        result = await fn(...args)

        if (isNil(result)) {
          return result
        }

        try {
          await this.store.set(key, result)
        } catch (error) {
          console.error(error)

          stats.error++
        }
      } else {
        result = await this.store.listen(key)
      }

      return result
    }

    return cachedFunc
  }

  debug () {
    return { fname: this.fname, stats: this.stats }
  }
}

module.exports = Memoise
