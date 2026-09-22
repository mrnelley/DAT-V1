begin;
create table if not exists compass_private.departmental_priorities (
 id text primary key, year integer not null check(year between 2026 and 2100),
 title text not null check(length(trim(title)) between 1 and 1200),
 department text not null references compass_private.departments(name),
 active boolean not null default true,source_file text not null,source_refs jsonb not null
);
alter table compass_private.departmental_priorities enable row level security;
revoke all on compass_private.departmental_priorities from public,anon,authenticated;
insert into compass_private.departmental_priorities(id,year,title,department,source_file,source_refs) values
('2026-workplan-community-relations-p1-t1-r19',2026,'Acquisition: Recruit 3-5 new Groundbreakers Giving Circle members','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r19"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r13',2026,'Acquisition: Secure 2-4 major sponsors at the $10,000+ level','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r13"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r12',2026,'Acquisition: Secure 3-5 new corporate sponsors','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r12"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r17',2026,'Build individual giving through a mix of acquisition and retention strategies, including revamping the Groundbreaker Giving Circle, strengthening the ExtraGive campaign, and executing targeted year-end digital solicitations','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r17"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r33',2026,'Complete Leadership Development Plans for CR team members','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r33"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r24',2026,'Craft a data-driven SROI case for support to highlight measurable impact and engage funders seeking innovative opportunities','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r24"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r39',2026,'Create 2026 advocacy engagement calendar, key targets, touch points and tracking tool for meetings, site visits, tours, etc.','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r39"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r31',2026,'Create and distribute trauma-informed, value-aligned, HDC branded communication templates for residents (door sign, resident memo, resident letter, follow-up card)','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r31"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r27',2026,'Cross-departmental Event Planning Protocol developed and implemented','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r27"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r38',2026,'Develop and implement board-approved policy and advocacy priorities, inclusive of communications strategy and messaging approach - federal, state, and local','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r38"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r35',2026,'Develop and implement Corporate/Leadership Recognition Strategy: Identify opportunities and create plan and secure "wins" to elevate programs/projects and leadership for external recognization, "under 40" "under 30", "trail-blazer" leadership awards, "best in affordable housing", "best multifamily community", etc.','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r35"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r29',2026,'Develop and launch resident communication channel in collaboration with PM and RS','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r29"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r4',2026,'Develop media announcement regarding LIHTC awards and other key project awards','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r4"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r34',2026,'Develop recruitment digital marketing strategy with HR to attract new talent, which includes testimonials, video, quotes, in writing','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r34"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r18',2026,'Ensure full board engagement in philanthropy by achieving 100% participation in annual giving','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r18"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r5',2026,'Enterprise level predevelopment fund for real estate development pipeline','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r5"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r22',2026,'Establish a framework to guide a planned giving strategy; evaluate the potential for a recognition society centered on estate giving (planned gifts)','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r22"]'::jsonb),
('2026-workplan-community-relations-p2-t1-r7',2026,'Expand earned media reach through proactive media outreach','Community Relations','Community Relations.pdf','["workplan-community-relations-p2-t1-r7"]'::jsonb),
('2026-workplan-community-relations-p2-t1-r1',2026,'Facebook - Track and analyze performance metrics, and implement strategies to increase followers and engagement of key partners, residents, and elected officials.','Community Relations','Community Relations.pdf','["workplan-community-relations-p2-t1-r1"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r49',2026,'Facilitate the production and communications strategy of annual collateral, including the Impact Report and Strategic Plan, to ensure brand consistency and effectively communicate the organization’s mission, vision, and values to external stakeholders.','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r49"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r26',2026,'Form a cross-functional team to evaluate grant opportunities and relationship engagement status on a quarterly basis, ensuring they align with organizational priorities','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r26"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r6',2026,'Groundbreaking events for Cornerstone and CA 2 (possibly)','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r6"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r9',2026,'Grow corporate sponsorship revenue by renewing key partners, upgrading existing sponsors, and cultivating new relationships through the #BetterTogether Corporate Giving Campaign','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r9"]'::jsonb),
('2026-workplan-community-relations-p2-t1-r2',2026,'Grow Facebook followers','Community Relations','Community Relations.pdf','["workplan-community-relations-p2-t1-r2"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r52',2026,'Grow LinkedIn followers','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r52"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r40',2026,'Identify and cultivate residents who are willing to document, speak and share/produce their stories with elected officials','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r40"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r44',2026,'Identify and develop advocacy-specific collateral to support priorities (PA & DE Fact Sheets; 5 Project Fact Sheets; 10 new Resident Stories)','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r44"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r25',2026,'Implementation and integration of a CRM platform to strengthen relationship management and enhance cross- departmental collaboration','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r25"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r16',2026,'Increase grant success rate and yield rate. (industry standard success 42%; yield rate is 38%)','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r16"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r48',2026,'Increase unique website users through improved navigation and content','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r48"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r47',2026,'Increase website sessions following the website redesign','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r47"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r42',2026,'Issue and track sign-on support letters for policy and advocacy priorities to achieve policy wins','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r42"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r14',2026,'Launch a faith based corporate giving campaign focused on securing gifts for Hope & Opportunity Fund (Q4)','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r14"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r51',2026,'LinkedIn - Implement a social media strategy utilizing ELT to elevate HDC''s brand, expand audience reach, and grow reach and followers, with performance tracked through key growth metrics.','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r51"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r41',2026,'Participate and increase executive leadership in coalition/alliances: PA Developer''s Council, National NeighborWorks Association, Affordable Housing Tax Credit Coalition, Up for Growth, PA Housing Choice Campaign, Delaware NonProfit Affordable Housing Group, Housing Partnership Network Policy Group, Coalition for Sustainable Housing (Lancaster)','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r41"]'::jsonb),
('2026-workplan-community-relations-p2-t1-r4',2026,'Post Engagement (Increase post engagements to approximately 456 per month in 2026, targeting a total of 5,472 engagements for the year - 15% growth)','Community Relations','Community Relations.pdf','["workplan-community-relations-p2-t1-r4"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r53',2026,'Post Engagement Rate (Increase LinkedIn engagement rate from 11.03% to 13% in 2026, maintaining at least 13% each month)','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r53"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r54',2026,'Post Impressions (Increase LinkedIn post impressions to approximately 6,300 per month in 2026, targeting a total of 75,500 impressions for the year -15% growth)','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r54"]'::jsonb),
('2026-workplan-community-relations-p2-t1-r5',2026,'Post impressions (Increase post impressions to approximately 4,050 per month in 2026, targeting a total of 48,600 impressions for the year -15% growth) * Facebook has transitioned from reporting “impressions” to “views,” which more accurately reflect content that was actively seen rather than simply displayed.','Community Relations','Community Relations.pdf','["workplan-community-relations-p2-t1-r5"]'::jsonb),
('2026-workplan-community-relations-p2-t1-r3',2026,'Post Reach (Increase Facebook post reach to approximately 28,950 people in 2026, with an average of 2,400 people per month -15% growth)','Community Relations','Community Relations.pdf','["workplan-community-relations-p2-t1-r3"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r43',2026,'Produce board-driven, resident-centered op-eds related to advocacy','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r43"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r50',2026,'Produce four external newsletters annually to educate and keep stakeholders informed, driving engagement and actionable support, with open rates used to measure effectiveness. (16% increase)','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r50"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r46',2026,'Redesign the website to improve user experience, update content, modernize the look, and support 5-year strategic plan.','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r46"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r10',2026,'Retain and renew corporate sponsors','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r10"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r20',2026,'Retain ExtraGive donors','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r20"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r21',2026,'Secure NW Flexible Impact and Capital Grant','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r21"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r15',2026,'Secure philanthropic grants to advance resident services, strengthen general operations, and drive program innovation','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r15"]'::jsonb),
('2026-workplan-community-relations-p2-t1-r6',2026,'Subject Matter Expertise Produce 25 thought leadership presentations in 2026, supported by a proactive strategy to identify, organize, and leverage thought leadership opportunities across all departments to build brand awareness.','Community Relations','Community Relations.pdf','["workplan-community-relations-p2-t1-r6"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r7',2026,'Support ribbon cutting for Flats 5 in DE','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r7"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r30',2026,'Transfer ownership of corporate Google reviews to Property Management, and develop a strategy for Community Managers to take ownership of Google review goals for their individual sites.','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r30"]'::jsonb),
('2026-workplan-community-relations-p1-t1-r11',2026,'Upgrades: Attain a 20% rate of increased giving among renewing sponsors','Community Relations','Community Relations.pdf','["workplan-community-relations-p1-t1-r11"]'::jsonb),
('2026-workplan-finance-p1-t1-r12',2026,'Analyze all properties below 10% PM fee to determine potential increased fee; priortize properties and obtain approvals to increase fee and timeline to execute. Develop a financial performance dashboard by region to include: PM%, Rent Collection %, Vacancy loss, controllable cost per unit, >AR','Finance','Finance.pdf','["workplan-finance-p1-t1-r12"]'::jsonb),
('2026-workplan-finance-p1-t1-r36',2026,'Complete Leadership Development Plans for FIN team members','Finance','Finance.pdf','["workplan-finance-p1-t1-r36"]'::jsonb),
('2026-workplan-finance-p1-t1-r28',2026,'Develop a strategy to capture efficiencies from acquisition integration','Finance','Finance.pdf','["workplan-finance-p1-t1-r28"]'::jsonb),
('2026-workplan-finance-p1-t1-r14',2026,'Develop and execute a coordinated stabilization and hand off process for each development project from closing to post construction to ensure equity installments and perm loan closing milestones are achieved.','Finance','Finance.pdf','["workplan-finance-p1-t1-r14"]'::jsonb),
('2026-workplan-finance-p1-t1-r44',2026,'Develop and implement new organizational structure of department focusing on efficiencies','Finance','Finance.pdf','["workplan-finance-p1-t1-r44"]'::jsonb),
('2026-workplan-finance-p1-t1-r42',2026,'Develop and test an incident response plan according to the BCDR','Finance','Finance.pdf','["workplan-finance-p1-t1-r42"]'::jsonb),
('2026-workplan-finance-p1-t1-r39',2026,'Develop long term strategy for asset (IT) replacement','Finance','Finance.pdf','["workplan-finance-p1-t1-r39"]'::jsonb),
('2026-workplan-finance-p1-t1-r30',2026,'Develop plan to implement Yardi efficiencies and optimization','Finance','Finance.pdf','["workplan-finance-p1-t1-r30"]'::jsonb),
('2026-workplan-finance-p1-t1-r24',2026,'Develop strategy and implement new Asset Management software system.','Finance','Finance.pdf','["workplan-finance-p1-t1-r24"]'::jsonb),
('2026-workplan-finance-p1-t1-r29',2026,'Develop strategy for Asset Management Line of Business financials','Finance','Finance.pdf','["workplan-finance-p1-t1-r29"]'::jsonb),
('2026-workplan-finance-p1-t1-r5',2026,'Develop workplan for addressing accounts receivable that includes rent collection, controllable costs, insurance, and taxes.','Finance','Finance.pdf','["workplan-finance-p1-t1-r5"]'::jsonb),
('2026-workplan-finance-p1-t1-r20',2026,'Economic Occupancy Rate','Finance','Finance.pdf','["workplan-finance-p1-t1-r20"]'::jsonb),
('2026-workplan-finance-p1-t1-r21',2026,'Evaluate feasibility and sustainability of 3rd party property management in collaboration with PM.','Finance','Finance.pdf','["workplan-finance-p1-t1-r21"]'::jsonb),
('2026-workplan-finance-p1-t1-r40',2026,'Identify cost savings related to IT vendor contract','Finance','Finance.pdf','["workplan-finance-p1-t1-r40"]'::jsonb),
('2026-workplan-finance-p1-t1-r6',2026,'Identify properties that have ability to produce excess cash and manage the 7 of properties to maximize cash to parent.','Finance','Finance.pdf','["workplan-finance-p1-t1-r6"]'::jsonb),
('2026-workplan-finance-p1-t1-r7',2026,'Identify properties that have deferred developer fee and manage 3 of properties to maximize deferred fee payment.','Finance','Finance.pdf','["workplan-finance-p1-t1-r7"]'::jsonb),
('2026-workplan-finance-p1-t1-r43',2026,'Implement automatic encryption system for sensitive information in emails and training for all employees','Finance','Finance.pdf','["workplan-finance-p1-t1-r43"]'::jsonb),
('2026-workplan-finance-p1-t1-r33',2026,'Improve internal relationship through customer service training','Finance','Finance.pdf','["workplan-finance-p1-t1-r33"]'::jsonb),
('2026-workplan-finance-p1-t1-r8',2026,'Increase cash on hand from 85 to 110 through reducing A/R, increases in dev fee paid, and excess cash.','Finance','Finance.pdf','["workplan-finance-p1-t1-r8"]'::jsonb),
('2026-workplan-finance-p1-t1-r41',2026,'Increase security Awareness scoring','Finance','Finance.pdf','["workplan-finance-p1-t1-r41"]'::jsonb),
('2026-workplan-finance-p1-t1-r19',2026,'Maintain average controllable cost','Finance','Finance.pdf','["workplan-finance-p1-t1-r19"]'::jsonb),
('2026-workplan-finance-p1-t1-r16',2026,'Properties meeting budgeted NOI','Finance','Finance.pdf','["workplan-finance-p1-t1-r16"]'::jsonb),
('2026-workplan-finance-p1-t1-r32',2026,'Reduce late fees by implementing a streamlined accounts payable process','Finance','Finance.pdf','["workplan-finance-p1-t1-r32"]'::jsonb),
('2026-workplan-finance-p1-t1-r17',2026,'Reduce properties with negative NOI from 9','Finance','Finance.pdf','["workplan-finance-p1-t1-r17"]'::jsonb),
('2026-workplan-finance-p1-t1-r27',2026,'Reduce time to close each property','Finance','Finance.pdf','["workplan-finance-p1-t1-r27"]'::jsonb),
('2026-workplan-finance-p1-t1-r18',2026,'Reduce troubled property list from 11','Finance','Finance.pdf','["workplan-finance-p1-t1-r18"]'::jsonb),
('2026-workplan-finance-p1-t1-r15',2026,'Reduce Vacancy loss through a coordinated strategy with PM','Finance','Finance.pdf','["workplan-finance-p1-t1-r15"]'::jsonb),
('2026-workplan-finance-p1-t1-r26',2026,'Staff time reallocation/productivity gains in process or procedures related to techology optimization (ADP, Yardi: payroll, AP)','Finance','Finance.pdf','["workplan-finance-p1-t1-r26"]'::jsonb),
('2026-workplan-finance-p1-t1-r25',2026,'User adoption rate (software systems)','Finance','Finance.pdf','["workplan-finance-p1-t1-r25"]'::jsonb),
('2026-workplan-hr-p1-t1-r19',2026,'Build capacity of HR Coordinator by further define HR roles more clearly and perform cross-training','Human Resources','HR.pdf','["workplan-hr-p1-t1-r19"]'::jsonb),
('2026-workplan-hr-p1-t1-r29',2026,'Build out performance management module in ADP','Human Resources','HR.pdf','["workplan-hr-p1-t1-r29"]'::jsonb),
('2026-workplan-hr-p1-t1-r32',2026,'Collaborate with One2One on developing and delivering AI Training and Education','Human Resources','HR.pdf','["workplan-hr-p1-t1-r32"]'::jsonb),
('2026-workplan-hr-p1-t1-r24',2026,'Continue development of Leadership Develop Plans for employees and develop tracking system with updates','Human Resources','HR.pdf','["workplan-hr-p1-t1-r24"]'::jsonb),
('2026-workplan-hr-p1-t1-r25',2026,'Create strategy to build relationships with College & Tech Schools throughout Geographic footprint','Human Resources','HR.pdf','["workplan-hr-p1-t1-r25"]'::jsonb),
('2026-workplan-hr-p1-t1-r11',2026,'Define a better process for tracking FMLA','Human Resources','HR.pdf','["workplan-hr-p1-t1-r11"]'::jsonb),
('2026-workplan-hr-p1-t1-r28',2026,'Develop a formal Employee Value Proposition that highlights HDC''s mission, culture, flexibility, and impact','Human Resources','HR.pdf','["workplan-hr-p1-t1-r28"]'::jsonb),
('2026-workplan-hr-p1-t1-r14',2026,'Develop and Implement Comprehensive Customer Service Training Framework Strategy - could include monthly/quarterly customer service training or undercover boss/secret shopper strategy.','Human Resources','HR.pdf','["workplan-hr-p1-t1-r14"]'::jsonb),
('2026-workplan-hr-p1-t1-r20',2026,'Develop and implement cross-training program.','Human Resources','HR.pdf','["workplan-hr-p1-t1-r20"]'::jsonb),
('2026-workplan-hr-p1-t1-r30',2026,'Develop calendar for monthly HR Training (supervisor training, benefit training, wellness training)','Human Resources','HR.pdf','["workplan-hr-p1-t1-r30"]'::jsonb),
('2026-workplan-hr-p1-t1-r21',2026,'Develop Departmental Career Pathways (PM is complete) and cross- departmental path','Human Resources','HR.pdf','["workplan-hr-p1-t1-r21"]'::jsonb),
('2026-workplan-hr-p1-t1-r15',2026,'Develop more enhanced customer Service Feedback Loop with Residents (work with CR and PM)','Human Resources','HR.pdf','["workplan-hr-p1-t1-r15"]'::jsonb),
('2026-workplan-hr-p1-t1-r27',2026,'Develop recruitment marketing strategy with CR to attract new talent','Human Resources','HR.pdf','["workplan-hr-p1-t1-r27"]'::jsonb),
('2026-workplan-hr-p1-t1-r23',2026,'Develop strategy for increasing employee engagement by highlight employee stories and experiences - once a month.','Human Resources','HR.pdf','["workplan-hr-p1-t1-r23"]'::jsonb),
('2026-workplan-hr-p2-2.c',2026,'Employee spotlight or show and tell on FMM','Human Resources','HR.pdf','["workplan-hr-p2-2.c"]'::jsonb),
('2026-workplan-hr-p1-t1-r9',2026,'Implement carrier connections for all ancillary benefits including 401k','Human Resources','HR.pdf','["workplan-hr-p1-t1-r9"]'::jsonb),
('2026-workplan-hr-p1-t1-r8',2026,'Implement optimization in ADP to include recruitment, compensation management and performance management (exact strategies TBD after assessement)','Human Resources','HR.pdf','["workplan-hr-p1-t1-r8"]'::jsonb),
('2026-workplan-hr-p1-t1-r12',2026,'Implement protocol/process to eliminate missed premium payments by employees (new hires, EE on leave)','Human Resources','HR.pdf','["workplan-hr-p1-t1-r12"]'::jsonb),
('2026-workplan-hr-p1-t1-r17',2026,'Improve 6 month employee retention rate by hiring the right people for the right position. (Develop Interview Guide for Hiring Managers)','Human Resources','HR.pdf','["workplan-hr-p1-t1-r17"]'::jsonb),
('2026-workplan-hr-p1-t1-r33',2026,'Improve employee engagement around policies, programs, "fun" engagement, inclusion & belonging, and culture.','Human Resources','HR.pdf','["workplan-hr-p1-t1-r33"]'::jsonb),
('2026-workplan-hr-p1-t1-r18',2026,'Improve employee retention by continuing the Training Check-ins at 2 weeks, 30, 60, and 90 days (new hire, hiring manager, and trainer) and stay interviews 1, 3 and 5 years','Human Resources','HR.pdf','["workplan-hr-p1-t1-r18"]'::jsonb),
('2026-workplan-hr-p1-t1-r22',2026,'Launch LEAD cohort #2','Human Resources','HR.pdf','["workplan-hr-p1-t1-r22"]'::jsonb),
('2026-workplan-hr-p2-2.b',2026,'Monthly Property Spotlight during FMM: site staff present their property','Human Resources','HR.pdf','["workplan-hr-p2-2.b"]'::jsonb),
('2026-workplan-hr-p1-t1-r6',2026,'Reduce health insurance claim costs through employee health benefits training','Human Resources','HR.pdf','["workplan-hr-p1-t1-r6"]'::jsonb),
('2026-workplan-hr-p1-t1-r26',2026,'Research and implement assessment tools on skills and culture fit','Human Resources','HR.pdf','["workplan-hr-p1-t1-r26"]'::jsonb),
('2026-workplan-hr-p1-t1-r10',2026,'Revise SOP to clearly define roles and responsibilities between finance, HR, and hiring managers as it relates payroll, HRIS','Human Resources','HR.pdf','["workplan-hr-p1-t1-r10"]'::jsonb),
('2026-workplan-property-management-p1-t1-r35',2026,'All PM staff who want Leadership Development Plans have one','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r35"]'::jsonb),
('2026-workplan-property-management-p1-t1-r27',2026,'All properties subject to NSPIRE scores achieve 95 or higher.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r27"]'::jsonb),
('2026-workplan-property-management-p1-t1-r8',2026,'Analyze all properties below 10% PM fee to determine potential increased fee; priortize properties and obtain approvals to increase fee and timeline to execute','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r8"]'::jsonb),
('2026-workplan-property-management-p1-t1-r22',2026,'Complete planned capital expenditure projects','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r22"]'::jsonb),
('2026-workplan-property-management-p1-t1-r38',2026,'Create a PM Learning and Growth Dashboard to track growth and capacity building within the departments.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r38"]'::jsonb),
('2026-workplan-property-management-p1-t1-r26',2026,'Develop plan to implement Yardi efficiencies and optimization','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r26"]'::jsonb),
('2026-workplan-property-management-p1-t1-r13',2026,'Develop workplan for addressing accounts receivable that includes rent collection, controllable costs, insurance, and taxes.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r13"]'::jsonb),
('2026-workplan-property-management-p1-t1-r21',2026,'Ensure housing stability rate by coordinating with resident services to minimize risk of eviction.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r21"]'::jsonb),
('2026-workplan-property-management-p1-t1-r5',2026,'Ensure that all income certifications are completed 90 days after financial closing.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r5"]'::jsonb),
('2026-workplan-property-management-p1-t1-r4',2026,'Implement lease up strategy on Flats 5 to exceed milestones - create lease-up dashboard','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r4"]'::jsonb),
('2026-workplan-property-management-p1-t1-r36',2026,'Improve employee retention by building technical skills and training for MTs in order to perform in-house repairs.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r36"]'::jsonb),
('2026-workplan-property-management-p1-t1-r37',2026,'Improve employee retention by ensuring comprehensive training plan for property management staff.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r37"]'::jsonb),
('2026-workplan-property-management-p1-t1-r15',2026,'Improve housing authority response time related to vacancy claims, vacant units, and applicants.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r15"]'::jsonb),
('2026-workplan-property-management-p1-t1-r30',2026,'Improve resident centered customer service approach by launching a customer service training program in collaboration with HR','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r30"]'::jsonb),
('2026-workplan-property-management-p1-t1-r31',2026,'Improve resident satisfaction by resolving complaints','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r31"]'::jsonb),
('2026-workplan-property-management-p1-t1-r6',2026,'Improve timeliness, communication and satisfaction with residents and departments around rehabiliation projects. Develop a Rehab resident engagement SOP (pre-notification, communication touchpoints, post-completion survey)','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r6"]'::jsonb),
('2026-workplan-property-management-p1-t1-r14',2026,'Increase accountability with maintenance technicians, community managers, and regional managers to hit target turn times inclusive of an action plan.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r14"]'::jsonb),
('2026-workplan-property-management-p1-t1-r33',2026,'Increase Positive move-outs by connecting residents to resources that would promote economic mobility- homebuyer courses at sites annually','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r33"]'::jsonb),
('2026-workplan-property-management-p1-t1-r32',2026,'Increase resident satisfaction by holding quarterly Community Meetings.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r32"]'::jsonb),
('2026-workplan-property-management-p1-t1-r10',2026,'Lower insurance claims through maintenance technician and resident training','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r10"]'::jsonb),
('2026-workplan-property-management-p1-t1-r20',2026,'Maintain or increase rent collection targets','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r20"]'::jsonb),
('2026-workplan-property-management-p1-t1-r18',2026,'Reduce average controllable cost by Implementing Enterprise-level contract opportunities and bulk purchase opportunities','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r18"]'::jsonb),
('2026-workplan-property-management-p1-t1-r11',2026,'Reduce repair and restoration costs for water damage and restorations costs by performing work in house.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r11"]'::jsonb),
('2026-workplan-property-management-p1-t1-r12',2026,'Reduce repairs and maintenance line item in budgets by 5%.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r12"]'::jsonb),
('2026-workplan-property-management-p1-t1-r28',2026,'Reduce time to fill for PM staffing vacancies and plan for coverage of vacancy which includes communications to residents.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r28"]'::jsonb),
('2026-workplan-property-management-p1-t1-r16',2026,'Reduce vacancy loss and economic vacancy by holding regional managers accountable for filling vacant units.','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r16"]'::jsonb),
('2026-workplan-property-management-p1-t1-r19',2026,'Reduce vendor use by increasing capacity and training of maintainance techs. 5%','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r19"]'::jsonb),
('2026-workplan-property-management-p1-t1-r24',2026,'Zero noncompliance','Property Management','Property Management.pdf','["workplan-property-management-p1-t1-r24"]'::jsonb),
('2026-workplan-real-estate-development-p2-t1-r9',2026,'All team members who want Leadership Development Plans have them.','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p2-t1-r9"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r5',2026,'Close and NTP Issued for College Ave Phase 2 - 10% construction complete by year end','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r5"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r4',2026,'Close and NTP Issued for Cornerstone Apartments - 100% closed by 12/31/26','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r4"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r10',2026,'Close and NTP Issued for NEPA Preservation Deal - 65% complete by year end','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r10"]'::jsonb),
('2026-workplan-real-estate-development-p2-t1-r4',2026,'Create an evaluation tool to determine the efficiency of the new department structure.','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p2-t1-r4"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r21',2026,'Create and implement a page-turn policy during design to reduce change orders','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r21"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r13',2026,'Deliver Projected Development Fee Revenue as Planned','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r13"]'::jsonb),
('2026-workplan-real-estate-development-p2-t1-r2',2026,'Develop a compliance and policy checklist for RED deals at different stages (application, predevelopment, construction, and stabilization)','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p2-t1-r2"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r19',2026,'Develop a policy of non-negotiables for LPAs','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r19"]'::jsonb),
('2026-workplan-real-estate-development-p2-t1-r1',2026,'Develop and implement contractor performance scorecards and debriefs after project completion.','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p2-t1-r1"]'::jsonb),
('2026-workplan-real-estate-development-p2-t1-r12',2026,'Develop construction value engineering guidelines to assess tradeoffs without compromising long term quality - inform revisions to the HDC Design Guide Standards.','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p2-t1-r12"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r17',2026,'Develop coordinated policy for protocol and coordinating between FIN, RED and CR to approach banks/foundations with aligned asks, prioritizing either development or operations based on donor fit and impact.','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r17"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r14',2026,'Develop enterprise level capital strategy in collaboration with FIN for revolving loan to support early stage predevelopment (temporary loan to permanent financing).','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r14"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r11',2026,'Develop portfolio mix metrics that can be used as part of the evaluation of prospective RED projects of acquisitions','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r11"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r23',2026,'Develop process so that all invoices will be processed within 7 days of receipt','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r23"]'::jsonb),
('2026-workplan-real-estate-development-p2-t1-r11',2026,'Develop strategy and process for PM and Maintenance representative input (pre and post production) - inform revisions to HDC Design Guide Standards.','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p2-t1-r11"]'::jsonb),
('2026-workplan-real-estate-development-p2-t1-r6',2026,'Develop strategy and process for resident feedback loop (pre and post production) - inform revisions to HDC Design Guide Standards. Track number of design changes informed by residents.','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p2-t1-r6"]'::jsonb),
('2026-workplan-real-estate-development-p2-t1-r3',2026,'Develop strategy for preparing for financial and PM hand off protocol for development hand off post construction.','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p2-t1-r3"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r15',2026,'Develop strategy to maximize permanent debt on LIHTC deals (consider Market Rate Units, internal reserves to increase income) 2026 baseline measurement - year over year increase moving forward.','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r15"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r18',2026,'Diversify deal structure by researching and identifying 5 new funding resources and 3 new deal structures to enable deals to be feasible in the uncertain financial times.','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r18"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r8',2026,'Flats 5- 100% construction completion and placed in service','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r8"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r9',2026,'HOP-New Freedom, Landisville 1, St. Stanislaus','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r9"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r22',2026,'Implement schedule to ensure applications will be complete 1 week before due date','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r22"]'::jsonb),
('2026-workplan-real-estate-development-p2-t1-r7',2026,'Improve satisfaction with external and internal partners. Create a continuous improvement feed back loop to the RED department that includes Lessons Learned (GC, Architect, consultants, PM, RS, Finance, CR) after each project within 1 month of completion. Feedback to be included in Lessons Learned SOP.','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p2-t1-r7"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r16',2026,'NEPA Preservation deal achieved at closing within deferred dev target','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r16"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r7',2026,'Prepare and submit 9% LIHTC Application for Bucks Co (PA)','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r7"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r6',2026,'Prepare and submit 9% LIHTC Application for Smyrna Phase 2 (DE)','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r6"]'::jsonb),
('2026-workplan-real-estate-development-p2-t1-r13',2026,'Reduce insurance risk and cost by building an insurance risk assessment into the design phase checklist to mitgate insurance risk - Builder''s risk and property insurance.','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p2-t1-r13"]'::jsonb),
('2026-workplan-real-estate-development-p1-t1-r24',2026,'Reduce time to execute development related documents by implementing Electronic Signature Protocol for HDC RED staff and partners','Real Estate Development','Real Estate Development.pdf','["workplan-real-estate-development-p1-t1-r24"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r12',2026,'Develop strategy to increase home-buyer educational opportunities.','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r12"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r20',2026,'Improve participation in HDC organized programs and events by direct outreach and personal connection to residents.(Response rate in surveys - GOAL 30%)','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r20"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r13',2026,'Improve rent collection by working with residents who are behind to collect the rent through a documented and tracked referral process.','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r13"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r18',2026,'Improve service delivery partnership connection (Develop a partnership impact map tied to priorities)','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r18"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r16',2026,'Improve the data integrity and analysis of resident services key performance indicators. (monthly and quarterly reports with trend analysis)','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r16"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r4',2026,'Improve timeliness, communication and satisfaction with residents and departments around rehabiliation projects.','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r4"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r24',2026,'Increase #Resident Service Coordinators Engaged in Leadership Development Plans','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r24"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r21',2026,'Leverage strategic partnerships for housing stability, financial capability, health and wellness; develop a partnership impact map','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r21","workplan-resident-services-p1-t1-r22"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r6',2026,'Leverage Strategic Partnerships to offer support and services to residents in priority areas (Housing Stability/Financial Capability/Health & Wellness)-Programs & Services & Funds','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r6"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r17',2026,'Optimize functionality of resident referral system to streamline process, follow up with residents, and close the loop to increase housing stability.','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r17"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r8',2026,'Partner with CR on grant writing to bring contribute revenue for Resident Services','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r8"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r9',2026,'Partner with CR on supporting the launch of a faith based giving H&O Fundraising Campaign','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r9"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r10',2026,'Reduce accounts recieveable by working with residents who are behind to collect the rent through a documented and tracked referral process & Reduce number of troubled properties to <9. Collaborate with FIN and PM on developing a strategy for troubled properties - focusing on a detailed plan for 3 properties per quarter','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r10"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r15',2026,'Resolve issues with tracking and follow-up with residents to service delivery partners and document outcomes. Implement referral management system to track residents connected to Service Delivery Partners that will create monthly reports and identify resident trends that might need to be addressed. (Res. Connect or TBD System)','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r15"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r26',2026,'Retool and implement more streamlined and supportive onboarding experience','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r26","workplan-resident-services-p1-t1-r22"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r25',2026,'Strengthen team building of department','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r25"]'::jsonb),
('2026-workplan-resident-services-p1-t1-r11',2026,'Work with residents who are at risk of eviction or non-renewal to maintain housing stability.','Resident Services','Resident Services.pdf','["workplan-resident-services-p1-t1-r11"]'::jsonb)
on conflict(id) do nothing;

