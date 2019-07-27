Explore a CSS selectpr in a document

    node extract-selector  --url 'http://www.miningnewsmagazine.org/?p=1083' "h1[itemprop=headline]"

Build a ruleset

    node extract-build.js --url 'http://www.miningnewsmagazine.org/?p=1083' \
        --guess

    node extract-build.js --url 'http://www.miningnewsmagazine.org/?p=1083' \
        --document ".post-entry" \
        --title "h1[itemprop=headline]"

    node extract-build.js \
        --url 'http://www.miningnewsmagazine.org/?p=1083' \
        --guess
    node extract-build.js \
        --url 'https://edition.cnn.com/2019/07/27/africa/rwanda-opposition-disappearances-intl/index.html' \
        --guess
    node extract-build.js \
        --url 'https://www.bbc.com/news/world-asia-49136211' \
        --guess
    node extract-build.js \
        --url 'https://www.cbc.ca/news/politics/snc-lavalin-bellegarde-2019-election-1.5226179' \
        --guess

