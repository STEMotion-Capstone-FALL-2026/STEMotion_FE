# Chemistry asset verification — 2026-10-11

This checklist uses authoritative chemical data; it is not an IUPAC certification. Only the verified presets below are enabled. Asset components contain no Vietnamese narration text.

| Asset / preset | Formula / identity | Atomic number / electrons | Atomic weight | Geometry | Reading / use | Result |
|---|---|---|---|---|---|---|
| Atom / neutral carbon | C | Z=6; six electrons, shells 2–4 | N/A in graphic | Two circular shell guides; electrons stay on guides. Teaching model, not quantum trajectories | Carbon; Vietnamese spoken pronunciation not reverified in this silent export | PASS visual preset |
| ElementTile / carbon | C, Carbon | 6 | 12.011, conventional abridged standard atomic weight; not isotope mass | N/A | Carbon; spoken pronunciation pending | PASS visual preset |
| Molecule / water | H₂O: two H, one O | N/A: molecule, no aggregate atomic number claim | N/A: no molecular mass displayed | Equal O–H illustration lengths; H–O–H 104.5°, bent | Water / nước; spoken pronunciation pending | PASS visual preset |
| Flask | Laboratory flask illustration; no substance specified | N/A | N/A | Decorative bubbles; no reaction, calibration or measured volume claim | No chemical pronunciation required | PASS within illustrative scope |
| Molecule / carbon dioxide, oxygen | Previously available variants | Not verified by this pass | Not displayed | Not enabled | Do not use until separately verified | UNVERIFIED / DISABLED |
| Other elements / ions | Not registered | Not verified | Not verified | Not enabled | Do not infer data from carbon defaults | UNVERIFIED / DISABLED |

Carbon's configuration is 1s² 2s² 2p². The shells encode occupancy only; the moving dots do not assert real electron paths. Carbon standard atomic weight varies by natural isotope abundance: CIAAW interval [12.0096, 12.0116]; the tile uses abridged 12.011. An ion or different element requires a separately verified preset and registry change.

Sources: [RSC carbon](https://periodic-table.rsc.org/element/6/C), [CIAAW carbon](https://www.ciaaw.org/carbon.htm), [CIAAW abridged weights](https://ciaaw.org/abridged-atomic-weights.htm), [NIST experimental water angle](https://cccbdb.nist.gov/listangleexp3x.asp?bi=10&descript=aHOH&mi=3).

Enforcement: FE/BE allowlist restricts carbon particle counts, identity and mass; molecule accepts `water` only. Components also reject unverified carbon and molecule props when called without the plan validator. Tests calculate the angle from coordinates and verify shell occupancy and radius at multiple frames. Empty props select these explicitly verified presets, never an arbitrary chemical element.
