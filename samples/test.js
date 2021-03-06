/**
 *  samples/test.js
 *
 *  David Janes
 *  IOTDB
 *  2018-09-05
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

const minimist = require("minimist")
const ad = minimist(process.argv.slice(2), {
    boolean: [ "entities" ],
})

if (!ad._.length) {
    console.log("#", "expected a domain name")
    process.exit()
}

/**
 *  Call like e.g. "node test bbc.com" and it will find the sample
 *  URL from the definitions matching "bbc.com" and run 
 */
_.promise({
    url: ad._[0],
})
    // aws setup
    .add("aws$cfg", require("./aws.json"))
    .then(aws.initialize)
    .then(aws.comprehend.initialize)

    // extract
    .then(extract.initialize)
    .then(extract.load_rules.builtin)

    // find a rule matching the domain
    .then(extract.find)
    .make(sd => {
        const urls = _.flatten(sd.rules
            .map(rule => rule.samples)
            .filter(url => url))

        if (!urls.length) {
            console.log("#", "could not find anything")
            process.exit()
        }

        sd.url = urls[0]
    }))

    // find the rule, fetch
    .then(extract.find)
    .then(extract.fetch)

    // analyze
    .then(extract.extract)
    .conditional(ad.entities, extract.entities)

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
