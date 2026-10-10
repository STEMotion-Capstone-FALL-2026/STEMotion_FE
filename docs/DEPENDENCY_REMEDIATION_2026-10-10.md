# Dependency remediation — 10 October 2026

The GitHub push exposed Dependabot findings; a fresh npm audit found 32 affected
package nodes (3 critical, 7 high). These counts include transitive/tooling effects
and are not counts of independently exploitable production vulnerabilities.

Updated Vitest/coverage to 5.0.3, Vite to 8.3.4 and the compatible React plugin to
5.2.0. Node 24 and its type definitions are specified in package.json, .nvmrc and
CI. Remotion packages are pinned to 4.0.526 to match the worker instead of drifting
when regenerating the lockfile. npm ci, 45 tests and production build passed.

After: 24 affected package nodes, **0 critical**, 5 high, 18 moderate and 1 low.
Remaining high findings are the braces/globbing chain pulled through Tailwind;
the audit reports no fixed braces release. Moderate findings include older
PostCSS selector tooling through the pinned Remotion Tailwind bundle; KaTeX has
a low finding. These remain open. Do not expose dev/test servers to untrusted
networks or process untrusted glob/stylesheet inputs in build tooling.

Vercel supports Node 24 and the engines field selects it for the next deployment:
[official Node version documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
Verify the actual deployment log; passing a local build is not proof of release.
