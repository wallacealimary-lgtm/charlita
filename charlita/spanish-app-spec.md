# Spanish Learning App — Replicable Spec

**App name:** Charlita
**Spec version:** 0.2 — 24 Sep 2026 (end of P1)
**Status:** P0 + P1 built and tested (offline drills). Next: learner tries P1 on iPhone/iPad, then P2 (Respuestas rápidas) and P3 (coach + online modes).

This file is the **source of truth**. An agent should be able to build the whole app for any learner from this file alone. The building agent **must keep the Decision Log and Gaps sections at the bottom up to date** as it works (see §13).

---

## 1. What this is

A calm, beautiful phone and tablet app for an intermediate learner (B1→B2) to build Spanish vocabulary, verb control and — above all — the confidence to **respond quickly in real conversation**.

It has two halves:

- **Offline mode:** drills that work with no internet (on a plane, on the metro).
- **Online mode:** AI-powered conversation, exploration, reading and listening.

An **orchestrator** agent sits in the centre. It reads the **learner profile** and steers every module toward the learner's goals. The learner can also **talk to it directly** through the in-app **coach** (§5.9) to change goals and ask about their own progress. Mistakes and new words from online mode flow back into offline mode, and that **feedback loop** is the core of the design.

It is meant to replace doom-scrolling. Opening the app should feel like a treat, not homework.

## 2. Design principles (non-negotiable)

1. **Spelling is never penalised.** The learner is learning Spanish, not spelling. Near-misses count as correct and the correct form is shown gently (§6).
2. **Spanish in, Spanish out.** The app speaks only Spanish. The learner may type English anytime. English appears only as *the thing being translated*: translation targets, matching pairs, tap-to-translate, and the tense-detective mode (§5.1.b).
3. **Never discouraging.** No red crosses, no broken-streak guilt, no sad mascots. Aim for a session success rate of roughly 75–85%. If the learner is struggling, the app gets easier, not louder.
4. **Frustration-aware.** Items the learner is fighting with get rested, not hammered (§7.3).
5. **Feel the progress.** The learner must be able to *see* that they're improving. Calm stats, words learned, verbs mastered.
6. **Offline first.** Everything in Offline mode works in airplane mode.
7. **Speed without pressure.** Train *getting something out*, never visible timers (§5.3).
8. **Replicable.** Provider-agnostic (Claude or ChatGPT), no backend of our own, and everything configurable through the learner profile.

## 3. Target language variety

- **Primary:** Spain Spanish (es-ES). This means vosotros is taught everywhere, Spain vocabulary (*coger*, *ordenador*, *móvil*, *vale*), pretérito perfecto for today and recent past (*hoy he comido*), and es-ES voices for audio.
- **Secondary:** Latin American variants shown as a small tagged note when they differ (e.g. *computadora (LatAm)*, *ustedes for vosotros*). Never tested as the main answer.
- Configurable per learner in the profile (`variety: "es-ES" | "es-MX" | ...`).

## 4. Architecture

```
┌──────────────────────── App (installable PWA) ─────────────────────────┐
│                                                                        │
│   OFFLINE MODE (local only)          ONLINE MODE (needs internet + key)│
│   ├─ Verbos                          ├─ Charla (conversation/scenarios)│
│   ├─ Palabras                        ├─ Explora (facts exchange)       │
│   └─ Respuestas rápidas              ├─ Lector (reader)                │
│                                      └─ Escucha (voice + podcasts)     │
│                                                                        │
│                      ORCHESTRATOR (agent)                              │
│          reads/writes ▼                  ▲ suggests next session       │
│                    LEARNER PROFILE + PROGRESS STORE                    │
│                    (IndexedDB, on device, exportable)                  │
│                                                                        │
│   STATIC DATASETS (bundled JSON): verbs, words, quick replies,         │
│   plus reserve pools for offline refresh                               │
└────────────────────────────────────────────────────────────────────────┘
                       │ online only
                       ▼
        LLM provider adapter (Anthropic | OpenAI), learner's own key,
        with the provider's web-search tool for articles and podcasts
```

