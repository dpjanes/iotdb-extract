/**
 *  lib/clean.js
 *
 *  David Janes
 *  Consensas
 *  2018-09-05
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

const assert = require("assert")

/**
 */
const _clean = _.promise.make(self => {
    const method = "_clean"
    const aws = require("iotdb-awslib")

    const rule = self.json._rule
    const master = self.json._master

    // everything with an underscore goes
    _.keys(self.json)
        .filter(key => key.startsWith("_"))
        .forEach(key => delete self.json[key])

    // specific rules for each key
    _.mapObject(self.json, (value, key) => {
        [ rule, master ]
            .filter(set => set)
            .filter(set => set.extract)
            .map(set => set.extract[key])
            .filter(key_rule => _.is.Dictionary(key_rule))
            .forEach(key_rule => {
                // remove values from array
                if (key_rule.removes) {
                    if (_.is.Array(value)) {
                        value = _.without(value, ..._.coerce.list(key_rule.removes))
                        self.json[key] = value
                    }

                    if (_.is.String(value)) {
                        _.coerce.list(key_rule.removes).forEach(remove => {
                            value = value.replace(remove, "")
                            self.json[key] = value
                        })
                    }
                }

                // add values to array
                if (key_rule.adds && _.is.Array(value)) {
                    _.coerce.list(key_rule.adds)
                        .filter(add => value.indexOf(add) === -1)
                        .forEach(add => value.push(add))

                    self.json[key] = value
                }
            })
    })
})

/**
 *  Call me after everything, and this will make sure no temporary
 *  data is left in the record, plus it do various data transformations
 */
const clean = _.promise.make((self, done) => {
    const method = "clean"

    assert.ok(_.is.Array(self.jsons), `${method}: expected self.jsons`)

    _.promise.make(self)
        .each({
            method: _clean,
            inputs: "jsons:json",
        })
        .end(done, self, "jsons")
})

/**
 *  API
 */
exports.clean = clean
