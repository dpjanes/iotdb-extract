/**
 *  lib/extract.js
 *
 *  David Janes
 *  Consensas
 *  2018-09-01
 *
 *  Copyright [2013-2018] [David P. Janes]
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

const assert = require("assert")

const cheerio = require("cheerio")

/**
 */
const _extract_elements = ($, $story, part) => {
    const parts = []
    $story.find(part).each((x, e) => {
        parts.push($(e).text())
    })

    return parts
        .filter(part => part)
        .map(part => part.trim())
        .filter(part => part.length)
}

/**
 */
const _extract = _.promise.make(self => {
    const method = "extract"

    if (!self.rule.extract) {
        self.jsons = null
        return
    }

    $ = self.$

    self.jsons = []

    const stories = $(self.rule.extract.content || "body")
    stories.each((x, _story) => {
        const json = _.d.compose({
            document: [],
            url: self.url,
        }, self.rule.extract.meta || {})

        let any = false

        const $story = $(_story)

        if (self.rule.extract.title) {
            const parts = _extract_elements($, $story, self.rule.extract.title)
            if (parts.length) {
                json.title = parts[0]
                any = true
            }
        }

        if (self.rule.extract.document) {
            const parts = _extract_elements($, $story, self.rule.extract.document)
            if (parts.length) {
                json.document = parts.join("\n\n")
                any = true
            }
        }

        if (!any) {
            return
        }

        self.jsons.push(json)
    })
})

/**
 */
const extract = _.promise.make((self, done) => {
    const method = "extract"

    assert.ok(_.is.Array(self.rules), `${method}: expected self.rules`)
    assert.ok(_.is.String(self.document), `${method}: expected self.document`)
    
    _.promise.make(self)
        .then(_.promise.add({
            "$": cheerio.load(self.document),
        }))
        .then(_.promise.series({
            method: _extract,
            inputs: "rules:rule",
            outputs: "jsonss",
            output_selector: sd => sd.jsons,
            output_filter: jsons => jsons && jsons.length,
        }))
        .then(_.promise.make(sd => {
            sd.jsons = sd.jsonss.length ? sd.jsonss[0] : null
        }))
        .then(_.promise.done(done, self, "jsons"))
        .catch(done)
})

/**
 *  API
 */
exports.extract = extract
