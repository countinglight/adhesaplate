# Adhesa Plate site takeover and prototype plan

Status: working plan, 2026-10-12. No production platform change has been approved.

## Decision to make with the owner

The owner decides whether the current WordPress/Elementor installation may be replaced or substantially changed. She will review visuals, marketing direction, and SEO, and she has final approval. Vlad will coordinate implementation with an agent. The owner wants to publish future blog posts herself without asking for a code change or site rebuild.

Discuss these choices with her before committing to a full build:

| Choice | What the owner would do | Development and production implications |
| --- | --- | --- |
| WordPress with a code-maintained theme | Write and publish posts in the WordPress Posts editor | Git holds theme/plugin code; WordPress holds posts, media, and form submissions. A separate Bluehost WordPress site provides a realistic prototype. Elementor may remain temporarily as a reference and need not be the future page editor. |
| WordPress with Elementor layouts | Write and publish posts in WordPress; review Elementor-built pages | Keeps the current visual editor and form options, but page layouts and settings mainly live in the database, making Git review and rollback less direct. |
| Astro plus a CMS and form backend | Write posts in a new CMS, subject to the chosen publishing workflow | A Git-only static Astro site does not meet the owner's self-publishing requirement. The CMS, publishing integration, form processing, and Bluehost compatibility must be demonstrated before choosing this route. |

The existing Astro preview at `adhesaplate.countinglight.com` remains useful for visual exploration. It is not, by itself, proof of the final blog and form workflow. Bluehost remains the intended production host. Do not replace the live WordPress site or change DNS until the owner approves a platform and a complete prototype.

## Immediate safeguards and takeover

