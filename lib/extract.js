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
const _extract_elements = ($, $story, part_rule) => {
    let parts = []

    if (_.is.String(part_rule)) {
        $story.find(part_rule).each((x, e) => {
            parts.push($(e).text())
        })
    } else if (_.is.Dictionary(part_rule)) {
        if (part_rule.root) {
            $(part_rule.root).each((x, e) => {
                parts.push($(e))
            })
        } else if (part_rule.story) {
            $story.find(part_rule.story).each((x, e) => {
                parts.push($(e))
            })
        }

        if (part_rule.attribute) {
            parts = parts.map(part => part.attr(part_rule.attribute))
        } else if (part_rule.jsonld) {
            parts = parts.map(part => part.html())
        } else {
            parts = parts.map(part => part.text())
        }

        if (part_rule.jsonld && parts.length) {
            try {
                const json = JSON.parse(parts[0])
                parts = [ json[part_rule.jsonld] ]
            } catch (x) {
            }
        }

        if (part_rule.split) {
            parts = _.flatten(parts.map(part => part.split(part_rule.split)))
        }
    }

    return parts
        .filter(part => part)
        .map(part => part.replace(/[\s|\u00A0]+/g, " ")) // FML WTF
        .map(part => part.trim())
        .filter(part => part.length)
}

/**
 */
const _extract = _.promise(self => {
    _.promise.validate(self, _extract)

    if (!self.rule.extract) {
        self.jsons = null
        return
    }

    $ = self.$

    self.jsons = []

    const stories = $(self.rule.extract._content || "body")
    stories.each((x, _story) => {
        const json = _.d.compose({
            url: self.url,
        }, self.rule.meta || {})

        let $story = $(_story)

        if (self.rule.extract._removes) {
            $story = $story.clone()

            _.d.list(self.rule.extract, "_removes", [])
                .forEach(remove => $story.find(remove).remove())
        }

        _.mapObject(self.rule.extract, (part_rule, key) => {
            if (key.startsWith("_")) {
                return
            }

            const parts = _extract_elements($, $story, part_rule)
            if (!parts.length) {
                return
            }

            if (key === "title") {
                json[key] = parts[0]
            } else if (part_rule.first) {
                json[key] = parts[0]
            } else if (part_rule.list) {
                json[key] = parts
            } else {
                json[key] = parts.join("\n\n")
            }
        })

        if (self.rule._title_required && _.is.Empty(json.title)) {
            return
        }

        if (self.rule._document_required && _.is.Empty(json.document)) {
            return
        }

        json._rule = self.rule
        self.jsons.push(json)
    })
})

_extract.method = "extract/_extract"
_extract.requires = {
    rule: _.is.Dictionary,
}
_extract.accepts = {
}
_extract.produces = {
}

/**
 */
const extract = _.promise((self, done) => {
    _.promise(self)
        .validate(extract)

        .add({
            "$": cheerio.load(self.document),
        })
        .each({
            method: _extract,
            inputs: "rules:rule",
            outputs: "jsonss",
            output_selector: sd => sd.jsons,
            output_filter: jsons => jsons && jsons.length,
        })
        .make(sd => {
            sd.jsons = sd.jsonss.length ? sd.jsonss[0] : []
        })
        .end(done, self, "jsons")
})

extract.method = "extract"
extract.requires = {
    rules: _.is.Array,
    document: _.is.String,
}
extract.accepts = {
}
extract.produces = {
    jsons: _.is.Array,
}

/**
 *  API
 */
exports.extract = extract
