/**
 *  lib/find.js
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
const find = _.promise.make((self, done) => {
    const method = "find"

    _.promise.make(self)
        .then(_.promise.done(done, self))
        .catch(done)
})

/**
 *  API
 */
exports.find = find
// export.find.p = _.promise.parameterize(find, "path")
