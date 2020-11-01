/**
 *  samples/analyze.js
 *
 *  David Janes
 *  Consensas
 *  2020-10-31
 *  🎃🕸👻
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
const cache = require("iotdb-cache")
const fetch = require("iotdb-fetch")

const path = require("path")

const minimist = require("minimist")
const ad = minimist(process.argv.slice(2), {
    string: [
        "file",
        "url",
    ],
    boolean: [ ],
})

if (!ad.url && !ad.file) {
    console.log("#", "expected --file or --url")
    process.exit()
}

_.promise({
    cache$cfg: {
        path: path.join(__dirname, "..", ".fs-cache"),
    },
    url: ad.url || null,
    path: ad.path || null,
})
    // extract
    .then(extract.initialize)

    .conditional(sd => sd.url, fetch.document.get(null))
    .conditional(sd => sd.path, fs.read.utf8)

    // parse the document and guess it's structure
    /*
    .then(fs.read.utf8.p(path.join(__dirname, "../test/data/reuters-congo-1/input.html")))
    .then(fs.read.utf8.p(path.join(__dirname, "../test/data/bbc-brazil-1/input.html")))
    .then(fs.read.utf8.p(path.join(__dirname, "../test/data/cp24-1/input.html")))
    */
    .then(extract.analyze)

    .make(sd => {
        console.log(JSON.stringify(sd.rule, null, 2))
    })
    .catch(error => {
        console.log("#", _.error.message(error))

        delete error.self
        console.log(error)
    })
