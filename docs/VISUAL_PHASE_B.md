# Phase B — local subject packs and narrated showcase

Date: 2026-10-11. Local only; no push, DB migration or production rollout.

## Architecture and assets

Extends Phase A registry and Scene Plan adapter. Physics pack: ForceVector,
OrbitPath, Pendulum, Lens, Wave. Chemistry pack: Atom, Molecule, Flask,
ElementTile. Each registry entry has id, subject, tags and bounded propsSchema;
counts are integers, unknown assets/props/layouts are rejected in FE and BE.
Asset components have no embedded Vietnamese copy: text is supplied by the plan.
Models are educational illustrations, not numerical scientific simulations.
The atom narration explicitly states that drawn orbits are illustrative.

Both CosmicZoom and TalkingDiagram support center/left/right. The manual six-scene
plan uses each template/variant once, with different title, subject, mascot and
callout placement. Existing SceneData/API remains compatible; layout_variant is
optional. Director integration remains deferred.

## Audio and timing

FPT key was initially unauthorized (401). User replaced it; one real MP3 was
created, then FPT returned `API rate limit exceeded for 'free'` (429), including
bounded backoff retries. User approved **edge-tts for the local demo**. The demo
uses edge-tts 7.2.8, vi-VN-HoaiMyNeural, rate -10%. This is a community client for
Edge's online speech service, not an Azure production API/SLA. It is explicitly
selected with --edge; no automatic fallback disguises the provider.

Every narration is synthesized from Scene Plan text, decoded with ffprobe, and
cached by text/provider/voice/rate fingerprint. Raw total: 60.384s. The 1800-frame
budget is allocated proportionally to those measured durations using largest
remainders. Bounded ffmpeg atempo normalizes each audio to its assigned duration
(approximately 0.6% speed change), writes 48kHz PCM WAV and remeasures it. Only
then are duration_sec and durationInFrames set through the adapter. No word-count
estimate or six fixed ten-second durations is used for the delivered video.
The default Studio preview uses editorial timings until audio is supplied.

Background music: SpacyLoop by ElectronicFreaker, CC0. Attribution/source is in
public/music/LICENSE.md. Music loops at 0.035 volume beneath narration, rises to
0.11 with a short ramp for unnarrated scenes. Narration volume stays unchanged.
Music is a showcase overlay, not automatically enabled on every production clip.

## Reproduce

From STEMotion_RENDER (Python 3.12+, Node and FE dependencies installed):

```powershell
python -m pip install --target .local-tools/edge-tts -r scripts/demo-requirements.txt
node --import tsx scripts/render-phase-b.ts --video --edge
```

Without --edge, --video explicitly uses FPT key from worker .env. Run with no
flags for asset/layout render tests. --preview creates a music-only visual
preview with editorial timing, never the narrated acceptance artifact.
Local tools and generated audio/MP4 are ignored. Secrets never enter the manifest.

Artifacts: `.local-artifacts/phase-b/PhaseBDemo.mp4`, timing.json, render-tests.json,
nine asset snapshots and six layout snapshots. Each asset is rendered twice in
Chromium and the PNG hashes must match. Registry parity is asserted before any
TTS request. Unit tests check all allowlists, six unique placements and ducking.

## Validation and rollout limits

FE: 56/56 tests pass; TypeScript and Vite build pass.
Worker: 7/7 tests pass outside Windows sandbox, including actual ffmpeg/ffprobe
normalization, bounded 429 retry and synchronization of visualPlan duration with
narration. The same ffmpeg test failed inside the Windows sandbox but passed on the host;
the reported successful run uses host execution.
BE: DirectorPlanValidatorTest 3/3 pass; no new schema migration in Phase B.
FPT worker path now fails the job on synthesis errors, measures audio through
ffprobe, and keeps camera duration synchronized; no silent Google fallback for
explicit FPT mode. Edge remains local demo tooling only.

V14 remains prepared but unapplied. Back up production Supabase before any BE
push/rollout. Cloud profile currently disables Flyway: push alone does not apply
V14; migration must be explicitly planned before deploying the V14 entity.
VPS worker deployment, AI service rollout and AI Director are separate pending
tracks and have not been represented as completed by this showcase.
