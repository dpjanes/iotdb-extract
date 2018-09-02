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
 *  Find rules that will match the URL,
 *  ordering from strongest to weakest
 *  based on "longest url match"
 */
const find = _.promise.make(self => {
    const method = "find"

    assert.ok(_.is.AbsoluteURL(self.url), `${method}: expected self.url`)
    assert.ok(_.is.Object(self.extract), `${method}: expected self.extract`)

    self.rules = self.extract.rules
        .map(rule => {
            const length = Math.max(0, ..._.d.list(rule, "urls", [])
                .filter(url => self.url.indexOf(url) > -1)
                .map(url => url.length))

            if (length) {
                rule = _.d.clone(rule)
                rule.__length = length

                return rule
            }
        })
        .filter(rule => rule)

    self.rules.sort((a, b) => b.__length - a.__length)
    // self.rule = self.rules.length ? self.rules[0] : null
    // ... maybe ... self.rules.forEach(rule => delete rule.__length)
})

/**
 */
const parameterize = url => _.promise.make((self, done) => {
    _.promise.make(self)
        .then(_.promise.add("url", url))
        .then(find)
        .then(_.promise.done(done, self, "rules"))
        .catch(done)
})

/**
 *  API
 */
exports.find = find
exports.find.p = parameterize
