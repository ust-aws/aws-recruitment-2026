type PositionSeed = {
  name: string
  office: string
  committee: string
  committeeDescription: string
  description: string
  responsibilities: string[]
  isOpen: boolean
}

export const POSITION_SEEDS: PositionSeed[] = [
  {
    name: "Executive Assistant to the CEO",
    office: "Office of the Chief Executive Officer",
    committee: "Office of the Chief Executive Officer",
    committeeDescription:
      "The Chief Executive Officer (CEO) serves as the highest-ranking executive and primary decision-maker of AWS Builders – UST. The CEO provides strategic direction and overall leadership to all committees, represents the organization in official and external capacities, and ensures compliance with organizational policies and procedures.",
    description:
      "The Executive Assistant supports the CEO in matters related to the organization, coordinates with committees under the CEO, and acts as the CEO's associate.",
    responsibilities: [
      "Assist the CEO with organization-wide matters and initiatives",
      "Coordinate with executive officers and Committee Directors on behalf of the CEO",
      "Assist in organizing executive meetings and activities",
      "Monitor and coordinate tasks delegated by the CEO",
      "Help facilitate communication between the CEO and different committees",
      "Act as the CEO's primary administrative associate",
    ],
    isOpen: true,
  },
  {
    name: "Executive Assistant to the CFO",
    office: "Office of the Chief Finance Officer",
    committee: "Office of the Chief Finance Officer",
    committeeDescription:
      "The Chief Finance Officer (CFO) manages the organization's financial planning, budgeting, fiscal oversight, financial reporting, fundraising, and financial resource management. The CFO also supervises the Finance Committee.",
    description:
      "The Executive Assistant supports the CFO in matters related to financial operations and coordinates with the Finance Committee.",
    responsibilities: [
      "Assist the CFO with financial planning and budgeting matters",
      "Coordinate with the Finance Committee",
      "Assist in organizing financial documents and reports",
      "Help monitor finance-related tasks and deadlines",
      "Assist in coordinating fundraising and financial activities",
      "Act as the CFO's associate",
    ],
    isOpen: true,
  },
  {
    name: "Finance Committee Staff",
    office: "Office of the Chief Finance Officer",
    committee: "Finance Committee",
    committeeDescription:
      "The Finance Committee maintains and facilitates the flow of financial resources for the organization's events and develops initiatives that help guarantee a sustainable and consistent inflow of finances.",
    description:
      "Finance Committee Staff assist in the management, documentation, and facilitation of the organization's financial resources and support financial activities assigned by the Committee Director.",
    responsibilities: [
      "Assist in monitoring the financial resources allocated for organizational activities",
      "Help maintain accurate financial records and documentation",
      "Assist in preparing financial documents and reports",
      "Support the processing and documentation of financial transactions",
      "Assist in fundraising and revenue-generating initiatives",
      "Work on tasks assigned by the Finance Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
  {
    name: "Executive Assistant to the Corporate Secretary",
    office: "Office of the Corporate Secretary",
    committee: "Office of the Corporate Secretary",
    committeeDescription:
      "The Corporate Secretary maintains official records, documents, and organizational archives; supervises the Secretariat Committee; prepares official meeting documents and correspondence; and manages organizational governance and administrative procedures.",
    description:
      "The Executive Assistant supports the Corporate Secretary in administrative and documentation matters and coordinates with the Secretariat Committee.",
    responsibilities: [
      "Assist the Corporate Secretary with administrative matters",
      "Coordinate with the Secretariat Committee",
      "Assist in organizing official records and documents",
      "Support the preparation of meeting minutes, agendas, and correspondence",
      "Monitor administrative tasks and deadlines",
      "Act as the Corporate Secretary's associate",
    ],
    isOpen: true,
  },
  {
    name: "Secretariat Committee Staff",
    office: "Office of the Corporate Secretary",
    committee: "Secretariat Committee",
    committeeDescription:
      "The Secretariat Committee handles the logistical and administrative matters of the organization and develops feedback mechanisms for events, meetings, and activities. It also handles organizational paperwork, member attendance, evaluations, and reports.",
    description:
      "Secretariat Committee Staff assist in the organization's administrative, documentation, attendance monitoring, evaluation, and reporting processes.",
    responsibilities: [
      "Assist in preparing and organizing organizational paperwork",
      "Help maintain administrative records and documents",
      "Assist in monitoring member attendance",
      "Support the preparation and distribution of meeting documents",
      "Assist in developing and distributing feedback and evaluation forms",
      "Help organize and evaluate results and outputs",
      "Assist in preparing reports for organizational submission",
      "Work on tasks assigned by the Secretariat Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
  {
    name: "Executive Assistant to the CRO",
    office: "Office of the Chief Relations Officer",
    committee: "Office of the Chief Relations Officer",
    committeeDescription:
      "The Chief Relations Officer (CRO) manages external communications, public relations, and marketing initiatives. The CRO supervises the External Affairs, Marketing, and Sponsorships Committees and develops and maintains relationships with partner organizations and stakeholders.",
    description:
      "The Executive Assistant supports the CRO in external relations, communications, marketing, sponsorship, and partnership matters.",
    responsibilities: [
      "Assist the CRO with matters related to external and public relations",
      "Coordinate with the External Affairs, Marketing, and Sponsorships Committees",
      "Assist in coordinating external partnerships and engagements",
      "Support communications with organizational stakeholders",
      "Monitor external-relations tasks and deadlines",
      "Act as the CRO's associate",
    ],
    isOpen: true,
  },
  {
    name: "External Affairs Committee Staff",
    office: "Office of the Chief Relations Officer",
    committee: "External Affairs Committee",
    committeeDescription:
      "The External Affairs Committee handles the organization's internal and external relationships, including partnerships and collaborations. It coordinates with internal teams regarding organizational partners, maintains the stakeholder database, and represents the organization in internal and external meetings and events.",
    description:
      "External Affairs Committee Staff assist in developing, coordinating, and maintaining relationships with the organization's partners and stakeholders.",
    responsibilities: [
      "Assist in researching and identifying potential partners",
      "Support the coordination of partnerships and collaborations",
      "Assist in communicating with organizational partners",
      "Help maintain the organization's stakeholder database",
      "Coordinate with internal teams regarding partner-related responsibilities",
      "Assist in external meetings and events when assigned",
      "Work on tasks assigned by the External Affairs Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
  {
    name: "Sponsorship Committee Staff",
    office: "Office of the Chief Relations Officer",
    committee: "Sponsorship Committee",
    committeeDescription:
      "The Sponsorship Committee is responsible for sourcing and securing organization sponsors, preparing sponsorship materials, approaching prospective sponsors, negotiating sponsorship terms, and managing sponsorship deliverables.",
    description:
      "Sponsorship Committee Staff assist in sourcing potential sponsors, preparing sponsorship materials, communicating with sponsors, and managing sponsorship requirements.",
    responsibilities: [
      "Assist in researching and identifying potential sponsors",
      "Help prepare sponsorship decks, proposals, and related materials",
      "Assist in contacting and communicating with prospective sponsors",
      "Support sponsorship negotiations and documentation",
      "Assist in monitoring sponsorship deliverables",
      "Help maintain relationships with existing sponsors",
      "Work on tasks assigned by the Sponsorship Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
  {
    name: "Marketing Committee Staff",
    office: "Office of the Chief Relations Officer",
    committee: "Marketing Committee",
    committeeDescription:
      "The Marketing Committee develops and implements comprehensive marketing plans and campaigns for the organization's events and promotions while managing the organization's overall branding and social media presence.",
    description:
      "Marketing Committee Staff assist in developing and implementing marketing campaigns, promotions, and strategies for AWS Builders – UST.",
    responsibilities: [
      "Assist in developing marketing plans and campaigns",
      "Support the promotion of organizational events and initiatives",
      "Assist in managing the organization's social media presence",
      "Help maintain consistency in organizational branding",
      "Research marketing trends and promotional opportunities",
      "Monitor audience engagement when needed",
      "Work on tasks assigned by the Marketing Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
  {
    name: "Executive Assistant to the CCO",
    office: "Office of the Chief Creative Officer",
    committee: "Office of the Chief Creative Officer",
    committeeDescription:
      "The Chief Creative Officer (CCO) leads the organization's creative strategy and brand management initiatives. The CCO supervises the Publicity, Media, and Documentation Committees and oversees marketing materials, visual communications, multimedia content, and digital assets.",
    description:
      "The Executive Assistant supports the CCO in coordinating creative operations and communicates with the committees under the CCO.",
    responsibilities: [
      "Assist the CCO with creative and brand management matters",
      "Coordinate with the Publicity, Media, and Documentation Committees",
      "Assist in monitoring creative projects and deadlines",
      "Help facilitate communication among creative committees",
      "Assist in organizing creative activities and projects",
      "Act as the CCO's associate",
    ],
    isOpen: true,
  },
  {
    name: "Publicity Committee Staff",
    office: "Office of the Chief Creative Officer",
    committee: "Publicity Committee",
    committeeDescription:
      "The Publicity Committee is responsible for creating graphical advertisements, publications, and promotional materials for the organization's social media accounts.",
    description:
      "Publicity Committee Staff assist in creating and preparing visual publicity materials and promotional content for AWS Builders – UST.",
    responsibilities: [
      "Assist in creating graphical advertisements and promotional materials",
      "Support the development of social media content",
      "Assist in preparing publicity materials for events and initiatives",
      "Follow established organizational branding and visual standards",
      "Coordinate with the Marketing and Media Committees when necessary",
      "Assist in organizing creative assets and files",
      "Work on tasks assigned by the Publicity Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
  {
    name: "Media Committee Staff",
    office: "Office of the Chief Creative Officer",
    committee: "Media Committee",
    committeeDescription:
      "The Media Committee is responsible for video editing and multimedia production for the organization, including creating and editing video content for events, meetings, and promotional purposes.",
    description:
      "Media Committee Staff assist in the production, editing, and management of multimedia content for AWS Builders – UST.",
    responsibilities: [
      "Assist in video production and editing",
      "Support the creation of multimedia content for events and promotions",
      "Assist in filming and capturing multimedia materials when assigned",
      "Help organize and manage multimedia assets",
      "Assist in preparing video content for publication",
      "Coordinate with the Publicity and Documentation Committees when necessary",
      "Work on tasks assigned by the Media Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
  {
    name: "Documentation Committee Staff",
    office: "Office of the Chief Creative Officer",
    committee: "Documentation Committee",
    committeeDescription:
      "The Documentation Committee is responsible for properly documenting the projects and activities of the organization for official and organizational purposes.",
    description:
      "Documentation Committee Staff assist in capturing, organizing, and maintaining records of AWS Builders – UST projects, activities, and events.",
    responsibilities: [
      "Assist in documenting organizational events and activities",
      "Capture photographs, videos, and other relevant records when assigned",
      "Organize and maintain documentation files",
      "Assist in coordinating event documentation coverage",
      "Ensure important organizational activities are properly recorded",
      "Coordinate with the Media Committee when necessary",
      "Work on tasks assigned by the Documentation Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
  {
    name: "Executive Assistant to the COO",
    office: "Office of the Chief Operating Officer",
    committee: "Office of the Chief Operating Officer",
    committeeDescription:
      "The Chief Operating Officer (COO) oversees the daily operations and internal affairs of the organization. The COO supervises the Community Development and Logistics Committees and ensures efficient workflow and operational excellence across committees.",
    description:
      "The Executive Assistant supports the COO in coordinating internal operations, organizational processes, and the committees under the COO.",
    responsibilities: [
      "Assist the COO with matters related to internal operations",
      "Coordinate with the Community Development and Logistics Committees",
      "Assist in monitoring organizational workflows and processes",
      "Support the COO in coordinating with Committee Directors",
      "Assist in organizing operational activities and events",
      "Help facilitate communication between the COO and committees",
      "Act as the COO's associate",
    ],
    isOpen: true,
  },
  {
    name: "Community Development Committee Staff",
    office: "Office of the Chief Operating Officer",
    committee: "Community Development Committee",
    committeeDescription:
      "The Community Development Committee plans and coordinates outreach programs with partner communities and conducts related activities that raise the social consciousness and involvement of its members.",
    description:
      "Community Development Committee Staff assist in organizing and implementing outreach programs, community initiatives, and activities that encourage social consciousness and member involvement.",
    responsibilities: [
      "Assist in planning and coordinating outreach programs",
      "Support activities conducted with partner communities",
      "Assist in organizing community development initiatives",
      "Participate in activities that promote social consciousness among members",
      "Help coordinate logistics and manpower for community activities",
      "Support the implementation of community-related projects",
      "Work on tasks assigned by the Community Development Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
  {
    name: "Logistics Committee Staff",
    office: "Office of the Chief Operating Officer",
    committee: "Logistics Committee",
    committeeDescription:
      "The Logistics Committee serves as the overall manpower of the organization. It ensures that equipment and materials are available for events, coordinates with the Facilities Management Office (FMO), and reserves venues and equipment while ensuring optimal conditions before, during, and after every event.",
    description:
      "Logistics Committee Staff provide manpower and operational support for the preparation and execution of organizational events and activities.",
    responsibilities: [
      "Assist in ensuring that necessary equipment and materials are available for events",
      "Help coordinate with the Facilities Management Office (FMO)",
      "Assist in reserving venues and equipment",
      "Help prepare venues before organizational activities",
      "Provide on-ground logistical support during events",
      "Assist in monitoring equipment and materials during activities",
      "Help organize and secure equipment after events",
      "Work on tasks assigned by the Logistics Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
  {
    name: "Executive Assistant to the CTO",
    office: "Office of the Chief Technology Officer",
    committee: "Office of the Chief Technology Officer",
    committeeDescription:
      "The Chief Technology Officer (CTO) leads technological initiatives and digital infrastructure development. The CTO supervises the Development and Technicals Committees and oversees software development and technical operations.",
    description:
      "The Executive Assistant supports the CTO in coordinating technological initiatives, technical operations, and the committees under the CTO.",
    responsibilities: [
      "Assist the CTO with technology and infrastructure matters",
      "Coordinate with the Development and Technicals Committees",
      "Assist in monitoring technical projects and deadlines",
      "Support the organization of technical initiatives and activities",
      "Help facilitate communication between technical committees",
      "Act as the CTO's associate",
    ],
    isOpen: true,
  },
  {
    name: "Technicals Committee Staff",
    office: "Office of the Chief Technology Officer",
    committee: "Technicals Committee",
    committeeDescription:
      "The Technicals Committee is responsible for overseeing and operating the technical aspects of every event and activity held by the organization.",
    description:
      "Technicals Committee Staff assist in preparing, operating, and troubleshooting the technical requirements of AWS Builders – UST events and activities.",
    responsibilities: [
      "Assist in setting up technical equipment for events",
      "Provide technical support during organizational activities",
      "Assist in operating technical equipment during events",
      "Help troubleshoot technical issues when necessary",
      "Assist in monitoring technical requirements throughout activities",
      "Coordinate with the Development Committee when needed",
      "Work on tasks assigned by the Technicals Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
  {
    name: "Development Committee Staff",
    office: "Office of the Chief Technology Officer",
    committee: "Development Committee",
    committeeDescription:
      "The Development Committee serves as the technical manpower of the organization. It creates and produces online resources such as websites, educates members on their use, provides technical facilitation during workshops, and supports Student Builder Group initiatives such as AWS SkillBuilder.",
    description:
      "Development Committee Staff assist in developing, maintaining, and supporting the organization's digital and technical resources.",
    responsibilities: [
      "Assist in creating and maintaining online resources such as websites",
      "Support the development of digital tools for organizational use",
      "Assist in educating members on the use of organizational resources",
      "Provide technical assistance during workshops when assigned",
      "Help troubleshoot and diagnose technical issues during workshops",
      "Support Student Builder Group initiatives such as AWS SkillBuilder",
      "Work on tasks assigned by the Development Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
  {
    name: "Executive Assistant to the CHRO",
    office: "Office of the Chief Human Resources Officer",
    committee: "Office of the Chief Human Resources Officer",
    committeeDescription:
      "The Chief Human Resources Officer (CHRO) manages personnel policies, recruitment, and member development. The CHRO supervises the Human Resources Committee, oversees training and capacity-building initiatives, and handles disciplinary matters and conflict resolution.",
    description:
      "The Executive Assistant supports the CHRO in recruitment, member development, personnel matters, and coordination with the Human Resources Committee.",
    responsibilities: [
      "Assist the CHRO with recruitment and member-related matters",
      "Coordinate with the Human Resources Committee",
      "Assist in organizing training and member development initiatives",
      "Support the management of HR-related documents",
      "Assist in coordinating member welfare initiatives",
      "Help facilitate communication between the CHRO and members",
      "Act as the CHRO's associate",
    ],
    isOpen: true,
  },
  {
    name: "Human Resources Committee Staff",
    office: "Office of the Chief Human Resources Officer",
    committee: "Human Resources Committee",
    committeeDescription:
      "The Human Resources Committee handles and manages the members of the organization, including their welfare, satisfaction, and involvement in events, meetings, and activities. It also handles grievances, develops and maintains the HR Manual, and establishes policies and procedures concerning members, staff, and officers.",
    description:
      "Human Resources Committee Staff assist in recruitment, member engagement, welfare, documentation, and the implementation of human resource initiatives and policies.",
    responsibilities: [
      "Assist in planning and implementing recruitment activities",
      "Support the onboarding and integration of new members",
      "Assist in monitoring member welfare, satisfaction, and involvement",
      "Help gather and address member feedback and concerns",
      "Assist in organizing training and capacity-building activities",
      "Support the development and updating of the HR Manual",
      "Assist in maintaining HR-related records and documents",
      "Work on tasks assigned by the Human Resources Committee Director",
      "Ensure punctual and quality completion of assigned tasks",
    ],
    isOpen: true,
  },
]
