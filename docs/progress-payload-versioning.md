# Progress and synchronization payload versions

`POST /api/sync` uses `schemaVersion: 1` and a strict, bounded Zod contract. The
server defaults omitted versions to v1 only for already deployed clients. A
future incompatible shape must introduce a new literal version and an explicit
server adapter; it must not reinterpret old fields in place.

Stable client event IDs remain unique per user in PostgreSQL. New fields are
optional during a compatibility window, database migrations are additive, and
the server recalculates lesson outcomes/rewards rather than trusting versioned
client calculations. Once telemetry shows that an older version is no longer in
use, its adapter can be removed in a separately reviewed change.