create or replace function compass_private.validate_weekly_document(document jsonb,finalizing boolean)
returns void language plpgsql security definer set search_path='' as $$
declare entry jsonb; task jsonb; enterprise_count integer := 0;
begin
 if jsonb_typeof(document) is distinct from 'object' or jsonb_typeof(document->'entries') is distinct from 'array'
 or jsonb_array_length(document->'entries')>12 or length(document::text)>100000 then raise exception 'Invalid weekly record'; end if;
 if length(coalesce(document->>'note',''))>2000 then raise exception 'Weekly context is too long'; end if;
 -- Legacy submissions remain readable; newly typed entries have explicit links.
 for entry in select value from jsonb_array_elements(document->'entries') loop
  if entry ? 'commitmentType' and coalesce(entry->>'commitmentType','') not in ('enterprise','department') then raise exception 'Choose a commitment type'; end if;
  if nullif(entry->>'departmentPriorityId','') is not null and (entry->>'commitmentType' is distinct from 'department' or nullif(entry->>'objectiveId','') is not null) then raise exception 'Choose one commitment type per priority'; end if;
  if entry->>'commitmentType'='department' and nullif(entry->>'objectiveId','') is not null then raise exception 'A departmental priority cannot also be an enterprise commitment'; end if;
  if entry->>'commitmentType'='enterprise' and nullif(entry->>'departmentPriorityId','') is not null then raise exception 'Choose one commitment type per priority'; end if;
  if nullif(entry->>'departmentPriorityId','') is not null and not exists(select 1 from compass_private.departmental_priorities d where d.id=entry->>'departmentPriorityId' and d.active) then raise exception 'Choose an active department workplan priority'; end if;
  if finalizing and entry->>'commitmentType'='department' and nullif(entry->>'departmentPriorityId','') is null then raise exception 'Choose the department workplan priority for each departmental commitment'; end if;
  if finalizing and entry->>'commitmentType'='enterprise' and nullif(entry->>'objectiveId','') is null then raise exception 'Choose an enterprise objective for each enterprise commitment'; end if;
 end loop;
 if not finalizing then return; end if;
 if coalesce(document->>'capacity','') not in ('enterprise','capacity') then raise exception 'Choose your enterprise capacity'; end if;
 for entry in select value from jsonb_array_elements(document->'entries') loop
  if length(trim(coalesce(entry->>'title',''))) not between 1 and 250
    or length(trim(coalesce(entry->>'desiredResult',''))) not between 1 and 2000 then raise exception 'Each priority needs a title and desired result'; end if;
  if coalesce(entry->>'due','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'A priority due date is required'; end if;
  perform (entry->>'due')::date;
  if coalesce(entry->>'status','') not in ('good','watch','risk') then raise exception 'Invalid priority status'; end if;
  if coalesce(entry->>'objectiveId','')<>'' then
   if not exists(select 1 from compass_private.enterprise_objectives where id=entry->>'objectiveId' and active) then raise exception 'Unknown enterprise objective'; end if;
   enterprise_count := enterprise_count+1;
  end if;
  if jsonb_typeof(entry->'tasks') is distinct from 'array' or jsonb_array_length(entry->'tasks')>30 then raise exception 'Invalid action items'; end if;
  for task in select value from jsonb_array_elements(entry->'tasks') loop
   if length(trim(coalesce(task->>'title',''))) not between 1 and 250
    or coalesce(task->>'status','') not in ('open','in_progress','complete','blocked','cancelled')
    or not exists(select 1 from compass_private.positions where id=task->>'owner' and active) then raise exception 'Action items need a title, responsible position and status'; end if;
   if coalesce(task->>'due','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'An action item due date is required'; end if;
   perform (task->>'due')::date;
  end loop;
 end loop;
 if document->>'capacity'='enterprise' and enterprise_count=0 then raise exception 'Link a priority to an enterprise objective or choose the capacity option'; end if;
 if document->>'capacity'='capacity' and enterprise_count>0 then raise exception 'Remove enterprise links before submitting an opt-out'; end if;
end; $$;

create or replace function public.compass_weekly_context(week_date date default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare selected_week date:=coalesce(week_date,date_trunc('week',now() at time zone 'America/New_York')::date);
begin
 if not compass_private.weekly_access('',false) then raise exception 'Weekly access required' using errcode='42501'; end if;
 if extract(isodow from selected_week)<>1 then raise exception 'Select a Monday'; end if;
 perform compass_private.weekly_maintain();
 return jsonb_build_object('week',selected_week,'startsOn',(select starts_on from compass_private.weekly_settings),
  'boundaries',(select to_jsonb(b) from compass_private.weekly_boundaries(selected_week) b),
  'positionId',compass_private.current_position(),
  'positionTitle',coalesce((select title from compass_private.positions where id=compass_private.current_position()),(select position_title from compass_private.members where user_id=auth.uid())),
  'departmentalObjectives',(select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'department',d.department,'year',d.year,'active',d.active) order by d.department,d.title),'[]') from compass_private.departmental_priorities d where d.year=extract(year from selected_week)),
  'positions',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'title',p.title,'department',p.department,
    'canEdit',compass_private.weekly_access(p.id,true),'required',p.required,
    'points',case when compass_private.weekly_score_access(p.id) then 100+coalesce((select sum(points) from compass_private.weekly_points where position_id=p.id),0) else null end)), '[]')
    from compass_private.positions p where p.active),
  'objectives',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title,'area',area,'period',period)),'[]') from compass_private.enterprise_objectives where active),
  'records',(select coalesce(jsonb_agg(jsonb_build_object('positionId',r.position_id,'week',r.week,'expected',r.expected,'exempt',r.exempt,
    'draft',case when compass_private.weekly_draft_access(r.position_id) then r.draft else null end,
    'submitted',r.submitted,'revision',r.revision,'submittedRevision',r.submitted_revision,'firstAt',r.first_submitted_at,'lastAt',r.last_submitted_at)), '[]')
    from compass_private.weekly_records r where r.week=selected_week),
  'events',(select coalesce(jsonb_agg(jsonb_build_object('positionId',position_id,'week',week,'points',points,'outcome',outcome)),'[]')
    from compass_private.weekly_points where extract(year from week)=extract(year from selected_week) and compass_private.weekly_score_access(position_id)));
