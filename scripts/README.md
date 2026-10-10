# Developer script reference

Run commands from the repository root after `npm ci`. Build and deployment are documented in
[BUILD.md](../BUILD.md). Add an entry here whenever a utility is added to this directory.

| Script                                               | Command / caller                                                        | Purpose and effects                                                                                                                                                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [check-line-endings.js](check-line-endings.js)       | `npm run line-endings:check`; part of `npm run check`                   | Checks tracked text files for CRLF; exits nonzero on violations without changing files.                                                                                                                                 |
| [mark-review-headers.js](mark-review-headers.js)     | `node scripts/mark-review-headers.js`; last step of `npm run build:site` | Appends an `X-Robots-Tag: noindex` rule to `website/dist/_headers` unless a route in `wrangler.site.jsonc` is the production hostname. Requires an existing build. Does not deploy. See [Search engines](../BUILD.md#search-engines). |
