#!/bin/sh
set -e

host="$1"
port="$2"
shift 2

until pg_isready -h "$host" -p "$port" -U "$POSTGRES_USER" >/dev/null 2>&1; do
  echo "Waiting for postgres at $host:$port..."
  sleep 2
 done

exec "$@"
