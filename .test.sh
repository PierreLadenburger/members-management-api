#!/usr/bin/env bash
TOKEN=$(curl --request POST --url https://api.homedoc.fr/login --header 'content-type: application/json' --data '{"email":"pierre.ladenburger@epitech.eu", "password":"123"}'| jq -r '.token')
echo "$TOKEN"

curl --request POST --url https://api.homedoc.fr/getUser --header 'content-type: application/json' --data '{"token":"'$TOKEN'"}'