1. **Move private exports out of Git.** The downloaded home-directory ZIP and WordPress XML are currently in `backup/` under the project checkout. On 2026-10-12, `backup/` was untracked and not ignored. Move it to private storage outside the checkout and add `backup/` to `.gitignore` to prevent accidental inclusion. The ZIP includes mail files; the XML includes contact and inbound-message records. Do not commit either file or share raw copies in issue trackers.
2. **Obtain a current production database backup.** The home-directory ZIP contains site files and uploads, but its `public_html/wpdb.sql` identifies an old development database and is dated 2020. The WordPress XML is a content export, not a full recovery backup. Identify the current production database in Bluehost and export it through phpMyAdmin or a verified backup tool. Keep it off the web server and outside Git. [Bluehost database export instructions](https://www.bluehost.com/help/article/import-a-mysql-database-using-phpmyadmin).
3. **Check old archives under the public web root.** The downloaded snapshot contains `public_html/wpdb.sql`, `public_html/wp-links-opml.zip`, and `public_html/wp-content/uploads/wp-clone/wpclone_backup_25th_Feb_2016_08-13AM_Adh_EUQAgT1rzX.zip`. Confirm whether these still exist. Preserve any needed private copy, then remove them from the web-served directories. Their public accessibility has not been tested; treat possible exposure as a priority for the site owner and hosting support.
4. **Make recovery independent of one person.** Confirm the owner remains Bluehost's Primary Contact. Update her recovery email and phone; give Vlad his own Tech Contact account and a separate WordPress administrator account if his work requires it. Review all existing Bluehost and WordPress administrators, remove obsolete access, and enable two-step verification with recovery keys stored privately. Do not share logins. [Bluehost roles](https://www.bluehost.com/help/article/am-users-roles) and [two-step verification](https://www.bluehost.com/help/article/two-factor-authentication).
5. **Establish recurring backups and test a restore.** The Bluehost site screen showed the backup tile as inactive. Determine what the plan actually includes, then arrange scheduled backups of both files and production database, with a copy outside the hosting account and an agreed retention period. Restore a copy to an isolated test site to verify that it works.
6. **Inventory updates before applying them.** The WordPress dashboard showed 12 updates, a PHP update notice, and plugin/security notices. Record WordPress, PHP, theme, and plugin versions; review Wordfence findings. After a current backup and staging restore exist, test updates on staging and then apply them to production in a controlled window. Do not blindly update the live Elementor/Elementor Pro pair or deactivate plugins during discovery.

## Information Vlad will confirm

| Question | Result needed |
| --- | --- |
| Who is the registrar for `adhesaplate.com`, who controls its login, and when does it renew? | Domain ownership and recovery map. Bluehost labels the domain external, while its displayed nameservers are Bluehost's. |
| Who controls DNS, and what are the current A/AAAA/CNAME, MX, SPF, DKIM, DMARC, TXT, and CAA records? | Saved DNS baseline before any staging or launch changes. Preserve company email routing. |
| What is `dev.adhesaplate.com` used for, and who owns it? | Decide whether it may be reused; do not overwrite it by assumption. |
| What backups are included with the hosting plan, and what is the production database name? | Recovery procedure and current database export. Do not circulate database credentials. |
| Who has Bluehost, cPanel, WordPress, registrar, and company-mail administrative access? | Access inventory, least-privilege cleanup, and recovery contacts. |
| Which form is the live quote form? What fields, recipients, confirmation, spam control, and stored-submission behavior does it use? | Acceptance criteria for the prototype form. Send staging tests only to a test recipient. |
| Does the owner want drafts, scheduling, categories, tags, multiple authors, or approval before a post goes live? | Blog editor acceptance criteria. At minimum, she must be able to publish without developer involvement. |
| Which existing pages, PDFs, posts, and media are current? Are higher-resolution originals and a vector logo available? | Content and asset migration list. The WordPress XML has 62 page records and 18 post records; a post record does not prove a public blog exists today. |
| Which Search Console, analytics, ad, and conversion accounts are active, and who owns them? | SEO and marketing baseline before cutover. Do not change tracking until the owner confirms requirements. |

## Prototype work, after the owner chooses a direction

1. Inventory current URLs, page copy, metadata, forms, downloadable files, and media using the WordPress XML and private home-directory backup. Verify business claims and old archived copy with the owner. Keep customer submissions out of the content repository.
2. For a WordPress route, create an isolated Bluehost staging installation with its own document root and database. Inspect `dev.adhesaplate.com` first. Password-protect the prototype and mark it `noindex`; ensure it cannot send real quote notifications or analytics conversions. Use sanitized content where practical. [Bluehost subdomains](https://www.bluehost.com/help/article/subdomains/) and [Google's access/indexing distinction](https://developers.google.com/search/docs/crawling-indexing/control-what-you-share).
3. Implement a representative home page, product page, blog index, individual post, and quote form before migrating every page. Put custom theme and plugin code in Git. Keep environment configuration and secrets out of Git.
4. Have the owner log in to staging, draft a post, upload an image, preview it, and publish it. Confirm the result appears without a developer deploy. Test quote delivery, stored submissions, mobile layouts, accessibility, and page speed.
5. Present the prototype to the owner for visual, copy, marketing, and SEO review. Record approved changes and unresolved decisions. Expand to the full page set only after the publishing and form workflows pass.

## Launch and ongoing operation

Before launch, take a fresh files-and-database backup, finalize the URL/redirect map, verify forms and mail delivery, compare SEO metadata, and document rollback. Obtain the owner's approval for the cutover. After launch, keep production posts and submissions in the production database. Deploy tested design code from Git; do not routinely overwrite production with a staging database. Assign a named person to watch quote submissions, updates, backups, domain renewal, and site health.

## Current evidence and limits

- Bluehost shows `adhesaplate.com` as a WordPress site on WordPress Plus Hosting and lists `dev.adhesaplate.com` separately as “Other CMS.”
- WordPress administration is accessible through Bluehost. Elementor and Elementor Pro are active; the active theme is Hello Elementor. Contact Form 7, Flamingo, Wordfence, Really Simple Security, and Yoast SEO are also active.
- A WordPress All Content XML export and a home-directory ZIP were downloaded on 2026-10-12. The XML contains 62 pages, 18 posts, and Elementor layout metadata. The ZIP contains uploads matching the XML's unique media URLs. Many recorded source images are small; request higher-resolution originals for final design.
- The exact production database, current backup coverage, domain registrar, role assignments, quote delivery, and purpose of the existing development subdomain still require confirmation.
