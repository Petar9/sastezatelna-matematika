# Independent Astra review: regional Olympiad hint expansion

Reviewer: gpt-6-astra (actual assigned model), 2026-11-15.
Scope: `/tmp/regional-hints-proposed.json`; 12 original problems, 23 natural answer units, 23 authored exercises, 138 hint stages; derived lessons/concept copy and relevant provider/rendering paths.
Status: independent copy review complete; seven proposal groups below await owner approval. No application or draft files changed. This report is the only review deliverable written by the reviewer. Temporary PDF page renderings were created solely for inspection.

Reviewed draft SHA-256: `9ba4af0d848d1cb8a7b8944dbd45392e16a7d40e506f9489da281130bc01b26c`.

## Finding

The expanded draft supplies the missing intermediate reasoning and is mathematically sound in the reviewed 46 units/exercises. No arithmetic error, incorrect final answer, use of a method requiring algebra beyond grade 4, or disclosure of the current requested answer in hint 1 was found at the natural-unit/exercise level. The explanations now distinguish a model, the decisive calculation, and completion/checking. I recommend two substantive clarifications and five small Bulgarian corrections before owner approval. None changes statements, answers, source attribution, identities, difficulty or reward policy.

The substantive improvements already present include: explaining equal groups before factoring; reversing the pencil transfers in the correct order; counting shared sides once rather than counting all polygon sides; distinguishing 30 growth events from calendar day 31; explaining the five-meeting period; and enumerating every admissible box count rather than presenting two unexplained guesses.

## Proposals for the owner's decision

All proposals are pending. Apply none without the owner's decision in the conversation. The replacements below replace only the quoted excerpt, preserving surrounding text and all three stage boundaries.

### R1 - Medium: distinguish butterfly occupancy groups from leaf shapes

Location: `oli-ob-g4-2025-p3-c`, hint 1.

Current:
> На единия вид листа кацат 1 + 2 = 3 пеперуди, а на другия 4 + 1 = 5.

Concern: the problem already has two geometric kinds of leaves, squares and triangles. This wording can incorrectly imply that the butterfly distribution is determined by the leaf shape. The source instead says “на някои листа” and “на останалите”.

Recommended replacement:
> На едни листа кацат 1 + 2 = 3 пеперуди, а на останалите 4 + 1 = 5.

### R2 - Medium: explain why the two paths form a complete circuit

Location: `oli-ob-g4-2026-p2-a`, hint 1, last paragraph.

Current:
> Една обиколка на шестоъгълника е 6 · 120 = 720 см. До първата среща след старта двамата, движещи се един срещу друг, заедно изминават точно тази обиколка.

Concern: the key relation is stated correctly, but the child still has to supply the reason. The authored relative-motion exercises already give this explanation. Making it explicit in the original is worthwhile for the requested teaching expansion.

Recommended replacement:
> Една обиколка на шестоъгълника е 6 · 120 = 720 см. До първата среща след старта мравката изминава едната част от пътя от A до мястото на срещата, а паякът - другата част, в обратната посока. Двата пътя заедно образуват цялата обиколка от 720 см.

### R3 - Low: identify the divisor without relying on a fraction layout

Location: `oli-ob-g4-2023-p1-a`, hint 2.

Current:
> В долната скоба всяко изваждане дава 2:

Concern: the app's unchanged statement writes division inline with a colon. There is no visually lower bracket.

Recommended replacement:
> В скобата, на която делим, всяка от четирите разлики е 2:

### R4 - Low: refer explicitly to the room numbers' digits

Location: `oli-ob-g4-2023-p1-a`, hint 3, first sentence of last paragraph.

Current:
> Провери и двете условия за стаите: Иван и Петър са на стотицата 3, а Иван и Стоян имат различни единици, 9 и 7.

Concern: “са на стотицата 3” is unnatural and describes the people instead of the room numbers.

Recommended replacement:
> Провери и двете условия за стаите: номерата на Иван и Петър имат цифра 3 на стотиците, а номерата на Иван и Стоян имат различни цифри на единиците: 9 и 7.

### R5 - Low: say what is grouped

Location: `oli-ob-g4-2025-p1-a`, hint 1.