**Vocabulary used in this spec:**
- **Interface:** the screens the learner touches.
- **Mode:** Offline or Online.
- **Module:** one feature inside a mode.
- **Orchestrator:** the agent deciding what happens next.
- **Learner profile:** the orchestrator's memory of the learner.
- **Feedback loop:** online mistakes and words flowing into offline drills.

### Data continuity across app updates (required)
The app will keep getting new features. Progress and the orchestrator's memory must survive every update.
- All learner state lives on the device in IndexedDB (`items`, `kv`, `words`). Code updates arrive through the service worker and **never touch IndexedDB**.
- Every item has a **stable key** (`w:<wordId>`, `tabla:<verb>:<tense>`, `det:<id>`, `sig:<verb>:<tense>`, `vtr:<id>`). Datasets may grow, but existing IDs are never renumbered or reused.
- `kv.meta.schema` holds the data-schema version. When stored data changes shape, bump `SCHEMA` and add a migration that upgrades data in place. Migrations never delete progress.
- On every load, new default profile fields are **filled in without overwriting** anything the learner or coach already set (`fillDefaults`).
- The orchestrator's memory (`coach_notes`, `goals_history`) lives inside the profile, so it follows the same rules and is included in backups.
- When a new version is ready, the app shows *"Hay una versión nueva — Actualizar"* and reloads only when the learner taps it.
- Backups: Export/Import in Ajustes. After 40+ answers, the home screen suggests a backup once a week.

### Tech choices
- **PWA** (installable to the iOS/iPadOS home screen), with a service worker caching everything needed offline.
- **Storage:** IndexedDB for progress, profile and saved articles. There's a one-tap **Export / Import backup** (JSON).
- **Fonts and illustrations bundled locally** so offline mode looks identical.
- **LLM adapter:** a single interface (`chat()`, `chatWithSearch()`) with Anthropic and OpenAI implementations. The key is entered in Settings and stored only on the device. Check each provider's requirements for direct browser calls (e.g. Anthropic's browser-access header).
  - *Security note:* a key in the browser is visible to anyone holding the unlocked device. That's acceptable for a personal app, and the spec says so plainly to anyone replicating it.
- **Voice:** use the browser's speech synthesis (es-ES voice) for listening and speech recognition for speaking. Verify support on iOS Safari; if recognition is unavailable, fall back to the keyboard's dictation mic or a transcription API.
- **Hosting:** any static host. No server of our own.

## 5. Modules

### 5.1 Verbos (offline)

**Dataset:** the 100 most frequent Spanish verbs, each fully conjugated for all 6 persons (yo, tú, él/ella/usted, nosotros, vosotros, ellos/ellas/ustedes) in:

- **Indicativo:** presente, pretérito perfecto, pretérito indefinido, pretérito imperfecto, pluscuamperfecto, futuro simple, futuro compuesto, condicional simple, condicional compuesto
- **Subjuntivo:** presente, pretérito perfecto, imperfecto (-ra, with -se accepted), pluscuamperfecto
- **Imperativo:** afirmativo, negativo

Pretérito anterior and future subjunctive are excluded (literary or legal).

Each tense also carries 3–5 **example sentences** per common verb, with an English translation, for the tense detective.

- Generate conjugations programmatically, then verify all irregulars against a reliable reference before shipping.
- Ship as static JSON.
- Keep a **reserve pool** of the next ~150 verbs for offline refresh.

**Modes:**

a) **Tabla:** fill in a verb's conjugation grid, across one tense or across tenses.
   - Buttons: *Comprobar* (check), *Ver respuesta* (show answer), *Saltar* (skip).
   - Correct cells turn soft green; near-misses show the corrected form beside them.

b) **Detective de tiempos:** the learner sees an English sentence and picks which of 3–4 Spanish versions (differing by tense or mood) fits best. Alternatively: "which verb would you use here?"
   - This is **the one mode allowed to show English explanations**, e.g. a short tense card: *Condicional = "would + verb" · hablaría = I would speak*.
   - This exists because tense *meaning* isn't clear to the learner yet.

c) **¿Qué significa?:** a conjugated form (e.g. *fui*) is shown, and the learner types or chooses the English meaning.
   - Accept every valid reading: *fui* = "I went" (ir) **or** "I was" (ser).
   - This mode is about meaning, not grammar.

d) **Traduce:** a generated sentence using the target verb is shown, and the learner translates it. Uses the pre-built example sentences offline.

