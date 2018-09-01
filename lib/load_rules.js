/**
 *  lib/load_rules.js
 *
 *  David Janes
 *  Consensas
 *  2018-09-01
 */

const _ = require("iotdb-helpers")
const fs = require("iotdb-fs")

const path = require("path")
const assert = require("assert")

/**
 */
const load_rules = _.promise.make((self, done) => {
    const method = "load_rules"
    const inventory = require("..")

    _.promise.make(self)
        .then(_.promise.add("rules", []))
        .then(fs.list)
        .then(_.promise.series({
            method: inventory.load_rule,
            inputs: "paths:path",
            outputs: "rules",
            output_selector: sd => sd.rule,
            output_filter: rule => rule,
        }))
        .then(_.promise.done(done, self, "rules"))
        .catch(done)
})

/**
 */
const parameterize = path => _.promise.make((self, done) => {
    _.promise.make(self)
        .then(_.promise.add("path", path))
        .then(load_rules)
        .then(_.promise.done(done, self, "rules"))
        .catch(done)
})

/**
 *  API
 */
exports.load_rules = load_rules
exports.load_rules.p = parameterize
exports.load_rules.builtin = parameterize(path.join(__dirname, "..", "definitions"))