end; $$;

create or replace function compass_private.save_weekly(payload jsonb,finalizing boolean,at_time timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare position_key text := payload->>'positionId'; week_date date := (payload->>'week')::date;
 document jsonb := payload->'draft'; rec compass_private.weekly_records; boundary record;
 event_points integer; event_outcome text; correction text := trim(coalesce(payload->>'correctionReason',''));
begin
 if not compass_private.weekly_access(position_key,true) then raise exception 'You cannot edit this position' using errcode='42501'; end if;
 if not exists(select 1 from compass_private.positions where id=position_key and active) then raise exception 'Inactive position'; end if;
 if week_date < (select starts_on from compass_private.weekly_settings) then raise exception 'This cycle predates weekly tracking; use the future historical import workflow'; end if;
 if not(payload ? 'expectedRevision') then raise exception 'Reload the weekly record before saving'; end if;
 perform compass_private.validate_weekly_document(document,finalizing);
 if exists(select 1 from jsonb_array_elements(document->'entries') e join compass_private.departmental_priorities d on d.id=e->>'departmentPriorityId' where d.year<>extract(year from week_date)) then raise exception 'Choose a departmental priority for the submission year'; end if;
 select * into boundary from compass_private.weekly_boundaries(week_date);
 if finalizing and at_time<boundary.opens_at then raise exception 'This week has not started'; end if;
 insert into compass_private.weekly_records(position_id,week) values(position_key,week_date) on conflict do nothing;
 select * into rec from compass_private.weekly_records where position_id=position_key and week=week_date for update;
 if (payload->>'expectedRevision') is null then raise exception 'A numeric revision is required'; end if;
 if rec.revision is distinct from (payload->>'expectedRevision')::integer then
  if rec.updated_by=auth.uid() and rec.draft=document and (not finalizing or rec.submitted=document) then return to_jsonb(rec); end if;
  raise exception 'This record changed; reload it before saving';
 end if;
 if rec.exempt then raise exception 'This position is exempt for this week'; end if;
 if at_time>boundary.grace_at then
  if not exists(select 1 from compass_private.members where user_id=auth.uid() and active and (compass_private.is_admin() or compass_private.current_position_roles() && array['director']))
    or length(correction)<3 then raise exception 'After grace, a Director or Admin correction reason is required'; end if;
 end if;
 update compass_private.weekly_records set draft=document,revision=revision+1,updated_by=auth.uid(),updated_at=at_time,
  submitted=case when finalizing then document else submitted end,
  first_submitted_at=case when finalizing then coalesce(first_submitted_at,at_time) else first_submitted_at end,
  last_submitted_at=case when finalizing then at_time else last_submitted_at end,
  submitted_revision=case when finalizing then revision+1 else submitted_revision end
 where position_id=position_key and week=week_date returning * into rec;
 if finalizing then
  insert into compass_private.weekly_revisions(position_id,week,revision,snapshot,actor_id,recorded_at,correction_reason)
   values(position_key,week_date,rec.revision,document,auth.uid(),at_time,nullif(correction,''));
  if rec.first_submitted_at<=boundary.deadline_at then
    event_points := case when document->>'capacity'='enterprise' then 5 when jsonb_array_length(document->'entries')>0 then 3 else 0 end;
    event_outcome := case when event_points=5 then 'on_time_priority' when event_points=3 then 'on_time_departmental' else 'on_time_opt_out' end;
  elsif rec.first_submitted_at<=boundary.grace_at then event_points:=-3;event_outcome:='late_submission';
  else event_points:=-10;event_outcome:='missed_submission'; end if;
  insert into compass_private.weekly_points(position_id,week,points,outcome,recorded_at)
  values(position_key,week_date,event_points,event_outcome,at_time)
  on conflict(position_id,week) do update set points=excluded.points,outcome=excluded.outcome,recorded_at=excluded.recorded_at
  where at_time<=boundary.deadline_at;
 end if;
 return to_jsonb(rec);
end; $$;

insert into compass_private.releases(version) values('20260925_departmental_priorities') on conflict do nothing;
notify pgrst,'reload schema';
commit;
