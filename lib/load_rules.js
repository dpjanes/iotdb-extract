/**
 *  lib/load_rules.js
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
const load_rules = _.promise.make((self, done) => {
    const method = "load_rules"

    _.promise.make(self)
        .then(_.promise.done(done, self))
        .catch(done)
})

/**
 *  API
 */
exports.load_rules = load_rules
// exports.load_rules.p = _.promise.parameterize(load_rules, "path")
