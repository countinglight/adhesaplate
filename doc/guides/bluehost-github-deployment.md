# GitHub-to-Bluehost deployment plan

Status: proposed future workflow, last reviewed 2026-10-15. The staging workflow
exists and is manual. The production workflow, production key, and automatic
triggers described below have not been enabled.

This plan covers the Astro website only. GitHub holds the source; GitHub
Actions builds it; Bluehost serves the generated static files. No build tools
or Git checkout need to live in a public Bluehost directory. Bluehost is the
only deployment target in the future state.

## Branches and targets

| Branch | Purpose | Trigger | Bluehost destination |
| --- | --- | --- | --- |
| `vlads-dev` | Day-to-day edits and owner review | Automatic on push after the first manual staging run succeeds | `dev.adhesaplate.com`, `/home3/adhesapl/public_html/dev` |
| `master` | Reviewed, stable source | No deployment | None |
| `deploy` | Approved production release | Automatic on merge/push to this protected branch | `adhesaplate.com`, main document root `/home3/adhesapl/public_html` |

The promotion path is `vlads-dev -> master -> deploy`. Changes on
`vlads-dev` can update staging frequently. A reviewed pull request moves
tested changes to `master` without publishing. A second pull request, with
`master` as its source, moves the approved release to `deploy`. A push to
`deploy` then starts the production workflow. Neither target is built on
Bluehost: each Actions run performs `npm ci`, checks the site, builds Astro,
and transfers only `website/dist/`.

Today, `.github/workflows/deploy-bluehost-staging.yml` is manual and checks
out `vlads-dev`. It is intentionally not yet a push trigger. GitHub's
manual Run workflow button requires the workflow to exist on the default
branch; that requirement is now met. After a successful first run and browser
review, change its trigger to `push` on `vlads-dev`, while retaining an
optional manual trigger for repairs.

## GitHub controls

1. Protect `master` and `deploy`: require pull requests, required build/check
   status, no force pushes, and no deletion. Require review as appropriate for
   the team. Do not push directly to `deploy`.
2. Add a required pull-request check on `deploy` that verifies the PR head is
   exactly this repository's `master` branch. GitHub branch protection alone
   does not express "source branch must be master." Keep the check required so
   another branch cannot silently become a release.
3. Create GitHub environments `staging` and `production`. Allow only
   `vlads-dev` to use staging and only `deploy` to use production. Put each
   target's SSH private key in its own environment secret. If the GitHub plan
   supports required environment reviewers, use one for production.
4. Use a concurrency group per target so two runs cannot write to the same
   document root simultaneously. Production must build the exact triggering
   `deploy` commit, not the latest `master` or `vlads-dev`.
5. Keep deployment keys out of source, build artifacts, logs, and chat. The
   existing staging key is currently a repository Actions secret named
   `BLUEHOST_STAGING_SSH_KEY`; move it to the staging environment when that
   environment is configured.

Before using `deploy` as the Bluehost production trigger, disconnect the
old Cloudflare Git build currently watching that branch. A production
promotion must have only the intended Bluehost deployment effect.

