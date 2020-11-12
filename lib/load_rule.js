/**
 *  lib/load_rule.js
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
const fs = require("iotdb-fs")

const assert = require("assert")

/**
 *  Slightly confusing as there can be multiple rules
 *  in a single rule file
 */
const load_rule = _.promise((self, done) => {
    const method = "load_rule"

    assert.ok(_.is.String(self.path), `${method}: expected self.path`)

    _.promise(self)
        .then(fs.read.yamls)
        .make(sd => {
            sd.rules = sd.json
            sd.rules.forEach(rule => {
                rule._title_required = _.is.Nullish(rule._title_required) ? true : !!rule._title_required
                rule._document_required = _.is.Nullish(rule._document_required) ? true : !!rule._document_required
            })

        })
        .end(done, self, "json:rules")
})

load_rule.method = "load_rule"
load_rule.requires = {
}
load_rule.accepts = {
}
load_rule.produces = {
}

/**
 */
const parameterize = path => _.promise((self, done) => {
    _.promise(self)
        .add("path", path)
        .then(load_rule)
        .end(done, self, "rules")
})

/**
 *  API
 */
exports.load_rule = load_rule
exports.load_rule.p = parameterize
