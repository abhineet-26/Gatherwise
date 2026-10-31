#!/usr/bin/env bash
# Pre-submission checks for the challenge rules (single `main` branch, < 10 MB, no secrets,
# README sections present). Read-only: it never modifies the repository.
# Usage: bash scripts/verify-submission.sh [--ci]
set -u

CI_MODE=0
[ "${1:-}" = "--ci" ] && CI_MODE=1
fail=0
warn=0
ok()   { printf '  PASS  %s\n' "$1"; }
bad()  { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }
note() { printf '  WARN  %s\n' "$1"; warn=$((warn + 1)); }

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not inside a git repository."; exit 2; }
cd "$(git rev-parse --show-toplevel)" || exit 2
echo "GatherWise submission check ($(date -u +%Y-%m-%dT%H:%MZ))"

echo "1. Branches (only 'main' is allowed)"
locals=$(git for-each-ref --format='%(refname:short)' refs/heads | sed '/^$/d')
count=$(printf '%s\n' "$locals" | sed '/^$/d' | wc -l | tr -d ' ')
if [ "$count" = "1" ] && [ "$locals" = "main" ]; then
  ok "single local branch: main"
else
  bad "local branches: $(printf '%s ' $locals) (expected only: main)"
fi
if [ "$CI_MODE" = "0" ] && git remote get-url origin >/dev/null 2>&1; then
  remote_heads=$(git ls-remote --heads origin 2>/dev/null | awk '{print $2}' | sed 's#refs/heads/##' | sed '/^$/d')
  if [ -z "$remote_heads" ]; then
    note "could not read remote branches (offline, no access, or empty remote)"
  elif [ "$remote_heads" = "main" ]; then
    ok "remote 'origin' has only main"
  else
    bad "remote branches: $(printf '%s ' $remote_heads) (expected only: main)"
  fi
else
  note "remote branches not checked (no 'origin' remote, or --ci)"
fi

echo "2. Size (limit 10 MB)"
limit_kb=10240
git_kb=$(du -sk .git | cut -f1)
tracked_kb=$(git ls-files -z | xargs -0 -r du -ck 2>/dev/null | tail -1 | cut -f1)
tracked_kb=${tracked_kb:-0}
printf '        .git: %s KB   tracked files: %s KB\n' "$git_kb" "$tracked_kb"
if [ "$tracked_kb" -ge "$limit_kb" ]; then bad "tracked files are over 10 MB"; else ok "tracked files under 10 MB"; fi
if [ "$git_kb" -ge "$limit_kb" ]; then
  bad ".git is over 10 MB (try: git gc --prune=now; large files in history must be removed)"
elif [ "$git_kb" -ge $((limit_kb * 8 / 10)) ]; then
  note ".git is above 80% of the limit"
else
  ok ".git under 10 MB"
fi
big=$(git ls-files -z | xargs -0 -r du -k 2>/dev/null | awk '$1 > 1024 {print $1 " KB  " $2}' | sort -rn | head -5)
[ -n "$big" ] && note "tracked files over 1 MB:" && printf '%s\n' "$big" | sed 's/^/        /'

echo "3. Secrets and forbidden files"
pattern='AIza[0-9A-Za-z_-]{35}|-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----|"private_key_id"[[:space:]]*:'
hits=$(git grep -InE "$pattern" 2>/dev/null | cut -c1-140 | head -5)
if [ -n "$hits" ]; then bad "secret-like content in tracked files:"; printf '%s\n' "$hits" | sed 's/^/        /'; else ok "no key patterns in tracked files"; fi
if git log --all --oneline -G'AIza[0-9A-Za-z_-]{35}' 2>/dev/null | grep -q .; then
  bad "key-like string appears in git history (rotate the key and rewrite history)"
else
  ok "no key patterns in git history"
fi
env_files=$(git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example$' || true)
if [ -n "$env_files" ]; then bad "tracked env files: $env_files"; else ok "no .env files tracked"; fi
forbidden=$(git ls-files | grep -E '(^|/)(node_modules|dist|build|coverage|\.firebase)/|\.log$|\.sqlite$|\.pem$|service-account' || true)
if [ -n "$forbidden" ]; then bad "forbidden paths tracked:"; printf '%s\n' "$forbidden" | head -5 | sed 's/^/        /'; else ok "no dependency, build or credential paths tracked"; fi

echo "4. Required files and README sections"
for f in README.md AGENTS.md .gitignore .env.example docs/PRD.md docs/ARCHITECTURE.md; do
  if [ -f "$f" ]; then ok "$f present"; else bad "$f missing"; fi
done
if [ -f README.md ]; then
  for topic in 'vertical' 'approach' 'how it works|how the solution works' 'assumption'; do
    if grep -qiE "^#{1,4} .*(${topic})" README.md; then ok "README has a section on: ${topic%%|*}"; else bad "README is missing a heading about: ${topic%%|*}"; fi
  done
  if grep -qiE '<!-- *AGENT' README.md; then bad "README still contains <!-- AGENT --> placeholders"; fi
fi

echo "5. Working tree"
if [ -n "$(git status --porcelain)" ]; then note "uncommitted changes present (commit before submitting)"; else ok "working tree clean"; fi

echo
echo "Result: ${fail} failure(s), ${warn} warning(s)"
[ "$fail" -eq 0 ]
