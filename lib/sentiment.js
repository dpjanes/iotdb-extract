/**
 *  lib/sentiment.js
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
 *  This should be made to do batches of 4096, not just the first
 */
const _sentiment = _.promise.make((self, done) => {
    const method = "_sentiment"
    const aws = require("iotdb-awslib")

    const combined = [ self.json.title, self.json.document ]  
        .filter(x => x)
        .join("\n\n")
        .substring(0, 4096)

    _.promise.make(self)
        .then(_.promise.add("document", combined))
        .then(aws.comprehend.sentiment)
        .then(_.promise.make(sd => {
            sd.json.sentiment = sd.sentiment
        }))
        .then(_.promise.done(done, self))
        .catch(done)
})

/**
 */
const sentiment = _.promise.make((self, done) => {
    const method = "sentiment"

    assert.ok(_.is.Array(self.jsons), `${method}: expected self.jsons`)

    _.promise.make(self)
        .then(_.promise.series({
            method: _sentiment,
            inputs: "jsons:json",
        }))
        .then(_.promise.done(done, self, "jsons"))
        .catch(done)
})

/**
 *  API
 */
exports.sentiment = sentiment
