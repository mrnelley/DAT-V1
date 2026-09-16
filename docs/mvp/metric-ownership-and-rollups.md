# Metric ownership and rollups

September 16, 2026: structured source catalog in `src/features/planning`. This is domain code under development, not yet connected to the scorecards or hosted tables. The older planning-candidate.json is Q2 and must not be mistaken for the newly supplied Q3 plan.

## Configuration instead of bespoke formulas

Most measures need one approved configuration, not custom programming. Supported arithmetic: reported value, sum, mean, weighted mean, ratio, percentage, and growth from baseline. Specialized composites, survey indices, risk scores and external benchmarks need a defined methodology; until approved, accept a sourced reported value or show Pending. Never infer a cybersecurity score or blended engagement formula from its label.

Director's recurring form: reporting period, value (or two plainly named counts), short explanation and source. The app calculates the result and shows the target. Setup belongs in a separate ELT/Admin workflow: accountable position, scope/population, unit, collection cadence, calculation type, numerator/denominator labels, baseline, target, direction and source. Executive approves target/definition changes. Routine entry must not expose a formula editor.

## Required schema boundaries

- `metric_definitions`: stable identity, label, accountable position and population scope.
- `metric_definition_versions`: effective reporting period, unit, approved calculation enum and typed parameters, aggregation policy, approval audit. Do not execute user-authored SQL or JavaScript.
- `metric_targets`: approved period targets, comparator, range or benchmark reference, and interpretation.
- `metric_observations`: definition version, period, scope, input values, source, author, submitted timestamp and revision lineage. Preserve source inputs, not only the result.
- `metric_surface_links`: many-to-many links to pillar, annual scorecard domain, strategy and department. One metric may appear on multiple surfaces without storing a second actual.
- `metric_results`: server-derived results or an approved reported value, separate from review status and freshness.

Targets and KPI actuals are separate from weekly submission points. Task completion supplies delivery evidence, not an automatic enterprise KPI value. Do not average heterogeneous KPI percentages into a pillar status. Until approved rollup rules exist, use a documented review status with freshness and coverage counts.

## Aggregation safeguards

Rates aggregate numerators and denominators over disjoint populations. Do not average percentages. Monthly snapshots such as cash, employee headcount and vacancy must not be summed across months. Flows such as contributed revenue can be summed only across nonoverlapping periods/categories. Overall contributed revenue must not be added to its own component streams. Duplicate department reporting of resident satisfaction or controllable cost needs a single canonical definition or explicitly different populations.

Zero is a valid observation. Missing is Pending. Zero denominators and missing/invalid inputs produce Pending, not zero or green status. Growth needs an agreed baseline; range and strict `>` targets retain their meaning. Cadence and stale-source warnings are separate from performance color.

## Source decisions still needed

1. Operations: standalone department, or a cross-department function? Advocacy remains in the confirmed roster; no silent replacement.
2. Q3 objective 6: source title missing. Objective 13 numbering is inferred from the supplied sequence.
3. Strategy wording: retain stable strategy codes while resolving alternate names for 4.1, 4.2, 3.2 and 2.2.
4. Keep the two questioned 5.3 objectives in source placement until reassignment is approved.
5. Define revenue mix categories/tolerance (33/33/33 totals 99), employee engagement blend, brand visibility blend, and philanthropy benchmark.
6. Resolve ambiguous labels with metric owners: NPSIRE, LDP denominator, grant yield versus success, economic occupancy, and survey populations.

Long-form objective descriptions still need faithful transcription from the supplied outline. Department calculation types intentionally remain unassigned until owner definitions are approved. The arithmetic library is a tested building block; the server must validate inputs and authorization before persisting calculations.
