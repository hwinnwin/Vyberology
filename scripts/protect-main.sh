#!/usr/bin/env bash
set -euo pipefail

REMOTE_URL="$(git config --get remote.origin.url || true)"

if [[ -z "${REMOTE_URL}" ]]; then
  echo "No git remote found. Set OWNER and REPO manually."
  exit 1
fi

if [[ "${REMOTE_URL}" =~ github.com[:/]+([^/]+)/([^/.]+) ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
else
  echo "Could not parse OWNER/REPO from remote URL: ${REMOTE_URL}"
  exit 1
fi

echo "Targeting ${OWNER}/${REPO}"

CHECKS=(
  "CI (Build + Test + Gates)"
  "Deploy (Web + Supabase)"
  "Release Prep"
  "Detector Health"
)

CONTEXTS_JSON=$(printf '%s
' "${CHECKS[@]}" | jq -R . | jq -s .)

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated. Run 'gh auth login' first."
  exit 1
fi

echo "Applying branch protection to ${OWNER}/${REPO}@main..."

jq -n \
  --argjson contexts "${CONTEXTS_JSON}" \
  '{
    required_status_checks: {
      strict: true,
      contexts: $contexts
    },
    enforce_admins: true,
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      dismiss_stale_reviews: true
    },
    restrictions: null
  }' | \
  gh api \
    -X PUT \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    "/repos/${OWNER}/${REPO}/branches/main/protection" \
    --input -

echo "✅ Branch protection applied. Current settings:" \
&& gh api -H "Accept: application/vnd.github+json" \
  "/repos/${OWNER}/${REPO}/branches/main/protection" | jq '{
    require_pr_reviews: (.required_pull_request_reviews != null),
    approving_reviews: (.required_pull_request_reviews.required_approving_review_count // 0),
    status_checks_strict: .required_status_checks.strict,
    required_checks: (.required_status_checks.contexts // []),
    enforce_admins: .enforce_admins.enabled
  }'
