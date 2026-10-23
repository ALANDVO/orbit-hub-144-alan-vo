# Changelog

## 1.0.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of Orbit Hub
- Design system extraction from React/TypeScript codebases
- RTL-aware design audit with 6-dimension scoring (24 points)
- Craft floor quality gate with absolute bans (layout thrash, raw CSS injection, physical props on RTL)
- OIDC authentication via Keycloak with PKCE, HttpOnly cookies, CSRF protection
- Role-based access control (viewer, operator, admin)
- Demo mode (localhost-bound, explicitly labeled)
- Docker Compose with PostgreSQL, Keycloak, backend, frontend
- GitHub Actions CI with backend/frontend tests, Docker builds, integration tests
- Deterministic offline core — no LLM required
- Optional LLM explanations (advisory, provider-agnostic)

### Security
- JWT tokens in HttpOnly SameSite cookies
- CSRF protection on all mutating endpoints
- No credentials in localStorage
- Demo mode refuses to start in production
- Secrets only in .env (gitignored)

## [Unreleased]

### Planned
- Visual regression testing integration
- CSS-in-JS runtime analysis
- Custom craft floor rules via UI
- SAML IdP broker documentation
- Performance benchmarking suite