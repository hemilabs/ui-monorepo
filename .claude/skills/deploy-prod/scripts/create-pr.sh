#!/usr/bin/env bash
set -euo pipefail

gh pr create \
  --base prod \
  --head main \
  --title "Deploy $(date +%F)" \
  --body-file -