### 5.2 Palabras (offline)

**Dataset:** 1,000 B1–B2 words, es-ES first. Plus a **reserve pool** of ~2,000 more, ordered by frequency, for offline refresh. Plus user-added words.

```json
{ "id": "w0421", "es": "aprovechar", "pos": "verb", "gender": null,
  "def_es": "Sacar provecho o utilidad de algo.",
  "example_es": "Aprovecha el buen tiempo para ir a la playa.",
  "en": "to make the most of / take advantage of",
  "variety": "all", "latam_alt": null, "topic": ["vida diaria"],
  "freq_rank": 1840, "source": "core" }
```

`source` is one of `core` | `reserve` | `lector` | `charla` | `manual`.

**Modes:**
- **Emparejar:** 5 Spanish and 5 English words; tap to pair them.
- **Adivina la palabra:** a Spanish definition (and optionally the example with a blank) is shown, and the learner types or picks the word.
- **Tarjetas:** flashcards. Spanish on the front; the back shows the Spanish definition first, and the English only on a second tap.
- **Traduce:** type the translation, in either direction.

### 5.3 Respuestas rápidas (offline) — the speed trainer

The learner's biggest weakness is freezing when spoken to. This module trains *producing a reply at all*.

**Dataset (~200 cards):** everyday things people say to you in Spain, e.g. *¿Qué tal el finde?*, *¿Te pongo algo más?*, *¿Me dejas pasar?*, *¿Vienes esta noche?*. Each card has 2–3 natural native replies.

- **Any Spanish reply counts.** After answering, the learner sees how a native might answer and can star one to "keep".
- **Muletillas:** teach and reward the fillers natives use to buy thinking time: *pues…*, *a ver…*, *bueno…*, *es que…*, *o sea…*, *¿cómo te diría?*. Starting a reply with one is celebrated.
- **Survival phrases:** *¿Me lo repites?*, *Más despacio, porfa*, *No te he entendido*, *¿Cómo se dice…?*
- **No timers on screen.** Privately, the app may track time-to-first-word and show a gentle monthly trend ("respondes más rápido que en septiembre"). It is never shown per card.

### 5.4 Charla (online) — conversation and scenarios

- The learner picks a topic or scenario, or taps *Sorpréndeme*.
- Scenarios lean on the learner's real life (see profile), e.g. bakery, neighbour, doctor, small talk at work, returning something in a shop.
- The conversation is text or voice and continues until the learner ends it.
- **No corrections mid-flow.** The AI keeps it warm, funny and occasionally bizarre, but conversational.
- **At the end:** a short summary, then the **3–5 highest-value corrections**, constructively framed ("Dijiste X — suena más natural Y"), then new words offered for the word bank.
- Errors and new words update the profile and raise those items' priority in offline mode.
- A **Modo rápido** sub-option runs short everyday exchanges (the Respuestas rápidas idea, but live).

### 5.5 Explora (online) — facts exchange

- The learner picks any topic (animals of Africa, how steel is made, the history of tapas).
- The AI shares surprising facts in Spanish at the learner's level. The learner asks follow-ups in English or Spanish, and the AI always answers in Spanish.
- Unknown words can be tapped and saved, just like in the Lector.
- End-of-session summary and saved words follow, as in Charla.

### 5.6 Lector (online to find, offline to read)

- Finds texts **originally written in Spanish** at the learner's level, on topics they like.
- Renders each text in a clean reading view: serif font, cream paper, adjustable size.
- **Tap a word** to see its English gloss and the Spanish definition. **Guardar** sends it to Palabras (`source: "lector"`).
- **Download for offline:** articles are saved to IndexedDB.
- **Sources:**
  - Downloaded and re-rendered full texts come only from **open or public-domain** sources: Wikisource (es), Spanish Wikipedia, Project Gutenberg Spanish, and other clearly open-licensed material.
  - Copyrighted news and articles are **linked** and opened in the browser, not copied.
- Each text can be liked or disliked; this feeds topic preferences.

### 5.7 Escucha (online)

