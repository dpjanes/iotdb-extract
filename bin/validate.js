/*
 *  bin/validate.js
 *
 *  David Janes
 *  Consensas
 *  2020-11-07
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
    ],
    string: [
        "_",
    ],
    alias: {
    }, 
    default: {
        "cache": true,
    },
})

const help = message => {
    const name = "validate"

    if (message) {
        console.log(`${name}: ${message}`)
        console.log()
    }

    console.log(`\
usage: ${name} [options] <rules.yaml>...

Validate rules against previous runs of the rules.
This will let you know if a rule stops working.

A subfolder called '.validate' will be created in
the same folder as each rule, and then the various
files to be saved will be stored in there.

We do not cache URL fetches, as that would defeat 
the point!

Options:

--write          write the current results to disk,
                 basically like a reset. If there 
                 is no saved results, this is done
                 automatically

Debugging info:

--verbose        increase debugging information
`)

    process.exit(message ? 1 : 0)
}

if (ad.help) {
    help()
}
if (!ad._.length) {
    help("at least one rule file is required")
}

_.logger.levels({
    debug: ad.debug || ad.verbose,
    trace: ad.trace || ad.verbose,
})
const logger = require("../logger")(__filename)

/**
 */
const _one_sample = _.promise((self, done) => {
    _.promise(self)
        .validate(_one_sample)

        .make(sd => {
            logger.info({
                method: _one_sample.method,
                parameters: {
                    url: sd.url,
                    source: sd.source,
                    folder: sd.folder,
                },
            }, "called")

            sd.rule = {
                key: _.hash.md5("iotdb-extract", "extract", sd.url),
                values: "document",
                method: fetch.document,
            }
        })
        .then(cache.execute)

        .make(sd => {
            sd.path = path.join(sd.folder, _.hash.md5(sd.url) + ".yaml")
            sd.old_path = sd.path
            sd.fs$otherwise_json = null
        })
        .then(fs.read.yaml)
        .add("json:old_extracts")
        
        .then(extract.extract)
        .make(sd => {
            sd.jsons.forEach(json => delete json._rule)
            sd.new_extracts = sd.jsons
        })

        .make(sd => {
            sd.json = null

            if ((ad.write) || _.is.Null(sd.old_extracts)) {
                sd.json = sd.new_extracts

                logger.info({
                    method: _one_sample.method,
                    url: sd.url,
                    extracts: sd.new_extracts,
                    path: sd.path,
                }, "write extracted data")
            } else if (_.is.Equal(sd.new_extracts, sd.old_extracts)) {
                logger.debug({
                    url: sd.url,
                    method: _one_sample.method,
                }, "not changed")
            } else {
                logger.warn({
                    method: _one_sample.method,
                    url: sd.url,
                    "new_extracts": sd.new_extracts,
                    "old_extracts": sd.old_extracts,
                    "old_path": sd.old_path,
                }, "CHANGED")

                sd.result.exit = 1
            }
        })
        .conditional(sd => sd.json, fs.write.yaml)

        .end(done, self, _one_sample)
})

_one_sample.method = "_one_sample"
_one_sample.description = ``
_one_sample.requires = {
    rule: _.is.Dictionary,
    folder: _.is.String,
    url: _.is.String,
    result: {
        exit: _.is.Integer,
    },
}
_one_sample.accepts = {
}
_one_sample.produces = {
    result: {
        exit: _.is.Integer,
    },
}

/**
 */
const _one_rule = _.promise((self, done) => {
    _.promise(self)
        .validate(_one_rule)

        .add("samples", sd => _.d.list(sd.rule, "samples", []))
        .each({
            method: _one_sample,
            inputs: "samples:url",
            error: error => {
                console.log("#", _.error.message(error))
            },
        })

        .end(done, self, _one_rule)
})

_one_rule.method = "_one_rule"
_one_rule.description = ``
_one_rule.requires = {
    rule: _.is.Dictionary,
    folder: _.is.String,
}
_one_rule.accepts = {
}
_one_rule.produces = {
}

/**
 */
const _one_rules = _.promise((self, done) => {
    _.promise(self)
        .validate(_one_rules)

        .then(fs.read.yamls)
        .make(sd => {
            sd.rules = sd.jsons
            sd.source = sd.path
            sd.folder = path.join(path.dirname(sd.path), ".validate", path.basename(sd.path).replace(/[.]yaml$/, ""))
            sd.path = sd.folder
        })
        .then(fs.make.directory)
        .each({
            method: _one_rule,
            inputs: "rules:rule",
        })

        .end(done, self, _one_rules)
})

_one_rules.method = "_one_rules"
_one_rules.description = ``
_one_rules.requires = {
    path: _.is.String,
}
_one_rules.accepts = {
}
_one_rules.produces = {
}

/**
 *  main
 */
_.promise({
    trace: ad.trace,
    verbose: ad.verbose,

    cache$cfg: {
        path: path.join(os.homedir(), ".iotdb-extract"),
    },

    paths: ad._,
    result: {
        exit: 0,
    }
})
    .conditional(ad.cache, fs.cache)

    .then(extract.initialize)

    .each({
        method: _one_rules,
        inputs: "paths:path",
    })
    .make(sd => {
        process.exit(sd.result.exit)
    })
    
    .catch(error => {
        if (ad.verbose) {
            delete error.self
            console.log("#", error)
        }

        help(_.error.message(error))
    })
