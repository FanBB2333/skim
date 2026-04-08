#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_RACE=0

if [[ "${1:-}" == "--race" ]]; then
  RUN_RACE=1
fi

cd "$ROOT_DIR"

echo "[1/4] go test ./..."
go test ./...

echo "[2/4] go vet ./..."
go vet ./...

echo "[3/4] go build ./cmd/skim"
go build ./cmd/skim

if [[ "$RUN_RACE" -eq 1 ]]; then
  echo "[4/4] go test -race ./..."
  go test -race ./...
else
  echo "[4/4] skip race test (use --race to enable)"
fi
