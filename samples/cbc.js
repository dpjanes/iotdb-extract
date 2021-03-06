/**
 *  samples/cbc.js
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
const extract = require("iotdb-extract")
const fs = require("iotdb-fs")
const aws = require("iotdb-awslib")

_.promise({
    url: "https://www.cbc.ca/news/politics/does-mexico-throw-canada-under-the-bus-1.4807073",
    verbose: true,
})
    // aws setup
    .add("aws$cfg", require("./aws.json"))
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

    // last step
    .then(extract.clean)
    .make(sd => {
        console.log("+", JSON.stringify(sd.jsons, null, 2))
    })
    .catch(error => {
        console.log("#", _.error.message(error))

        delete error.self
        console.log(error)
    })
