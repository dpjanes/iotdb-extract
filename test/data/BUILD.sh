for folder in *
do
    [ ! -f $folder/data.yaml ] && continue
    echo $folder
    node ../_cook.js $folder > $folder/output.yaml
done
