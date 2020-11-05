/**
 *  lib/strategy/jsonld.js
 *
 *  David Janes
 *  IOTDB.org
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
const vm = require("vm")

const logger = require("../../logger")(__filename)
const _util = require("./../_util")

/**
 */
const strategy = _.promise(self => {
    _.promise.validate(self, strategy)

    const $ = cheerio.load(self.document)
    const selector = `script[type="application/ld+json"]`
    $(selector).each((x, e) => {
        const $e = $(e)
        const code = $e.html()
        let d
        try {
            d = JSON.parse(code)
        } catch (x) {
            try {
                const sandbox = {}
                vm.createContext(sandbox);
                vm.runInContext("d=" + code, sandbox, { timeout: 50 })

                d = sandbox.d
            } catch (y) {
            }
        }

        if (!d || (d["@type"] !== "NewsArticle")) {
            return
        }

        ;[ 
            [ "headline", "name" ],
            [ "datePublished", "datePublished" ],
            [ "dateModifed", "dateModified" ],
            [ "dateCreated", "dateCreated" ],
            [ "keywords", "keywords" ],
        ]
            .filter(keyt => d[keyt[0]])
            .forEach(keyt => {
                self.extracts.push({
                    $strategy: "jsonld",
                    $score: 0.95,
                    [ keyt[1] ]: {
                        select: selector,
                        jsonld: keyt[0],
                        list: !!(keyt[0] === "keywords"),
                    }
                })
            })
    })
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
