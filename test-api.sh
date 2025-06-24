#!/bin/bash

# Test script for Finance Manager API endpoints

BASE_URL="https://finance-manager.irfandimarsya.workers.dev"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0YWQ1NTgwLTM2ZTUtNDcwNi1iZWQ4LWRkZmU2OTZkZTM3OCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJVU0VSIn0.WfcI0qmC5LXwhhm_zlo88FQSrb4_yXFxjFXud5Oaz44"

echo "Testing Chart of Accounts endpoint..."
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/accounts"

echo -e "\n\nTesting Transactions endpoint..."
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/transactions"

echo -e "\n\nTesting Categories endpoint..."
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/categories"

echo -e "\n\nTesting Budgets endpoint..."
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/budgets"

echo -e "\n\nTesting Reports endpoint..."
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/reports/summary"