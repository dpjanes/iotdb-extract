/**
 *  lib/load_rule.js
 *
 *  David Janes
 *  Consensas
 *  2018-09-01
 */

const _ = require("iotdb-helpers")
const fs = require("iotdb-fs")

const cheerio = require("cheerio")

/**
 */
const load_rule = _.promise.make((self, done) => {
    const method = "load_rule"

    assert.ok(_.is.String(self.path), `${method}: expected self.path`)

    _.promise.make(self)
        .then(fs.read.json.magic)
        .then(_.promise.done(done, self, "json:rule"))
        .catch(done)
})

/**
 *  API
 */
exports.load_rule = load_rule
// export.load_rule.p = _.promise.parameterize(load_rule, "path")