- **Voice chat:** Charla and Explora can run hands-free, with speech in and es-ES speech out.
- **Podcasts:** the orchestrator recommends episodes that suit the learner's level and interests, with Apple Podcasts links (found via web search).
  - Seed with learner-oriented Spain Spanish shows (e.g. *Hoy Hablamos*).
  - Each episode gets a like or dislike, which feeds preferences.

### 5.8 Orchestrator (engine)

- **Online:** an LLM call reads the profile plus recent progress and returns:
  - today's suggested session (e.g. *"10 min condicional + charla en la farmacia"*);
  - per-module prompt parameters (level, topics, weak words to weave in, scenario ideas);
  - profile updates after each online session.
- **Offline fallback:** a simple rule-based planner (due items first, weakest tense next, one quick-reply block).
- **Tuning:** slightly increase difficulty when success is above 85%; ease off when it is below 70% or frustration signals appear.
- **Goal pacing:** knows target dates and nudges coverage (e.g. all subjunctive tenses before the exam date). Never guilt-trips.

**Charla system prompt skeleton:**
```
Eres un compañero de conversación en español de España (nivel {level}).
Habla SOLO en español. El usuario puede escribir en inglés; responde en español.
No corrijas durante la conversación. Sé cálido, divertido, a veces absurdo.
Usa de forma natural estas palabras que está aprendiendo: {weak_words}.
Escenario: {scenario}. Intereses: {likes}. Evita: {dislikes}.
Cuando el usuario diga que ha terminado, devuelve JSON:
{summary_es, corrections:[{said, better, why_es}] (máx 5, las más útiles),
 new_words:[{es, def_es, en}], weak_points:[...]}
```

### 5.9 Tu coach (online) — talking to the orchestrator
The learner's way to talk to the orchestrator directly. Built in P3.
- **Screen:** *Tu coach*, a chat. The coach writes in Spanish at the learner's level. The learner may type English. **Grammar explanations may use short English anchors** (same exception as the tense detective).
- **Context the coach receives on every turn:** the learner profile, `coach_notes`, and a compact **progress summary** built on the device: tense accuracy, words learned/mastered, weak items, days practised, recent sessions, and the current due counts. Raw item data is not sent.
- **What the learner can do:**
  - Ask about their learning: *"¿Qué se me da peor?"*, *"¿Qué he aprendido este mes?"*, *"Explícame el condicional"*.
  - Change goals and preferences: *"Quiero centrarme en el subjuntivo"*, *"Ahora tengo 15 minutos al día"*, *"Me interesa la cocina"*.
- **Profile changes are proposals.** The coach returns a structured patch (e.g. `{"weak_tenses": [...], "daily_minutes": 15}`). The app shows it as a card, *"¿Actualizo tu perfil?"*, and applies it only when the learner taps **Sí**. Every applied change is appended to `goals_history` with `by: "coach"` or `by: "learner"`.
- **Memory:** the coach may save short durable notes about the learner (`coach_notes`, capped at ~50, oldest summarised). These persist across app updates and backups.
- **Offline:** the coach screen explains that it needs a connection. Offline drills keep using the rule-based planner.
- **Coach system prompt skeleton:**
```
Eres el coach de español de {name} (nivel {level_now}, variedad {variety}).
Habla en español sencillo y cálido. Si pregunta por gramática, puedes usar anclas breves en inglés.
Perfil: {profile_json}  Notas previas: {coach_notes}  Progreso: {progress_summary}
Nunca culpes ni hables de rachas perdidas. Celebra el progreso real con datos.
Si el usuario quiere cambiar objetivos o preferencias, responde y añade al final JSON:
{"profile_patch": {...}, "note": "..."}  (solo campos del perfil; el usuario lo confirmará)
```

## 6. Answer checking (spelling tolerance)

Apply these steps in order:

1. **Normalise:** lowercase, trim, strip punctuation.
2. **Exact match** → ✅ correct.
3. **Match ignoring accents** → ✅ correct; show the accented form gently.
   - *Exception:* if the unaccented answer is another valid form of the same verb (*hablo* vs *habló*), treat it as **"casi"** (see Gaps G1).
4. **Edit distance within tolerance** (≤1 for words of ≤5 letters, ≤2 for longer) and not equal to another valid form → ✅ correct; show the corrected spelling.
5. **Matches a different person or tense of the same verb** → 🟡 **casi**. This is a teaching moment, e.g. *"Eso es para 'nosotros' — aquí buscamos 'ellos'."*
6. **Anything else** → "Todavía no". Show the answer in a neutral colour, never red.

