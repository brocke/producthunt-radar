# ProductHunt Radar — Plan

> Persönliches Dashboard, um schnell zu sehen, welche Produkte auf
> ProductHunt gerade durch die Decke gehen. Kein generischer
> Reader, sondern auf eigene Signale (Velocity, Topics, Watchlist)
> zugeschnitten — angereichert mit Claude-Zusammenfassungen.

---

## 1. Kontext & Ziele

### Was die App ist
Ein lokales (später deploybares) Dashboard, das die ProductHunt
GraphQL-API anzapft und die spannendsten Launches sichtbar macht —
nicht einfach Top-Upvotes, sondern gewichtet nach **Velocity** und
nach **persönlich relevanten Topics**. Plus: tägliche Snapshots,
damit Trends später sichtbar werden.

### Was die App **nicht** ist
- Kein kommerzielles Produkt (PH-API ist standardmäßig non-commercial)
- Kein Twitter-/Slack-Bot, der automatisch postet
- Keine vollständige Reimplementierung der PH-Website

### Erfolgskriterien (Definition of Done für den MVP)
- [ ] App läuft lokal, zeigt den heutigen + gestrigen Feed
- [ ] Custom Velocity-Score sortiert Posts sinnvoll
- [ ] Filter nach Topics funktioniert
- [ ] Detail-View mit Claude-Zusammenfassung der Kommentare
- [ ] Watchlist (Produkte markieren und wiederfinden)
- [ ] Tägliche Snapshots werden automatisch in DB geschrieben
- [ ] Daily Digest als Markdown-Export
- [ ] HTTP Basic Auth, falls deploybar gemacht

---

## 2. Tech-Stack & Begründung

| Bereich | Wahl | Warum |
|---|---|---|
| Framework | **Next.js 15 (App Router)** + TypeScript | Server Components → API-Token bleibt server-side; gleichzeitig modernes UI; Claude Code kann sehr gut damit umgehen |
| Styling | **Tailwind CSS + shadcn/ui** | Schnell zu sauberem UI; passt zum Designer-Background; alle Komponenten sind eigener Code, voll anpassbar |
| State (Client) | Server Components + minimaler Client State (useState) | Erst wenn nötig: TanStack Query. Nicht overengineeren |
| Persistenz | **SQLite + Drizzle ORM** | File-basiert, kein DB-Server, perfekt für lokal/single-user. Migration zu Postgres/Supabase später möglich, wenn Netlify-Deployment konkret wird |
| GraphQL-Client | `graphql-request` (leichtgewichtig) | Kein Apollo-Overkill für 5–10 Queries |
| AI-Anreicherung | Anthropic SDK (`@anthropic-ai/sdk`), Claude Sonnet 4.5 | Eigene Zusammenfassungen von Posts & Kommentaren |
| Cron / Snapshots | **`node-cron`** im Next-Server (instrumentation.ts) | Single-Process reicht; kein externer Scheduler nötig |
| Auth | **HTTP Basic Auth** via Next.js Middleware | ~20 Zeilen Code, kein Login-UI, Browser-Pop-up. Reicht für Single-User-Setup |
| Deployment | **VPS** bevorzugt (SQLite + Cron laufen so wie sie sind) — Netlify möglich, dann aber DB-Wechsel | s.o. |

---

## 3. ProductHunt API — was du wissen musst

### Endpoint
`POST https://api.producthunt.com/v2/api/graphql`

### Auth
- Header: `Authorization: Bearer {DEVELOPER_TOKEN}`
- Token holen: ProductHunt → API Dashboard → neue Application →
  unten auf der App-Seite "Generate Token" für **Developer Token**
- `redirect_uri` beim Anlegen: `https://localhost:8424/callback`
  (wird nicht benutzt, aber Pflichtfeld)

### Rate Limit
- Complexity-based, **900 pro 15-Min-Fenster**
- Response-Header: `X-Rate-Limit-Limit`, `X-Rate-Limit-Remaining`,
  `X-Rate-Limit-Reset`
- → in den API-Client einbauen: Limits loggen, bei <50 verbleibend
  defensiv werden, bei 0 mit klarer Fehlermeldung abbrechen

### Sehr wichtig
- **Non-commercial** by default — für persönliche Tools okay, für
  alles kommerzielle vorher `hello@producthunt.com` kontaktieren
- Nur die Felder im GraphQL-Query anfordern, die wir wirklich
  anzeigen → schont Complexity-Budget

