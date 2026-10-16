# GitHub-to-Bluehost deployment plan

Status: proposed Bluehost workflow, last reviewed 2026-10-15. Staging is
manual. A manual-only production workflow is drafted locally but is not yet
available on GitHub or authorized to publish. A production key and cutover
readiness marker have not been configured.

This plan covers the Astro website only. GitHub holds the source; GitHub
Actions builds it; Bluehost serves the generated static files. No build tools
or Git checkout need to live in a public Bluehost directory. Bluehost is the
only deployment target in the future state.

## Branches and targets

| Branch | Purpose | Trigger | Bluehost destination |
| --- | --- | --- | --- |
| `dev` | Day-to-day edits and owner review | Manual GitHub Actions run only; no push trigger | `dev.adhesaplate.com`, `/home3/adhesapl/public_html/dev` |
| `master` | Reviewed, stable source | No deployment | None |
| `deploy` | Approved production release | Manual GitHub Actions run only; defaults to read-only plan | `adhesaplate.com`, main document root `/home3/adhesapl/public_html` |

The promotion path is `dev -> master -> deploy`. Changes on
`dev` reach staging only when you manually run the workflow. A reviewed
pull request moves tested changes to `master` without publishing. A second
pull request, with `master` as its source, moves the approved release to
`deploy`. That merge does not publish to Bluehost. Manually run the
production workflow on `deploy` to plan or publish. Neither target is built on
Bluehost: each Actions run performs `npm ci`, checks the site, builds Astro,
and transfers only `website/dist/`.

Today, `.github/workflows/deploy-bluehost-staging.yml` is manual and still checks
out the existing `vlads-dev` branch. Rename that branch to `dev` and update
the workflow checkout reference before using this proposed flow. Keep
`workflow_dispatch` as its only trigger. In GitHub Actions, select the staging
workflow, select the `dev` branch, and click **Run workflow** when you want
to publish the current `dev` commit to the prototype. GitHub requires manually dispatched workflows
to exist on the default branch; that requirement is now met.

## GitHub controls

1. Protect `master` and `deploy`: require pull requests, required build/check
   status, no force pushes, and no deletion. Require review as appropriate for
   the team. Do not push directly to `deploy`.
2. Add a required pull-request check on `deploy` that verifies the PR head is
   exactly this repository's `master` branch. GitHub branch protection alone
   does not express "source branch must be master." Keep the check required so
   another branch cannot silently become a release.
3. Create GitHub environments `staging` and `production`. Allow only
   `dev` to use staging and only `deploy` to use production. Put each
   target's SSH private key in its own environment secret. If the GitHub plan
   supports required environment reviewers, consider one for production as
   an additional approval beyond the manual workflow run.
4. Use a concurrency group per target so two runs cannot write to the same
   document root simultaneously. Production must build the exact triggering
   `deploy` commit, not the latest `master` or `dev`.
5. Keep deployment keys out of source, build artifacts, logs, and chat. The
   existing staging key is currently a repository Actions secret named
   `BLUEHOST_STAGING_SSH_KEY`; move it to the staging environment when that
   environment is configured.

Before promoting this workflow onto `deploy`, disconnect the old Cloudflare
Git build currently watching that branch. Although Bluehost production
publishing is manual, a push to `deploy` may still publish to Cloudflare
until that old trigger is removed.

