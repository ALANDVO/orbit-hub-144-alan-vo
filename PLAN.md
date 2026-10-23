# Product development plan

Each round completes one feature or repair. Future items are planned, not implemented claims.

## Current round

project-skeleton

## Roadmap

### project-skeleton — Project skeleton with FastAPI backend and React frontend

Status: in_progress

Acceptance:
- backend/app/main.py exports FastAPI app
- frontend/package.json with React + TypeScript + Vite
- Dockerfiles for backend and frontend
- compose.yaml with Keycloak and volumes
- CI workflow running pytest and npm build/test
- README with install/run/test steps
- portfolio.json with schema_version 1

### design-system-engine — Design system extraction engine (core AI/ML feature)

Status: planned

Acceptance:
- Analyzes React/TypeScript codebase for design tokens
- Extracts type scale, color palette, spacing, component patterns
- Generates DESIGN.md with 8-section format
- Works offline without LLM key

### audit-workflow — Design audit workflow with RTL detection

Status: planned

Acceptance:
- Flags physical CSS properties on RTL pages
- Reports margin/padding/border/text-align/float issues
- Scoring with internationalization dimension

### craft-floor-workflow — Craft floor quality gate before UI edits

Status: planned

Acceptance:
- Loads quality rules before UI modifications
- Enforces absolute bans (no layout thrash, no raw CSS injection)
- Integrates with editor workflow

### auth-oidc — OIDC authentication with Keycloak

Status: planned

Acceptance:
- Authorization code flow with PKCE
- HttpOnly SameSite cookies + CSRF protection
- Viewer/Operator/Admin roles
- Demo mode explicitly labeled and localhost-bound

