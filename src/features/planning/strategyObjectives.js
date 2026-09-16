// Source objective titles, grouped by strategy code. Long-form source descriptions
// remain a separate content-import task; these titles must not stand in for descriptions.
const groups = {
  '1.1': ['Advance Strategic Acquisitions', 'Strengthen Rehabilitation & Preservation of Affordable Housing', 'Develop New Affordable Housing'],
  '1.2': ['Grow Enterprise-level Capital for Predevelopment', 'Expand Strategic Partnerships to reduce funding gaps'],
  '1.3': ['Explore Homeownership Development Initiatives', 'Explore innovative housing models'],
  '4.1': ['Strengthen talent management strategy', 'Strengthen workplace culture', 'Expand organizational collaboration'],
  '4.2': ['Expand cross-training and leadership development programs', 'Develop leadership succession planning strategies', 'Invest in leadership development'],
  '4.3': ['Strengthen Operational Efficiency', 'Deploy technology solutions (including AI) that enhance both efficiency and accessibility', 'Increase investment in IT and cybersecurity to protect organizational assets and data'],
  '5.1': ['Strengthen collaborative model of operations and inter-departmental synergy across departments', 'Strengthen Asset Management Strategies'],
  '5.2': ['Increase Brand Awareness', 'Grow long-term financial resilience through philanthropic engagement'],
  '5.3': ['Evaluate 3rd party property management business', 'Assess the profitability and mission-related return on investment of key business lines', 'Implement Impact Evaluation Framework', 'Advance innovative design approaches to real estate development informed by community input and stakeholder engagement'],
  '3.1': ['Establish a formal, proactive advocacy framework', 'Identify and promote key policy priorities'],
  '3.2': ['Build local, state, and federal advocacy capacity', 'Develop, and empower resident leaders to share their stories of impact'],
  '3.3': ['Elevate HDC leadership and Board of Directors in Advocacy work', 'Explore the feasibility and strategic need of investing additional resources to enhance the execution and reach of advocacy efforts'],
  '2.1': ['Improve the Resident Experience', 'Elevate access to critical resident services', 'Actively promote clear pathways for homeownership, workforce development, and job advancement opportunities for all residents', 'Leverage service delivery partners and community partnership to address the needs of residents', 'Continue engagement of executive leadership in resident community meetings', 'Increase resident participation in feedback loop of real estate development projects'],
  '2.2': ['Develop an enterprise-level communication and engagement strategy for residents', 'Improve collaboration and align shared goals between property management and resident services teams to ensure seamless support', 'Embrace a technology solution for transparent tracking, efficient resolution, and proactive communication regarding resident concerns and maintenance requests', 'Increase connection between the Resident Advisory Council and the Board of Directors'],
  '2.3': ['Advance a consistently trauma-informed, customer service-oriented approach across resident interactions and touchpoints', 'Create and implement enterprise-level standards of customer service excellence, with a focus on property management and resident services'],
};
export const strategyAliases = {
  '4.1': 'SUSTAIN Supportive and Collaborative Culture',
  '4.2': 'GROW Leadership',
  '3.2': 'GROW Advocacy Capital & Impact',
  '2.2': 'GROW Resident Communication & Engagement',
};
export const strategyObjectives = Object.entries(groups).flatMap(([strategyId, titles]) =>
  titles.map((title, index) => ({ id: `${strategyId}.${index + 1}`, strategyId, title,
    description: null, descriptionStatus: 'source-transcription-pending',
    mappingStatus: 'confirmed-source-grouping' })));
