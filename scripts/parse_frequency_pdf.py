#!/usr/bin/env python3
"""Parse the German Frequency Dictionary PDF into structured JSON and Markdown."""

import json
import re
import sys
from pathlib import Path

import pdfplumber

PDF_NAME = (
    "German Frequency Dictionary 1 - Essential Vocabulary - 2500 Most Common German Words "
    "(MostUsedWords.com) (z-library.sk, 1lib.sk, z-lib.sk).pdf"
)
ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / PDF_NAME

POS_ABBREVS = {
    "abr", "adj", "adv", "art", "av", "con", "cntr", "f", "i", "m", "n",
    "nnpl", "nu", "phr", "pfx", "prn", "prp", "prt", "sfx", "sg", "pl",
    "vb", "vb2", "vbr",
}


def normalize_space(text):
    """Collapse whitespace but preserve intentional spacing inside sentences."""
    return re.sub(r"\s+", " ", text).strip()


def clean_sentence(text):
    """Remove leading '- ' from English sentences."""
    text = text.strip()
    if text.startswith("-"):
        text = text[1:].strip()
    return text


def split_two_columns(line):
    """Split a layout line into (left_column, right_column) using a wide whitespace gap.

    Also handles the common case where the left column is IPA and the right column
    is an English sentence prefixed with '-', even when the gap is only one space.
    Returns (left, right) or (line.strip(), "") if no clear gap found.
    """
    line = line.rstrip()
    # Dictionary columns are separated by 3+ spaces; words within a sentence use single spaces.
    m = re.search(r"(\S)\s{3,}(\S)", line)
    if m:
        left = line[: m.end(1)].strip()
        right = line[m.start(2) :].strip()
        return (left, right)

    # Fallback: the English sentence starts with " -" after the IPA.
    for match in re.finditer(r"\s+-", line):
        left = line[: match.start()].strip()
        right = line[match.start() + 1 :].strip()  # keep the leading '-'
        if right and len(left) <= 60 and not is_pos_only(left):
            return (left, right)

    return (line.strip(), "")


def split_pos_prefix(line):
    """Split the leading POS token(s) from the rest of a metadata line.

    Example:
        "N; adj; adv  Das wäre kein so lustiges Fest."
        -> ("N; adj; adv", "Das wäre kein so lustiges Fest.")
    Returns ("", line.strip()) if no POS prefix is found.
    """
    line = line.strip()
    tokens = line.split()
    pos_parts = []
    rest_parts = []
    for token in tokens:
        inner = re.sub(r"[;,]", "", token)
        if inner.lower() in POS_ABBREVS and not rest_parts:
            pos_parts.append(token)
        else:
            rest_parts.append(token)
    return " ".join(pos_parts), " ".join(rest_parts)


def is_pos_only(text):
    """Return True if text consists only of part-of-speech abbreviations and separators."""
    tokens = [t for t in re.split(r"[\s,;]+", text) if t]
    if not tokens:
        return False
    return all(t.lower() in POS_ABBREVS for t in tokens)


def is_likely_ipa(text):
    """Heuristic: IPA strings are short, contain phonetic symbols, and not POS."""
    if not text:
        return False
    if is_pos_only(text):
        return False
    if len(text) > 60:
        return False
    ipa_marks = set("ɛɪɔʊəɐʃçŋɾɹɻθðɣʒʔˈˌː¨äöü")
    return any(ch in text for ch in ipa_marks) or bool(re.search(r"[ˈˌː]", text))


def is_header_footer(line):
    """Return True if the line looks like a page header/footer."""
    stripped = line.strip()
    if not stripped:
        return True
    if stripped in {"German English Frequency Dictionary", "German   English   Frequency     Dictionary"}:
        return True
    if re.match(r"^\d+\s*$", stripped):
        return True
    if stripped == "Rank German      English equivalent":
        return True
    if stripped == "Part of Speech German sentence":
        return True
    if stripped == "IPA          -English sentence":
        return True
    return False


def is_section_header(line):
    """Return True if the line marks the start of a categorized back-matter section."""
    stripped = line.strip()
    return stripped in {
        "Adjectives",
        "Adverbs",
        "Conjunctions",
        "Prepositions",
        "Pronouns",
        "Nouns",
        "Numerals",
        "Verbs",
    } or stripped.startswith("Rank German-PoS")


