#!/bin/bash
# Wait for the test PostgreSQL database to be ready

set -e

MAX_RETRIES=30
RETRY_INTERVAL=1

DATABASE_URL="${TEST_DATABASE_URL:-postgresql://test:test@localhost:5433/acme_test}"

echo "Waiting for test database to be ready..."

for i in $(seq 1 $MAX_RETRIES); do
  if pg_isready -d "$DATABASE_URL" > /dev/null 2>&1; then
    echo "✅ Database is ready!"
    exit 0
  fi
  
  echo "Attempt $i/$MAX_RETRIES: Database not ready, waiting ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

echo "❌ Database failed to become ready after $MAX_RETRIES attempts"
exit 1
