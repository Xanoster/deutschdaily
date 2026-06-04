# DeutschDaily

DeutschDaily is an offline-first daily German practice app focused on useful resident-life sentences for Germany. It is built as a small static web app, so it can run directly from `DEDaily.html` without a build step or server.

## Features

- Daily sentence queue with progress tracking
- Spaced repetition scheduling
- 500-card daily-life vocabulary deck with articles, gender, plurals, examples, and Anki-style ratings
- A1, A2, and B1 grammar curriculum with a complete topic index, study tracking, focused explanations, examples, and generated exercises
- Browse by topic
- Pattern learning and pattern practice
- German to English and English to German practice
- Text-to-speech support with browser speech synthesis plus optional desktop fallback voices when network audio is available
- Learn more panels with grammar, variants, reuse ideas, likely replies, and active practice tasks
- Formal and informal variants where `Sie` / `du` matters
- Offline local progress storage with export/import backups
- Minimal SVG app logo for browser tabs and bookmarks

## Run Locally

Open this file in a browser:

```text
DEDaily.html
```

The app loads these local files:

```text
src/content.js
src/learning.js
src/storage.js
src/app.js
src/styles.css
```

No install step is required.

## Project Structure

```text
DEDaily.html              App shell and script/style includes
src/content.js            Topics, patterns, and sentence seed data
src/learning.js           Learn more generation and teaching metadata
src/vocab.js              500-card daily-life vocabulary deck
src/grammar.js            A1/A2/B1 grammar course content
src/storage.js            Local storage, daily queue, history, and SRS
src/app.js                Rendering, navigation, practice, TTS, import/export
src/assets/logo.svg       Minimal app logo and favicon
src/styles.css            CSS import index
src/styles/               Split CSS files by app area
scripts/validate.js       Static validation for content and app wiring
scripts/logic-tests.js    Storage, import, and SRS regression tests
```

## Progress Storage

Progress is stored in browser `localStorage` under:

```text
dd_v4
```

An older key may also exist:

```text
dd_clean_v1
```

## Validate

Run the static validation script from the project root:

```bash
node scripts/validate.js
```

Run storage/SRS regression tests:

```bash
node scripts/logic-tests.js
```

The validation checks:

- HTML includes the expected CSS and JS files
- sentence IDs are unique
- topics, levels, and pattern references are valid
- every sentence has learning metadata
- vocabulary cards have valid topics, source refs, noun gender/article data, and examples
- grammar modules cover A1, A2, and B1 with complete lesson metadata
- expected replies and practice prompts are not generic
- formal/informal coverage stays above the configured threshold
- misleading sentence-to-pattern links are blocked by contract checks
- A1 survival and emergency coverage stay above launch thresholds
- known reviewer fixes remain intact

## Content Guidelines

When adding or editing sentences:

- Prefer practical resident-life situations over tourist phrases.
- Use `Sie` for offices, doctors, landlords, banks, service staff, transport staff, and unknown adults.
- Add `du` variants where a learner may realistically speak to friends, close colleagues, neighbors, or peers.
- Keep translations faithful and natural.
- Every sentence should either have at least one `patternId` or be marked `fixed: true`.
- Add sentence-specific learning notes when a pattern would be misleading.

## GitHub

Repository remote:

```text
https://github.com/Xanoster/deutschdaily.git
```
