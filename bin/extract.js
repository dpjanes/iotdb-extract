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
const extract = require("..")

const yaml = require("js-yaml")
const path = require("path")
const os = require("os")
const URL = require("url").URL

const cheerio = require("cheerio")

const minimist = require("minimist")
const ad = minimist(process.argv.slice(2), {
    boolean: [
        "verbose", "dump", "trace", "debug",
    ],
    string: [
        "url", 
    ],
    alias: {
    }, 
})

const help = message => {
    const name = "extract"

    if (message) {
        console.log(`${name}: ${message}`)
        console.log()
    }

    console.log(`usage: ${name} [options] --url <url>`)
    console.log("")
    console.log("Options:")
    console.log("--url <url>                URL to pull (cached)")

    process.exit(message ? 1 : 0)
}

if (ad.help) {
    help()
}
if (!ad.url && ad._.length) {
    ad.url = ad._.shift()
}
if (!ad.url) {
    help("--url <url> is required")
}
_.logger.levels({
    debug: ad.debug || ad.verbose,
    trace: ad.trace || ad.verbose,
})
const logger = require("../logger")(__filename)

/**
 */
const _load = _.promise((self, done) => {
    _.promise(self)
        .validate(_load)

        .add("path", path.join(self.cache_folder, self.url_hash + ".html"))
        .then(fs.make.directory.parent)
        
        .add("otherwise", null)
        .then(fs.read.utf8)
        .conditional(sd => sd.document, _.promise.bail)

        .then(fetch.document)
        .then(fs.write.utf8)

        .end(done, self, "document")
})

_load.method = "_load"
_load.requires = {
    cache_folder: _.is.String,
    url: _.is.String,
    url_hash: _.is.String,
}
_load.accepts = {
}
_load.produces = {
    $: _.is.Object,
    document: _.is.String,
}

/**
 *  main
 */
_.promise({
    trace: ad.trace,
    verbose: ad.verbose,

    cache_folder: path.join(os.homedir(), "var", "iotdb-extract"),
    url: ad.url,
    url_hash: _.hash.md5(ad.url),
})
    .then(_load)

    .then(extract.initialize)
    .then(extract.load_rules.builtin)
    .then(extract.find)
    .then(extract.extract)

    .make(sd => {
        sd.jsons.forEach(json => {
            _.keys(json)
                .filter(key => key.startsWith("_"))
                .forEach(key => delete json[key])

            console.log("--")
            console.log(yaml.safeDump(json, {
                sortKeys: true,
            }))

        })
    })

    // done
    .catch(error => {
        delete error.self
        console.log("===")
        console.trace()
        console.log("===")
        console.log()

        help(_.error.message(error))
    })


/*
*/