---

## 4. Features (priorisiert)

### MVP (Phase 1–3)
1. **Today Feed**: Heutige + gestrige Posts, default nach Velocity sortiert
2. **Topic-Filter**: Multiselect (AI, Productivity, Developer Tools, …)
3. **Detail-View**: Tagline, Beschreibung, Maker, Top-Kommentare

### V1 (Phase 4–6)
4. **Custom Scoring (Velocity)**: Upvotes pro Stunde seit Launch
5. **Watchlist**: Stern-Button → in DB, eigene Seite zum Wiederfinden
6. **Snapshots**: Regelmäßig automatisch Top-Posts in DB schreiben
   (auch ohne Visualisierung jetzt schon — Daten sammeln!)

### V2 (Phase 7–9)
7. **Claude-Anreicherung**: Pro Post eine
   "Was-ist-das-und-warum-ist-es-spannend"-Zusammenfassung
8. **Daily Digest**: Markdown-Export der Top 10 von gestern, mit AI-Summaries
9. **Basic Auth**: Middleware-basierter Schutz für Deployment

### Später / Optional
- Trend-Charts auf Basis der gesammelten Snapshots
- Sleeper-Hit-Erkennung (Posts, die nach Launch noch weiter wachsen)
- Slack/Email-Versand des Digests
- Migration auf Postgres/Supabase, falls Netlify-Deployment kommt

---

## 5. Phasenplan

### Phase 0 — Setup (30 Min)
- `npx create-next-app@latest producthunt-radar --typescript --tailwind --app`
- shadcn/ui initialisieren (`npx shadcn@latest init`)
- `.env.local` mit `PH_TOKEN=...` und `ANTHROPIC_API_KEY=...`
- `.gitignore` checken — `.env.local` und `*.db` müssen drin sein
- Drizzle + `better-sqlite3` installieren, leeres `db/schema.ts` anlegen

**Done wenn:** `npm run dev` zeigt eine leere Next-Page

### Phase 1 — API-Client (1 Std)
- `lib/ph/client.ts`: GraphQL-Wrapper mit `graphql-request`
- `lib/ph/queries.ts`: typisierte Queries für `posts` (siehe §6)
- Rate-Limit-Header auslesen und in einem kleinen Logger ausgeben
- **Smoke-Test**: Server Action `getTodayPosts()` → console.log

**Done wenn:** Im Terminal stehen 20 echte Posts mit Name/Votes

### Phase 2 — Today Feed UI (1–2 Std)
- Route `/` → Server Component, ruft `getTodayPosts()`
- shadcn/ui `Card` pro Post: Thumbnail, Name, Tagline, Votes, Topics
- Loading-State, leerer State, Fehler-State
- Default-Sortierung: Votes (Velocity kommt in Phase 4)

**Done wenn:** Du siehst auf `/` einen sauberen, scrollbaren Feed

### Phase 3 — Detail-View (1 Std)
- Route `/post/[slug]` → Server Component
- Volle Beschreibung, Maker-Info, **Top 10 Kommentare** (`get_post_comments`)
- Link zurück zum Feed; externer Link zu ProductHunt

**Done wenn:** Klick auf Card öffnet Detail-Seite mit allen Infos

### Phase 4 — Velocity-Score + Filter (2 Std)
- `lib/scoring.ts`: `velocity(post)` = `votes / max(hours_since_launch, 1)`
  mit leichter Dämpfung (z.B. `votes / Math.pow(hours, 0.8)`) —
  hier ist Raum zum Experimentieren, mach es austauschbar
- Sortier-Dropdown im Feed: Votes / Velocity / Time
- Topic-Multiselect (Popover mit Checkboxes) → URL-State via
  `searchParams`, damit Filter teilbar/refreshbar bleiben

**Done wenn:** Du kannst nach Velocity sortieren und nach AI filtern

### Phase 5 — Watchlist + DB-Setup (1–2 Std)
- Drizzle-Schema: `watchlist { id, ph_post_id, slug, name, added_at, note }`
- Server Action `toggleWatchlist(postId)`
- Stern-Button auf Card (Client Component, optimistic update ok)
- Route `/watchlist` → eigene Liste

**Done wenn:** Stern bleibt erhalten nach Refresh, eigene Seite zeigt alles

### Phase 6 — Snapshots (1–2 Std) **NEU**
- Drizzle-Schema erweitern:
  ```
  snapshots {
    id, ph_post_id, slug, name, tagline,
    votes_count, comments_count, topics (JSON),
    snapshot_at, posted_at, thumbnail_url
  }
  ```
