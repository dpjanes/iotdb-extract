/**
 *  fetch.js
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
const extract = require("iotdb-extract")
const fs = require("iotdb-fs")
const aws = require("iotdb-awslib")

_.promise.make({
    url: process.argv[2]
})
    // aws setup
    .then(_.promise.add("awsd", require("./aws.json")))
    .then(aws.initialize)
    .then(aws.comprehend.initialize)

    // extract
    .then(extract.initialize)
    .then(extract.load_rules.builtin)

    // find the rule, fetch
    .then(extract.find)
    .then(extract.fetch)

    // analyze
    .then(extract.extract)
    .then(extract.entities)

    .then(_.promise.make(sd => {
        console.log(JSON.stringify(sd.jsons, null, 2))
    }))
    .catch(error => {
        console.log("#", _.error.message(error))

        delete error.self
        console.log(error)
    })
