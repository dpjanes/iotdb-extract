/**
 *  lib/analyze.js
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

const cheerio = require("cheerio")

const logger = require("../logger")(__filename)
const _util = require("./_util")

/**
 */
const analyze = _.promise(self => {
    _.promise.validate(self, analyze)

    const $ = cheerio.load(self.document)
    const $body = $("body")

    $body.find("p,div").each((x, e) => {
        const $e = $(e)
        $e.parentsUntil("body").each((x, p) => {
            p.__EXCLUDE = true
        })
    })

    $body.find("p,div").each((x, e) => {
        if (e.__EXCLUDE) {
            return
        }
        const $e = $(e)
        const text = _util.text($, $e)
            .replace(/[^A-Za-z]/g, " ")
            .split(" ")
            .filter(x => x.length)

        $e.parentsUntil("body").each((x, p) => {
            if (x < 2) {
                p.__SCORE = (p.__SCORE || 0) + 1
            }
        })
    })

    let max = null
    let max_score = 0

    $body.find("div").each((x, e) => {
        if (!e.__SCORE) {
            return
        }

        if (e.__SCORE < max_score) {
            return
        }

        const $e = $(e)
        const eclass = $e.attr("class")

        max_score = e.__SCORE
        if (eclass) {
            max = `${e.tagName}.${eclass}`
        } else {
            max = e.tagName
        }
    })

    console.log("HERE:XXX", max, max_score)
})

analyze.method = "analyze"
analyze.description = `Figure out the structure of a web page`
analyze.requires = {
    document: _.is.String,
}
analyze.accepts = {
}
analyze.produces = {
}

/**
 *  API
 */
exports.analyze = analyze