- `lib/snapshots/take.ts`: holt aktuelle Top 50 (heutige + gestrige) →
  schreibt einen Snapshot-Datensatz pro Post in DB
- **Cron-Setup** via `instrumentation.ts` (Next.js Hook):
  - Bei App-Start `node-cron` registrieren
  - Cron-Pattern: `0 */6 * * *` (alle 6 Stunden) für den Anfang
  - Beim ersten Lauf nach App-Start einmal triggern, damit auch im
    Dev-Modus Daten reinkommen
- Logging: jeder Snapshot-Run schreibt `[snapshot] OK / N Posts, Y Sek`
- **Wichtig:** Visualisierung gibt's jetzt noch nicht — wir sammeln
  nur. Daten sind gold

**Done wenn:** Nach 12 Stunden Laufzeit stehen mehrere Snapshot-Zeilen
pro Post in der DB

### Phase 7 — Claude-Anreicherung (1–2 Std)
- `lib/ai/summarize.ts`: Anthropic SDK, Sonnet 4.5
- Prompt: "Gib mir in 3 Sätzen, was dieses Produkt macht und warum
  es für jemanden interessant sein könnte, der KI-Tools für
  Workshops einsetzt. Dann: 1 Satz Tonalitäts-Read der Kommentare."
- Button "Zusammenfassen" auf Detail-Seite → Server Action →
  Ergebnis cachen (in DB-Tabelle `ai_summaries`, damit nicht jedes
  Mal Tokens fließen)

**Done wenn:** Knopfdruck → 5 Sekunden später steht eine sinnvolle
Zusammenfassung da

### Phase 8 — Daily Digest (1 Std)
- Server Action `generateDigest()`:
  - Hol gestrige Top 10 by Velocity
  - Pro Post: AI-Summary (aus Cache oder frisch)
  - Render als Markdown-String
- Route `/digest` mit Copy-Button + Download-as-File
- Optional: Cron-Job um 09:00, der den Digest in `digests/YYYY-MM-DD.md`
  ablegt

**Done wenn:** Du kannst dir mit einem Klick deinen morgendlichen
Digest holen

### Phase 9 — HTTP Basic Auth (30 Min) **NEU**
- `middleware.ts` im Root: prüft `Authorization`-Header
- Credentials aus `.env.local`: `AUTH_USER`, `AUTH_PASS`
- Bei Fehlfunktion: `401` mit `WWW-Authenticate: Basic` → Browser-Popup
- Pfad-Whitelist: `/api/cron` (falls externer Trigger nötig) bekommt
  eigenen Token via Header, nicht Basic Auth
- Lokal kann man Auth über env-Flag `DISABLE_AUTH=true` deaktivieren

**Done wenn:** Beim Aufruf der App kommt erst ein Browser-Pop-up,
nach erfolgreicher Eingabe normaler Zugriff. Auf einem zweiten Gerät
muss man sich erneut authentifizieren.

---

## 6. GraphQL-Cheatsheet (Startpunkt-Queries)

### Heutige Top-Posts (max 20)
```graphql
query TodayPosts($postedAfter: DateTime!) {
  posts(first: 20, order: VOTES, postedAfter: $postedAfter) {
    edges {
      node {
        id
        slug
        name
        tagline
        votesCount
        commentsCount
        createdAt
        featuredAt
        thumbnail { url }
        topics(first: 5) {
          edges { node { id name slug } }
        }
      }
    }
  }
}
```

### Post-Details + Top-Kommentare
```graphql
query PostDetails($slug: String!) {
  post(slug: $slug) {
    id
    name
    tagline
    description
    votesCount
    website
    url
    makers { id name username }
    comments(first: 10, order: VOTES_COUNT) {
      edges {
        node {
          id
          body
          votesCount
          createdAt
          user { name username }
        }
      }
    }
  }
}
```

### Topics suchen (für Filter-UI)
```graphql
query SearchTopics($query: String!) {
  topics(first: 20, query: $query) {
    edges { node { id name slug followersCount } }
  }
}
```

**Tipp:** Mit dem GraphiQL-Explorer von PH kannst du Queries vorab
testen, bevor du sie in den Code übernimmst.

---

## 7. Verzeichnisstruktur (Vorschlag)

