#!/usr/bin/env bash
set -euo pipefail

git fetch --quiet origin main prod

numbers=$(git log origin/prod..origin/main --merges --pretty=format:"%s" |
  sed -nE 's/^Merge pull request #([0-9]+) from .*/\1/p')

unmerged=$(git log origin/prod..origin/main --first-parent --no-merges --oneline)
if [ -n "$unmerged" ]; then
  printf 'Warning: these commits are not from a merge commit, so their PRs are not in the list:\n%s\n' "$unmerged" >&2
fi

if [ -z "$numbers" ]; then
  echo "No merged PRs to release." >&2
  exit 1
fi

fields=""
index=0
for number in $numbers; do
  index=$((index + 1))
  fields+=$(printf 'pr%03d: pullRequest(number: %s) { bodyHTML closingIssuesReferences(first: 20) { nodes { title url } } headRefName title url } ' "$index" "$number")
done

gh api graphql \
  -F owner='{owner}' \
  -F repo='{repo}' \
  -f query="query(\$owner: String!, \$repo: String!) { repository(owner: \$owner, name: \$repo) { $fields } }" \
  -q '
    def tag($label; $items): if ($items | length) > 0 then "\($label): " + ($items | join(", ")) else empty end;
    def key: capture("github\\.com/(?<repo>[^/]+/[^/]+)/(?:issues|pull)/(?<number>[0-9]+)") | "\(.repo)#\(.number)" | ascii_downcase;
    .data.repository[]
    | .url as $self
    | [.closingIssuesReferences.nodes[] | {title, url}] as $closes
    | ([.bodyHTML | scan("href=\"(https://github\\.com/[^/\"]+/[^/\"]+/(?:issues|pull)/[0-9]+)") | .[0]]
      | unique_by(key)
      | map(select(key as $k | [$closes[].url, $self] | map(key) | index($k) | not))) as $refs
    | [
        $self,
        .title,
        "branch: \(.headRefName)",
        tag("closes"; [$closes[] | "\(.url) (\(.title))"]),
        tag("refs"; $refs)
      ]
    | join(" | ")
  '
