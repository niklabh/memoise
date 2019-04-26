/* global describe, before, after, it */

'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const Memoise = require('../index')
const redis = require('redis')
const mockRedis = require('./mockRedis')

describe('Unit Tests', () => {
  let asyncCallSwitch = false
  let asyncFn = (arg1, arg2) => {
    asyncCallSwitch = !asyncCallSwitch

    return Promise.resolve('result')
  }

  before(() => {
    sinon.stub(redis, 'createClient').resolves(mockRedis)
  })

  after(() => {
    redis.createClient.restore()
  })

  it('should be able to wrap a async function', async () => {
    const cache = new Memoise({store: 'lru', max: 10, maxAge: 60 * 1000})
    const cachedAsyncFn = cache.wrap(asyncFn)
    let value = await cachedAsyncFn('arg1', 'arg2')

    expect(value).to.equals('result')
    expect(asyncCallSwitch).to.be.true

    value = await cachedAsyncFn('arg1', 'arg2')

    // next call should come from cache
    expect(value).to.equals('result')
    expect(asyncCallSwitch).to.be.true
  })
})
