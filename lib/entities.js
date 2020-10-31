/**
 *  lib/entities.js
 *
 *  David Janes
 *  Consensas
 *  2018-09-01
 *
 *  Copyright (2013-2020) David P. Janes
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const _ = require("iotdb-helpers")

/**
 *  This should be made to do batches of 4096, not just the first
 */
const _entities = _.promise.make((self, done) => {
    const method = "_entities"
    const aws = require("iotdb-awslib")

    _.promise.validate(self, _entities)

    const combined = [ self.json.title, self.json.document ]  
        .filter(x => x)
        .join("\n\n")
        .substring(0, 4096)

    _.promise.make(self)
        .add("document", combined)
        .then(aws.comprehend.entities)
        .make(sd => {
            sd.json.persons = _.uniq(sd.entities.filter(e => e.Type === "PERSON").map(e => e.Text))
            sd.json.organizations = _.uniq(sd.entities.filter(e => e.Type === "ORGANIZATION").map(e => e.Text))
            sd.json.locations = _.uniq(sd.entities.filter(e => e.Type === "LOCATION").map(e => e.Text))
        })

        .end(done, self, _entities)
})
_entities.method = "_entities"
_entities.description = ``
_entities.requires = {
    json: _.is.Dictionary,
}
_entities.accepts = {
}
_entities.produces = {
    json: _.is.Dictionary,
}

/**
 */
const entities = _.promise.make((self, done) => {
    _.promise.make(self)
        .validate(entities)

        .each({
            method: _entities,
            inputs: "jsons:json",
        })

        .end(done, self, entities)
})

entities.method = "entities"
entities.description = ``
entities.requires = {
    extract: _.is.Dictionary,
    jsons: _.is.Array,
}
entities.accepts = {
}
entities.produces = {
    jsons: _.is.Array,
}

/**
 *  API
 */
exports.entities = entities
