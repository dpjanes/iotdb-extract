Explore a CSS selectpr in a document

    node extract-selector  --url 'http://www.miningnewsmagazine.org/?p=1083' "h1[itemprop=headline]"

Build a ruleset

    node extract-build.js --url 'http://www.miningnewsmagazine.org/?p=1083' \
        --guess

    node extract-build.js --url 'http://www.miningnewsmagazine.org/?p=1083' \
        --document ".post-entry" \
        --title "h1[itemprop=headline]"

