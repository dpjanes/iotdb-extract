/**
 *  lib/_util.js
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

// https://stackoverflow.com/questions/18749591/encode-html-entities-in-javascript/39243641#39243641
const htmlEntities = {
    nbsp: ' ',
    cent: '¢',
    pound: '£',
    yen: '¥',
    euro: '€',
    copy: '©',
    reg: '®',
    lt: '<',
    gt: '>',
    quot: '"',
    amp: '&',
    apos: '\''
};

const _decode = str => str.replace(/\&([^;]+);/g, (entity, entityCode) => {
    var match;

    if (entityCode in htmlEntities) {
        return htmlEntities[entityCode];
        /*eslint no-cond-assign: 0*/
    } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
        return String.fromCharCode(parseInt(match[1], 16));
        /*eslint no-cond-assign: 0*/
    } else if (match = entityCode.match(/^#(\d+)$/)) {
        return String.fromCharCode(~~match[1]);
    } else {
        return entity;
    }
});

const _html_rex = new RegExp("<[^>]*>", "gm")

/**
 */
const text = ($, $e) => {
    $e = $e.clone()
    $e.find("script,style").remove()

    if ([ "script", "style"].indexOf($e.get(0).tagName) > -1) {
        return ""
    } else {
        return _decode($e.html().replace(_html_rex, " "))
    }
}

/**
 */
const node_name = ($, $e) => {
    const tagName = $e.get(0).tagName
    let eclass = $e.attr("class")
    let eid = $e.attr("id")

    if (eid) {
        return `${tagName}#${eid}`
    } else if (eclass) {
        eclass = eclass.split(" ").filter(x => x.length).join(".")
        return `${tagName}.${eclass}`
    } else {
        return `${tagName}`
    }
}

/**
 */
const node_path = ($, $e) => {
    const ps = []
    $e.parentsUntil("html").each((x, p) => ps.unshift(node_name($, $(p))))
    return ps
}

/**
 *  A somewhat more forgiving JSON parser, for 
 *  dealing with crufty JSON-LD
 */
const parse = (s, _otherwise) => {
    let d = _otherwise
    try {
        d = JSON.parse(s)
    } catch (x) {
        try {
            const sandbox = {}
            vm.createContext(sandbox);
            vm.runInContext("d=" + s, sandbox, { timeout: 50 })

            d = sandbox.d
        } catch (y) {
            if (_.is.Undefined(_otherwise)) {
                throw x
            }
        }
    }

    return d
}

/**
 */
exports.text = text
exports.node_name = node_name
exports.node_path = node_path
exports.parse = parse
