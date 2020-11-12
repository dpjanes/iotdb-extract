/**
 *  lib/entities.js
 *
 *  David Janes
 *  IOTDB
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
const _entities = _.promise((self, done) => {
    const aws = require("iotdb-awslib")

    _.promise(self)
        .validate(_entities)

        .make(sd => {
            sd.document = [ self.json.title, self.json.document ]  
                .filter(x => x)
                .join("\n\n")
                .substring(0, 4096)
        })
        .then(aws.comprehend.entities)
        .make(sd => {
            sd.json.persons = _.uniq(sd.tokens.filter(e => e.tag === "PERSON").map(e => e.document))
            sd.json.organizations = _.uniq(sd.tokens.filter(e => e.tag === "ORGANIZATION").map(e => e.document))
            sd.json.locations = _.uniq(sd.tokens.filter(e => e.tag === "LOCATION").map(e => e.document))
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
const entities = _.promise((self, done) => {
    _.promise(self)
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
