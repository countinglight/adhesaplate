#!/usr/bin/env bash
# Local fixture test; never connects to Bluehost.
set -Eeuo pipefail
sha1=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
sha2=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
sha3=cccccccccccccccccccccccccccccccccccccccc
tmp=$(mktemp -d)
case "$tmp" in /tmp/tmp.*) ;; *) echo "Unexpected test directory: $tmp" >&2; exit 1 ;; esac
trap 'rm -rf -- "$tmp"' EXIT
root=$tmp/public_html
state=$tmp/state
mkdir -p "$root/dev" "$state"
printf 'staging\n' > "$root/dev/index.html"
printf 'legacy\n' > "$root/index.php"
sed -e "s|root=/home3/adhesapl/public_html|root=$root|" \
    -e "s|state=/home3/adhesapl/.adhesaplate-deploy|state=$state|" \
    scripts/bluehost-production-remote.sh > "$tmp/remote.sh"

bash "$tmp/remote.sh" plan "$sha1" > "$tmp/plan.txt"
grep -q 'Root WordPress indicators present: true' "$tmp/plan.txt"
if bash "$tmp/remote.sh" prepare "$sha1" > /dev/null 2>&1; then
  echo 'Prepare incorrectly allowed root WordPress' >&2; exit 1
fi
rm "$root/index.php"
printf 'adhesaplate-static-root-ready\n' > "$state/PRODUCTION_READY"
bash "$tmp/remote.sh" prepare "$sha1" > /dev/null
mkdir -p "$state/incoming/$sha1/site/about"
printf 'first\n' > "$state/incoming/$sha1/site/index.html"
printf 'about\n' > "$state/incoming/$sha1/site/about/index.html"
printf 'about/index.html\nindex.html\n' > "$state/incoming/$sha1/manifest"
bash "$tmp/remote.sh" activate "$sha1" > /dev/null
[[ $(cat "$root/index.html") == first && -f $root/about/index.html ]]
[[ $(cat "$root/dev/index.html") == staging ]]

bash "$tmp/remote.sh" prepare "$sha2" > /dev/null
mkdir -p "$state/incoming/$sha2/site/blog"
printf 'second\n' > "$state/incoming/$sha2/site/index.html"
printf 'blog\n' > "$state/incoming/$sha2/site/blog/index.html"
printf 'blog/index.html\nindex.html\n' > "$state/incoming/$sha2/manifest"
bash "$tmp/remote.sh" activate "$sha2" > /dev/null
[[ $(cat "$root/index.html") == second && -f $root/blog/index.html ]]
[[ ! -f $root/about/index.html && $(cat "$root/dev/index.html") == staging ]]
[[ -d $state/backups ]]

bash "$tmp/remote.sh" prepare "$sha3" > /dev/null
mkdir -p "$state/incoming/$sha3/site"
printf 'unmanaged\n' > "$root/new.html"
printf 'release\n' > "$state/incoming/$sha3/site/new.html"
printf 'new.html\n' > "$state/incoming/$sha3/manifest"
if bash "$tmp/remote.sh" activate "$sha3" > /dev/null 2>&1; then
  echo 'Activation incorrectly overwrote an unmanaged file' >&2; exit 1
fi
[[ $(cat "$root/new.html") == unmanaged && $(cat "$root/index.html") == second ]]
echo 'Production release fixture checks passed.'