def parse_first_line(line, german_sentence_hint=""):
    """Extract (rank, german, english) from the first line of an entry.

    Falls back to sentence-based headword detection when the German/English
    columns are separated by only a single space.
    """
    # Standard case: rank, then 2+ spaces between German and English.
    m = re.match(r"^\s*(\d+)\s+(\S.*?)\s{2,}(\S.*)$", line)
    if m:
        return int(m.group(1)), normalize_space(m.group(2)), normalize_space(m.group(3))

    # Fallback: rank followed by a single string; split using the German sentence hint.
    m = re.match(r"^\s*(\d+)\s+(\S.*)$", line)
    if not m:
        return None
    rank = int(m.group(1))
    rest = m.group(2).strip()

    hint = normalize_space(german_sentence_hint).lower()
    best_german = ""
    best_english = rest

    # Try every possible split point, preferring the longest German headword that
    # appears in the example sentence.
    for i in range(1, len(rest)):
        if rest[i] != " ":
            continue
        candidate = rest[:i]
        english = rest[i + 1 :].strip()
        if candidate.lower() in hint:
            if len(candidate) > len(best_german):
                best_german = candidate
                best_english = english

    if not best_german:
        # No match in sentence; take the first token as German.
        parts = rest.split(None, 1)
        best_german = parts[0]
        best_english = parts[1] if len(parts) > 1 else ""

    return rank, normalize_space(best_german), normalize_space(best_english)


def parse_entry_lines(lines):
    """Parse a block of lines representing one dictionary entry.

    Expected layout (with approximate indentation):
      Rank German    English equivalent
           Part of Speech    German sentence
           IPA    -English sentence
    """
    lines = [ln for ln in lines if ln.strip()]
    if not lines:
        return None

    # We need the German sentence hint for first-line disambiguation, but it's on
    # later lines. Parse metadata lines first, then re-parse the first line if needed.
    # As a simple heuristic, build a hint from all non-first lines.
    hint_lines = []
    for line in lines[1:]:
        _, right = split_two_columns(line)
        if right and not right.startswith("-"):
            hint_lines.append(right)
    german_sentence_hint = " ".join(hint_lines)

    parsed = parse_first_line(lines[0], german_sentence_hint)
    if not parsed:
        return None
    rank, german, english = parsed

    # Split remaining lines into columns. If a line is just an English continuation
    # (starts with '-' and has no left column), represent it as ("", sentence).
    rows = []
    for line in lines[1:]:
        stripped = line.strip()
        if stripped.startswith("-"):
            rows.append(("", stripped))
            continue
        left, right = split_two_columns(line)
        rows.append((left, right))

    # Find the first English sentence row.
    english_idx = None
    for i, (_, right) in enumerate(rows):
        if right.startswith("-"):
            english_idx = i
            break

    pos = ""
    ipa = ""
    german_parts = []
    english_parts = []

    if english_idx is None:
        # No English marker found. Treat everything as German metadata/sentence.
        for i, (left, right) in enumerate(rows):
            if i == 0:
                line_text = lines[1 + i] if 1 + i < len(lines) else ""
                pos_prefix, rest = split_pos_prefix(line_text)
                if pos_prefix:
                    pos = pos_prefix
                    if rest:
                        german_parts.append(rest)
                    elif right:
                        german_parts.append(right)
                elif is_pos_only(left):
                    pos = left
                    if right:
                        german_parts.append(right)
                else:
                    if left:
                        german_parts.append(left)
                    if right:
                        german_parts.append(right)
            else:
                if left and not is_pos_only(left):
                    ipa = left
                if right:
                    german_parts.append(right)
    else:
        # Lines before English: German sentence + metadata.
        for i in range(english_idx):
            left, right = rows[i]
            if i == 0:
                line_text = lines[1 + i] if 1 + i < len(lines) else ""
                pos_prefix, rest = split_pos_prefix(line_text)
                if pos_prefix:
                    pos = pos_prefix
                    if rest:
                        german_parts.append(rest)
                    elif right:
                        german_parts.append(right)
                elif is_pos_only(left):
                    pos = left
                    if right:
                        german_parts.append(right)
                else:
                    if left:
                        german_parts.append(left)
                    if right:
                        german_parts.append(right)
            else:
                # The line immediately before the English sentence usually carries the IPA
                # in its left column and the final fragment of the German sentence in its right.
                if i == english_idx - 1 and left and is_likely_ipa(left):
                    ipa = left
                elif left:
                    german_parts.append(left)
                german_parts.append(right)

        # English sentence rows.
        for i in range(english_idx, len(rows)):
            left, right = rows[i]
            if i == english_idx and left and is_likely_ipa(left) and not ipa:
                ipa = left
            english_parts.append(clean_sentence(right))

    return {
        "rank": rank,
        "german": german,
        "english": english,
        "pos": normalize_space(pos),
        "germanSentence": normalize_space(" ".join(german_parts)),
        "ipa": normalize_space(ipa),
        "englishSentence": normalize_space(" ".join(english_parts)),
    }


