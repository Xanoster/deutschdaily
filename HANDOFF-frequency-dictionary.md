# Handoff: German Frequency Dictionary Learning Module

## Goal
Add a new **Frequency Dictionary** learning module to the DeutschDaily app based on the PDF:
`German Frequency Dictionary 1 - Essential Vocabulary - 2500 Most Common German Words (MostUsedWords.com) (z-library.sk, 1lib.sk, z-lib.sk).pdf`

The module should show **German word + German example sentence** on the front of Anki-style cards, with English translations (word meaning and sentence meaning) hidden by default but revealable.

---

## What has been done

### 1. PDF parsing
- Created `scripts/parse_frequency_pdf.py`.
- It parses the main frequency dictionary section of the PDF (ranks 1–2525), extracts rank, German word, English equivalent, part of speech, German sentence, English sentence, and IPA.
- Outputs:
  - `src/frequency-dictionary.json` (parsed data, ~622 KB)
  - `docs/german-frequency-dictionary.md` (human-readable summary)
- Run it with: `python3 scripts/parse_frequency_pdf.py`

### 2. Data module
- Created `src/frequency-dictionary-data.js` (~477 KB) which defines the global `FREQUENCY_DICTIONARY` array.
- Included in `DEDaily.html` before `storage.js` and `app.js`.

### 3. Navigation
- Added a **Frequency** nav button in both desktop and mobile nav in `DEDaily.html`.

### 4. Storage layer (`src/storage.js`)
- Bumped `DB_VERSION` from 7 to 8.
- Added frequency progress fields:
  - `freqLearned`, `freqFavorites`, `freqSrs`, `freqAttempts`
  - `freqDailyGoal`, `freqDailyQueue`, `freqDailyQueueDate`, `freqDailyQueueDone`
- Added helpers:
  - `validFrequencyRankSet()`, `normalizeFrequencyAttempts()`
  - `freqById()`, `getFreqReviewIds()`, `getFreqSrsLevel()`, `isFreqScheduledFuture()`
  - `scheduleFreq()`, `markFreqLearned()`, `unmarkFreqLearned()`, `toggleFreqLearned()`, `toggleFreqFav()`
  - `getNewFreqPool()`, `ensureFreqDailyQueue()`, `recordFreqAttempt()`

### 5. App layer (`src/app.js`)
- Added `frequency` to `VALID_VIEWS`.
- Added state fields: `freqFilter`, `freqRange`.
- Added URL routing for `?view=frequency&filter=...&range=...`.
- Added view rendering dispatch.
- Added `updateNavBtns()` handling for frequency.
- Added UI functions:
  - `renderFrequency()` – list view with queue, stats, filters, search, range chips
  - `renderFreqCard()` – card with German word + German sentence always visible, English hidden
  - `toggleFreqReveal()` – DOM-based toggle (no full re-render), shows/hides English word, sentence, and IPA
  - `setFreqFilter()`, `setFreqRange()`, `setFreqGoal()`, `refreshFreqQueue()`
- Added practice mode:
  - `FP` state variable
  - `startFrequencyPractice()`, `renderFrequencyPractice()`, `frequencyPracticeReveal()`, `frequencyPracticeAnswer()`, `frequencyPracticeNext()`
  - Keyboard shortcuts (Space, ArrowRight, 1–4)
  - `closePractice()` updated to reset `FP`

### 6. Styles (`src/styles/enhancements.css`)
- Added `.freq-card`, `.freq-sentence`, `.freq-en-word`, `.freq-en-sentence`, `.freq-ipa`, `.freq-practice-card`, `.freq-practice-word`, `.freq-practice-sentence`, `.freq-practice-en`, and responsive rules.

### 7. Reveal UX improvement
- German sentence is **always visible** on frequency cards (not hidden behind toggle).
- Only English word meaning, English sentence translation, and IPA are hidden/revealed on tap.
- Toggle uses DOM manipulation (`classList.toggle('hid')` + `hidden` attribute), matching the sentence card pattern — no full page re-render.

### 8. Validation (`scripts/validate.js`)
- Confirms `src/frequency-dictionary-data.js` is included in `DEDaily.html`.
- Confirms `FREQUENCY_DICTIONARY` is an array of 2,525 entries.
- Validates every entry has `german`, `english`, `germanSentence`, `englishSentence`.
- Checks ranks are 1–2525 with no duplicates or gaps.
- Checks string fields are non-empty.

### 9. Logic tests (`scripts/logic-tests.js`)
- `scheduleFreq` tests for new entries with all 4 ratings (again/hard/good/easy).
- `scheduleFreq` tests for review entries with all 4 ratings.
- `ensureFreqDailyQueue` populates queue with due cards first.
- `markFreqLearned` / `unmarkFreqLearned` / `toggleFreqLearned` round-trip.
- `toggleFreqFav` add/remove round-trip.
- `FREQUENCY_DICTIONARY` is loaded and has 2,525 entries.

### 10. Documentation
- `README.md` updated with frequency dictionary in features list, project structure, and a "Frequency Dictionary" section covering regeneration with the parser.

---

## What remains

### 1. Manual smoke test
- Open `DEDaily.html` in a browser.
- Click the **Frequency** nav item.
- Verify:
  - List loads and cards render.
  - Range chips and filters work.
  - German sentence is always visible; English word + sentence + IPA reveal on tap.
  - Mark learned / save buttons work and persist after reload.
  - Practice mode starts and ratings schedule reviews correctly.

### 2. Possible improvements
- **Data size**: `src/frequency-dictionary-data.js` is ~477 KB. Consider minifying or loading in chunks if performance becomes an issue.
- **Progress stats**: The sidebar and header still only show sentence/vocab stats. Consider adding frequency stats if desired.
- **Search**: Search currently matches raw string fields. Could add rank number search.
- **5 entries missing POS**: Ranks 347, 639, 1416, 2306, 2340 have empty `pos` in the parsed data (not in the source PDF). Parser could be improved to extract POS for these edge cases, or they can remain as-is.

### 3. Clean-up
- The `src/frequency-dictionary.json` file is only used by the parser to generate the JS module. Decide whether to keep it in the repo or remove it to save space.

---

## Key files changed / created
- `scripts/parse_frequency_pdf.py` **(new)**
- `src/frequency-dictionary.json` **(new, generated)**
- `src/frequency-dictionary-data.js` **(new, generated)**
- `docs/german-frequency-dictionary.md` **(new, generated)**
- `DEDaily.html` **(modified)**
- `src/storage.js` **(modified)**
- `src/app.js` **(modified)**
- `src/styles/enhancements.css` **(modified)**
- `scripts/validate.js` **(modified)**
- `scripts/logic-tests.js` **(modified)**
- `README.md` **(modified)**

---

## How to regenerate the data
```bash
python3 scripts/parse_frequency_pdf.py
```
This will overwrite `src/frequency-dictionary.json`, `src/frequency-dictionary-data.js`, and `docs/german-frequency-dictionary.md`.

## Current status
- Parsing: complete and verified (2525 entries, 0 empty German/English sentences after filtering).
- App integration: implemented with improved reveal UX (German sentence always visible).
- Validation: frequency dictionary validation added and passing.
- Tests: frequency storage SRS tests added and passing.
- Documentation: README updated.
- Manual browser test: pending.
