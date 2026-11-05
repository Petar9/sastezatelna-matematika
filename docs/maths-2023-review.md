# Математика за всеки 2023 - content review

Status: integrated locally with 24 active rows; M1-06 and M1-17 await the owner's clarification decision. This is a source-content handoff, not publication approval or a claim that human review occurred.

| Field | Record |
| --- | --- |
| Competition / grade | Национално състезание „Математика за всеки“, 2023, 4. клас |
| Scope | Module 1: 20 full originals; Module 2: 2 full originals, each with 3 subconditions. 22 full originals represented by 26 rows. No authored exercises and no audio. |
| Source directory | `/Users/mac/ideas/maths/materials/matematika-za-vseki-2023/` - private, unchanged |
| Statements | `OMT-All-2023-4 кл-probs.pdf`: pages 1-2 Module 1; page 3 Module 2 |
| Answer key / solutions | `OMT-All-2023-4 кл-sol.pdf`: page 1 Module 1 key and Module 2 problem 1; page 2 Module 2 problem 2 |
| Output | `content/kids/competition-2023.json`: 26 prepared rows, 24 active; stable 2023 IDs; exactly 3 concrete worked parts each; ordered multi-answers; reviewed existing concept IDs |
| Islands | Approved existing 17-island structure; rows assigned to the specific topics provided by the coordinator; 17 islands and 78 stable skill IDs retained |
| Difficulty | 8 standard and 18 hard rows; at source-original level 8 standard and 14 hard originals. All parts of each Module 2 original inherit hard. Ratings are editorial, not measured. |
| Introductory problems | Each row includes an `introductionRationale` identifying prerequisites and whether it is a suitable introduction. It is not a declaration that every original is introductory. |
| Human review | Pending; agent checked transcription, mathematics, official answers and worked steps. |
| Publication permission | Not assessed by this worker; integration and release belong to coordinator. |

## Checks performed

Visually inspected all five supplied full-resolution renders: `/tmp/maths-2023-problems-p1.png`, `/tmp/maths-2023-problems-2.png`, `/tmp/maths-2023-problems-3.png`, `/tmp/maths-2023-solutions-1.png`, `/tmp/maths-2023-solutions-2.png`. The PDFs have unusable text extraction for most statements, so the statements were transcribed against these images. Wrapped lines and printed line-break hyphens are joined; whitespace and mathematical typography are represented in plain text. No substantive problem wording or options were paraphrased. The printed overlines on the digit strings `abcd` and `efgh` are described separately in the M1-06 clarification.

Ran an independent Python verification of every answer against the visually transcribed official key. Output: `PASS all 26 answer rows match independent calculations and visually transcribed official key.` The script also checked 26 unique IDs, exactly three worked parts per row, and the complete ordered answer arrays.

| Row | Official answer (letter or ordered numeric answer) | Independent verification |
| --- | --- | --- |
| M1-01 | В | 202302023 : 17 = 11900119, 8 digits |
| M1-02 | А | x = y = 100 |
| M1-03 | Б | Exhaustive even-number search: smallest positive candidate with distinct digits is 132, digit sum 6 |
| M1-04 | Г | Original 79 digits, 78 insertions, original 10 fours: 88 |
| M1-05 | В | 8² − 2² − 6² = 24 |
| M1-06 | В | Exhaustive search over distinct-digit four-digit pairs with positive differences 1..25 finds minimum 25; 4012 − 3987 = 25. Lower bound 1000 + 12 − 987 = 25. |
| M1-07 | В | Exhaustive 5! order search gives only Георги-Боян-Даниела-Ани-Васил and Георги-Даниела-Боян-Васил-Ани; Георги has 6 letters. |
| M1-08 | Б | Small rectangle 7 by 14; overall 21 by 14: area 294, perimeter 70 |
| M1-09 | А | Difference purchase: pineapple + 3 bananas = 6; target costs 22 − 2·6 = 10; change 40. Positive integer price search confirms the target. |
| M1-10 | Г | Children 5, parents 30; after two years 3·7 + 2·32 = 85 |
| M1-11 | В | 14 words МАТЕМАТИКА, 9 words ТАЛАНТИ; A letters 14·3 + 9·2 = 60 |
| M1-12 | А | 2(a+10)+2a=100, a=20 cm; inner area 400 sq.cm = 4 sq.dm |
| M1-13 | В | Minute-by-minute search from 20:23 finds first valid positional derangement at 02:32 next day; 369 min |
| M1-14 | В | Exhaustive subsets with sum17: {4,6,7}, {1,3,6,7}, {1,4,5,7}, {2,3,5,7}, {2,4,5,6}, {1,2,3,4,7}, {1,2,3,5,6}: 7 |
| M1-15 | Б | Only maths 180−105=75, three quarters of maths; shared quarter25 |
| M1-16 | 43 | Opposite vertex sums equal: x+48=67+24; a positive integer circle assignment is top30/right37/bottom11/left13 |
| M1-17 | 14 | Exhaustive permutations of each set of four distinct consecutive digits: 1302,2031;2413,3142;3524,4253;4635,5364;5746,6475;6857,7586;7968,8697. See interpretation note. |
| M1-18 | 17 | Non-pines 2023:17=119, seven equal species119:7=17 |
| M1-19 | 21 | Sorted digit sums of all900 three-digit numbers: lowest20 total65; lowest21 total70. Counts of sums1,2,3,4 are1,3,6,10. |
| M1-20 | 19 | Women with man to left23−10=13; opposite transitions in circle equal; men with man to left32−13=19 |
| M2-1a | 86; 1219 | Direct generation of all23 terms20,23,...86 and summation |
| M2-1b | 10; 154 | Before transfer third20/fourth80; after transfer10/90. Remaining after first144, second44, original298, first154. Check154+44+10+90=298. |
| M2-1c | 406 | Exhaustive positive integer thickness-count search with count4>count3; minimum406. Minimizers (5cm,4cm,3cm) counts (400,5,1) and (401,3,2). Explanation uses latter. |
| M2-2a | 120 | Exhaustive integer shape dimensions: square9, rectangle8 by13. From2b=2s+a and a+b=21, a8,b13. Boundary8·9+4·8+4·4=120. |
| M2-2b | 612 | All allowed (a,b,s,rectangle area): (2,20,19,40),(4,16,14,64),(6,12,9,72),(8,8,4,64). Max72; four squares81 and four rectangles72 total612. |
| M2-2c | 96 | Exhaustive 3-color assignments over actual rectangle adjacency graph yield6; four independent square choices2⁴=16; product96. |

