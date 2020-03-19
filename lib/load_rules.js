/**
 *  lib/load_rules.js
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
const fs = require("iotdb-fs")

const path = require("path")
const assert = require("assert")

/**
 */
const load_rules = _.promise.make((self, done) => {
    const method = "load_rules"
    const inventory = require("..")

    assert.ok(self.extract, `${method}: self.extract required`)

    _.promise.make(self)
        .then(_.promise.add({
            rules: [],
            filter: name => !name.startsWith(".") && name.endsWith(".yaml"),
        }))
        .then(fs.list)
        .then(_.promise.series({
            method: inventory.load_rule,
            inputs: "paths:path",
            outputs: "rules",
            output_selector: sd => sd.rules,
            output_filter: rules => rules && rules.length,
            output_flatten: true,
        }))
        .then(_.promise.make(sd => {
            sd.extract.rules = sd.extract.rules.concat(sd.rules)
        }))
        .then(_.promise.done(done, self))
        .catch(done)
})

/**
 */
const parameterize = path => _.promise.make((self, done) => {
    _.promise.make(self)
        .then(_.promise.add("path", path))
        .then(load_rules)
        .then(_.promise.done(done, self, "rules"))
        .catch(done)
})

/**
 *  API
 */
exports.load_rules = load_rules
exports.load_rules.p = parameterize
exports.load_rules.builtin = parameterize(path.join(__dirname, "..", "definitions"))
