/*
 *  bin/extract-probe.js
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
        "configuration", "cfg", 
        "url", 
    ],
    alias: {
        "configuration": "cfg",
        "dry-run": "dry_run",
    }, 
})

const help = message => {
    const name = "extract-probe"

    if (message) {
        console.log(`${name}: ${message}`)
        console.log()
    }

    console.log(`usage: ${name} [options] --url <url>`)
    console.log("")
    console.log("Options:")
    console.log("--url <url>                URL to pull (cached)")
    console.log("--selector <selector>      CSS selector")

    process.exit(message ? 1 : 0)
}

if (ad.help) {
    help()
}
if (!ad.url) {
    help("--url <url> is required")
}
if (!ad.selector) {
    help("--selector <selector> is required")
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
        /*
        .except(_.promise.unbail)
        .make(sd => {
            sd.$ = cheerio.load(sd.document)
        })

        .end(done, self, "$")
        */
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

/**
const _build_rule = _.promise((self, done) => {
    _.promise(self)
        .validate(_build_rule)

        .make(sd => {
            console.log("==")
            console.log("selector:", sd.selector)
            console.log("result:")
            console.log(sd.$(sd.selector).html())
            console.log()
        })

        .end(done, self)
})

_build_rule.method = "yyy._build_rule"
_build_rule.requires = {
    selector: _.is.String,
}
_build_rule.accepts = {
}
_build_rule.produces = {
}
 */

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
    .make(sd => {
        sd.rules = [
            {
                extract: {
                    document: ad.selector,
                    document_required: false,
                    title_required: false,
                },
            }
        ]
    })
    .then(extract.extract)
    .make(sd => {
        console.log("HERE:XXX", sd.jsons)
    })
    /*
    EHRE: [ { urls: 'bbc.com',
    samples: [ 'https://www.bbc.com/news/world-latin-america-45380237' ],
    meta: { language: 'en' },
    extract:
     { _content: '.story-body',
       title: 'h1',
       document: '.story-body__inner p',
       published: [Object],
       updated: [Object] },
    __length: 7 } ]
    */

    /*
    .each({
        method: _build_rule,
        inputs: "selectors:selector",
    })
    */

    // done
    .catch(error => {
        delete error.self
        console.log("===")
        console.trace()
        console.log("===")
        console.log()

        help(_.error.message(error))
    })
