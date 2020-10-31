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

/**
 */
const load_rules = _.promise((self, done) => {
    const inventory = require("..")

    _.promise(self)
        .validate(load_rules)

        .add({
            rules: [],
            fs$filter_name: name => !name.startsWith(".") && name.endsWith(".yaml"),
        })
        .then(fs.list)
        .each({
            method: inventory.load_rule,
            inputs: "paths:path",
            outputs: "rules",
            output_selector: sd => sd.rules,
            output_filter: rules => rules && rules.length,
            output_flatten: true,
        })
        .make(sd => {
            sd.extract.rules = sd.extract.rules.concat(sd.rules)
        })

        .end(done, self, load_rules)
})

load_rules.method = "load_rules"
load_rules.description = ``
load_rules.requires = {
    extract: _.is.Dictionary,
}
load_rules.accepts = {
}
load_rules.produces = {
    extract: _.is.Dictionary,
}
load_rules.params = {
    path: _.p.normal,
}
load_rules.p = _.p(load_rules)

/**
 *  API
 */
exports.load_rules = load_rules
exports.load_rules.builtin = load_rules.p(path.join(__dirname, "..", "definitions"))
