/**
 *  samples/reuters-congo-1.js
 *
 *  David Janes
 *  Consensas
 *  2018-11-10
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

const path = require("path")

const configuration = {
    url: "https://www.reuters.com/article/us-congo-election/congos-controversial-voting-machines-start-arriving-idUSKCN1MU0MJ",
    data: "reuters-congo-1/input.html",
}

_.promise({
})
    // aws setup
    .add("aws$cfg", require("./aws.json"))
    .then(aws.initialize)
    .then(aws.comprehend.initialize)

    // extract
    .then(extract.initialize)
    .then(extract.load_rules.builtin)

    // find the rule
    .then(extract.find.p(configuration.url))

    // parse the document
    .then(fs.read.p(path.join(__dirname, "..", "test", "data", configuration.data), "utf-8"))
    .then(extract.extract)

    // get entities & sentiment
    .then(extract.entities)
    .then(extract.sentiment)

    // last step
    .then(extract.clean)
    .make(sd => {
        console.log(JSON.stringify(sd.jsons, null, 2))
    })
    .catch(error => {
        console.log("#", _.error.message(error))

        delete error.self
        console.log(error)
    })