def extract_all_lines(pdf):
    """Extract all non-header/footer lines from the PDF as a single stream.

    Stops when it reaches the categorized back-matter sections (Adjectives, Verbs, etc.).
    """
    all_lines = []
    for page in pdf.pages:
        text = page.extract_text(layout=True) or ""
        for line in text.splitlines():
            if is_section_header(line):
                return all_lines
            if not is_header_footer(line):
                all_lines.append(line)
    return all_lines


def parse_stream(lines):
    """Parse entries from a flat list of lines."""
    entries = []
    current_block = []
    for line in lines:
        if re.match(r"^\s*\d+\s+\S", line):
            if current_block:
                entry = parse_entry_lines(current_block)
                if entry:
                    entries.append(entry)
                current_block = []
        current_block.append(line)
    if current_block:
        entry = parse_entry_lines(current_block)
        if entry:
            entries.append(entry)
    return entries


def is_garbage_entry(entry):
    """Return True for entries that are clearly parsed from title/copyright/textual noise."""
    german = entry.get("german", "")
    english = entry.get("english", "")
    sentence = entry.get("germanSentence", "")
    garbage_markers = [
        "MostUsedWords",
        "TX 77043",
        "Book 1",
        "Pareto",
        "Copyright",
        "All rights reserved",
        "Common German Words",
        "www.MostUsedWords",
        "#winning",
        "2525 most common words",
        "To Use This Dictionary",
    ]
    if any(marker in sentence or marker in english or marker in german for marker in garbage_markers):
        return True
    # Real entries have a short German headword, not a full clause.
    if len(german.split()) > 5:
        return True
    if entry.get("rank", 0) > 2525:
        return True
    return False


def main():
    if not PDF_PATH.exists():
        print(f"PDF not found: {PDF_PATH}", file=sys.stderr)
        sys.exit(1)

    print(f"Parsing {PDF_PATH} ...")
    with pdfplumber.open(PDF_PATH) as pdf:
        lines = extract_all_lines(pdf)
        print(f"Total content lines: {len(lines)}")
        all_entries = parse_stream(lines)

    print(f"Total entries parsed: {len(all_entries)}")

    # Deduplicate by rank (keep first occurrence) and drop obvious garbage.
    seen_ranks = set()
    unique_entries = []
    for e in all_entries:
        if e["rank"] not in seen_ranks and not is_garbage_entry(e):
            seen_ranks.add(e["rank"])
            unique_entries.append(e)

    unique_entries.sort(key=lambda x: x["rank"])
    print(f"Unique entries: {len(unique_entries)}")

    # Write JSON.
    json_path = ROOT / "src" / "frequency-dictionary.json"
    json_path.write_text(json.dumps(unique_entries, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote JSON: {json_path}")

    # Write Markdown summary.
    md_path = ROOT / "docs" / "german-frequency-dictionary.md"
    md_path.parent.mkdir(exist_ok=True)
    md_lines = [
        "# German Frequency Dictionary – Parsed Summary",
        "",
        f"Source: `{PDF_NAME}`",
        "",
        f"Total entries parsed: **{len(unique_entries)}**",
        "",
        "## Format",
        "",
        "Each entry contains:",
        "",
        "- `rank` – frequency rank",
        "- `german` – German headword",
        "- `english` – English equivalent(s)",
        "- `pos` – part(s) of speech",
        "- `germanSentence` – example German sentence",
        "- `englishSentence` – English translation of the example sentence",
        "- `ipa` – IPA pronunciation",
        "",
        "## Sample entries",
        "",
    ]
    for e in unique_entries[:10]:
        md_lines.extend(
            [
                f"### {e['rank']}. {e['german']}",
                "",
                f"- **English:** {e['english']}",
                f"- **POS:** {e['pos']}",
                f"- **German sentence:** {e['germanSentence']}",
                f"- **English sentence:** {e['englishSentence']}",
                f"- **IPA:** {e['ipa']}",
                "",
            ]
        )

    md_lines.extend(
        [
            "## Full entry list",
            "",
            "| Rank | German | English | POS | German sentence |",
            "| ---: | --- | --- | --- | --- |",
        ]
    )
    for e in unique_entries:
        ger = e["germanSentence"].replace("|", "\\|")
        md_lines.append(f"| {e['rank']} | {e['german']} | {e['english']} | {e['pos']} | {ger} |")

    md_path.write_text("\n".join(md_lines), encoding="utf-8")
    print(f"Wrote Markdown: {md_path}")

    # Print parse quality diagnostics.
    empty_german = sum(1 for e in unique_entries if not e["germanSentence"])
    empty_english = sum(1 for e in unique_entries if not e["englishSentence"])
    print(f"Entries with empty German sentence: {empty_german}")
    print(f"Entries with empty English sentence: {empty_english}")


if __name__ == "__main__":
    main()
