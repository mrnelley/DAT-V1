begin;
insert into compass_private.metric_definitions(id,name,department,tracking_area,unit) values
('strategic-metric-1','Growth in new units outside acquisitions',null,'2030 outcomes','percent'),
('strategic-metric-2','Units created, acquired or preserved',null,'2030 outcomes','units'),
('strategic-metric-3','Enterprise capital for real estate development',null,'2030 outcomes','USD'),
('strategic-metric-4','Housing models explored and vetted',null,'2030 outcomes','models'),
('strategic-metric-7','Employee engagement',null,'2030 outcomes','percent'),
('strategic-metric-8','Technologies adopted with measurable savings',null,'2030 outcomes','technologies'),
('strategic-metric-11','Philanthropic growth above national average',null,'2030 outcomes','percent'),
('strategic-metric-12','Positive brand visibility and reach',null,'2030 outcomes','percent'),
('strategic-metric-13','Coalitions and alliances with active involvement',null,'2030 outcomes','coalitions'),
('strategic-metric-14','Increase in policymaker engagement',null,'2030 outcomes','percent'),
('strategic-metric-15','Resident leaders and stakeholders participating in advocacy',null,'2030 outcomes','people'),
('strategic-metric-16','Policy wins',null,'2030 outcomes','wins'),
('strategic-metric-17','Resident satisfaction',null,'2030 outcomes','percent'),
('strategic-metric-19','Wage growth for working families (2026–2030)',null,'2030 outcomes','percent')
on conflict(id) do update set name=excluded.name,unit=excluded.unit;
insert into compass_private.releases(version) values('20260918_strategic_measures') on conflict do nothing;
notify pgrst,'reload schema';
commit;
