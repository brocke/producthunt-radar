# CLAUDE.md – ProductHunt Radar

Projektspezifische Anweisungen für Claude Code.
Überschreibt die globale `~/.claude/CLAUDE.md`.

---

## 🚀 Aktueller Stand (Stand 2026-05-28)

**MVP komplett + große Iteration darüber.** Alle 10 Phasen aus `plan.md` (0–9) sind umgesetzt, plus zahlreiche Post-MVP-Features.

**Live:** https://ph-radar.filbro.de (HTTPS via Coolify/Traefik, Auth via `DISABLE_AUTH`-env steuerbar).

**Post-MVP-Features (deployed):**
- **Lenses** — KI-Re-Ranking mit freiem Prompt. Drei Vorlagen (Workflow / Nachbau / Signal), Custom-Prompt frei tippbar. Cache pro `lens_key` in `lens_scores`-Tabelle. Sonnet 4.6, Batch-Scoring 60 Posts/Call, Top-200-Cap pro Aktivierung. Erstanwendung ~80–120 s, danach Cache (<1 s).
- **Zeitraum-Dropdown** — 24 h (Default) / 3 Tage. PH-API-Pagination mit `pageInfo.endCursor`, max-pages dynamisch nach Range (vermeidet Complexity-Budget-Sprenger). `unstable_cache` mit TTL 30 min keyed auf `rangeHours`, sodass Topic-/Sort-/Lens-Wechsel keinen fresh-fetch triggern.
- **Robustness-Layer** — `phRequest` retry 1× bei transienten Netzwerk-Fehlern, `paginatePostsQuery` graceful partial result, `useTransitionHeartbeat`-Hook in allen Selectors (hält React-Concurrent-Scheduler wach), Range/Sort/Topic disabled während Pending, gemeinsamer `TransitionPendingProvider`-Context für „Claude bewertet die Posts"-Banner.
- **Dark Mode** — Light / Dark / System via `next-themes` + shadcn-CSS-Vars. ThemeToggle als Icon-Only DropdownMenu rechts oben (Sun/Moon/Monitor je nach Stand).
- **Mobile** — Header-Buttons als Icon-only bei `sm:` breakpoint, Title-Auto-Shrink, alle Pages responsive ohne Sonderbehandlung.
- **Brand-Akzentfarbe** `#e6007e` (Pink) sparsam für Watchlist-Counter, Active-Lens-Pill, Vote-Arrow, BackLink-Hover.
- **Favicon** — eigenes Logo (Kreuz-Symbol auf ziegelrot) in `app/icon.png` + `app/apple-icon.png`.
- **BackLink mit URL-State-Erhalt** — `router.back()`-basiert, label-aware (`Back to Watchlist` / `Back to Digest` / `Back to feed`).
- **About-Modal** — Info-Button rechts oben öffnet Feature-Übersicht mit „Lenses"-Hero-Card, PH-Limits-Liste.
- **Feed-Zeitstempel** — „Feed-Daten von HH:MM Uhr — Cache läuft 30 Min" unter dem Header.
- **Filter-Reset-Link** — rechts in der Filter-Zeile, sichtbar wenn etwas anderes als Default aktiv.

**Verzeichnis-Mapping:**
- Lokal: `/Users/filbroki/Documents/Claude Code/ProductHunt Radar/` (Stand 28.05.26 — vermutlich Verschiebung in den nächsten Tagen geplant, dann hier aktualisieren)
- Server: Coolify-managed, kein klassisches `/root/ph-radar/`-Verzeichnis mehr

