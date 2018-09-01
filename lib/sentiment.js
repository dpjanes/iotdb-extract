/**
 *  lib/sentiment.js
 *
 *  David Janes
 *  Consensas
 *  2018-09-01
 */

const _ = require("iotdb-helpers")
const aws = require("iotdb-awslib")

const assert = require("assert")

/**
 *  This should be made to do batches of 4096, not just the first
 */
const _sentiment = _.promise.make((self, done) => {
    const method = "_sentiment"

    const combined = [ self.json.title, self.json.document ]  
        .filter(x => x)
        .join("\n\n")
        .substring(0, 4096)

    _.promise.make(self)
        .then(_.promise.add("document", combined))
        .then(aws.comprehend.sentiment)
        .then(_.promise.make(sd => {
            sd.json.sentiment = sd.sentiment
        }))
        .then(_.promise.done(done, self))
        .catch(done)
})

/**
 */
const sentiment = _.promise.make((self, done) => {
    const method = "sentiment"

    assert.ok(_.is.Array(self.jsons), `${method}: expected self.jsons`)

    _.promise.make(self)
        .then(_.promise.series({
            method: _sentiment,
            inputs: "jsons:json",
        }))
        .then(_.promise.done(done, self, "jsons"))
        .catch(done)
})

/**
 *  API
 */
exports.sentiment = sentiment
