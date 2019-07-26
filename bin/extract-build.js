/*
 *  bin/extract-build.js
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
        "guess",
    ],
    string: [
        "url", 
        "document", "title",
    ],
    alias: {
        "dry-run": "dry_run",
    }, 
})

const help = message => {
    const name = "extract-build"

    if (message) {
        console.log(`${name}: ${message}`)
        console.log()
    }

    console.log(`usage: ${name} [options] --url <url>`)
    console.log("")
    console.log("Options:")
    console.log("--url <url>                URL to pull (cached)")
    console.log("--document <selector>")
    console.log("--title <selector>")

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

const _guess = _.promise((self, done) => {
    _.promise(self)
        .validate(_guess)

        .make(sd => {
            sd.$ = cheerio.load(sd.document)

            if (!sd.rule.title) {
                sd.rule.title = "h1"
            }
            /*
            console.log("==")
            console.log("document:", sd.document)
            console.log("result:")
            console.log(sd.$(sd.document).html())
            console.log()
            */
        })

        .end(done, self)
})

_guess.method = "_guess"
_guess.requires = {
}
_guess.accepts = {
}
_guess.produces = {
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

    documents: ad._,
})
    .then(_load)
    .make(sd => {
        sd.rule = {
            document_required: false,
            title_required: false,
        }

        if (ad.document) {
            sd.rule.document = ad.document
        }
        if (ad.title) {
            sd.rule.title = ad.title
        }

        sd.rules = [
            {
                extract: sd.rule,
            }
        ]
    })
    .then(_guess)
    .then(extract.extract)
    .make(sd => {
        sd.jsons.forEach(json => {
            delete json._rule

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
