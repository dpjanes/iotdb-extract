/**
 *  lib/fetch.js
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
 *  Optional module
 */
const fetch = _.promise.make((self, done) => {
    const method = "fetch"
    const fetch = require("iotdb-fetch")

    assert.ok(_.is.AbsoluteURL(self.url), `${method}: expected self.url`)

    _.promise.make(self)
        .then(fetch.document.get())
        .then(_.promise.done(done, self, "document"))
        .catch(done)
})

/**
 */
const parameterize = url => _.promise.make((self, done) => {
    _.promise.make(self)
        .then(_.promise.add("url", url))
        .then(fetch)
        .then(_.promise.done(done, self, "rule"))
        .catch(done)
})

/**
 *  API
 */
exports.fetch = fetch
exports.fetch.p = parameterize