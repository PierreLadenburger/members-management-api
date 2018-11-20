#!/bin/bash

apt-get install jq

TOKEN=$(curl --request POST \
  --url http://vps549581.ovh.net/users-api/login \
  --header 'content-type: application/json' \
  --data '{
"email" : "pierre.ladenburger@epitech.eu",
"password" : "123"
}' | jq -r '.token')
echo "$TOKEN"

curl --request POST \
  --url http://vps549581.ovh.net/users-api/getUser \
  --header 'content-type: application/json' \
  --data '{
"token" : "'$TOKEN'"
}'