GitHub references: [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches),
[deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments),
[manually running a workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

## Build and transfer rules

Staging uses `npm run build -w website`, then
`scripts/mark-bluehost-staging-noindex.js` adds a `noindex, nofollow` meta
tag to every generated HTML page. Bluehost's Apache does not interpret the
Cloudflare-specific `_headers` file. Production uses a clean Astro build
without the staging marker. Before production transfer, check the home page
canonical URL and indexing status against the production domain.

Both workflows must pin and verify the server's SSH host key, use the
dedicated deployment key, verify the canonical absolute destination path over
SSH, and fail before transfer if anything differs. The present staging
workflow pins the public host key already trusted on the maintainer's PC.
If Bluehost changes the server or SSH host key, verify the replacement with
Bluehost before updating the pin.

The staging directory was inspected: it contained `.well-known` and two
`.htaccess` files, with no visible site content. The current staging workflow
uses `rsync --delete` for generated files but excludes top-level hidden files,
preserving those Bluehost-managed entries. Recheck the directory before the
first run if its contents have changed.

The production root contains the nested staging directory. A production
transfer must explicitly preserve `/dev/`, hidden Bluehost files and
directories, and any other non-site paths found in a fresh inventory.
Never copy the staging `rsync --delete` command directly to
`/home3/adhesapl/public_html`. Define precisely which files the production
workflow owns and may remove. Keep a recoverable copy of the previous release
outside the public document root before replacing it. The production
workflow is not to be enabled until this ownership list, backup, rollback,
and smoke checks have been tested.

After staging or production transfer, verify at least the home page, one
nested page, the blog index, images/CSS, links, HTTPS, and a missing-page
response. On staging, verify `noindex`; on production, verify the home page
is indexable and canonicalizes to `https://adhesaplate.com/`. Record the
deployed commit SHA with each run. On failure, restore the previous release,
then fix or revert the source commit before the next promotion.

## SSH setup runbook for each person

These are the steps used to enable access. Repeat with the owner's own
Bluehost login and a *separate* key pair if she needs personal shell access.
A personal key should have a passphrase; an unattended deployment key is a
different key. Separate keys can be revoked independently, although keys
added to the same Bluehost hosting account still reach the same Unix user
and files.

1. Sign in to Bluehost. Open **Websites -> Manage Site -> Files & Access ->
   SSH -> Manage**. In **Connect over SSH**, switch **Shell Access** on.
   Bluehost may first require account verification.
2. On the person's Windows PC, open PowerShell and create a key pair, using a
   unique filename, for example:

   ```powershell
   ssh-keygen -t ed25519 -C "adhesaplate-owner" -f "$env:USERPROFILE\.ssh\adhesaplate-owner"
   ```

   Enter a passphrase for a person's interactive key. The file without
   `.pub` is private; the `.pub` file is the public key.
3. Read and copy only the public key:

   ```powershell
   Get-Content "$env:USERPROFILE\.ssh\adhesaplate-owner.pub"
   ```

   In Bluehost SSH Management, choose **Add SSH Key**, give it a recognizable
   name, paste the public key, and add it. If the interface instead shows a
   cPanel **Authorize** action, complete that too. Never upload the private
   key to Bluehost's web files or send it in email/chat.
4. Obtain the current SSH host/IP and hosting username from Bluehost. For
   this account the observed values were `adhesapl` and `173.254.104.106`;
   recheck them rather than assuming they never change. On the first
   connection, verify the server host-key fingerprint through a trusted
   Bluehost source before accepting it.
5. Test the new key from PowerShell:

   ```powershell
   ssh -i "$env:USERPROFILE\.ssh\adhesaplate-owner" adhesapl@173.254.104.106
   ```

   The explicit `-i` is expected for a non-default key filename. Confirm
   the shell prompt shows the hosting user and use `exit` to disconnect.
   A message that `known_hosts2` does not exist, or idle keepalive messages
   under `ssh -v`, is not a login failure.

For an Actions deployment, generate a separate key pair dedicated to that
target. Add only its public half to Bluehost. Store the complete private key
(including BEGIN/END lines) as the appropriate GitHub Actions secret. An
unattended key normally has no passphrase; protect it with GitHub
environment/branch restrictions and rotate or revoke it when access changes.

Bluehost references: [enable SSH](https://www.bluehost.com/help/article/ssh-access),
[manage SSH keys](https://www.bluehost.com/help/article/am-ssh-access).

## Activation checklist

- [ ] Manually run the existing staging workflow and inspect
      `https://dev.adhesaplate.com/`; confirm its noindex tag and that the
      main site is unaffected.
- [ ] Change staging to auto-deploy from `vlads-dev`; verify a harmless
      content change and rollback.
- [ ] Protect `master` and `deploy`, add required checks and the
      master-only source check for production PRs.
- [ ] Disconnect the old Git-to-Cloudflare trigger on `deploy`.
- [ ] Inventory and back up the production document root; define protected
      paths, production-specific key/environment, file ownership, and
      rollback.
- [ ] Create and test the production Actions workflow without publishing;
      enable its `push: deploy` trigger only at the approved cutover.
