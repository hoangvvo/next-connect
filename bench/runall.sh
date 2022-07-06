#!/usr/bin/env bash
printf "Machine: $(uname -s -r -m) | $(node -r os -p "\`\${os.cpus().length} vCPUs | \${Math.ceil(os.totalmem() / (Math.pow(1024, 3)))}GB\`")\n"
printf "Node: $(node -v)\n\n"
for path in *.js
do
file=${path##*/} 
base=${file%.*}
./run.sh $base
done