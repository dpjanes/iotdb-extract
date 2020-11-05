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
const cache = require("iotdb-cache")
const fetch = require("iotdb-fetch")

const path = require("path")
const os = require("os")

const minimist = require("minimist")
const ad = minimist(process.argv.slice(2), {
    boolean: [
        "verbose", "dump", "trace", "debug",
        "cache",
    ],
    string: [
        "file",
        "url",
    ],
    default: {
        "cache": true,
    },
})

const help = message => {
    const name = "analyze"

    if (message) {
        console.log(`${name}: ${message}`)
        console.log()
    }

    console.log(`\
usage: ${name} [options]

Try and construct rules for an HTML document.

one of these required:

--url <url>     url to extract from
--file <file>   file to extract from

options:

--verbose       increase debugging information
--no-cache      don't cache URL fetch
`)

    process.exit(message ? 1 : 0)
}

if (ad.help) {
    help()
}
if (!ad.url && !ad.file) {
    help("one of --url or --file is required")
}
_.logger.levels({
    debug: ad.debug || ad.verbose,
    trace: ad.trace || ad.verbose,
})
const logger = require("../logger")(__filename)

_.promise({
    trace: ad.trace,
    verbose: ad.verbose,

    cache$cfg: {
        path: path.join(os.homedir(), ".iotdb-extract"),
    },

    url: ad.url || null,
    path: ad.file || null,
})
    // fetch the document 
    .conditional(ad.cache, fs.cache)
    .make(sd => {
        sd.rule = {
            key: _.hash.md5("iotdb-extract", "extract", sd.url || sd.path),
            values: "document",
            method: sd.url ? fetch.document : fs.read.utf8,
        }
    })
    .then(cache.execute)

    // analyze the data
    .then(extract.initialize)
    .then(extract.analyze)

    .make(sd => {
        console.log(JSON.stringify(sd.extracts, null, 2))
    })
    .catch(error => {
        console.log("#", _.error.message(error))

        delete error.self
        console.log(error)
    })