## Interpretation and integration notes

- M1-17 exact wording does not explicitly say that all four consecutive digits are distinct and each used once. The official14 uses this interpretation. The separate `clarification` field states it and remains pending owner approval as directed by the coordinator; do not silently change the original statement. If the clarification is not approved, withhold this row from automatic grading until resolved.
- M1-06 official key uses the positive difference of the two four-digit numbers, consistent with grade4 natural-number subtraction. The source does not explicitly write “positive”. The separate clarification states that reading and describes the printed overline notation. Coordinator should retain an explicit reading if necessary; it is not part of the original wording.
- M2-1b deliberately preserves both question order and final-state interpretation. The answers are `[10,154]`, not `[20,154]` and not a single answer. The 4 books that did not fit are added to the later remaining100, so the reverse step uses `(100−4):2·3=144`.
- M2-2a official rectangle sides8 and13 are correct; the shape relation is `2b = 2s + a`, not `b = s + a`. The worked solution derives8/13 and120, independently matching the official solution.
- All M2 rows repeat their common original context. M2-2a/b/c all reference the shared original figure ID `2023-M2-2`. Other figure references: `2023-M1-05`, `2023-M1-08`, `2023-M1-12`, `2023-M1-16`, `2023-M2-1c`. The six cropped source figures were integrated and passed the asset generator's decoded-pixel equality check.
- `family` values use the unique `y2023...` prefix to avoid triggering older authored templates or numerical worked-solution generators. Every row carries reviewed existing `concepts`; the runtime deliberately retains the existing skill-level objective map. The row concept list is editorial metadata, not a new per-problem progress model. In particular M1-11 uses a replacement worked solution within the existing two-type counting/cases skill M1-07. The inherited skill title and generic follow-ups remain unchanged.
- Integration adds the original rows and losslessly optimized source crops only. Source PDFs, child histories and external systems were not modified; no authored variants or audio were added.


## Integration and pending items

- Append rows after existing pool entries, preserving every old problem index, source ID, content version, saved draft, award and island target. Real-source selection scans the finite pools even when old cursors are exhausted.
- Module 2 has two full sources with three subconditions each. Ordered numeric fields are preserved; a/b/c share one source gold entitlement. No reward target or multiplier change.
- Safe original-statement links expose only statement text, source, figure and choices; they never expose answer fields or worked solutions. Source parts open their own matching subcondition; scaffolds still link to the full original.
- Two rows are unavailable for automatic grading: M1-06 needs the positive-difference reading made explicit; M1-17 needs four distinct consecutive digits, each used once. Proposed clarifications are stored separately and have not been appended to the original text or approved.
- Tutor video: https://www.youtube.com/watch?v=aYay8vowt3w - “Пълни решения на "Математика за всеки" от 13.05.2023”, 5074 seconds. Caption discovery found no Bulgarian captions. Owner approved deferring the transcript; no transcript, audio extraction or tutor-derived claims were fabricated. Current solutions use the supplied official PDF and independent mathematics.
- Local integration only; human review and publication are separate. The About count is 102 active tasks/subconditions across 2023–2026, not 104 prepared rows.

### Source figure crops

Crops use the original problem-page renders, with coordinates in pixels; original labels and white backgrounds retained.

| Figure | Page | Crop x1,y1,x2,y2 | Size |
| --- | ---: | --- | --- |
| 2023-M1-05.png | 1 | 1038, 888, 1212, 1060 | 174 × 172 |
| 2023-M1-08.png | 2 | 379, 178, 625, 406 | 246 × 228 |
| 2023-M1-12.png | 2 | 443, 1157, 630, 1352 | 187 × 195 |
| 2023-M1-16.png | 2 | 1020, 603, 1216, 789 | 196 × 186 |
| 2023-M2-1c.png | 3 | 900, 775, 1217, 1028 | 317 × 253 |
| 2023-M2-2.png | 3 | 920, 1125, 1219, 1522 | 299 × 397 |

## Final acceptance evidence

- Final verification: 194/194 tests, TypeScript, ESLint, production build, private-bundle audit and diff checks passed. The image generator verified decoded-pixel equality for all 70 images.
- Refreshed the owner preview at http://127.0.0.1:3002 with the new build. Saved local course history was byte-for-byte unchanged before/after restart. An isolated temporary learner record served the 2023 M1-08 task, its source figure, a multipart original-source page and updated About copy successfully over HTTP.
- Browser automation was attempted through Chrome CLI and CUA but both failed at the browser-control layer; desktop/mobile visual and interactive browser checks remain unverified. Progressive help, drafts, selection, source safety and history compatibility passed automated tests. No push or deployment performed.
