# CRUM

A clean, append-only CRM for teams who want clarity over noise. Track **people**,
**organizations**, **opportunities** ("what if we sold X to Y?"), and **deals**
through a pipeline — and attach notes and conversations to any of them.

No email ingestion, no auto-enrichment, no background scraping. You capture what
matters by hand, and in exchange every record is real. Everything is stamped with
who added it and when.

## How your data is stored

CRUM is **event-sourced**: instead of overwriting records, it appends one JSON line
per change to a monthly log, and rebuilds the current state by replaying it. That
means clean merges when your team edits at once, a full history for free, and a
dataset any other tool (or your AI) can read.

Files it writes, all under this app's `data/` folder:

- `v0/events/YYYY-MM.jsonl` — the append-only event log (the source of truth).
- `v0/config.json` — your pipeline stages and tag palette.

Because the store is plain JSONL, you can `grep` it, diff it in git, or hand it to
an LLM without CRUM in the loop. The file is the contract.
