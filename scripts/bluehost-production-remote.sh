#!/usr/bin/env bash
# Runs on Bluehost as adhesapl. The plan command is read-only.
set -Eeuo pipefail

mode=${1:?Expected plan, prepare, or activate}
sha=${2:?Expected commit SHA}
root=/home3/adhesapl/public_html
state=/home3/adhesapl/.adhesaplate-deploy
marker=$state/PRODUCTION_READY
expected_marker=adhesaplate-static-root-ready

[[ $sha =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid commit SHA' >&2; exit 1; }
[[ ! -L $root && -d $root ]] || { echo 'Production root missing or symlinked' >&2; exit 1; }
[[ $(cd "$root" && pwd -P) == "$root" ]] || { echo 'Production root resolves elsewhere' >&2; exit 1; }
[[ -d $root/dev ]] || { echo 'Expected nested dev directory missing' >&2; exit 1; }

wordpress_at_root=false
for name in index.php wp-config.php wp-admin wp-content wp-includes; do
  if [[ -e $root/$name ]]; then wordpress_at_root=true; fi
done
if [[ -f $root/.htaccess ]] && grep -Eqi 'index\.php|# BEGIN WordPress' "$root/.htaccess"; then
  wordpress_at_root=true
fi
ready=false
if [[ -f $marker && ! -L $marker && $(cat "$marker") == "$expected_marker" ]]; then ready=true; fi

echo "Production root: $root"
echo "Root WordPress indicators present: $wordpress_at_root"
echo "Static cutover marker valid: $ready"
if [[ -f $state/current-sha ]]; then echo "Current managed release: $(cat "$state/current-sha")"; fi

if [[ $mode == plan ]]; then exit 0; fi
[[ $ready == true && $wordpress_at_root == false ]] || {
  echo 'Publishing blocked: remove root WordPress indicators and set the cutover marker after backup/review.' >&2
  exit 1
}

validate_manifest() {
  local manifest=$1 entry top
  [[ -f $manifest && ! -L $manifest ]] || { echo "Missing manifest: $manifest" >&2; exit 1; }
  LC_ALL=C sort -cu "$manifest"
  while IFS= read -r entry; do
    [[ -n $entry && $entry =~ ^[A-Za-z0-9_./-]+$ ]] || { echo "Unsafe manifest path: $entry" >&2; exit 1; }
    [[ $entry != /* && $entry != .* && $entry != */./* && $entry != */. && $entry != */../* && $entry != ../* && $entry != */.. && $entry != *//* ]] || {
      echo "Unsafe manifest path: $entry" >&2; exit 1
    }
    top=${entry%%/*}
    case "$top" in
      dev|wordpress|cgi-bin|wp-admin|wp-content|wp-includes|wp-*)
        echo "Protected path in manifest: $entry" >&2; exit 1 ;;
    esac
  done < "$manifest"
}

check_target_path() {
  local entry=$1 part cursor=$root
  local -a parts
  IFS=/ read -r -a parts <<< "$entry"
  for part in "${parts[@]:0:${#parts[@]}-1}"; do
    cursor=$cursor/$part
    [[ ! -L $cursor ]] || { echo "Symlink in destination path: $entry" >&2; exit 1; }
    [[ ! -e $cursor || -d $cursor ]] || { echo "Non-directory in destination path: $entry" >&2; exit 1; }
  done
  [[ ! -L $root/$entry ]] || { echo "Symlink destination: $entry" >&2; exit 1; }
}
if [[ $mode == prepare ]]; then
  mkdir -p "$state/incoming/$sha"
  echo "Prepared incoming release directory: $state/incoming/$sha"
  exit 0
fi
[[ $mode == activate ]] || { echo "Unknown mode: $mode" >&2; exit 1; }

incoming=$state/incoming/$sha
new=$incoming/manifest
site=$incoming/site
[[ -d $site && ! -L $site ]] || { echo 'Incoming release missing' >&2; exit 1; }
validate_manifest "$new"
[[ -f $site/index.html ]] || { echo 'Incoming home page missing' >&2; exit 1; }
while IFS= read -r entry; do
  [[ -f $site/$entry && ! -L $site/$entry ]] || { echo "Incoming file missing: $entry" >&2; exit 1; }
done < "$new"

previous=$state/current-manifest
had_previous=false
if [[ -f $previous ]]; then
  had_previous=true
  validate_manifest "$previous"
else
  previous=$incoming/empty-previous-manifest
  : > "$previous"
fi

# Refuse to overwrite anything this workflow did not deploy previously.
while IFS= read -r entry; do
  check_target_path "$entry"
  if [[ -e $root/$entry && ! -f $root/$entry ]]; then
    echo "Non-file collision: $entry" >&2; exit 1
  fi
  if [[ -e $root/$entry ]] && ! grep -Fxq -- "$entry" "$previous"; then
    echo "Unmanaged file collision: $entry" >&2; exit 1
  fi
done < "$new"

backup=$state/backups/$(date -u +%Y%m%dT%H%M%SZ)-$sha
mkdir -p "$backup"
cp "$previous" "$backup/previous-manifest"
if [[ -f $state/current-sha ]]; then cp "$state/current-sha" "$backup/previous-sha"; fi
while IFS= read -r entry; do
  check_target_path "$entry"
  [[ -f $root/$entry && ! -L $root/$entry ]] || { echo "Managed file missing: $entry" >&2; exit 1; }
done < "$previous"
tar -czf "$backup/previous-files.tar.gz" -C "$root" -T "$previous"
echo "Saved previous managed files: $backup"

rollback() {
  echo 'Activation failed; attempting to restore the previous managed files.' >&2
  comm -13 "$previous" "$new" | while IFS= read -r entry; do rm -f -- "$root/$entry"; done
  tar -xzf "$backup/previous-files.tar.gz" -C "$root"
  if [[ $had_previous == true ]]; then cp "$backup/previous-manifest" "$state/current-manifest";
  else rm -f "$state/current-manifest"; fi
  if [[ -f $backup/previous-sha ]]; then cp "$backup/previous-sha" "$state/current-sha";
  else rm -f "$state/current-sha"; fi
}
trap rollback ERR
rsync -a --files-from="$new" "$site/" "$root/"
comm -23 "$previous" "$new" | while IFS= read -r entry; do rm -f -- "$root/$entry"; done
cp "$new" "$state/current-manifest"
printf '%s\n' "$sha" > "$state/current-sha"
trap - ERR
echo "Activated production release: $sha"
