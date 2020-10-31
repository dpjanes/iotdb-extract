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

const WRITE = process.env.WRITE === "1"
const DUMP = process.env.DUMP === "1"

describe("data", function() {
    let self = {}

    before(function(done) {
        _.promise(self)
            .then(extract.initialize)
            .then(extract.load_rules.builtin)
            .make(sd => {
                self = sd
                self.verbose = true
            })
            .end(done, {})
    })

    describe("good", function() {
        it("works", function(done) {
            const _test = _.promise((self, done) => {
                const root = path.join(__dirname, "data", self.path)

                _.promise(self)
                    .add("path", sd => path.join(root, "data.yaml"))
                    .then(fs.read.json.magic)
                    .log("test", "path")
                    .add("json:configuration")

                    // find the rule
                    .add("configuration/url")
                    .then(extract.find)

                    // parse the document
                    .then(fs.read.utf8.p(path.join(root, "input.html")))
                    .then(extract.extract)
                    .then(extract.clean)
                    .add("jsons:got")

                    // read the expected value
                    .add("path", sd => path.join(root, "output.yaml"))
                    .add("jsons:json")
                    .conditional(WRITE, fs.write.yaml)
                    .then(fs.read.json.magic)
                    .add("json:expected")

                    // last step
                    .make(sd => {
                        if (DUMP) {
                            console.log(sd.got)
                        }

                        assert.deepEqual(sd.got, sd.expected)
                    })
                    .end(done, self)
            })

            _.promise(self)
                .add("paths", [
                    "bbc-brazil-1",
                    "cbc-mexico-1",
                    "reuters-congo-1",
                ])
                .each({
                    method: _test,
                    inputs: "paths:path",
                })
                .end(done, {})
        })
    })
})