GitHub references: [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches),
[deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments),
[manually running a workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

## Protecting the release branch and production site

Treat the merge into `deploy` as a candidate production release. A separate
manual workflow run is the publication decision. A push to `dev` never
publishes the prototype. Configure these controls before the first live run:

1. In GitHub **Settings -> Rules -> Rulesets**, create an active branch ruleset
   for `deploy`. Require a pull request, passing build/check status, and a
   trusted review if a second technical reviewer is available. Block force
   pushes and deletion, apply the rules to administrators, and keep bypass
   permissions empty or exceptionally narrow. Protect `master` similarly.
   Limit repository-admin access because an administrator who can edit these
   rules remains a high-trust actor. Require the check from its expected
   GitHub App where GitHub offers that setting.
2. Require a check on pull requests targeting `deploy` that verifies the head
   is this repository's `master` branch. GitHub's ordinary branch rule does
   not express that source restriction. Review the release diff before merging,
   especially changes to `.github/workflows/`, deployment scripts, build
   configuration, dependencies, and `.github/CODEOWNERS`. Use code-owner review
   for those files where a second trusted reviewer is available. Protect
   `CODEOWNERS` itself. If there is only one technical maintainer, do not use a
   nontechnical approval as a substitute for technical review; rely on the
   required checks and a deliberate release review.
3. Store the production transfer credential only as a `production` environment
   secret. Restrict the environment to `deploy`; keep the workflow's
   `GITHUB_TOKEN` permissions at `contents: read`. Build and check the exact
   triggering commit before the deploy step, preferably in a job without the
   Bluehost secret. The deploy job should receive the secret only after checks
   pass. Pin third-party Actions to full commit SHAs when hardening the
   workflow, and avoid running untrusted pull-request code with secrets.
   A required production-environment reviewer is an optional extra gate
   beyond manually starting the workflow.
4. Do not mistake separate SSH keys for separate Bluehost permissions. The
   current staging key logs in as `adhesapl`, the same Unix user that can
   reach production. Compromise of that key could bypass every GitHub branch
   rule and alter the live site directly. Treat the staging key as
   production-sensitive until Bluehost provides a genuinely directory-limited
   transfer identity or separate hosting account. Investigate a restricted
   transfer account for `/public_html/dev`; verify its protocol and actual
   directory boundary before relying on it. Keep production and staging
   credentials distinct so each can be rotated independently.
5. Before production cutover, inventory `/home3/adhesapl/public_html` and
   define a precise file ownership/allowlist for deployment. Preserve `/dev/`,
   Bluehost-managed hidden files, and all other paths outside that list. Save
   the previous release outside the public root, serialize production runs,
   verify the deployed commit and key pages, and rehearse rollback. Keep an
   off-host backup and test restoration; possession of a full-account archive
   alone does not establish a fast recovery path.
6. Require strong two-factor authentication for GitHub, Bluehost, and the
   domain/DNS account. Give repository-admin and Bluehost access only to
   people who need it; review access and revoke or rotate credentials when
   responsibilities change. Monitor failed deployments and public-site
   availability so a bad release is detected promptly.

GitHub references: [ruleset options](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets),
[CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners),
[deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments),
[Actions security](https://docs.github.com/en/code-security/tutorials/secure-your-organization/protect-against-threats).
Bluehost references: [SSH access](https://www.bluehost.com/help/article/ssh-access),
[FTP account directories](https://www.bluehost.com/help/article/create-and-manage-ftp-accounts-for-your-website),
[backup](https://www.bluehost.com/help/article/how-to-create-a-manual-backup),
[restore](https://www.bluehost.com/help/article/bh-restore-backup).

## Manual production workflow and cutover gate

The draft `.github/workflows/deploy-bluehost-production.yml` has only a
`workflow_dispatch` trigger. It accepts `plan` (the default) or `publish` and
runs only when **deploy** is selected in GitHub Actions. Both operations build
and check that exact `deploy` commit; the build job has no Bluehost secret.
The production job uses `BLUEHOST_PRODUCTION_SSH_KEY` from a GitHub environment
named `production`, restricted to `deploy`. Create a **separate** production
key and environment secret before testing. The workflow is not live in GitHub
until you push and promote it to the default branch and `deploy` yourself.

Before remote testing, run `bash scripts/test-bluehost-production-release.sh` locally;
it uses a fake document root and never connects to Bluehost.

1. Run **plan** first. It verifies SSH, reports whether root-level WordPress
   remains and whether the cutover marker exists, then shows an `rsync`
   dry-run. It makes no Bluehost file changes. Keep a copy of the run log and
   inspect every proposed path. `plan` needs the production SSH key even
   though it does not write.
2. Before any **publish** run, take and test a recoverable backup of the
   current Bluehost site. Move/remove root-level WordPress files according to
   the approved cutover plan and remove WordPress rewrite rules from the root
   `.htaccess`. The workflow refuses to publish while it detects `index.php`,
   `wp-admin`, `wp-content`, `wp-includes`, `wp-config.php`, or WordPress
   rewrites in the production root. Keep `/dev/` and any separately hosted
   WordPress instance outside the static site's managed paths.
3. Only after that review, create
   `/home3/adhesapl/.adhesaplate-deploy/PRODUCTION_READY` **outside** the
   public root, containing exactly `adhesaplate-static-root-ready` and a
   newline. This is an explicit cutover marker, not a substitute for backup
   or review. Do not create it while the legacy root is still serving.
4. Manually select **publish** on `deploy` and paste the full 40-character
   commit SHA into `confirm_sha`. The workflow checks the SHA, validates the
   root and marker, stages the build outside the public root, refuses to
   overwrite files it did not own in an earlier release, backs up previously
   managed files, then activates the release. It removes only files listed
   in its prior managed-file manifest. The activation script attempts to
   restore those files if activation fails. A later public smoke-check
   failure still needs a manual diagnosis or rollback.
5. Review the home page, a nested page, blog, images, HTTPS, canonical URL,
   and indexing after activation. The first release's **legacy WordPress**
   backup and rollback are separate from the workflow's backups of later
   Astro-managed releases. Do not regard the first production publish as
   tested until both rollback paths have been rehearsed.

This manual workflow is a starting point for staged testing. Do not add an
automatic `push` trigger unless the owner and maintainer decide later that
branch protection, credential isolation, backup, and rollback are sufficient.

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

- [ ] Rename the current `vlads-dev` branch to `dev` and update the staging workflow
      checkout reference before testing or enabling the proposed flow.
- [ ] Manually run the existing staging workflow and inspect
      `https://dev.adhesaplate.com/`; confirm its noindex tag and that the
      main site is unaffected.
- [ ] Keep staging manual-only; verify that a push to `dev` does not publish,
      then manually run the workflow and test a harmless change and rollback.
- [ ] Protect `master` and `deploy`, add required checks and the
      master-only source check for production PRs; review deployment-code changes.
- [ ] Assess staging credential access to production; restrict or replace the
      credential if Bluehost permits a real directory boundary.
- [ ] Enable strong two-factor authentication on GitHub, Bluehost, and DNS
      accounts; review who has administrator access.
- [ ] Disconnect the old Git-to-Cloudflare trigger on `deploy`.
- [ ] Inventory and back up the production document root; define protected
      paths, production-specific key/environment, file ownership, and
      rollback.
- [ ] Add the manual production workflow to the default and `deploy` branches;
      create its environment and separate key, then run `plan` repeatedly.
- [ ] Complete cutover prerequisites and test one manually approved
      `publish` run. Do not add a `push` trigger without a later decision.
