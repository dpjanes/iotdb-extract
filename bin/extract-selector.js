/*
 *  bin/extract-selector.js
 *
 *  David Janes
 *  Consensas
 *  2019-07-26
 */

"use strict"

const _ = require("iotdb-helpers")
const fs = require("iotdb-fs")
const fetch = require("iotdb-fetch")
const extract = require("..")

const yaml = require("js-yaml")
const path = require("path")
const os = require("os")

const cheerio = require("cheerio")

const minimist = require("minimist")
const ad = minimist(process.argv.slice(2), {
    boolean: [
        "verbose", "dump", "trace", "debug",
        "dry-run",
    ],
    string: [
        "url", 
    ],
    alias: {
        "dry-run": "dry_run",
    }, 
})

const help = message => {
    const name = "extract-selector"

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

        .except(_.promise.unbail)
        .make(sd => {
            sd.$ = cheerio.load(sd.document)
        })

        .end(done, self, "$")
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
}

const _do_selector = _.promise((self, done) => {
    _.promise(self)
        .validate(_do_selector)

        .make(sd => {
            console.log("==")
            console.log("selector:", sd.selector)
            console.log("result:")
            console.log(sd.$(sd.selector).html())
            console.log()
        })

        .end(done, self)
})

_do_selector.method = "_do_selector"
_do_selector.requires = {
    $: _.is.Object,
    selector: _.is.String,
}
_do_selector.accepts = {
}
_do_selector.produces = {
}

/**
 *  main
 */
_.promise({
    verbose: ad.verbose,
    dry_run: ad.dry_run,

    cache_folder: path.join(os.homedir(), "var", "iotdb-extract"),
    url: ad.url,
    url_hash: _.hash.md5(ad.url),

    selectors: ad._,
})
    .then(_load)
    .each({
        method: _do_selector,
        inputs: "selectors:selector",
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
