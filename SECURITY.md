# Security Policy

## Reporting a vulnerability

If you find a security issue, please report it **privately** rather than opening
a public issue:

- Open a [private security advisory](https://github.com/Hotragn/H.O.T-EARTH/security/advisories/new)
  on this repository (preferred), or
- Contact the repository owner, [@Hotragn](https://github.com/Hotragn), through
  their GitHub profile.

Please include enough detail to reproduce the issue (affected file or endpoint,
steps, and impact). You'll get an acknowledgment as soon as the maintainer sees
it; this is a solo, volunteer-maintained project, so please allow reasonable
time for a response before any public disclosure.

## No secrets by design

H.O.T Earth is **keyless on purpose**. There are no API keys, tokens, or
credentials in the codebase, in CI, or required to run it:

- Every data source (NASA GIBS, Open-Meteo, NOAA GFS via NODD/S3, Natural Earth)
  is free and needs no authentication.
- There is no `.env` file, no server secrets, and no user accounts or auth flow.
- The app runs entirely as a static Next.js frontend plus thin, unauthenticated
  caching proxies. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Because of this, the realistic security surface is narrow. The kinds of issues
that are still in scope and worth reporting include:

- A caching proxy route (e.g. `/api/gibs/[layer]`) that could be abused as an
  open proxy or SSRF vector.
- A dependency with a known, exploitable vulnerability that affects the built
  app.
- Any way to make the app render data that misrepresents its source, since
  honesty about data provenance is a core project value.

**Out of scope:** anything requiring a leaked key (there are none), and reports
generated purely by automated scanners with no demonstrated impact.

## Supported versions

This project is pre-1.0 and moves fast. Only the latest commit on the default
branch is supported; fixes land there.