Current:
> В дългата скоба на B групирай всяко изваждане със съседното число:

Concern: the phrase groups an operation with a number; the displayed calculation actually groups the numbers in pairs, preserving their signs.

Recommended replacement:
> В дългата скоба на B групирай числата по двойки, като запазиш знаците:

### R6 - Low: make the check's conclusion idiomatic

Locations: `oli-ob-practice-animals-1`, `oli-ob-practice-animals-2`, `oli-ob-practice-animals-3`, hint 3 in each. Also affects the animals lesson and concept because they reuse exercise 1.

Current in all three:
> И двата дадени броя са изпълнени.

Concern: conditions can be fulfilled; numbers are obtained or matched.

Recommended replacement in all three:
> Получихме и двата броя от условието.

### R7 - Low: replace an awkward description of the final pencil count

Locations: the three backwards exercises, hint 1. Exercise 1 also supplies the backwards lesson and concept.

`oli-ob-practice-backwards-1` current:
> Последно Мая е получила 3 молива и е станала с 21.

Replacement:
> Накрая Мая е получила 3 молива и вече е имала 21.

`oli-ob-practice-backwards-2` current:
> Последно Мая е получила 4 молива и е станала с 22.

Replacement:
> Накрая Мая е получила 4 молива и вече е имала 22.

`oli-ob-practice-backwards-3` current:
> Последно Мая е получила 3 молива и е станала с 23.

Replacement:
> Накрая Мая е получила 3 молива и вече е имала 23.

Concern: “е станала с” is colloquial and awkward here; the replacement states the final quantity directly without adding a new inference or answer.

## Coverage and mathematical verification

All three hints in every row below were read. The original answer sets were compared with the supplied official solution PDFs, including intermediate arithmetic. The authored exercises were checked independently from their statements and calculations, not by accepting the drafter's checking script. No arithmetic corrections are proposed.

| Original | Natural units | Verified answer content and key reasoning |
| --- | --- | --- |
| 2023 problem 1 | a | a=317, b=329, c=477; rooms Ivan329/Petar317/Stoyan477; inverse operations, equal groups and digit constraints |
| 2023 problem 2 | a,b,c | 55 cats;34 mottled animals; impossible/19 mottled hens/18 available places; heads and legs, capacities |
| 2023 problem 3 | a,b | a=18,b=10; perimeter56704cm; five width segments, vertical overlap,1011 pairs plus one large square |
| 2024 problem 1 | a | x=1110,y=915,total2024 wagons; the wagon with Harry belongs outside both counted groups |
| 2024 problem 2 | a,b | side780cm; narrow rectangle perimeter832cm;208dm to2080cm; three equal bottom squares, five equal middle squares, correct height/width |
| 2024 problem 3 | a,b |137 unicorns,173 two-horned animals;166 flying; joint horn/star count and overlapping abilities handled correctly |
| 2025 problem 1 | a | difference4; A=221,B=2025 and remaining arithmetic checked |
| 2025 problem 2 | a,b | books25/27/50; pencils93/72/36; equal shares and conservation/reversal of all transfers |
| 2025 problem 3 | a,b,c |920cm on Jan31; March8;1105 white butterflies; shared edges,30 growth events,67th day,605 leaves |
| 2026 problem 1 | a | M=2026; inverse operations and intermediate x=3960,y=259 |
| 2026 problem 2 | a,b |24cm,48cm; speed ratio4:1;144cm ant travel per meeting, period5, remainder3, nearest endpoint comparison |
| 2026 problem 3 | a,b,c |19 large boxes;74 large boxes;2 or7 large boxes; fixed total, balance of surpluses and exhaustive0–9 cases |

| Authored family | Exact covered suffixes after `oli-ob-practice-` | Verified field answers |
| --- | --- | --- |
| expressions | expressions-1,-2,-3 |35;40;45 |
| animals | animals-1,-2,-3 |7/13;8/14;9/15 |
| backwards | backwards-1,-2,-3 |27;27;30 |
| boxes | boxes-1,-2,-3 |5;6;2/5 |
| tiling | tiling-1,-2,-3 |8/256;10/500;12/864 |
| growth | growth-1,-2,-3;growth-core-1,-2 |48;84;120;28;4 |
| relative | relative-1,-2,-3 |48;60;12 |

