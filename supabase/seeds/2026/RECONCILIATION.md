# 2026 seed decisions and mappings

- positions: 11
- departments: 6
- pillars: 5
- strategies: 15
- strategicObjectives: 42
- strategicTargets: 19
- KPISourceRows: 66
- metricDefinitions: 145
- Q1ArchivedObjectives: 24
- Q2ArchivedObjectives: 14
- Q3Objectives: 14
- Q1DepartmentPriorities: 40
- DepartmentalPriorities: 180
- draftWorkplanObjectives: 181
- reportedFacts: 13
- reviewItems: 2

## Confirmed decisions

- Position-owned work; no people, emails or historical point awards. SVP owns RED; Director of Project Management shares access. VP of Impact and Advancement covers Community Relations.
- Q1 and Q2 are immutable Admin archive records, excluded from live rollups. The Q1 rollout row is omitted.
- Q3 row 6 refers to College Ave Phase 2 and is merged by alias, without duplicating the initiative. Its inconsistent scattered-site note is retained separately.
- Project-plan references are related work across departments, not unique project ownership.
- Contributed revenue starts from one user-directed $750,000 Q3 YTD balance, manually marked as exceeding goal. Old contribution progress and inferred category allocations are excluded.
- Values and status are manually entered. Unknown numeric values/baselines start at zero, tagged as defaults rather than measurements.
- PM Occupancy Rate and Finance Economic Occupancy Rate stay separate. Potential minus collected rent is a display-only shortfall helper.
- HR retention has separate six- and twelve-month entries. Website windows support 12, 6 or 3 months. Newsletter total opens, unique opens, sent and delivered are separate counts.
- RS utilization is a raw count with separate optional total-unit and total-resident inputs. Referrals Made and Referrals Connected stay separate. Deaths remain neutral.
- Cap-ex total and on-track counts are separate. Compliance figures come from Salesforce. Turnover time uses elapsed days. Revenue-mix status is manual.
- Access permissions are not financial grants. No existing permissions are removed by this seed.

## Remaining import choices

- **opening-cutoff:** Choose the effective cutoff for the $750,000 opening YTD balance before loading subsequent contribution records. Do not invent category allocation.
- **q3-source-note:** Row 6 is mapped to College Ave Phase 2 per instruction. Its 9%/scattered-site progress note is retained separately, not applied to that project.

## Early workplan references

- Community Relations.pdf: 2 pages, 51 objective rows; retained as draft references. Latest decisions take precedence.
- Finance.pdf: 1 pages, 29 objective rows; retained as draft references. Latest decisions take precedence.
- HR.pdf: 2 pages, 26 objective rows; retained as draft references. Latest decisions take precedence.
- Property Management.pdf: 1 pages, 28 objective rows; retained as draft references. Latest decisions take precedence.
- Real Estate Development.pdf: 2 pages, 29 objective rows; retained as draft references. Latest decisions take precedence.
- Resident Services.pdf: 1 pages, 18 objective rows; retained as draft references. Latest decisions take precedence.

No names or progress-owner columns from these PDFs are copied. Early draft numbers do not override the current seed. Source-only 2025 baseline descriptions are not 2025 records. The ambiguous Nov–Jan 2025 training observation from the pasted Q3 note is omitted from active data.

## Current KPI mapping

