/**
 *  lib/extract.js
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
const extract = _.promise.make((self, done) => {
    const method = "extract"

    _.promise.make(self)
        .then(_.promise.done(done, self))
        .catch(done)
})

/**
 *  API
 */
exports.extract = extract
// export.extract.p = _.promise.parameterize(extract, "path")
