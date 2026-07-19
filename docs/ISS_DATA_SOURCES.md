# ISS Tracker Data Sources (Phase 13)

Verification date: **2026-07-18**. All licenses, endpoints, CORS headers, download URLs and orbital-element epochs below were verified on this date against official pages and/or live HTTP requests (noted per item). Anything that could not be verified from an official source is explicitly flagged. Same rigor and honesty bar as `docs/DATA_SOURCES.md` (Earth) and `docs/SUN_DATA_SOURCES.md`: real data, real physics, honest claims, everything free and legally usable for an MIT open-source app, every source + license logged.

> **Date note.** The phase brief states "Today is 2026-07-18." The live CelesTrak responses carried `Date:` headers of `2026-07-19 04:0x UTC` at fetch time (US-evening-of-the-18th = early-19th UTC), and the fetched ISS element set has epoch `2026-07-18T20:42:50Z`. The honest verification date is **2026-07-18** (the calendar day the brief and the data epoch share); CORS checks physically executed just after the UTC midnight rollover, so a few header timestamps read `2026-07-19`. Both are recorded truthfully below.

> **What this tab does.** The ISS Tracker shows where the International Space Station is **right now**: it takes a real Two-Line Element set (TLE) — the ISS's current orbital elements — and propagates it with **SGP4** in the browser (the SGP4 library lives in `lib/`, owned by another agent) to produce a live sub-satellite point, ground track, and pass predictions for the user's location. This document covers only the **data** side: where the TLE comes from, its license, its freshness, and how it reaches the app.

## Summary table

| Source | Data used | License | Attribution required | CORS (client-fetch?) | Verified against (2026-07-18) |
|---|---|---|---|---|---|
| **CelesTrak GP** | ISS + stations TLE / GP orbital element sets (NORAD 25544 etc.) | Underlying data US Gov **public domain** (17 U.S.C. 105); CelesTrak adds **no** license/attribution fee — binds callers to its **Usage Policy** (rate + caching) | No formal requirement; **courtesy credit** "US Space Force (18 SDS) via CelesTrak" recommended | **Yes — `Access-Control-Allow-Origin: *`** on `gp.php` (GET **and** preflight), verified live | `https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE` + `usage-policy.php` + live headers |
| wheretheiss.at | Live position cross-check (lat/lon/alt/velocity) | No explicit license; free, keyless hobby API | Not stated | **Yes — `Access-Control-Allow-Origin: *`** on `api.wheretheiss.at` | `https://api.wheretheiss.at/v1/satellites/25544` + developer page |
| open-notify | Live position cross-check (lat/lon only) | No explicit license; free, keyless hobby API | Not stated | ACAO `*` **but HTTP-only** → mixed-content blocked from an HTTPS app | `http://api.open-notify.org/iss-now.json` live (HTTPS port 443 refused) |

**Decision in one line:** the ISS TLE is fetched from **CelesTrak** (canonical, free, public-domain, keyless) and **mirrored to a committed file** (`public/data/iss/tle.json`) refreshed **twice daily** by a GitHub Action; the browser reads that one cached copy and SGP4 propagates it. CelesTrak **does** send CORS `*` now (so the app *could* fetch live), but CelesTrak's own usage policy asks large user bases to **cache/proxy rather than have every client query it**, and TLEs must stay **fresh** — so a cron mirror is both the polite and the robust choice. wheretheiss.at is a valid **live cross-check** (CORS `*`, keyless); open-notify is **rejected** for client use (HTTP-only → mixed content on an HTTPS site).

Committed artifact: `public/data/iss/tle.json` (~2.5 KB) — ISS TLE + Hubble/CSS in an `others` array — produced by `scripts/iss/fetch_tle.py`.

---

## 1. CelesTrak GP (General Perturbations orbital element sets) — the TLE source

**Verified against:** `https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE` (and `&FORMAT=JSON`), `https://celestrak.org/usage-policy.php`, `https://celestrak.org/NORAD/documentation/gp-data-formats.php`, plus live requests with an `Origin: https://example.vercel.app` header (GET + preflight OPTIONS) on 2026-07-18.

**What it is.** CelesTrak (maintained by Dr. T.S. Kelso) is the long-standing canonical free distributor of NORAD TLE / GP element sets. The elements themselves originate from the **US Space Force / 18th Space Defense Squadron (18 SDS)**, obtained via **Space-Track**, and redistributed by CelesTrak. As US Government work they are **public domain (17 U.S.C. §105)**.

