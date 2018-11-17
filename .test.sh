#!/bin/bash

curl --request POST \
  --url http://vps549581.ovh.net/users-api/login \
  --header 'content-type: application/json' \
  --data '{
"email" : "pierre.ladenburger@epitech.eu",
"password" : "123"
}'