Also accept every valid alternative: ser/ir forms, imperfect subjunctive -ra/-se, synonyms listed in the dataset.

## 7. Adaptivity

### 7.1 Scheduling
Use Leitner boxes 1–5 with intervals of roughly 0, 1, 3, 7 and 21 days.
- Correct → move up one box.
- Casi → stay in the same box.
- Miss → drop to box 1.
- Missed items resurface sooner within a session, but never more than 3 times per session.

### 7.2 Mastery and refresh
- An item is **mastered** after passing box 5 twice.
- **Actualizar** (per dataset, one tap) retires mastered items and pulls the next ones from the bundled reserve pool, so refresh works offline.
- Retired items still appear occasionally as easy "wins".
- When online, refresh can also ask the LLM to generate items that fit the profile.

### 7.3 Frustration handling
**Signals:**
- 3+ misses on the same item in one session;
- several skips in a row;
- rapid wrong answers;
- the **"Déjalo descansar"** button on any card.

**Response:**
- Rest the item for 3+ days.
- Bring it back later in an easier format (multiple choice instead of typed, or with a hint).
- Immediately serve 2–3 items the learner knows well, so they get a win.
- Show one short encouraging line in Spanish.

### 7.4 Session shape
Sessions are short (5–10 min) and mix new, due and easy items for a ~75–85% success rate. Every session ends with a small celebration and a visible progress tick.

## 8. Learner profile (template)

```json
{
  "name": "", "native_language": "en", "variety": "es-ES",
  "level_now": "B1", "level_targets": [{"level":"B2","by":"YYYY-MM","exam":null}],  // exam optional; pacing never exam-driven unless the learner asks
  "main_goal": "", "weaknesses": [], "frustrations": [],
  "life_context": "", "interests": [], "dislikes": [],
  "rules": {"spelling_tolerant": true, "ui_language": "es", "user_may_write_en": true},
  "daily_minutes": null,
  "progress": {"weak_items": [], "mastered_count": {}, "tense_accuracy": {}},
  "liked_content": [], "disliked_content": [],
  "weak_tenses": [],
  "coach_notes": [],
  "goals_history": []
}
```

## 9. Visual design

- **Mood:** calm, clean, cute. A storybook on cream paper, meeting a modern soft-gradient app.
- **Base:** cream "paper" background with textured pastel illustration (halftone dots, brush strokes, organic blob shapes, paper-cut layering).
- **Components:** large rounded cards (radius ~24px), pill buttons and chips, generous whitespace, soft stat tiles for progress, subtle pastel gradients on hero cards.
- **Palette:**

| Token | Hex |
|---|---|
| cream | `#F6F1E7` |
| blush | `#EBB7B5` |
| sage | `#A8B98B` |
| mustard | `#E6A93C` |
| powder blue | `#C8DCE2` |
| lavender | `#D8CEF0` |
| charcoal | `#2A2A2A` |

- **Dark mode:** charcoal base, the same pastels muted.
- **Type:** an elegant serif for headings and the Lector (e.g. Fraunces or Lora), and a friendly rounded sans for UI (e.g. Nunito). Fonts are bundled locally.
- **Animal companions,** one per module, drawn as original illustrations in the textured paper style:

| Module | Animal |
|---|---|
| Verbos | erizo (hedgehog) |
| Palabras | ardilla (squirrel) |
| Respuestas rápidas | colibrí (hummingbird) |
| Charla | loro (parrot) |
| Explora | zorro (fox) |
| Lector | búho (owl) |
| Escucha | gato (cat) |

  - They cheer on success and give a kind shrug on misses.
  - **Never** sad, disappointed or guilt-tripping.
- **Motion:** gentle and short. Honour reduced-motion settings.
- **Progress language:** "días practicados este mes", never "you broke your streak".

## 10. Build phases

