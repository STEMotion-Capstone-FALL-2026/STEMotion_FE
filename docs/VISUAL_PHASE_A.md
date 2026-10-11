# Visual Phase A — local foundation, 2026-10-11

Approved design: subject templates × reusable parametric asset packs. The director emits seconds and approved IDs, never SVG/JSX. Original STEMotion prism mascot/palette, no copied artwork. Existing scenes remain atomic building blocks.

## Source and contracts

- `src/remotion/director/registry.json`: canonical registry, general pack `0.1.0`, explicit IDs/subject/tags/propsSchema; two orchestration templates pin `general@0.1.0` and allowed slots/assets. propsSchema is JSON Schema with bounded properties and additionalProperties=false. Background/particles/camera also have metadata under infrastructure; they are template-controlled, not director-selectable. Phase D will export the complete provider-facing Scene Plan schema.
- `assets/general`: sphere/glow, prism mascot, callout, arrow, label, kinetic number; frame-driven space background/seeded particle field/camera. SVG particles are used instead of canvas to avoid frame readiness races; no unseeded randomness or CSS animation clocks.
- `plan.ts`: strict allowlist, slot/prop validation and `scenePlanToSceneData(plan, fps, stableId)`. Seconds become rounded frames only here. IDs are supplied by the caller; saving does not regenerate them. Supported FPS: 30/60.
- Adapter uses existing `ILLUSTRATED_EXPLAINER` and valid legacy props, with an additive `visualPlan`. FullSTEMVideo selects the cinematic renderer when present; old scenes retain their renderer. No public Scene Plan API or AI generation wiring is added in Phase A.
- BE consumes a build-time copy of the same registry and rejects invalid `visualPlan` during scene validation. The render verification script requires exact FE/BE registry equality. Update both copies together; Phase D will expose catalogue APIs and automate distribution in CI.
- Worker already bundles this FE entry and supports `FullSTEMVideo`; no independent worker visual implementation is needed. Demo compositions are local studio entries, not new public worker compositions.

## Run locally

From STEMotion_FE:

```powershell
npx remotion studio src/remotion/index.ts
node scripts/render-phase-a.mjs --video
```

Open PhaseACosmicZoom (30 seconds), PhaseATalkingDiagram (15 seconds), or PhaseADemo (30 seconds combined). Render snapshots/video are in ignored `.local-artifacts/phase-a`; do not commit them. The script checks identical PNG hashes for repeat midpoint renders of both templates. Together these frames cover every registered asset plus background/particles/camera.

The combined demo has no TTS, captions or music. This is a visual render proof, not a full script → review → publish workflow. Do not use its narrated text as proof of scientific correctness.

## BE deployment gate

V14 adds nullable `subject`, `asset_pack`, JSONB `slots` to `remotion_templates`. Existing metadata remains unchanged; old JSON clients can omit new fields. Updating with omitted metadata preserves stored values. Rollback refuses populated metadata until explicitly exported/cleared.

V14 is prepared for local tests only; production is still v13 until explicitly rolled out. Before deployment: take a fresh encrypted backup using `STEMotion_BE/tools/phase1-db`, verify backup integrity, test with target PostgreSQL, apply V14, then activate the BE build. Never push/activate the new Hibernate mapping ahead of the migration. Existing Phase1 backup predates this change and is not a V14 rollout backup.

## Remaining priorities

Continue AI service and render reliability work first. VPS benchmarking, durable storage, callback reliability and narrated end-to-end output are separate. Packs B/C, production plan version migration, AI Director prompting/decision/usage tracking D and full video E remain deferred. Adding pack versions must retain old implementations or add an explicit migration; changing existing IDs in-place is not permitted.

## Verified results

- FE: 53 tests passed; production build and final type check passed. Existing bundle-size warning remains.
- BE: 173 tests total, 168 passed, 5 opt-in database tests skipped; no failures/errors.
- PostgreSQL-compatible local migration suite: V10�V14 tests passed, including V14 up/down/reapply and refusal to discard populated metadata. Production PostgreSQL validation is deferred to the rollout gate.
- Both midpoint PNG renders repeated with identical SHA256; frames visually inspected.
- Combined demo rendered successfully: 900 frames / 30 FPS / 1920�1080, H.264, no audio.
- No production DB changes, provider calls, secret rotation or deploy.
