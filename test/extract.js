/**
 *  test/extract.js
 *
 *  David Janes
 *  IOTDB
 *  2018-11-10
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

"use strict"

const _ = require("iotdb-helpers")
const fs = require("iotdb-fs")

const assert = require("assert")
const path = require("path")

const extract = require("..")
const _util = require("./_util")

describe("data", function() {
    let self = {}

    before(function(done) {
        _.promise.make(self)
           .then(_util.initialize)
            .then(extract.load_rules.builtin)
            .then(_.promise.make(sd => {
                self = sd
            }))
            .then(_.promise.done(done))
            .catch(done)
    })

    describe("good", function() {
        it("works", function(done) {
            const _test = _.promise((self, done) => {
                const root = self.path

                _.promise(self)
                    .add("json", null)
                    .add("path", sd => path.join(root, "data.yaml"))
                    .then(_.promise.optional(fs.read.json.magic))
                    .then(_.promise.bail.conditional(sd => !sd.json))
                    .then(_.promise.log("test", "path"))
                    .add("json:configuration")

                    // find the rule
                    .add("configuration/url")
                    .then(extract.find)

                    // parse the document
                    .add("path", sd => path.join(root, "input.html"))
                    .then(fs.read.utf8)
                    .then(extract.extract)
                    .then(extract.clean)
                    .add("jsons:got")

                    // read the expected value
                    .add("path", sd => path.join(root, "output.yaml"))
                    .then(fs.read.json.magic)
                    .add("json:expected")

                    // last step
                    .make(sd => {
                        assert.deepEqual(sd.got, sd.expected)
                    })
                    .catch(_.promise.unbail)
                    .end(done, self)
            })

            _.promise(self)
                .add("path", path.join(__dirname, "data"))
                .then(fs.list)
                .each({
                    method: _test,
                    inputs: "paths:path",
                })
                .end(done)
        })
    })
})
