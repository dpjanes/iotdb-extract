/**
 *  lib/strategy/title.h1.js
 *
 *  David Janes
 *  Consensas
 *  2020-11-02
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

const logger = require("../../logger")(__filename)
const _util = require("./../_util")

/**
 */
const strategy = _.promise(self => {
    _.promise.validate(self, strategy)

    const $ = cheerio.load(self.document)
    const $h1 = $("h1")
    if ($h1.length === 0) {
        return
    } else if ($h1.length === 1) {
        self.extracts.push({
            $score: 0.8,
            title: "h1"
        })
    } else {
        self.extracts.push({
            $strategy: "title.h1",
            $score: 0.6,
            title: "h1"
        })
    }
})

strategy.method = "strategy"
strategy.description = `Figure out the structure of a web page`
strategy.requires = {
    document: _.is.String,
    extracts: _.is.Array,
}
strategy.accepts = {
}
strategy.produces = {
    extracts: _.is.Array,
}

/**
 *  API
 */
exports.strategy = strategy
