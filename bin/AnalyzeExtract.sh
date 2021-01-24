#
#   bin/AnalyzeExtract.sh
#
#   David Janes
#   IOTDB
#   2020-11-12
#
#   Run Analyze and Extract
#   

if [ $# != 1 ]
then
    echo "$0: exactly one url argument required"
    exit 1
fi

BIN=$(dirname $0)
node $BIN/analyze.js --url "$1" --rule rule.yaml
node $BIN/extract.js --url "$1" --rule rule.yaml
