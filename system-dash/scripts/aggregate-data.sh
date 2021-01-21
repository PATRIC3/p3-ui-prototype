echo "Generating data..."
node -r esm ./generate-data.js > out.json

fields=('genus' 'host_name' 'isolation_country' 'isolation_site' 'genome_quality')

for field in "${fields[@]}"
do
  out_file="../../dist/data/by-${field}.json"
  node -r esm ./parse-data.js "${field}" > "${out_file}"
  echo "Wrote file to: ${out_file}"
  echo ""
done
