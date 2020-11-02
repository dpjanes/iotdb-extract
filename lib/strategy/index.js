/*
 *  lib/strategy/index.js
 *
 *  David Janes
 *  IOTDB.org
 *  2018-11-02
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

module.exports = Object.assign(
    {},
    {
        document: {
            body: require("./document.body").strategy,
            article: require("./document.article").strategy,
        },
        title: {
            meta: require("./title.meta").strategy,
            h1: require("./title.h1").strategy,
        },
    },
)
