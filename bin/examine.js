/*
 *  bin/examine.js
 *
 *  David Janes
 *  IOTDB
 *  2019-11-12
 */

"use strict"

const _ = require("iotdb-helpers")
const fs = require("iotdb-fs")
const fetch = require("iotdb-fetch")
const cache = require("iotdb-cache")
const extract = require("..")

const path = require("path")
const os = require("os")
const cheerio = require("cheerio")

let colors
try {
    colors = require("colors")
} catch (x) {
}

const _util = require("../lib/_util")

const minimist = require("minimist")
const ad = minimist(process.argv.slice(2), {
    boolean: [
        "verbose", "dump", "trace", "debug",
        "cache",
        "raw",
        "html",
    ],
    string: [
        "url", 
        "path", 
        "_",
        "remove",
        "find",
        "root",
    ],
    alias: {
        "remove": "removes",
    }, 
    default: {
        "cache": true,
        "scrub": true,
        "rules": path.join(__dirname, "..", "definitions"),
        "remove": "svg,script,style,form",
        "root": "body",
    },
})

const help = message => {
    const name = "examine"

    if (message) {
        console.log(`${name}: ${message}`)
        console.log()
    }

    console.log(`\
usage: ${name} [options]

Examine the structure of an HTML document. 
The most likely way you want to use this is:

    node ${name} --url <url> --find p

Source options:

One of these is required, with --file getting precedence

--url <url>      url to extract from
--file <file>    file to extract from

Output options (one of these is required):

--raw            just dump the document
--html           dump document, after structuring
--find <tag>[,<tag>...]     
                 find tag(s), print the text and the CSS path

Structuring options:

--remove <tag>[,<tag>...]
                 remove tags from the document first, the
                 default being "svg,script,style,form"
--scrub          remove all attributes except "class" and "id"
--root <tag>     start at the root tag, default is "body"

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
if (!ad.find && !ad.raw && !ad.html) {
    help("one of --find <tag>, --raw or --html is required")
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

    .make(sd => {
        if (ad.raw) {
            console.log(sd.document)
            return
        }

        const $ = cheerio.load(sd.document)
        const $document = $(ad.root)

        if (!_.is.Empty(ad.remove)) {
            $document.find(ad.remove).remove()
        }

        if (ad.scrub) {
            $document.find("*").each((x, e) => {
                const $e = $(e)
                _.keys(e.attribs || {})
                    .filter(key => [ "class", "id" ].indexOf(key) === -1)
                    .forEach(key => {
                        $e.attr(key, null)
                    })
            })
        }

        if (ad.find) {
            $document.find(ad.find).each((x, e) => {
                const $e = $(e)
                const text = _util.text($, $e).trim()
                if (_.is.Empty(text)) {
                    return
                }

                if (colors) { 
                    console.log("--")
                    const results = []
                    $e.parentsUntil("html").each((x, p) => {
                        const $p = $(p)
                        let pclass = $p.attr("class")
                        let pid = $p.attr("id")

                        let part = colors.white(p.tagName)
                        if (pid) {
                            part += colors.magenta("#")
                            part += colors.cyan(pid)
                        } else if (pclass) {
                            pclass.split(" ").forEach(c => {
                                part += colors.magenta(".")
                                part += colors.cyan(c)
                            })
                        }

                        results.unshift(part)
                    })
                    console.log(results.join(" "))
                    console.log()
                    console.log(text)
                } else {
                    console.log("--")
                    console.log(_util.node_path($, $e).join(" "))
                    console.log()
                    console.log(text)
                }
            })
        } else if (ad.html) {
            console.log($document.html().trim())
        }
    })

    .except(_.promise.unbail)
    .except(error => {
        if (ad.verbose) {
            delete error.self
            console.log("#", error)
        }

        help(_.error.message(error))
    })
