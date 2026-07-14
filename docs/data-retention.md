# Data export, deletion, and retention

- Account/profile and learning data remain until the user deletes the learning
  history or account, subject to legal retention duties.
- Export returns account metadata and user-owned learning tables as versioned
  JSON. Provider credentials, cookies, session tokens, and rate-limit keys are
  never exported.
- Learning-history deletion requires the current password and exact destructive
  confirmation. Account deletion additionally requires the server-only Supabase
  service-role key and deletes the Auth user so foreign-key cascades can run.
- Other sessions can be revoked without exposing their refresh/access tokens.
- Rate-limit rows are operational data and should be pruned after 48 hours by an
  owner-approved scheduled database job.
- Anonymous telemetry retention still requires an owner decision. Until a
  production policy is approved, do not represent telemetry as automatically
  erased on a fixed schedule.
- Managed database/hosting backups can retain deleted data for the provider's
  documented backup window. Restoration procedures must reapply deletion
  requests where legally required.
