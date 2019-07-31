/**
 *  lib/find.js
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

const assert = require("assert")

/**
 */
const find = _.promise(self => {
    _.promise.validate(self, find)

    self.rules = self.extract.rules
        .map(rule => {
            const length = Math.max(-1, ..._.d.list(rule, "urls", [])
                .filter(url => self.url.indexOf(url) > -1)
                .map(url => url.length))

            if (length > -1) {
                rule = _.d.clone(rule)
                rule.__length = length

                return rule
            }
        })
        .filter(rule => rule)

    self.rules.sort((a, b) => b.__length - a.__length)
})

find.method = "find"
find.description = `
    Find rules that will match the URL,
    ordering from strongest to weakest (based on "longest url match")`
find.requires = {
    url: _.is.String,
    extract: _.is.Dictionary,
}
find.accepts = {
}
find.produces = {
    rules: _.is.Array.of.JSON,
}

/**
 */
const find_p = url => _.promise((self, done) => {
    _.promise(self)
        .add("url", url)
        .then(find)
        .end(done, self, "rules")
})

/**
 */
const find_match = (key, value) => _.promise(self => {
    self.rule = self.extract.rules
        .filter(rule => rule[key] === value)
        .find(x => x) || null
})

/**
 */
const find_matches = (key, value, wildcard) => _.promise(self => {
    self.rules = self.extract.rules
        .filter(rule => (wildcard && (rule[key] === "*")) || (rule[key] === value))
})

/**
 *  API
 */
exports.find = find
exports.find.p = find_p
exports.find.match = find_match
exports.find.matches = find_matches
