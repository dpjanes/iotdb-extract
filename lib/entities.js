/**
 *  lib/entities.js
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
const _entities = _.promise.make((self, done) => {
    const method = "_entities"

    const combined = [ self.json.title, self.json.document ]  
        .filter(x => x)
        .join("\n\n")
        .substring(0, 4096)

    _.promise.make(self)
        .then(_.promise.add("document", combined))
        .then(aws.comprehend.entities)
        .then(_.promise.make(sd => {
            sd.json.persons = _.uniq(sd.entities.filter(e => e.Type === "PERSON").map(e => e.Text))
            sd.json.organizations = _.uniq(sd.entities.filter(e => e.Type === "ORGANIZATION").map(e => e.Text))
            sd.json.locations = _.uniq(sd.entities.filter(e => e.Type === "LOCATION").map(e => e.Text))
        }))
        .then(_.promise.done(done, self))
        .catch(done)
})

/**
 */
const entities = _.promise.make((self, done) => {
    const method = "entities"

    assert.ok(_.is.Array(self.jsons), `${method}: expected self.jsons`)

    _.promise.make(self)
        .then(_.promise.series({
            method: _entities,
            inputs: "jsons:json",
        }))
        .then(_.promise.done(done, self, "jsons"))
        .catch(done)
})

/**
 *  API
 */
exports.entities = entities
