/**
 *  lib/find.js
 *
 *  David Janes
 *  Consensas
 *  2018-09-01
 */

const _ = require("iotdb-helpers")

const assert = require("assert")

/**
 *  Find rules that will match the URL,
 *  ordering from strongest to weakest
 *  based on "longest url match"
 */
const find = _.promise.make(self => {
    const method = "find"

    assert.ok(_.is.AbsoluteURL(self.url), `${method}: expected self.url`)
    assert.ok(_.is.Array(self.rules), `${method}: expected self.rules`)

    self.rules = self.rules
        .map(rule => {
            const length = Math.max(0, ..._.d.list(rule, "urls", [])
                .filter(url => self.url.indexOf(url) > -1)
                .map(url => url.length))

            if (length) {
                rule = _.d.clone(rule)
                rule.__length = length

                return rule
            }
        })
        .filter(rule => rule)

    self.rules.sort((a, b) => b.__length - a.__length)
    // ... maybe ... self.rules.forEach(rule => delete rule.__length)
})

/**
 */
const parameterize = url => _.promise.make((self, done) => {
    _.promise.make(self)
        .then(_.promise.add("url", url))
        .then(find)
        .then(_.promise.done(done, self, "rule"))
        .catch(done)
})

/**
 *  API
 */
exports.find = find
exports.find.p = parameterize
