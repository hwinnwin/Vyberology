#!/usr/bin/env bash
set -euo pipefail

status=0

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    if [[ "$line" =~ ^[[:space:]]*FROM[[:space:]]+[^[:space:]]+ && "$line" != *"@sha256:"* ]]; then
      echo "❌ Missing digest in $file: $line"
      status=1
    fi
  done < <(grep -E '^[[:space:]]*FROM ' "$file" || true)
done < <(git ls-files | grep -E '(^|/)Dockerfile$|\.Dockerfile$' || true)

exit "$status"
