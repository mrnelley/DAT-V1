begin;
insert into compass_private.enterprise_objectives(id,title,pillar_id,area,period) values
('2026-Q3-1','Strengthen Property Management Financial Sustainability','sustainable-growth','Enterprise Revenue','2026-Q3'),
('2026-Q3-2','Execute Property Management 3rd Party Contract Exit Strategy','sustainable-growth','Enterprise Revenue','2026-Q3'),
('2026-Q3-3','Develop and Launch Asset Management Strategy','sustainable-growth','Enterprise Revenue','2026-Q3'),
('2026-Q3-4','Secure contributed revenue','sustainable-growth','Enterprise Revenue','2026-Q3'),
('2026-Q3-5','Finalize 4%/9% Underwriting Guidelines','diversify-innovate','Robust Pipeline','2026-Q3'),
('2026-Q3-7','Advance College Ave Phase 2 Closing','diversify-innovate','Robust Pipeline','2026-Q3'),
('2026-Q3-8','Advance Cornerstone Closing','diversify-innovate','Robust Pipeline','2026-Q3'),
('2026-Q3-9','Improve Employee Retention','agility-capacity','Employee Retention & Satisfaction','2026-Q3'),
('2026-Q3-10','Reduce Open Positions','agility-capacity','Employee Retention & Satisfaction','2026-Q3'),
('2026-Q3-11','Optimize new community lease-up process','agility-capacity','Operational Efficiency','2026-Q3'),
('2026-Q3-12','Complete CRM Design and Validation','agility-capacity','Operational Efficiency','2026-Q3'),
('2026-Q3-13','Digitize the Leasing Experience','agility-capacity','Operational Efficiency','2026-Q3'),
('2026-Q3-14','Advance Enterprise AI Strategy','agility-capacity','Operational Efficiency','2026-Q3'),
('2026-Q3-15','Strengthen Leadership knowledge around Resident Experience','care-connection','Resident Experience/Customer Service','2026-Q3')
on conflict(id) do update set title=excluded.title,pillar_id=excluded.pillar_id,area=excluded.area,period=excluded.period;
insert into compass_private.releases(version) values('20260917_weekly_objectives') on conflict do nothing;
commit;
