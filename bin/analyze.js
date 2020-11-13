/**
 *  samples/analyze.js
 *
 *  David Janes
 *  IOTDB
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
const document = require("iotdb-document")

const path = require("path")
const os = require("os")

const minimist = require("minimist")
const ad = minimist(process.argv.slice(2), {
    boolean: [
        "verbose", "dump", "trace", "debug",
        "cache",
        "parts",
    ],
    string: [
        "file",
        "url",
        "rule",
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

Try to construct extraction rules for an HTML document.

Source options:

One of these is required. If used together, the document will
be read from the file, but the url is assumed to be the source
of the file - this is useful in case, e.g. in looking up rules..

--url <url>     url to extract from
--file <file>   file to extract from

Rule options:

--rule <file>   write the rule to this file (otherwise stdout)
--parts         write the raw parts to stdout as JSON

Debugging info:

--verbose       increase debugging information
--no-cache      don't cache URL fetch
`)

    process.exit(message ? 1 : 0)
}

if (ad.help) {
    help()
}
if (!ad.url && !ad.file && ad._.length) {
    if (_.is.AbsoluteURL(ad._[0])) {
        ad.url = ad._.shift()
    } else {
        ad.path = ad._.shift()
    }
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
            key: _.hash.md5("iotdb-extract", "extract", sd.path || sd.url),
            values: "document",
            method: sd.path ? fs.read.utf8 : fetch.document,
        }
    })
    .then(cache.execute)

    // analyze the data
    .then(extract.initialize)
    .then(extract.analyze)

    // collapse
    .make(sd => {
        sd.extracts.sort((a, b) => a.$score - b.$score)
        sd.extract = Object.assign({}, ...sd.extracts)

        _.keys(sd.extract)
            .forEach(key => {
                delete sd.extract.$score
                delete sd.extract.$strategy
            })

        sd.rule = {
            apiVersion: "extract/v1",
            urls: null,
            samples: [],
            extract: sd.extract,
        }

        if (sd.url) {
            sd.rule.urls = new URL(sd.url).hostname.replace(/^www[.]/, "")
            sd.rule.samples.push(sd.url)
        }
    })

    // prepare for output
    .add("rule:json")
    .then(document.from.yaml)
    .make(sd => {
        sd.document = "---\n" + sd.document
        sd.path = ad.rule || null
    })
    .conditional(ad.rule, fs.write.utf8)
    .conditional(!ad.rule && !ad.parts, fs.write.stdout)
    .make(sd => {
        if (ad.parts) {
            console.log(JSON.stringify(sd.extracts, null, 2))
        }
    })

    .catch(error => {
        console.log("#", _.error.message(error))

        delete error.self
        console.log(error)
    })
