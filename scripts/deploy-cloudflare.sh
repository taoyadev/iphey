#!/usr/bin/env bash
# One-command publication through the existing, account-bound Actions workflow.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
if [[ ${IPHEY_GITHUB_SCOPED:-0} != 1 ]]; then
  export IPHEY_GITHUB_SCOPED=1
  exec "$HOME/.codex/bin/github-token-run" --user taoyadev -- bash "$0"
fi
[[ $(gh api user --jq .login) == taoyadev ]] || { echo 'Unexpected GitHub identity' >&2; exit 2; }
[[ $(git branch --show-current) == main ]] || { echo 'Release requires main' >&2; exit 2; }
[[ $(git remote get-url origin) == https://github.com/taoyadev/iphey.git ]] || { echo 'Unexpected repository' >&2; exit 2; }
sha=$(git rev-parse HEAD)
# Only the accepted commit is published; unrelated unstaged documentation stays local.
git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin HEAD:main
run_id=''
for attempt in {1..18}; do
  run_id=$(gh run list --repo taoyadev/iphey --workflow deploy.yml --commit "$sha" --event push --limit 1 --json databaseId --jq '.[0].databaseId // empty')
  [[ -n $run_id ]] && break
  sleep 5
done
[[ -n $run_id ]] || { echo 'No matching workflow appeared; inspect before retrying publication' >&2; exit 3; }
printf 'Release commit: %s\nWorkflow: https://github.com/taoyadev/iphey/actions/runs/%s\n' "$sha" "$run_id"
gh run watch "$run_id" --repo taoyadev/iphey --exit-status --interval 10
[[ $(git rev-parse HEAD) == "$sha" ]] || { echo 'Local HEAD changed during release' >&2; exit 4; }
