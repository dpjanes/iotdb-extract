/**
 *  _cook.js
 *
 *  David Janes
 *  Consensas
 *  2018-11-10
 
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

const yaml = require("js-yaml")
const minimist = require("minimist")

if (require.main === module) {
    const ad = minimist(process.argv.slice(2), {
        boolean: [ "entities", "sentiment", ],
    })

    if (ad._.length !== 1) {
        console.log("usage: _cook <folder>")
        process.exit()
    }

    _.promise.make({
        root: ad._[0],
    })
        // aws setup
        .then(_.promise.add("awsd", require("./aws.json")))
        .then(aws.initialize)
        .then(aws.comprehend.initialize)

        // extract setup
        .then(extract.initialize)
        .then(extract.load_rules.builtin)

        // get the URL
        .add("path", sd => path.join(sd.root, "data.yaml"))
        .then(fs.read.json.magic)
        .add("json:configuration")

        // find the rule
        .add("configuration/url")
        .then(extract.find)

        // parse the document
        .add("path", sd => path.join(sd.root, "input.html"))
        .then(fs.read.utf8)
        .then(extract.extract)

        // get entities & sentiment
        .conditional(ad.entities, extract.entities)
        .conditional(ad.sentiment, extract.sentiment)

        // last step
        .then(extract.clean)
        .make(sd => {
            console.log(yaml.safeDump(sd.jsons, {
                sortKeys: true,
            }))
        })
        .catch(error => {
            console.log("#", _.error.message(error))

            delete error.self
            console.log(error)
        })
}