| Phase | Scope | Done when |
|---|---|---|
| P0 ✅ | PWA scaffold, design system, storage, profile, export/import | Installs on iPhone, looks right, works offline |
| P1 ✅ | Verbos + Palabras + answer checking + adaptivity + refresh | Full drill loop works in airplane mode |
| P2 | Respuestas rápidas + muletillas | Speed module usable offline |
| P3 | LLM adapter, **Tu coach** (§5.9), Charla, Explora, orchestrator, feedback loop | Coach can answer progress questions and update goals (with confirmation); chat corrections appear in offline drills |
| P4 | Lector (tap-to-translate, save, download) + Escucha (voice, podcasts) | Read offline, save words, voice chat |
| P5 | Replication pass: onboarding interview → profile, setup guide | A new learner can be set up from this spec alone |

## 11. Acceptance tests (minimum)

- Airplane mode: every Offline module fully works after first load.
- Spelling: *aprobechar* → correct (corrected shown); *hablo* for *habló* → casi; *fué* → correct.
- Neither answer is penalised: *fui* translated as "I was" or "I went".
- No English UI text outside the allowed exceptions (§2.2).
- Three misses on one item → the item is rested and a "win" item follows.
- Refresh retires mastered items and pulls new items from the reserve pool with no internet.
- A Charla session produces ≤5 corrections, and its new words appear in Palabras.
- The coach answers "¿qué se me da peor?" using real progress data, and a goal change only reaches the profile after the learner confirms it.
- An app update (new SCHEMA + migration) keeps all progress, custom goals and coach notes.

**P1 results (24 Sep 2026, automated — `tests/`):** offline load ✅ · all 8 offline modes answer and save offline ✅ · *aprobechar* → correct, *hablo* for *habló* → casi, *fué* → correct ✅ · *fui* accepts "I went" and "I was" ✅ · no English UI outside allowed exceptions ✅ · 3 misses → item rested + known item served next ✅ · Actualizar retires mastered words/verbs and pulls reserve offline ✅ · Export → wipe → Import ✅ · simulated update keeps progress and custom goals ✅. Still to do: a manual install-and-airplane-mode check on the learner's iPhone and iPad.
- Export → wipe → Import restores everything.

## 12. Replicating for someone else

1. Run an onboarding interview covering:
   - native language and target variety;
   - level, goals and deadlines;
   - biggest weakness and what frustrates them;
   - interests and dislikes;
   - daily time and life context (for scenarios).
2. Fill in the learner profile (§8).
3. Pick dataset slices for their level; regenerate the word list if their variety differs.
4. Optionally swap the palette or animals.
5. The learner enters their own API key (Claude or ChatGPT) in Settings.

### Building and shipping (as built)
- **Stack:** plain HTML/CSS/ES modules. No build step or framework. Files: `index.html`, `css/app.css`, `js/{app,cards,store,data,checker,db,animals}.js`, `data/{verbs,words,detective}.json`, `fonts/`, `icons/`, `manifest.webmanifest`, `sw.js`.
- **Datasets** (`tools/`):
  - `verbs_src.py` + `build_verbs.py`: conjugations come from the `verbecc` library, with ~80 hand-checked irregular forms asserted at build time. Five verbs the library crashes on are built from a model verb. 2010 RAE monosyllable spelling is applied (*rio*, *fue*).
  - `detective_src.txt` + `build_detective.py`: hand-written English-anchored sentences. Distractors are the same verb and person in confusable tenses. Genuinely valid alternatives (e.g. *quisiera* for *querría*) are excluded.
  - `words/*.txt` + `build_words.py`: `es|pos|gender|en|def_es|example_es|topic|latam_alt`. Files `0*` are core, `r*` are reserve.
- **After changing any file,** run `python3 tools/make_sw.py`. It regenerates `sw.js` with a new cache version, so installed apps offer the update.
- **Tests:** serve the folder locally, then run `node tests/run.cjs ./tests/t_accept.cjs` (Playwright). `t_lang.cjs` checks for English in the UI, `t_cont.cjs` checks update continuity, and `test_checker.mjs` checks the answer checker.
- **Hosting:** any static HTTPS host; GitHub Pages is used here. iOS: open in Safari → Share → *Añadir a pantalla de inicio*, open once online, then everything works offline.

## 13. Agent instructions: keep this file alive

Whoever builds from this spec **must update this file as they go**:

- Every decision they make, including gap-filling and assumptions, goes in the **Decision Log** with *who decided* (`Learner` / `Agent` / `Together`).
- Every question they ask the learner, and the answer, goes in the log too.
- Unresolved questions go in **Gaps**. Move them to the log once answered.
- If a decision changes an earlier section, edit that section **and** log the change.
- Bump the spec version at each phase end.

---

## Decision Log

| # | Date | Decision | Why | Decided by |
|---|---|---|---|---|
| D1 | 2026-09-24 | Spain Spanish primary; LatAm variants as secondary notes | Learner lives in Barcelona | Learner |
| D2 | 2026-09-24 | App speaks only Spanish; learner may write English; English only as translation targets and in the tense detective | Immersion, but tenses need English anchoring | Learner |
| D3 | 2026-09-24 | Spelling never penalised | Learner struggles with spelling; must not be discouraged | Learner |
| D4 | 2026-09-24 | Full offline mode for verbs and words | Use on planes and without signal | Learner |
| D5 | 2026-09-24 | Adaptive stacking of weak items, with frustration backoff | Learn what's hard without burning out | Learner |
| D6 | 2026-09-24 | One-tap refresh retires mastered items | Keep the sets fresh | Learner |
| D7 | 2026-09-24 | "Interface" renamed Online mode; orchestrator + learner profile + feedback loop | Clearer architecture vocabulary | Together |
| D8 | 2026-09-24 | Speed trained via muletillas, quick replies, scenarios; no visible timers | Main goal is responding confidently; pressure backfires | Together (agent proposed, learner approved) |
| D9 | 2026-09-24 | Visual direction: cream paper + textured pastel illustration + rounded soft cards + animal companions | Learner's reference images: calm, clean, cute, bright pastels | Learner (refs) + agent synthesis, approved |
| D10 | 2026-09-24 | Installable PWA; bring-your-own API key (Claude/ChatGPT swappable); on-device storage with export | Offline-capable, replicable, no backend | Together (agent proposed, learner approved) |
| D11 | 2026-09-24 | Downloadable reading only from open/public-domain sources; news via link | Avoid copying copyrighted text | Together (agent proposed, learner approved) |
| D12 | 2026-09-24 | Voice conversation is core; podcast recommendations are a secondary passive option | Voice directly trains speaking speed | Together |
| D13 | 2026-09-24 | Builder keeps this spec updated with decisions, questions and answers | Spec must stay replicable | Learner |
| D14 | 2026-09-24 | App name **Charlita** (resolves G4) | Warm, conversational | Learner (from agent options) |
| D15 | 2026-09-24 | No exam target; learner "just wants to learn". Level targets are soft and pacing is never exam-driven (resolves G2) | Learner's answer | Learner |
| D16 | 2026-09-24 | Hosting on GitHub Pages | Free, stable URL, easy to update per phase | Learner (agent recommended) |
| D17 | 2026-09-24 | Demo after P0+P1, before P2 | Brief's check-in rule | Learner (agent recommended) |
| D18 | 2026-09-24 | Learner can talk to the orchestrator through an in-app **coach chat** (§5.9): ask about progress, change goals; profile changes need a one-tap confirmation | Learner asked to update goals and ask what he's learning | Together (learner request, agent design) |
| D19 | 2026-09-24 | Continuity: progress and coach memory stay on-device across updates, with schema migrations, non-destructive default filling and weekly backup nudges (§4) | Learner wants to add features anytime without losing the orchestrator's knowledge | Together |
| D20 | 2026-09-24 | Coach speaks Spanish, English allowed for grammar anchors | Same rationale as D2 | Learner (agent recommended) |
| D21 | 2026-09-24 | Build order: learner tries P1 on phone first, coach next (in P3) | Real feedback before more build | Learner |
| D22 | 2026-09-24 | G1: an accent that turns the answer into another form of the same verb (*hablo/habló*) = casi; any other missing or extra accent = correct | Kept spec default; teaches the difference without penalising spelling | Agent |
| D23 | 2026-09-24 | G8: vosotros imperative testable; -se imperfect subjunctive accepted, never asked | Kept spec default | Agent |
| D24 | 2026-09-24 | 100 core verbs = frequency blended with everyday usefulness (e.g. comer, dormir, comprar, conducir in; existir, producir, realizar moved to reserve). 158 reserve verbs | Conversation-first goal | Agent |
| D25 | 2026-09-24 | Conjugations generated with `verbecc` and verified against a hand-checked irregular list at build time (build fails on mismatch) | Spec §5.1 "verify irregulars" | Agent |
| D26 | 2026-09-24 | Tense detective ships 105 hand-written sentences across all 15 tenses, weighted to condicional/subjuntivo, instead of 3–5 per tense per verb | Quality over volume; see G11 | Agent |
| D27 | 2026-09-24 | Words: 1,039 core B1–B2 entries (es-ES, with LatAm alternates tagged) + 442 reserve, all hand-written. Reserve is short of the 2,000 in §5.2 (see G9); mastering takes weeks, so it won't run out soon | Time vs quality | Agent |
| D28 | 2026-09-24 | Leitner item = one word (shared across word modes) or one verb×tense (Tabla). New items start at box 2 on first correct answer | Simple, and progress is visible sooner | Agent |
| D29 | 2026-09-24 | Missed items come back later in the same session in an easier format (multiple choice), at most 3 times | §7.1 + §7.3 | Agent |
| D30 | 2026-09-24 | Rapid wrong answers = 3 wrong in a row, each under 2.5 s. Skip streak = 3 | Frustration signals in §7.3 needed numbers | Agent |
| D31 | 2026-09-24 | New-item share adapts to the last 5 sessions: 45% when accuracy is above 85%, 15% below 70%, otherwise 30% | Target 75–85% (§7.4) | Agent |
| D32 | 2026-09-24 | Verbos "Traduce": auto-accept when ≥70% of the reference's content words match (spelling-tolerant). Otherwise show the reference and let the learner self-rate (Lo tenía / Casi / Aún no) | Free translation can't be checked strictly without AI | Agent |
| D33 | 2026-09-24 | "Learned" = box ≥3 (shown on home); "mastered" = passed box 5 twice | Progress visible within days, not months | Agent |
| D34 | 2026-09-24 | Online modules shown on home as "Muy pronto" cards with their animals | Shows the full app shape without broken features | Agent |
| D35 | 2026-09-24 | No framework or build step; a Python script regenerates the SW precache | Easy for any agent to maintain and replicate | Agent |

