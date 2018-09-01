/**
 *  lib/fetch.js
 *
 *  David Janes
 *  Consensas
 *  2018-09-01
 */

const _ = require("iotdb-helpers")

const assert = require("assert")

/**
 *  Optional module
 */
const fetch = _.promise.make((self, done) => {
    const method = "fetch"
    const fetch = require("iotdb-fetch")

    assert.ok(_.is.AbsoluteURL(self.url), `${method}: expected self.url`)

    _.promise.make(self)
        .then(fetch.document.get())
        .then(_.promise.done(done, self, "document"))
        .catch(done)
})

/**
 */
const parameterize = url => _.promise.make((self, done) => {
    _.promise.make(self)
        .then(_.promise.add("url", url))
        .then(fetch)
        .then(_.promise.done(done, self, "rule"))
        .catch(done)
})

/**
 *  API
 */
exports.fetch = fetch
exports.fetch.p = parameterize
