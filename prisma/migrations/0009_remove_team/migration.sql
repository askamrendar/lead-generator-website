-- Phase 9.1 — Single-user product direction. Remove the Team collaboration system.
-- Drops Team, TeamMembership, TeamInvitation and the now-unused InvitationStatus enum.
-- Organization, Workspace, Membership, and the access layer are intentionally KEPT.

DROP TABLE IF EXISTS "TeamMembership";
DROP TABLE IF EXISTS "TeamInvitation";
DROP TABLE IF EXISTS "Team";

DROP TYPE IF EXISTS "InvitationStatus";