**Endpoints (verified by real fetches):**
- **TLE (used):** `https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE` → 3-line TLE (name + line 1 + line 2). `Content-Type: text/plain`, `Content-Disposition: filename="25544.txt"`.
- **JSON (cross-check):** same URL with `&FORMAT=JSON` → one object per satellite with a precise `EPOCH` ISO string, `MEAN_MOTION`, `ECCENTRICITY`, `INCLINATION`, etc. Used here only to cross-verify the epoch parsed from the TLE.
- **Query grammar (from `gp-data-formats.php`):** `gp.php?{QUERY}=VALUE[&FORMAT=VALUE]` where `{QUERY}` ∈ `CATNR` (1–9 digit catalog number), `INTDES` (international designator), `GROUP` (e.g. `stations`), `NAME`, `SPECIAL`. `FORMAT` ∈ `TLE`, `2LE`, `JSON`, `JSON-PRETTY`, `CSV`, `XML`, `KVN`. The **stations** group (`gp.php?GROUP=stations&FORMAT=tle`) returns the ISS with other crewed/station objects in one file.
- **ISS identity:** NORAD Catalog Number **25544**, object name **"ISS (ZARYA)"**, international designator **1998-067A**.

**License / attribution.** No copyright, license-fee, or mandatory-attribution clause appears anywhere on CelesTrak's GP pages (checked `usage-policy.php` and `gp-data-formats.php`; zero hits for "copyright/license/attribution/credit"). The data is public-domain US Gov work. There is therefore **no legal attribution requirement**, but a **courtesy credit is appropriate** and included in the app: *"Orbital data: US Space Force (18 SDS) via CelesTrak (celestrak.org)."*

**Usage policy (the binding condition — quoted / paraphrased from `usage-policy.php`, "by Dr. T.S. Kelso, 2026 May 15, updated 2026 May 22"):**
- *"Only download the data you need, when you are going to use it, and only download data once per update. For GP data, updates are once every 2 hours."* The GP-format FAQ reinforces: *"CelesTrak only checks for new GP data once every 2 hours, so there is no need for you to check more often"* — and calls out abusers who *"download the same file every minute of the day (that's 1,440 times or 120× the update rate)."*
- Machine-to-machine software *"should immediately stop querying when it receives any non-HTTP 200 responses"* (301/403/404/50x are signals of a bad/legacy URL or rate limiting; *"repeatedly ignoring them will end up sending your IP address to the firewall"*).
- Organizations behind a shared IP (NAT) are told to *"set up a proxy to cache these queries."* **This is exactly the mirror-to-a-committed-file pattern this project uses.**
- CelesTrak is donation-funded and serves *"hundreds of thousands of unique IP addresses each day."* Respecting the ~2-hour cadence and caching is the whole ask.

Our `scripts/iss/fetch_tle.py` honors this: **one** machine (the Action) makes a handful of requests **twice a day**, pauses ~2 s between them, sends a descriptive `User-Agent`, and **stops on any non-200** (no retry on 4xx). Every app user then reads the committed CDN copy — zero direct browser load on CelesTrak from the default path.

