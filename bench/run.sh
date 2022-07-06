#!/usr/bin/env bash

server="$1"
url="$2"

NODE_ENV=production node $server &
pid=$!

printf "$server\n"

sleep 2

wrk -t12 -c400 -d30s http://localhost:3000/user/123

printf "\n"

kill $pid