**Offene Punkte:**
- [KOE-352](https://linear.app/koerting-institute/issue/KOE-352) — Auth Read-Public + Write-Locked (Backlog, Medium). Auth ist live aktuell via `DISABLE_AUTH=true` deaktiviert für Demo-Sharing; das Ticket ist der saubere Long-Term-Fix.
- `plan.md` §10 "Später" — Trend-Visualisierung auf Basis der Snapshots-DB. Erst sinnvoll nach 2-4 Wochen Datensammlung, mittlerweile haben wir genug Daten — könnte als nächstes Feature angegangen werden.

**Memory-Einträge** (siehe `~/.claude/projects/.../memory/`):
- `project_deployment.md` — Details zum Hetzner-Setup, Caddy, Container, SSH-Keys
- `reference_ph_api_quirks.md` — PH API page-Limit 20, identische `createdAt` pro Tag, ID-Tiebreaker

> **Architektur-Wahrheit ist `plan.md`** — dort steht der Phasenplan, der Tech-Stack mit Begründungen, das GraphQL-Cheatsheet und alle Gotchas. Diese CLAUDE.md ergänzt nur projektübergreifende Konventionen, dupliziert aber nicht den Plan.

> ⚠️ **Next.js 16 ist installiert, NICHT 15** wie im Plan vorgeschlagen. Next.js 16 hat Breaking Changes ggü. älteren Versionen (App Router APIs, Caching, Server Actions). Bei Unsicherheit: Doku unter `node_modules/next/dist/docs/` konsultieren (siehe `AGENTS.md`).

---

## 🎯 Projektzweck und Zielgruppe
- **Hauptzweck**: Persönliches Dashboard für ProductHunt — Velocity-basiertes Ranking, Topic-Filter, Watchlist, Snapshots für Trend-Daten, Claude-Anreicherung. Details: siehe `plan.md` §1.
- **Zielgruppe**: Single-User (Filip Brocke). Keine Endnutzer-Daten, kein kommerzieller Einsatz (PH-API ist non-commercial by default).
- **Stakeholder**: Filip Brocke. Torsten ggf. später als Read-Only-User (siehe `plan.md` §10).

---

## 💻 Stack & Technologie
*Abweichungen vom Koerting-Default sind im Plan begründet — Kurzform hier.*

- **Sprache / Framework**: Next.js **16** (App Router) + TypeScript + Tailwind CSS **v4** + shadcn/ui + React 19
- **Persistenz**: **SQLite + Drizzle ORM** (statt Supabase) — single-user, lokal, kein DB-Server nötig. Migration zu Postgres/Supabase möglich, wenn Multi-User oder Netlify-Deployment relevant wird.
- **GraphQL-Client**: `graphql-request` (leichtgewichtig, kein Apollo-Overkill)
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`), Modell **Claude Sonnet 4.6** (`claude-sonnet-4-6`) — Plan nennt 4.5, wir nutzen die aktuelle Version.
- **Cron**: `node-cron` in `instrumentation.ts` (Single-Process, kein externer Scheduler)
- **Auth**: HTTP Basic Auth via Next.js Middleware (statt Supabase Auth) — reicht für Single-User
- **Hosting**: **VPS bevorzugt** (SQLite + Cron laufen direkt). Netlify nur, falls Migration auf Postgres + externer Scheduler akzeptabel.
- **Module-System**: ES Modules (`import/export`)
- **Package Manager**: `npm`
- **Linter/Formatter**: ESLint (Next.js Default) + Prettier

---

## 📋 Linear
- **Workspace/Team**: Koerting Institute
- **Projekt**: Eigenes Linear-Projekt "ProductHunt Radar"
- **Issues**: Phasen 0–9 aus `plan.md` werden als einzelne Issues angelegt, jedes mit "Done wenn"-Kriterium als Beschreibung. Bei Bugs/kleineren Tasks während einer Phase: zusätzliche Sub-Issues.

---

## 🏗️ Architektur & Patterns
- **Verzeichnisstruktur**: siehe `plan.md` §7
- **API-Token nur server-side** — niemals an Client Components durchreichen. Server Actions oder Route Handlers für alle PH-/Anthropic-Calls.
- **Rate-Limit-Aware**: Vor jedem PH-GraphQL-Call die `X-Rate-Limit-Remaining`-Header beobachten. Bei <50 defensiv werden, bei 0 mit klarer Fehlermeldung abbrechen.
- **AI-Caching ist Pflicht**: Pro Post-Summary nur einmal Tokens fließen lassen → in DB-Tabelle `ai_summaries` cachen.
- **Snapshots append-only**: Niemals überschreiben, jeder Snapshot ist eine neue Zeile.
- **Cron-Singleton-Guard**: Bei `instrumentation.ts`-Setup globales Flag (`globalThis.__cronStarted`) prüfen, sonst läuft Cron im Dev-Modus mehrfach.

---

## 👥 Mitwirkende
- Nur Filip. Keine PR-Reviews nötig, direkte Commits auf `main` okay für MVP-Phase.

---

## 🔒 Compliance
- Persönliches Tool, keine Endnutzer-Daten, keine personenbezogenen Daten von Dritten in der DB (außer öffentlichen PH-Maker-Namen, die ohnehin auf producthunt.com stehen).
- Anthropic API (US) ist akzeptabel, da kein kommerzieller Einsatz und keine sensiblen Daten verarbeitet werden.
- Falls das Projekt später für andere zugänglich gemacht wird (Torsten o.a.): Compliance-Frage neu prüfen.

---

## 📁 Projektspezifische Konventionen
- **Tests**: Keine automatisierten Tests. Pro Phase manuell verifizieren gemäß "Done wenn"-Kriterium aus `plan.md`. Falls eine spezielle Logik (z.B. Velocity-Score) später unsicher wird, gezielt Tests nachziehen.
- **Code-Kommentare**: Englisch (global), 2 Spaces Einrückung.
- **Commit-Messages**: Deutsch, kurz, beschreibend. Vorschlag pro Phase: `phase X: <kurzbeschreibung>`.
- **Phasen-Workflow**: Nach Abschluss jeder Phase aus `plan.md` kurzer Funktions-Check + Commit + Push, dann nächste Phase. Bei Stop-Punkten (z.B. Token-Eintrag in `.env.local`) explizit pausieren.
