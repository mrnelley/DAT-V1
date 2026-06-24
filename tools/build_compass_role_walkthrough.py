import argparse
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


DEFAULT_OUTPUT_PATH = Path("deliverables/Compass_Role_Walkthrough.pdf")

NAVY = colors.HexColor("#17324D")
TEAL = colors.HexColor("#168B91")
PALE_TEAL = colors.HexColor("#E9F4F3")
PALE_BLUE = colors.HexColor("#EEF3F7")
INK = colors.HexColor("#243442")
MUTED = colors.HexColor("#5C6D79")
LINE = colors.HexColor("#CBD7DE")
WHITE = colors.white

PAGE_WIDTH, PAGE_HEIGHT = letter
LEFT = 0.72 * inch
RIGHT = 0.72 * inch
TOP = 0.78 * inch
BOTTOM = 0.58 * inch


def make_styles():
    styles = getSampleStyleSheet()
    return {
        "cover_kicker": ParagraphStyle(
            "CoverKicker",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=TEAL,
            spaceAfter=10,
            tracking=1.2,
        ),
        "cover_title": ParagraphStyle(
            "CoverTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=36,
            leading=39,
            textColor=NAVY,
            alignment=TA_LEFT,
            spaceAfter=5,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=17,
            leading=21,
            textColor=INK,
            spaceAfter=0,
        ),
        "section": ParagraphStyle(
            "Section",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=NAVY,
            spaceBefore=0,
            spaceAfter=13,
        ),
        "subsection": ParagraphStyle(
            "Subsection",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=14,
            textColor=TEAL,
            spaceBefore=5,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.1,
            leading=12.5,
            textColor=INK,
            spaceAfter=4.5,
        ),
        "step": ParagraphStyle(
            "Step",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.1,
            leading=12.5,
            textColor=INK,
            leftIndent=0,
            firstLineIndent=0,
            spaceAfter=6,
        ),
        "callout": ParagraphStyle(
            "Callout",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=12,
            textColor=INK,
            spaceAfter=0,
        ),
        "table_header": ParagraphStyle(
            "TableHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=WHITE,
        ),
        "table_cell": ParagraphStyle(
            "TableCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.7,
            leading=9.6,
            textColor=INK,
        ),
        "table_cell_bold": ParagraphStyle(
            "TableCellBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.7,
            leading=9.6,
            textColor=NAVY,
        ),
    }


STYLES = make_styles()


def p(text, style="body"):
    return Paragraph(text, STYLES[style])


def step(number, text):
    return p(f"<b>{number}.</b> {text}", "step")


def subsection(title, steps):
    flowables = [p(title, "subsection")]
    flowables.extend(step(i, text) for i, text in enumerate(steps, start=1))
    return KeepTogether(flowables)


def callout(label, text):
    content = p(f"<b>{label}:</b> {text}", "callout")
    box = Table([[content]], colWidths=[PAGE_WIDTH - LEFT - RIGHT])
    box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE_TEAL),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return box


def nav_line(label, text):
    return p(f"<b>{label}:</b> {text}", "body")


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(LEFT, PAGE_HEIGHT - 39, PAGE_WIDTH - RIGHT, PAGE_HEIGHT - 39)
    canvas.setFont("Helvetica-Bold", 7.6)
    canvas.setFillColor(NAVY)
    canvas.drawString(LEFT, PAGE_HEIGHT - 30, "HDC COMPASS  |  ROLE WALKTHROUGH")

    canvas.line(LEFT, 34, PAGE_WIDTH - RIGHT, 34)
    canvas.setFont("Helvetica", 7.4)
    canvas.setFillColor(MUTED)
    canvas.drawString(LEFT, 22, "Compass operating guide  |  June 2026")
    canvas.drawRightString(PAGE_WIDTH - RIGHT, 22, str(doc.page))
    canvas.restoreState()