```
producthunt-radar/
├── app/
│   ├── page.tsx                    # Today Feed
│   ├── post/[slug]/page.tsx        # Detail-View
│   ├── watchlist/page.tsx          # Gemerkte Produkte
│   └── digest/page.tsx             # Daily Digest
├── components/
│   ├── ui/                         # shadcn/ui
│   ├── post-card.tsx
│   ├── topic-filter.tsx
│   └── watchlist-button.tsx
├── lib/
│   ├── ph/
│   │   ├── client.ts               # GraphQL-Client + Auth
│   │   ├── queries.ts              # GraphQL-Queries als Strings
│   │   └── types.ts                # TypeScript-Types
│   ├── ai/
│   │   └── summarize.ts            # Claude-Aufruf
│   ├── snapshots/
│   │   ├── take.ts                 # Snapshot-Logik
│   │   └── cron.ts                 # node-cron Setup
│   ├── scoring.ts                  # Velocity-Berechnung
│   └── db.ts                       # Drizzle-Setup
├── db/
│   ├── schema.ts                   # watchlist, snapshots, ai_summaries
│   ├── migrations/
│   └── data.db                     # SQLite-File (in .gitignore!)
├── middleware.ts                   # HTTP Basic Auth
├── instrumentation.ts              # Cron-Registrierung beim Start
├── .env.local                      # PH_TOKEN, ANTHROPIC_API_KEY, AUTH_USER, AUTH_PASS
└── plan.md                         # dieses Dokument
```

---

## 8. Gotchas & Hinweise an Claude Code

- **Sicherheit:** API-Token nur in Server Components / Server Actions
  verwenden. Niemals an Client Components durchreichen. Wenn du
  unsicher bist, ob ein Code-Pfad client- oder server-seitig läuft,
  frag mich.
- **Rate Limit:** Vor jedem GraphQL-Call prüfen, ob noch genug
  Budget da ist. Bei Phase 6 (Snapshots, alle 6h) ist das besonders
  wichtig — der Job darf das Budget nicht für die Live-Nutzung wegfressen.
- **GraphQL-Komplexität:** Lieber 2 kleine Queries als 1 verschachtelte
  fette. Felder nur dann anfragen, wenn sie auch angezeigt werden.
- **Caching:** Server Components mit `revalidate: 600` (10 Min)
  für den Feed reicht völlig. Detail-Seite kann länger cachen.
- **AI-Kosten:** Pro Summary ~1k Input + 200 Output Tokens →
  mit Sonnet 4.5 etwa 0,5 Cent pro Post. Caching in DB ist Pflicht.
- **Snapshots:** Niemals Snapshots überschreiben, immer als neue
  Zeile schreiben. Auch wenn das Tabelle wachsen lässt — bei 50 Posts
  × 4 Snapshots/Tag = 200 Zeilen/Tag, das ist nichts.
- **Cron im Dev-Modus:** Next.js startet Module manchmal mehrfach.
  Cron-Registrierung darf nur einmal passieren → in
  `instrumentation.ts` mit globalem Flag absichern (`globalThis.__cronStarted`).
- **Designer-Brille:** Saubere Spacing-Grid, klare Hierarchie (Name
  groß, Tagline mittel, Meta klein), keine Emoji-Overload. Inspiration:
  Linear, Vercel-Dashboard.

---

## 9. Erste Schritte für dich (nicht für Claude Code)

1. ProductHunt-Account → API Dashboard → App anlegen → Developer Token kopieren
2. Anthropic Console → API Key kopieren (für Phase 7)
3. In Claude Code: neues Verzeichnis öffnen, diese `plan.md` reinlegen
4. Claude Code starten mit: *"Lies plan.md und führe Phase 0 aus.
   Stoppe danach, damit ich den Token einsetzen kann."*
5. Token in `.env.local` eintragen, dann: *"Weiter mit Phase 1."*
6. Nach jeder Phase: kurzer Funktions-Check, dann nächste Phase

---

## 10. Offene Punkte / spätere Entscheidungen

- **Deployment-Ziel** noch offen: VPS (einfach, SQLite + Cron bleiben)
  oder Netlify (dann Migration auf Postgres/Supabase nötig)
- **Trend-Visualisierung** auf Basis der Snapshots — erst sinnvoll
  nach 2–4 Wochen Datensammlung
- **Multi-User**: Falls du irgendwann Torsten o.a. Zugriff geben
  willst → Wechsel Basic Auth → Supabase Auth (oder Clerk)