**CORS: verified — CelesTrak DOES send `Access-Control-Allow-Origin: *`.**
- `GET gp.php?CATNR=25544&FORMAT=TLE` with `Origin: https://example.vercel.app` → **HTTP 200**, headers `Server: Microsoft-IIS/10.0`, `X-Powered-By: PHP/8.2.20`, **`Access-Control-Allow-Origin: *`** (no redirect, no proxy — this is CelesTrak's own origin server).
- Preflight `OPTIONS` → **HTTP 204** with **`Access-Control-Allow-Origin: *`** and **`Access-Control-Allow-Methods: GET, HEAD`**.
- ⚠️ **This corrects the project's prior assumption.** Earlier phases assumed "Celestrak does NOT set CORS, which is why we mirror via cron." As of **2026-07-18** that is no longer true — `gp.php` is fully client-fetchable. The mirror is retained on the **stronger** grounds below (etiquette + freshness + resilience), not because CORS forces it.
- No `Cache-Control` header is sent on `gp.php` (verified absent), so the app/CDN must set its own caching for the committed file.

---

## 2. wheretheiss.at — live-position cross-check (optional)

**Verified against:** `https://api.wheretheiss.at/v1/satellites/25544` (live, with `Origin` header) and `https://wheretheiss.at/w/developer` (terms), 2026-07-18.

- **Response:** `{latitude, longitude, altitude(km), velocity(km/h), visibility, footprint, timestamp, solar_lat, solar_lon, units}` — a real **instantaneous position + velocity** for the ISS. Position-only: **no pass prediction** (that's the SGP4 path's job).
- **Keyless:** confirmed — the developer page notes *"some endpoints likely will allow for authentication in the future. In the meantime, please note the rate limits below."* No key today.
- **Rate limit:** *"requests are limited to roughly 1 per second"* (developer page); usage visible via `X-Rate-Limit` response headers.
- **License:** none stated (free hobby API). Treat as best-effort; do not vendor its output as authoritative.
- **CORS: verified `Access-Control-Allow-Origin: *`** on `api.wheretheiss.at` (HTTP 200, valid TLS). Directly client-fetchable.
- ⚠️ **Flag:** the **website** host `wheretheiss.at` (the human developer/terms page) currently serves an **expired TLS certificate** (`certificate has expired`, observed 2026-07-18). The **API** host `api.wheretheiss.at` has a valid cert and works fine — but the operator's cert hygiene is a reliability signal. Use only as a secondary "live now" cross-check, never as the primary source.

**Use in the app:** a truthful "live now (cross-check)" readout, clearly labeled as coming from wheretheiss.at and distinct from the SGP4-propagated primary position. If it disagrees with SGP4 by more than a few km, that's a signal the committed TLE has aged — surface the TLE epoch, don't silently trust either.

## 3. open-notify — REJECTED for client use

**Verified against:** `http://api.open-notify.org/iss-now.json` (live) and an HTTPS probe on 2026-07-18.

- Returns `{iss_position:{latitude, longitude}, message, timestamp}` — lat/lon only, keyless, and it did send `Access-Control-Allow-Origin: *` over HTTP.
- ⚠️ **Blocker:** the service is **HTTP-only** — a request to `https://api.open-notify.org` **fails to connect on port 443** (verified: connection refused after timeout). An HTTPS-hosted app (Vercel is HTTPS) **cannot** fetch `http://` content: browsers block it as **mixed content**. So open-notify is unusable from the deployed app regardless of its CORS header.
- **Decision: REJECTED** for the shipped app. wheretheiss.at covers the same "live now" cross-check need over HTTPS with a valid API cert.

---

## Live-vs-committed decision (honest rationale)

**Primary path = committed mirror + client-side SGP4.** `scripts/iss/fetch_tle.py` (GitHub Actions, twice daily) writes `public/data/iss/tle.json`; the browser fetches that one file and SGP4 propagates `tle.line1`/`tle.line2`. Reasons, in order of weight:

1. **CelesTrak's usage policy explicitly wants caching.** A public web app can have many simultaneous users; CelesTrak asks exactly this class of caller to *"set up a proxy to cache these queries"* and to fetch *"once per update"* (GP updates every ~2 h). One cron mirror read by all users is the polite, policy-compliant design. Having thousands of browsers hit `gp.php` directly — even though CORS now allows it — is precisely what the policy discourages.
2. **Freshness with a bounded, known age.** TLEs decay in accuracy (see below). A twice-daily refresh keeps the committed element set at most ~12 h old between runs, and the file records its `epoch` and `fetched_at` so the UI can show the exact age.
3. **Resilience / first paint / offline.** The committed file gives an instant first render and a fallback if CelesTrak is briefly unavailable (it had an 18 SDS/Space-Track data outage in Aug 2025, per its own site) — no runtime dependency on a third party for the default view.

**CORS is *not* the reason to commit** (that was the old, now-outdated assumption). Because `gp.php` sends CORS `*`, the app **may optionally** live-refresh the TLE directly from CelesTrak (e.g. a "refresh to latest" button, at most once per 2 h per the policy) on top of the committed baseline. wheretheiss.at (CORS `*`, keyless) is the separate live-position cross-check.

## TLE-age accuracy note (must surface in the UI)

SGP4 is only as accurate as the TLE's epoch:
- **Near epoch:** a fresh TLE propagated by SGP4 is typically good to **~1 km**.
- **Degradation:** error grows roughly **1–3 km/day** as the true orbit diverges from the mean elements (atmospheric drag on the ISS at ~420 km, plus periodic reboosts, are the main drivers). The ISS is a low, draggy object, so it's on the faster end.
- **A week-old TLE can be off by tens of km** (and pass timing off by seconds-to-minutes, which matters for "look up now" pass alerts).
- **Consequence for the tab:** always display the **TLE epoch and its age** ("elements from 2026-07-18 20:42 UTC, X h old"). Refresh twice daily. If a live cross-check (wheretheiss.at) diverges materially from the SGP4 position, that's the age showing — prompt a refresh rather than hiding it. This is the honest-claims rule applied to orbital data.

---

## The snapshot fetched this session (2026-07-18)

`scripts/iss/fetch_tle.py` fetched, checksum-validated (TLE mod-10), and wrote `public/data/iss/tle.json` (2,564 bytes):

**ISS (ZARYA), NORAD 25544 — epoch `2026-07-18T20:42:50Z`** (from TLE day-of-year `26199.86307315`; cross-checked against `FORMAT=JSON` `EPOCH = 2026-07-18T20:42:49.520160`):
```
ISS (ZARYA)
1 25544U 98067A   26199.86307315  .00004074  00000+0  81939-4 0  9998
2 25544  51.6317 143.3357 0006808 311.9482  48.0925 15.49045026576665
```
Mean motion 15.4905 rev/day → orbital period ≈ **92.96 min**; inclination **51.63°** (the familiar ISS latitude band ±51.6°); eccentricity 0.00068 (near-circular). Fetched ~7–8 h after epoch — fresh.

**Others (`others[]`, optional cross-checks, same shape):**
- **Hubble (HST), NORAD 20580** — epoch `2026-07-18T18:13:37Z`, inclination 28.47°, ~15.31 rev/day.
- **CSS / Tiangong (Tianhe), NORAD 48274** — epoch `2026-07-18T20:50:29Z`, inclination 41.47°, ~15.58 rev/day.

File shape: `{ meta{ source, source_url, catalog_number:25544, name, fetched_at, epoch, tle_line0, underlying_data, license, attribution, usage_policy, cors, is_snapshot, note }, tle{ name, line1, line2 }, others[]{ catalog_number, name, epoch, source_url, tle{...} } }`. Both TLE lines are stored **verbatim** — they are the exact SGP4 input and must not be reformatted.

---

## Rejected / flagged items

- **open-notify — REJECTED (HTTP-only).** `https://api.open-notify.org` refuses port 443; an HTTPS app can't fetch its `http://` endpoint (mixed content). Use wheretheiss.at for the live cross-check.
- **Prior "CelesTrak has no CORS" assumption — CORRECTED.** `gp.php` sends `Access-Control-Allow-Origin: *` on GET and preflight (verified 2026-07-18). The committed mirror stays for usage-policy etiquette + freshness + resilience, not for CORS.
- **wheretheiss.at website TLS cert expired** (host `wheretheiss.at`, observed 2026-07-18). The API host `api.wheretheiss.at` has a valid cert and CORS `*`; still, treat the whole service as best-effort secondary only.
- **Legacy TLE format is being phased out at the catalog-number boundary.** CelesTrak ran out of 5-digit catalog numbers on 2026-07-11; new objects get 6-digit numbers (100000+) and *"GP data will not be available for them using the TLE format"* — they need the CSV/JSON GP formats. **Not a problem for this tab:** ISS (25544), Hubble (20580) and CSS (48274) are all 5-digit and keep working in `FORMAT=TLE`. If we ever track a 6-digit object, switch that fetch to `FORMAT=JSON`/`CSV`.
- **No `Cache-Control` on `gp.php`** (verified absent) — the app/CDN must set caching on the committed file itself.
- **TLE freshness is a correctness issue, not cosmetic** — see the TLE-age note. The UI must show epoch/age; a stale TLE silently produces a wrong "live" position.
- **No API keys anywhere** — CelesTrak, wheretheiss.at, and open-notify are all keyless (project rule satisfied). No secrets are added to the repo or the workflow.

---

**Verification methodology note:** CORS claims come from live requests with a synthetic `Origin: https://example.vercel.app` header (GET **and** preflight OPTIONS for CelesTrak), inspecting `Access-Control-Allow-Origin`. The ISS TLE was fetched via `gp.php?CATNR=25544&FORMAT=TLE`, its epoch parsed from TLE line 1 (`YYDDD.DDDDDDDD`) and cross-checked against the `FORMAT=JSON` `EPOCH` field, and both lines checksum-validated (mod-10). CelesTrak's usage policy and GP-format docs were read from `usage-policy.php` and `gp-data-formats.php`. wheretheiss.at's rate limit + keyless status came from `wheretheiss.at/w/developer`; open-notify's HTTP-only status from a failed HTTPS (port 443) connect. All on 2026-07-18.

---

## Integration log (Phase 13)

Populate at integration time (per the planetary-data-ingestion rule) as the app wires these in. Frontend work (`lib/` SGP4, `app/`, `components/`) is out of scope for this phase.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| ISS live position + ground track | CelesTrak TLE (PD) → client-side SGP4 | `public/data/iss/tle.json` (built by `scripts/iss/fetch_tle.py`, GH Actions 2×/day), read by the browser; SGP4 in `lib/` | Show TLE epoch + age. Credit "US Space Force (18 SDS) via CelesTrak". Optional live-refresh from `gp.php` (CORS `*`, ≤1×/2 h). |
| Pass predictions for the user's location | Same TLE + SGP4 | Computed in-browser from `tle.json` + geolocation | Accuracy bounded by TLE age (~1 km near epoch, ~1–3 km/day). |
| "Live now" cross-check readout | wheretheiss.at (keyless, CORS `*`) | Browser-direct `api.wheretheiss.at/v1/satellites/25544` | Labeled as secondary cross-check; ~1 req/s limit; used to flag TLE staleness, not as primary. |
| Other stations overlay (optional) | CelesTrak TLE for HST 20580, CSS 48274 (PD) | `others[]` in `public/data/iss/tle.json` | Same SGP4 path; ISS is the focus. |
