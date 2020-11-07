/*
 *  bin/extract.js
 *
 *  David Janes
 *  Consensas
 *  2019-07-28
 */

"use strict"

const _ = require("iotdb-helpers")
const fs = require("iotdb-fs")
const fetch = require("iotdb-fetch")
const cache = require("iotdb-cache")
const extract = require("..")

const yaml = require("js-yaml")
const path = require("path")
const os = require("os")

const minimist = require("minimist")
const ad = minimist(process.argv.slice(2), {
    boolean: [
        "verbose", "dump", "trace", "debug",
        "cache",
        "first", "one",
        "json",
        "jsonl",
    ],
    string: [
        "url", 
        "path", 
        "_",
        "as",
        "rules",
    ],
    alias: {
        "one": "first",
    }, 
    default: {
        "cache": true,
        "rules": path.join(__dirname, "..", "definitions"),
    },
})

const help = message => {
    const name = "extract"

    if (message) {
        console.log(`${name}: ${message}`)
        console.log()
    }

    console.log(`\
usage: ${name} [options]

Extract structured data from an HTML document, using rules.

Source options:

One of these is required. If used together, the document will
be read from the file, but the url is assumed to be the source
of the file - this is useful in case, e.g. in looking up rules..

--url <url>     url to extract from
--file <file>   file to extract from

Rule options:

If --rule is specified, the rules in that file will
be used for better or for worse. If --rules is specified, all the
rules in that folder will be used (narrowed by --url). If neither is
specified, the default rules will be which handle a few well-known
news sites (e.g. cnn, cbc, bbc)

--rules <folder> load 
--rule <file>    read the parsing rule from this file

Output options (by default, output is YAML):

--first          only output the first result
--json           output the data as JSON
--jsonl          output the data as JSON Lines
--as <type>      as a schema.org type in JSON-LD (as much as possible,
                 most plausibly NewsArticle)

Debugging info:

--verbose        increase debugging information
--no-cache       don't cache URL fetch
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

/**
 *  main
 */
_.promise({
    trace: ad.trace,
    verbose: ad.verbose,

    cache$cfg: {
        path: path.join(os.homedir(), ".iotdb-extract"),
    },

    url: ad.url || null,
    path: ad.file || null,
    rule: null,
    rule_path: ad.rule || null,
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

    .then(extract.initialize)
    .then(extract.load_rules.p(ad.rules))

    .add("rule_path:path")
    .conditional(sd => sd.rule_path, fs.read.yamls)
    .conditional(sd => sd.rule_path, _.promise.add("jsons:rules"), extract.find)

    .then(extract.extract)

    .make(sd => {
        sd.jsons.forEach(json => {
            _.keys(json)
                .filter(key => key.startsWith("_"))
                .forEach(key => delete json[key])
        })

        if (ad.as) {
            sd.jsons.forEach(json => {
                json["@context"] = {
                    "@vocab": "http://schema.org/"
                },

                json["@type"] = ad.as

                if (json.url) {
                    json["@id"] = json.url
                    delete json.url
                }

                if (json.name) {
                    json.headline = json.name
                    // we keep name
                }

                if (json.document) {
                    json.articleBody = json.document
                    delete json.document
                }
            })
        }

        if (ad.jsonl) {
            sd.jsons.forEach(json => console.log(JSON.stringify(json)))
        } else if (ad.one) {
            if (ad.json) {
                console.log(JSON.stringify(sd.jsons[0] || null, null, 2))
            } else if (sd.jsons.length) {
                console.log("--")
                console.log(yaml.safeDump(jsons[0], {
                    sortKeys: true,
                }))
            } else {
                console.log("--")
            }
        } else {
            if (ad.json) {
                console.log(JSON.stringify(sd.jsons, null, 2))
            } else {
                sd.jsons.forEach(json => {
                    console.log("--")
                    console.log(yaml.safeDump(json, {
                        sortKeys: true,
                    }))
                })
            }
        }
    })

    .catch(error => {
        if (ad.verbose) {
            delete error.self
            console.log("#", error)
        }

        help(_.error.message(error))
    })