Structural checks performed using a read-only Python comparison:
- 46 units/exercises and138 nonempty hint strings, exactly three per unit/exercise.
- Removing only every `steps` property gives identical JSON structures for the draft and current collection: statements, prompts, fields, answers, IDs, dependencies, family membership and provenance are unchanged.
- Some first hints contain a numeral equal to a final answer for an unrelated intermediate quantity (for example eight perimeter segments versus an8cm side). This is not disclosure of the requested answer.
- Some second hints already obtain the requested count (for example2026p3a and2026p3c). The third stage still completes verification or proves completeness. This satisfies the approved model/decisive method/finish-or-check progression; I do not recommend withholding a naturally derived result merely to reserve it artificially for stage3.
- The current natural-unit route avoids the legacy whole-source aggregation's early disclosure of previous subparts. This review's “no hint1 disclosure” conclusion applies to the current23 natural units plus23 authored exercises, not to pretending a merged multi-part legacy problem is a single natural part.

## Source evidence and uncertainty

Read all supplied official solution PDFs:2023 (3pages),2024 (3),2025 (3),2026 (4), under `materials/olimpiada-oblasten/`. Visually inspected the2023 original geometry page and2024 original diagram to verify the new descriptions of projected widths, overlapping heights, and lettered segments. The diagrams support the draft's relationships.

The saved full tutor transcripts and `source-inventory.md` were reviewed during the preceding audit in this same task. They inform the expanded methods, not the authority of answers. Relevant passages include the2023 geometry tracing and alternation discussion,2024 geometry reference-unit explanation,2025 pencil reversal/shared-edge/calendar discussions, and2026 meeting-period/case-enumeration discussions. Timestamps are approximate navigation aids; the source inventory records these cautions:2025 captions sometimes say2015;2024 tutor reference unit52cm is not the156cm small-square side; a tutor's intermediate wagon index is not the total train length. None of these errors was imported into the draft.

No unresolved mathematical source discrepancy was found in this draft. This is an independent agent review, not a claim that a human has exhaustively checked and approved all source material or publication rights.

## Derived surfaces, saved work, and remaining limits

The provider derives each of the seven skill lessons from the first authored exercise's three `steps`; concept `idea` uses stage1 and `workedStep` joins stages2–3. All seven source exercises were reviewed with those uses in mind. R6 and R7 propagate to their lessons/concepts. The other five families need no special lesson/concept wording adjustment.

`components/kids-course.tsx:195` and `components/kids-player.tsx:72` render each lesson stage as one `li` text node. `.steps li` does not preserve whitespace. Consequently the draft's embedded blank lines collapse to spaces in lessons; the source steps range from155 to455 characters for these first exercises. The prose remains coherent after that collapse: equations are introduced by colons or ordinary sentences and sequences are separated by punctuation. I found no material meaning error requiring a UI redesign or separate lesson copy. The longest growth/tiling stages will be denser than paragraph-rendered hints. This remains a visual/mobile acceptance check after the copy gate, not a claim of verified browser presentation.

The current provider splits blank-line-delimited hint strings into paragraph arrays while preserving exactly three stages. Single newlines within a paragraph still collapse in HTML; semicolons and sentence punctuation preserve the intended mathematical sequence. The two groups of enumerated2026p3c cases remain intelligible, though the eventual mobile check should inspect their wrapping.

The provider now has a guarded current-solution lookup for saved connected units, checking identity/source/unit/total and unchanged text, fields, options and skill before refresh. This was inspected only; its saved-work behavior, persisted hint levels and reward effects require the coordinator's subsequent acceptance tests. No hint1/2 full-gold or hint3 no-new-gold policy change is proposed.

No regression suite, build, deployed-browser check or saved-learner mutation was run by this reviewer. The copy gate is still pending the owner's decisions on R1–R7. Acceptance tests and deployment readiness remain the coordinator's responsibility after approval.


## Owner decision - 2026-11-15

Owner approved all R1–R7 in chat (“approve”). All eleven excerpts applied exactly as proposed; stage boundaries and every non-hint content field preserved. Original review above is retained as the audit record.