| Source | Measure | Position owners | Metric IDs |
| --- | --- | --- | --- |
| attachment-kpi-01 | Reduce Health Insurance Claim Costs | Chief Financial Officer | hr-health-insurance-claim-cost-change |
| attachment-kpi-02 | Implement protocol to eliminate missed premiums | Director of Human Resources | hr-missed-premiums |
| attachment-kpi-03 | Resident Satisfaction | Director of Property Management | property-management-4 |
| attachment-kpi-04 | Continued development of Leadership Development Plans | Director of Human Resources | human-resources-11 |
| attachment-kpi-05 | Increase employee retention | Director of Human Resources | hr-retention-6-month, hr-retention-12-month |
| attachment-kpi-06 | Reduce Accounts Receivable | Chief Financial Officer | finance-3 |
| attachment-kpi-07 | Excess Cash to Parent | Chief Financial Officer | finance-5 |
| attachment-kpi-08 | Deferred Developer Fee Paid | Chief Financial Officer | finance-6 |
| attachment-kpi-09 | Number of days cash on hand | Chief Financial Officer | finance-1 |
| attachment-kpi-10 | Current Ratio | Chief Financial Officer | finance-4 |
| attachment-kpi-11 | Net Operating Income (NOI) | Chief Financial Officer | finance-parent-noi |
| attachment-kpi-12 | Average Property Management Fee | Chief Financial Officer | finance-pm-fee-percent |
| attachment-kpi-13 | Property Management Fee | Chief Financial Officer | property-management-5 |
| attachment-kpi-14 | Development Fee Revenue | Chief Financial Officer | finance-development-fee-revenue |
| attachment-kpi-15 | Reduce Vacancy loss through a coordinated strategy with PM | Chief Financial Officer | finance-7 |
| attachment-kpi-16 | Properties meeting budgeted NOI | Chief Financial Officer | finance-10 |
| attachment-kpi-17 | Reduce properties with negative NOI from 9 | Chief Financial Officer | finance-negative-noi-properties |
| attachment-kpi-18 | Reduce troubled property list from 11 | Chief Financial Officer | finance-troubled-properties |
| attachment-kpi-19 | Maintain average controllable cost | Chief Financial Officer | finance-9 |
| attachment-kpi-20 | Economic Occupancy Rate | Chief Financial Officer | finance-potential-rent, finance-actual-rent-collected, pm-occupancy-rate, finance-11 |
| attachment-kpi-21 | Resident Communication Channel | Director of Community Relations | cr-resident-communication-satisfaction |
| attachment-kpi-22 | Google Review Management | Director of Community Relations | cr-google-review-rating |
| attachment-kpi-23 | Recruitment Marketing | Director of Community Relations | cr-recruitment-marketing |
| attachment-kpi-24 | Website Sessions | Director of Community Relations | cr-website-sessions |
| attachment-kpi-25 | Unique Website Users | Director of Community Relations | cr-unique-website-users |
| attachment-kpi-26 | Newsletters | Director of Community Relations | cr-newsletter-open-rate, cr-newsletter-total-opens, cr-newsletter-unique-opens, cr-newsletter-sent, cr-newsletter-delivered |
| attachment-kpi-27 | LinkedIn Followers | Director of Community Relations | community-relations-14 |
| attachment-kpi-28 | LinkedIn Engagement Rate | Director of Community Relations | cr-linkedin-engagement-rate |
| attachment-kpi-29 | LinkedIn Impressions | Director of Community Relations | cr-linkedin-impressions |
| attachment-kpi-30 | Facebook Followers | Director of Community Relations | cr-facebook-followers |
| attachment-kpi-31 | Facebook Reach | Director of Community Relations | cr-facebook-reach |
| attachment-kpi-32 | Facebook Engagement | Director of Community Relations | cr-facebook-engagement |
| attachment-kpi-33 | Facebook Impressions | Director of Community Relations | community-relations-16 |
| attachment-kpi-34 | Earned Media Coverage | Director of Community Relations | community-relations-17 |
| attachment-kpi-35 | Turnover Time | Director of Property Management | property-management-12 |
| attachment-kpi-36 | Troubled Properties | Director of Property Management | property-management-11 |
| attachment-kpi-37 | Housing Stability | Director of Property Management; Director of Resident Services | resident-services-3 |
| attachment-kpi-38 | Resident Satisfaction via Community Meetings | Director of Property Management; Director of Resident Services | pm-community-meetings |
| attachment-kpi-39 | Vacant Units | Director of Property Management | property-management-3 |
| attachment-kpi-40 | Units Rehabbed | Director of Property Management | pm-bond-compliance-files |
| attachment-kpi-41 | New Units Placed in Service | Director of Property Management | pm-new-unit-lease-up |
| attachment-kpi-42 | Resident Services Utilization Rate | Director of Resident Services | resident-services-4 |
| attachment-kpi-43 | Resident Experience Score | Director of Resident Services | resident-services-2 |
| attachment-kpi-44 | Positive Move-Out Rate | Director of Property Management; Director of Resident Services | property-management-6, rs-positive-move-out-rate |
| attachment-kpi-45 | Household Engagement Rate | Director of Resident Services | resident-services-6 |
| attachment-kpi-46 | Resident Satisfaction Rate | Director of Resident Services; Director of Property Management | resident-services-1, property-management-4 |
| attachment-kpi-47 | Service Delivery Partner Connection Rate | Director of Resident Services | resident-services-7, rs-service-partner-connections |
| attachment-kpi-48 | Hours Saved | Director of Resident Services | rs-hours-saved |
| attachment-kpi-49 | Connection to Partners | Director of Resident Services | resident-services-7, rs-service-partner-connections |
| attachment-kpi-50 | Employee Satisfaction | Director of Human Resources | human-resources-1 |
| attachment-kpi-51 | Cost Savings | Director of Resident Services | resident-services-8 |
| attachment-kpi-52 | Contributed Revenue | Director of Resident Services; Director of Community Relations | community-relations-1 |
| attachment-kpi-53 | Reduce vendor use | Director of Property Management | pm-vendor-use-reduction |
| attachment-kpi-54 | Zero Non-Compliance | Director of Property Management | property-management-1 |
| attachment-kpi-55 | Cap Ex | Director of Property Management | pm-capex-on-track, pm-capex-total |
| attachment-kpi-56 | Reduce Compliance Consultant use | Director of Property Management | pm-compliance-consultant-spend-change |
| attachment-kpi-57 | Develop plan to implement Yardi efficiencies and optimization | Director of Property Management | pm-yardi-implementation |
| attachment-kpi-58 | Launch Customer Service Training Program in collaboration with HR | Director of Property Management | pm-customer-service-complaint-change |
| attachment-kpi-59 | Improve MT employee retention | Director of Property Management | pm-maintenance-technician-retention |
| attachment-kpi-60 | Rent Collection | Director of Property Management | property-management-2 |
| attachment-kpi-61 | Time to Fill | Director of Property Management; Director of Human Resources | human-resources-10, pm-time-to-fill |
| attachment-kpi-62 | Turnover Time | Director of Property Management | property-management-12 |
| attachment-kpi-63 | Improve CM employee retention | Director of Property Management | pm-community-manager-retention |
| attachment-kpi-64 | Create a PM Learning and Growth Dashboard | Director of Property Management | pm-learning-growth |
| attachment-kpi-65 | Cost Savings (Direct + Indirect) from technology | Chief Financial Officer | finance-technology-cost-savings |
| attachment-kpi-66 | Employee Engagement | Director of Human Resources | human-resources-3 |

