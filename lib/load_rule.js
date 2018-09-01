/**
 *  lib/load_rule.js
 *
 *  David Janes
 *  Consensas
 *  2018-09-01
 *
 *  Copyright [2013-2018] [David P. Janes]
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

const assert = require("assert")

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
 */
const parameterize = path => _.promise.make((self, done) => {
    _.promise.make(self)
        .then(_.promise.add("path", path))
        .then(load_rule)
        .then(_.promise.done(done, self, "rules"))
        .catch(done)
})

/**
 *  API
 */
exports.load_rule = load_rule
exports.load_rule.p = parameterize