def operating_model_table():
    rows = [
        ["Level", "Who Defines It", "What It Means", "Where It Lives"],
        [
            "Strategic Pillar",
            "ELT",
            "Long-range strategic structure set through 2030.",
            "Metrics; pillar detail",
        ],
        [
            "Enterprise Priority",
            "ELT",
            "A quarterly organizational commitment tied to one pillar and KPI evidence.",
            "Company Dashboard; Enterprise Priorities",
        ],
        [
            "Department Workplan",
            "OLT / department lead",
            "A department's plan for contributing to the strategy or an Enterprise Priority.",
            "Department Workplans",
        ],
        [
            "Weekly Priority",
            "Individual owner",
            "The person's ranked commitment for the week.",
            "Weekly Tracker",
        ],
        [
            "Action Item",
            "Weekly Priority owner",
            "A task that must belong to a Weekly Priority.",
            "Weekly Tracker; Data Table",
        ],
        [
            "Day-to-Day Task",
            "Any user",
            "A one-off task that does not need to belong to a Weekly Priority.",
            "Day-to-Day Tasks; Data Table",
        ],
        [
            "Stuck",
            "Any user",
            "A named blocker attached to a tracked task or Action Item.",
            "Stucks; Huddles; Data Table",
        ],
    ]

    formatted = []
    for row_index, row in enumerate(rows):
        style = "table_header" if row_index == 0 else "table_cell"
        formatted.append(
            [
                p(cell, "table_cell_bold" if row_index > 0 and column == 0 else style)
                for column, cell in enumerate(row)
            ]
        )

    table = Table(
        formatted,
        colWidths=[1.10 * inch, 1.08 * inch, 2.55 * inch, 1.55 * inch],
        repeatRows=1,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE_BLUE]),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def build_story():
    story = []

    story.extend(
        [
            Spacer(1, 1.65 * inch),
            p("OPERATING GUIDE", "cover_kicker"),
            p("Compass", "cover_title"),
            p("Role-Based Click-Through Walkthrough", "cover_subtitle"),
            Spacer(1, 2.55 * inch),
            Table(
                [["ELT", "OLT", "INDIVIDUAL USERS", "ADVOCACY + ADMIN"]],
                colWidths=[1.1 * inch, 1.1 * inch, 1.9 * inch, 1.75 * inch],
                style=TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), PALE_TEAL),
                        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                        ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
                        ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
                        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 7.8),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("TOPPADDING", (0, 0), (-1, -1), 7),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                    ]
                ),
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("1. The Operating Model", "section"),
            operating_model_table(),
            Spacer(1, 12),
            p("Navigation Map", "subsection"),
            nav_line(
                "Dashboards",
                "Company Dashboard &gt; My Dashboard &gt; Enterprise Priorities &gt; Data Table (administrators only).",
            ),
            nav_line("Planning", "Department Workplans."),
            nav_line(
                "Weekly execution",
                "Weekly Tracker &gt; Day-to-Day Tasks &gt; Huddles &gt; Stucks.",
            ),
            nav_line("Measurement and strategy-wide visualization", "Metrics."),
            Spacer(1, 6),
            callout(
                "Language rule",
                "Use Enterprise Priority for the company-level quarterly object.",
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("2. ELT: Define the Strategic Structure", "section"),
            subsection(
                "Maintain Strategic Pillars Through 2030",
                [
                    "Sign in with an ELT profile. ELT users open to Company Dashboard by default.",
                    "Click <b>Metrics</b> in the left navigation. Metrics is the all-at-once strategic-plan view by pillar.",
                    "Click the desired pillar. The pillar detail opens with aligned Enterprise Priorities, Key Objectives, KPIs, and long-term success metrics.",
                    "Review the pillar's success metrics and aligned work. Use this view to maintain the 2030 structure and judge whether the quarter's work supports it.",
                ],
            ),
            Spacer(1, 12),
            subsection(
                "Set the Quarter Theme and Enterprise Priorities",
                [
                    "Open <b>Company Dashboard</b>. Confirm the active quarter and the theme chip at the top of the executive pulse.",
                    "Open <b>Metrics</b>, then click the pillar the priority supports. This keeps each Enterprise Priority strategically aligned.",
                    "Click <b>Add Enterprise Priority</b>. Enter the priority name and Key Objective. Each Key Objective carries the owner, KPI / Success Measure, and End Target / Desired Result.",
                    "Click <b>Save</b>. The Enterprise Priority appears under the selected pillar with objective-level KPI tracking.",
                ],
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("3. ELT: Calibrate KPIs and Review Risk", "section"),
            subsection(
                "Set and Calibrate KPI Targets",
                [
                    "Click <b>Metrics</b>, then open the aligned pillar. Locate the Enterprise Priority to calibrate.",
                    "Click <b>Objective</b> beside the Enterprise Priority. Add the Key Objective, owner, department, workplan access, and notes.",
                    "Click <b>KPI</b> beside the Key Objective. Enter the KPI / Success Measure, End Target / Desired Result, current progress note, and status.",
                    "Click <b>Save</b>. The KPI remains manual text evidence underneath the Key Objective.",
                ],
            ),
            Spacer(1, 10),
            subsection(
                "Review Needs Attention / Off Track Items",
                [
                    "Open <b>Company Dashboard</b>. Start with Off Track and Needs Attention counts at the top.",
                    "Use Team Filter only when a narrower ownership read is needed. The default executive posture is the complete company view.",
                    "Click an Enterprise Priority row. Review its Key Objective owners, KPI evidence, connected department plans, tasks, and stucks.",
                    "Decide the response. Resource it, reset the commitment, name the next decision, or send it back to OLT with a clear owner and next step.",
                ],
            ),
            Spacer(1, 8),
            callout(
                "Escalation standard",
                "OLT should bring ELT strategic risk, decisions requiring ELT authority, policy/board/public communications, major financial/legal/reputational risk, or major resource reallocation.",
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("4. OLT Together: Weekly Operating Rhythm", "section"),
            subsection(
                "Monday Huddle",
                [
                    "Click <b>Huddles</b> in the left navigation. Open the scheduled OLT Monday huddle or click <b>Schedule Huddle</b>.",
                    "Confirm attendees and agenda. Include weekly priorities, connected workflows, open stucks, and cross-department dependencies.",
                    "Open <b>Weekly Tracker</b> during the discussion. Review each person's current-week priorities and linked department workplans or Enterprise Priorities.",
                    "Members can add agenda items directly in the huddle. Add a huddle item for each decision or follow-up and name the owner or next commitment.",
                ],
            ),
            Spacer(1, 5),
            subsection(
                "Wednesday Check-In",
                [
                    "Open the Wednesday huddle. Keep the check-in focused on changes since Monday.",
                    "Review Weekly Tracker statuses. Ask what is moving, what needs attention, and what is off track.",
                    "Open <b>Stucks</b>. Confirm every blocker has a named person who can help.",
                ],
            ),
            Spacer(1, 5),
            subsection(
                "Friday Review",
                [
                    "Open <b>Stucks</b> and filter to active items. Review unresolved blockers and at-risk weekly work.",
                    "Decide resolve-in-OLT versus escalate-to-ELT. Use the escalation standard and bring a proposed solution.",
                    "Open <b>Weekly Tracker</b> and move to the upcoming week. Confirm each OLT member has submitted next-week priorities.",
                ],
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("5. OLT Individual: Plan and Track the Week", "section"),
            subsection(
                "Create or Maintain a Department Workplan",
                [
                    "Click <b>Department Workplans</b>. Use My Workplans or the relevant department scope.",
                    "Click <b>Add Workplan</b>. Enter the title, department, lead, quarter, strategic pillar, status, and optional Enterprise Priority links.",
                    "Save the workplan. The workplan becomes available as an alignment option in Weekly Tracker.",
                ],
            ),
            Spacer(1, 8),
            subsection(
                "Create Weekly Priorities and Action Items",
                [
                    "Click <b>Weekly Tracker</b>. Your row appears first and is highlighted. The default order after you is Dana, Tammie, Sam, Kim, Meg, Jaime, Kelly, Michele, the rest of OLT, then staff.",
                    "Choose the current or upcoming week. Use upcoming week on Friday when submitting next week's priorities.",
                    "Click <b>Set My Weekly Priority</b> or an empty priority card. Enter the weekly commitment, due date, status, and support/risk note.",
                    "Select either a Department Objective / Workplan or an Enterprise Priority. Weekly Tracker priorities are for change-the-business work and require one of those alignment sources.",
                    "Add the first Action Item and save. Action Items created here remain attached to the Weekly Priority and are tracked in Data Table.",
                    "Click the priority card later to update it. Add Action Items, update status, carry work forward, or review detail.",
                    "Use the row reorder handle to customize how you see the people list for your own weekly input workflow.",
                ],
            ),
            Spacer(1, 5),
            callout(
                "Friday submission",
                "On Friday, move Weekly Tracker to the upcoming week and save next week's priorities before the OLT review closes.",
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("6. OLT Individual: Day-to-Day Tasks and Stucks", "section"),
            subsection(
                "Track a One-Off Task",
                [
                    "Click <b>Day-to-Day Tasks</b>. Use this for one-off routine tasks, not Action Items that belong under Weekly Priorities.",
                    "Type directly into the new sticky-note row and press Enter. The task saves immediately and a fresh input row appears at the bottom.",
                    "Use the drag handle or pin control as needed. Pinned work stays at the top; the handle reorders the queue.",
                    "Click the check-circle when complete. The row flies out and completion is logged.",
                ],
            ),
            Spacer(1, 11),
            subsection(
                "Issue a Stuck",
                [
                    "From a Weekly Tracker Action Item or Day-to-Day Task row, click <b>Issue a Stuck</b>. The source task is carried into the form.",
                    "Describe the blocker and select who can help. The person stuck defaults from the current task context.",
                    "Click <b>Issue Stuck</b>. The blocker appears in Stucks and is available for huddle review.",
                ],
            ),
            Spacer(1, 10),
            callout(
                "Data rule",
                "Every Action Item, queued task, and Stuck appears in the administrator Data Table. Weekly Action Items and queued tasks remain distinct records because their planning meaning is different.",
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("7. Dana and Nina: Advocacy Activity Workflow", "section"),
            subsection(
                "Use the Partner Register",
                [
                    "Sign in as Dana or Nina. Dana can manage her own advocacy records; Nina has delegated access with her own login.",
                    "Open Dana's Advocacy Command Center. Start with <b>Partner Register</b>, the app version of the master partner sheet.",
                    "Review each partner's circle, stage, lead/support roles, Last Touched date, next step, and target completion date.",
                    "Click <b>Profile</b> to open the partner profile area without leaving the dashboard.",
                ],
            ),
            Spacer(1, 8),
            subsection(
                "Log Touch Reports",
                [
                    "Open <b>Touch Reports</b>. Choose the partner tab that matches the touch.",
                    "Click <b>Log Touch Report</b>. Enter touch type, touch date, report notes, next step, and target completion date.",
                    "Save the report. The partner's Last Touched field updates and a Dana calendar follow-up is created from the target completion date.",
                    "Audit chips show who created, updated, or deleted the report and when. Deleted reports remain visible as audit records.",
                ],
            ),
            Spacer(1, 8),
            subsection(
                "Use Profiles, Calendar, and Teams Cards",
                [
                    "Open <b>Partner Profile</b> to see profile summary, goals, relationship history, assigned stewardship, and recent activity.",
                    "Use Dana's calendar to see touch-report follow-ups. Nina can see this delegated calendar lane without using Dana's account.",
                    "Open <b>Teams Adaptive Cards</b> to preview the card generated by the advocacy touchpoint workflow.",
                    "Keep relationship stewardship in Salesforce. Compass supports that system by logging advocacy activity and operational follow-through.",
                ],
            ),
            PageBreak(),
        ]
    )

    story.extend(
        [
            p("8. Administrators, Calendar, and Measurement", "section"),
            subsection(
                "Control Component Access and Governance",
                [
                    "Sign in as <b>Compass Admin</b>. Open <b>Administration &gt; Feature Rollout</b>.",
                    "Select an individual user, such as Gigi. Toggle component-level access such as <b>Stuck Actions</b> on or off for that person.",
                    "Use <b>Property Governance Assignments</b> to change the Community Manager or Resident Services Lead for a property.",
                    "Reset a user's feature switches to role defaults when the pilot configuration should be cleared.",
                ],
            ),
            Spacer(1, 8),
            subsection(
                "Manage the Organization-Wide Calendar",
                [
                    "Open <b>Company Dashboard</b> and review the org-wide Calendar.",
                    "Use org-wide calendar items only for dates that apply broadly: conferences, employee celebrations, holidays, HR trainings, Pulse Survey dates, and new hire announcements.",
                    "Compass Admin owns preassigned dates such as holidays, HR trainings, Pulse Survey windows, and new hire announcements.",
                    "ELT and OLT users can add org-wide events. Staff use personal calendar events unless the date applies across the organization.",
                ],
            ),
            Spacer(1, 8),
            subsection(
                "Audit All Work in Data Table",
                [
                    "Open <b>Dashboards</b> in the left navigation. Data Table appears only for administrators.",
                    "Click <b>Data Table</b>. The default All Work view includes Weekly Action Items, queued tasks, and Stucks.",
                    "Use the tabs to isolate a record type. Choose Weekly Action Items, Queued Tasks, or Stucks.",
                    "Search by action, owner, status, source/alignment, or strategic pillar. Use this as the operational audit trail.",
                ],
            ),
            Spacer(1, 12),
            subsection(
                "Measure the 2030 Strategic Plan",
                [
                    "Click <b>Metrics</b>. This is the organization-wide visualization of everything by strategic pillar.",
                    "Review each pillar's Enterprise Priorities, KPI evidence, workplans, and actions. Use the view for strategic connectedness rather than quarter-over-quarter pillar completion.",
                    "Click a pillar for detail. ELT can add Enterprise Priorities, Key Objectives, and KPIs from this view.",
                ],
            ),
            Spacer(1, 10),
            callout(
                "Separation of purpose",
                "Company Dashboard is ELT's quarterly pulse check. Metrics is the broader strategic-plan measurement view. Data Table is the administrator's record-level audit surface.",
            ),
        ]
    )
    return story


def build(output_path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=LEFT,
        rightMargin=RIGHT,
        topMargin=TOP,
        bottomMargin=BOTTOM,
        title="Compass Role-Based Click-Through Walkthrough",
        author="HDC MidAtlantic",
        subject="Compass operating guide",
    )
    frame = Frame(
        LEFT,
        BOTTOM,
        PAGE_WIDTH - LEFT - RIGHT,
        PAGE_HEIGHT - TOP - BOTTOM,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    doc.addPageTemplates([PageTemplate(id="Compass", frames=[frame], onPage=header_footer)])
    doc.build(build_story())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    args = parser.parse_args()
    build(args.output)
