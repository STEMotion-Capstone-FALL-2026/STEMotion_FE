# Phase B motion / chemistry review — 2026-10-11

Local silent review composition: `PhaseBMotionReview`, 1920×1080, 30 fps, exactly 1800 frames / 60 seconds. Previous narrated `PhaseBDemo.mp4` remains intact. No TTS provider request, music, secret change or production deployment is involved.

| Scene | Shared ambient motion | Main-object motion |
|---|---|---|
| 1: orbit / cosmic center | Particle drift 8px/s horizontally + 4px/s vertically; spring glow yoyo; mascot bob 12px / 3.2s | Orbital position changes continuously; existing cosmic camera zoom |
| 2: force / talking right | Same | Arrow scales only along its vector; 46-frame cycle at 30fps (~1.53s). Pulse is emphasis, not a claim that force magnitude changes |
| 3: pendulum / cosmic left | Same | Pendulum angle oscillates; existing camera zoom |
| 4: wave / talking left | Same | Travelling phase `sin(2π(x/λ − f·t))`, f=0.65Hz, λ=160; speed 104 visual units/s. Crest marker remains on the wave. Lens is static but surrounding ambient motion continues |
| 5: water / cosmic right | Same | Existing camera zoom; flask bubbles. Water bond angle remains fixed at 104.5° |
| 6: carbon / talking center | Same | Six electrons on two drawn shell guides, 2–4 occupancy; periods 4.5s and 6s |

No wall clock, random runtime state or CSS animation: all motion derives from Remotion frame/fps. Particle motion and main-object loops continue after entrance animation; no two-second still hold is authored.

Five scene boundaries use `TransitionSeries` with the actual MIT Remocn `pushThrough` presentation: 24-frame / 0.8s overlap at 10–10.8s, 20–20.8s, 30–30.8s, 40–40.8s, 50–50.8s. Outgoing sequences receive 24-frame handles so overlap does not shorten the 60s video. This local composition does not change existing API or narration timing. Upstream source provenance/license is beside the copied transition; zoom=1.16, blur=3.

Reproduce from `STEMotion_RENDER`: `node --import tsx scripts/render-motion-review.ts`. Output: `STEMotion_FE/.local-artifacts/phase-b-review/PhaseBMotionReview.mp4`; evidence: `verification.json`, scene snapshots and transition snapshots in the same ignored directory. Frame comparisons supplement scientific unit tests; differing image hashes alone do not prove physically correct motion.

Chemistry checklist: [CHEMISTRY_ACCURACY.md](CHEMISTRY_ACCURACY.md). Unverified CO₂/O₂ and alternative elements/ions are disabled, not silently substituted. Spoken pronunciation requires a later audio pass.

Validation: FE 62 tests passed and production build passed; BE registry contract 4/4 tests passed; worker build and 7/7 tests passed. Chromium snapshots passed for all six layouts (covering all nine subject assets) plus 15 frames around the five transitions. All six main-region crops changed across sampled gaps up to 1.43s. FFprobe verified 60.000000s, 1080p, 1800 frames and no audio stream. All feature commits remain local pending demo approval.
