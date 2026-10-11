# FE dependency triage — 2026-10-11

Baseline: `main` at `02a06df999f699232f5a17a5755b3797639d690c`. GitHub alert detail pages were read while signed in to the organization repository. Changes below are local only; no push/deployment or production environment change.

## Verdicts

| Alert | Installed / affected / fixed | Severity and attack vector | Exposure and verdict |
| --- | --- | --- | --- |
| [#11](https://github.com/STEMotion-Capstone-FALL-2026/STEMotion_FE/security/dependabot/11), postcss-selector-parser, CVE-2026-104844 / GHSA-rj75-hqrm-r3gf | Vulnerable copies `6.1.4` through Tailwind `3.4.19` and Remotion Tailwind `4.0.526`; css-loader also has patched `7.1.6`. Affected `<7.1.6`; fixed `7.1.6`. | Moderate, CVSS 3.1 **5.9**, network, high attack complexity, no privileges or interaction. Crafted flat CSS selectors cause quadratic synchronous parsing and CPU exhaustion. | **Dismissed** at 22:04 GMT+7 with reason “Vulnerable code is not actually used” and explanatory note. Dev/build dependency processing repository CSS, not user selectors in a request path. Production JS sourcemap has zero parser sources. Upstream explicitly excludes ordinary build-time parsing of trusted sources. No forced major transitive override from 6 to 7. |
| [#13](https://github.com/STEMotion-Capstone-FALL-2026/STEMotion_FE/security/dependabot/13), KaTeX, CVE-2026-103923 / GHSA-238p-pmpm-9mq7 | Installed `0.16.47` from range `^0.16.11`. Affected `>=0.11.0 <0.18.2`; fixed `0.18.2`. | Low, CVSS 4.0 **2.1**, network, low complexity, prerequisite prototype pollution/options-prototype influence, active user interaction for link-based XSS. Inherited settings can enable trusted HTML or external resources. | **Fixed locally** by pinning exact `0.18.2`. Direct runtime dependency present in production bundle; Writer/Reviewer and Remotion previews insert rendered user/AI expressions with `dangerouslySetInnerHTML`. No separate HTML sanitizer. A working prototype-pollution entry point has **not** been demonstrated, but runtime exposure justifies removing the gadget rather than dismissing. GitHub alert remains open pending an authorized push. |

Primary advisories: [PostCSS](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), [KaTeX](https://github.com/advisories/GHSA-238p-pmpm-9mq7).

## Compatibility and related rendering hardening

- Only KaTeX package/version and integrity changed in the lockfile; no broad `npm audit fix` or unrelated dependency upgrades.
- Reviewed upstream [0.17.0](https://github.com/KaTeX/KaTeX/releases/tag/v0.17.0) (internal `__defineFunction` API change) and [0.18.0](https://github.com/KaTeX/KaTeX/releases/tag/v0.18.0) (internal CSS class prefix changes). STEMotion does not use that internal API, custom KaTeX class selectors or a class sanitizer allowlist. It imports the package CSS, which upgrades with the renderer. This is a deliberate pre-1.0 minor transition, not an assumption that all minor versions are compatible. [0.18.2](https://github.com/KaTeX/KaTeX/releases/tag/v0.18.2) is the first patched release; `0.19` was not selected.
- Shared `src/utils/latex.ts` explicitly uses `trust: false`. MathFormulaStep, ChemicalReaction and GeometrySpace now use the same helper as Writer/Reviewer. Related issue found during review: exception fallbacks interpolated raw input into HTML. The shared fallback now escapes HTML before insertion.
- Six regression cases cover existing math/chemistry/geometry formulas, inherited `trust`, external-image commands and escaped fallback text. No claims of browser pixel-perfect visual verification or a full prototype-pollution audit.

## Verification

| Check | Result |
| --- | --- |
| `npm test` | **80/80 passed**, 13 files, 0 failures; 6 security/formula cases added to baseline 74 tests. |
| `npm run build -- --sourcemap` | **Passed**, including `tsc`; sourcemap flag is local evidence only, no configuration enabling shipped sourcemaps. Existing large-chunk warning remains. |
| Bundle source inspection | Local map `dist/assets/index-CRGqV_rz.js.map`: one KaTeX source, zero postcss-selector-parser sources. Build config reviewed: Vite PostCSS uses Tailwind/autoprefixer; Remotion webpack uses enableTailwind. |
| `npm audit --omit=dev --json` | **0 vulnerabilities** after upgrade. |
| `npm audit --json` | KaTeX advisory absent. **23 remaining package-level findings** (18 moderate, 5 high) from dev dependency chains; these are not 23 independent root advisories. Root advisories are PostCSS and an additional braces advisory. Dismissing GitHub does not alter npm audit output. |
| `git diff --check` | Passed. |
| GitHub dismissal verification | Alert #11 detail page shows Dismissed, actor LeTran30 and the saved note. Alert #13 is not dismissed. |

Additional finding outside the two requested GitHub alerts: [braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), high, transitive development glob/watch tooling. Recorded separately, not silently upgraded/dismissed in this two-alert task. Production-only audit is clean; this does not imply all development dependencies are patched. Reassess PostCSS dismissal if the app gains runtime CSS processing, accepts uploaded CSS into builds, or runs a playground with untrusted selectors.

Exact dismissal note:

> Build-only via Tailwind/Remotion; trusted repository CSS only. Production JS sourcemap contains no postcss-selector-parser. No runtime parsing of user CSS/selectors. Advisory excludes trusted build-time use. Reassess if untrusted CSS processing is added.

Local logs (ignored, not committed): workspace `.audit/stabilize-push-2026-10-11/fe-dependency-tests.log`, `fe-dependency-build.log`, `fe-audit-triage.json`, `fe-audit-after-katex.json`, `fe-audit-production-after.json` and `fe-dependency-tree.json`.

## Handoff

One dedicated local security commit contains package/lock changes, shared LaTeX hardening, regression tests and this report. Production remains at the previous pushed code until the user authorizes push. No BE/worker files, secrets or production data changed. Stop here and wait for push instructions.