## Questions to the learner

| # | Date | Question | Answer |
|---|---|---|---|
| Q1 | 2026-09-24 | Where should the app live so it can be installed? | GitHub Pages |
| Q2 | 2026-09-24 | How far to build before the first demo? | P0 + P1, then demo |
| Q3 | 2026-09-24 | Which B2 exam (DELE or SIELE)? | "I don't care about exams, I just want to learn" |
| Q4 | 2026-09-24 | App name? | Charlita |
| Q5 | 2026-09-24 | How do you want to talk to the orchestrator? | In-app coach chat |
| Q6 | 2026-09-24 | How should progress and coach knowledge carry over when features are added? | On-device + backups |
| Q7 | 2026-09-24 | Coach language? | Spanish, with English for grammar |
| Q8 | 2026-09-24 | Build order? | P1 on phone first, then the coach |

## Gaps (open questions)

| # | Question | Default until answered |
|---|---|---|
| G3 | Daily time budget? | 10 min (editable in Ajustes: 5/10/15/20) |
| G5 | Final animal line-up | As in §9. Drawn; learner to confirm at P1 demo |
| G6 | Speech-recognition support on iOS Safari (verify during P4) | Fall back to dictation mic |
| G7 | How the orchestrator judges podcast level | Ask LLM to rate on search, learner feedback adjusts |
| G9 | Expand reserve word pool from 442 to ~2,000 | Expand before the reserve is used up, or generate via LLM refresh (P3) |
| G10 | Manual check: install on iPhone and iPad, airplane mode | Pending learner's P1 demo |
| G11 | More tense-detective sentences (target 3–5 per tense for the top 30 verbs) | 105 now; add in P2/P3, or generate online |
| G12 | Coach: where the learner's API key lives, and which model | On device only, Settings (P3). Default: a current Claude model |
| G13 | Sync between iPhone and iPad | Manual export/import for now. Learner didn't choose cloud sync; revisit if it becomes annoying |