## Active Q3 objectives

- **Strengthen Property Management Financial Sustainability** (2026-Q3-1): Approve PM fee increases at 11 properties by September 1; approvals for LIHTC and Governor's Gate by November 1
- **Execute Property Management 3rd Party Contract Exit Strategy** (2026-Q3-2): Exit management of Brandywine
- **Develop and Launch Asset Management Strategy** (2026-Q3-3): Strategy approved; owner KPIs finalized; implementation task force established; interim tracker in use
- **Secure contributed revenue** (2026-Q3-4): Secure $96,000 in new commitments; achieve $750,000 YTD; develop faith-based fundraising campaign
- **Finalize 4%/9% Underwriting Guidelines** (2026-Q3-5): Policy guidelines approved
- **Advance College Ave Phase 2 Closing** (2026-Q3-7): Complete closing requirements to remain on schedule for 10/31/26 closing
- **Advance Cornerstone Closing** (2026-Q3-8): 100% construction documents and land development approval by 8/31/26
- **Improve Employee Retention** (2026-Q3-9): 88% six-month retention; 69% twelve-month retention; 90% Day 90 Training Satisfaction
- **Reduce Open Positions** (2026-Q3-10): Fewer than 5 open positions
- **Optimize new community lease-up process** (2026-Q3-11): 100% lease-up of Flats V by 11/1/26
- **Complete CRM Design and Validation** (2026-Q3-12): Complete small-group testing and prepare for Q4 soft launch
- **Digitize the Leasing Experience** (2026-Q3-13): Implement Yardi Automated Leasing Workflow
- **Advance Enterprise AI Strategy** (2026-Q3-14): Develop and deliver mandatory AI policy training for all staff
- **Strengthen Leadership knowledge around Resident Experience** (2026-Q3-15): Initiate Unreasonable Hospitality book club with OLT

## Deployment boundary

The generated archive SQL and Admin archive reader support Q1/Q2 notes. The department priority catalog supplies 180 selectable work scopes across six departments; it imports no targets or observations. Deploy that catalog with the separate 20260925 departmental priorities release. The remaining seed is a structural import package: the next metric-entry pass must preserve manual statuses, lookback windows, component fields and opening-balance metadata. It is not a request to turn stored formula text into executable code.

Rebuild: `node scripts/build-2026-seed.mjs`. Validate: `node --test test/annual-seed.test.mjs`.
