/**
 *  lib/analyze.js
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

const cheerio = require("cheerio")

const logger = require("../logger")(__filename)
const _util = require("./_util")

/**
 */
const analyze = _.promise((self, done) => {
    const extract = require("..")

    _.promise.make(self)
        .validate(analyze)

        .add("extracts", [])
        .then(extract.strategy.document.body)
        .then(extract.strategy.document.article)
        .then(extract.strategy.name.meta)
        .then(extract.strategy.keyword.meta)
        .then(extract.strategy.name.h1)
        .then(extract.strategy.name.title)
        .then(extract.strategy.jsonld)
        .then(extract.strategy.date.meta)

        .end(done, self, analyze)
})

analyze.method = "analyze"
analyze.description = `Figure out the structure of a web page`
analyze.requires = {
    document: _.is.String,
}
analyze.accepts = {
}
analyze.produces = {
    extracts: _.is.Array,
}

/**
 *  API
 */
exports.analyze = analyze
