# Documentation

Deep-dive docs for the **implemented** system. Start with the top-level
[`ARCHITECTURE.md`](../ARCHITECTURE.md) for the whole picture (implemented +
planned + gap analysis + implementation order).

| Doc | Covers |
| --- | --- |
| [ai.md](./ai.md) | AI content engine + cache-first rendering pipeline (`lib/ai/`) |
| [builder.md](./builder.md) | Template / block / theme / industry engine (`lib/builder/`, `components/blocks/`, `themes/`, `industries/`, `templates/`) |
| [seo.md](./seo.md) | Metadata + JSON-LD schema engine, sitemap/robots (`lib/seo/`, `components/seo/`) |
| [api.md](./api.md) | API routes, admin auth, rate limiting, error handling (`app/api/`, `lib/api/`) |
| [testing.md](./testing.md) | Test suite + verification gates (`tests/`, `npm test`) |
| [deployment.md](./deployment.md) | Build/env model today + the planned Deployment module |
| [contributing.md](./contributing.md) | Workflow, conventions, the green-build contract |
| [decision-log.md](./decision-log.md) | Architecture Decision Records (ADRs) |

Canonical project state lives in [`../PROJECT_MANIFEST.md`](../PROJECT_MANIFEST.md);
the roadmap in [`../ROADMAP.md`](../ROADMAP.md); release notes in
[`../CHANGELOG.md`](../CHANGELOG.md); security posture in
[`../SECURITY.md`](../SECURITY.md).
