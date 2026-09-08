export type Committee = {
  id: string
  name: string
  description: string
}

export type Position = {
  id: string
  committeeId: string
  name: string
  description: string
  responsibilities: string[]
}

export const MOCK_COMMITTEES: Committee[] = [
  {
    id: "committee-sponsorship",
    name: "Sponsorship",
    description:
      "Builds and maintains sponsor relationships, packages partnership offers, and coordinates sponsor deliverables for events.",
  },
  {
    id: "committee-external-affairs",
    name: "External Affairs",
    description:
      "Acts as the liaison between the members and the external partners of the organization.",
  },
  {
    id: "committee-marketing",
    name: "Marketing",
    description:
      "Develops and implements comprehensive marketing plans and campaigns for events, while managing relationships with partners, sponsors, and publicity.",
  },
  {
    id: "committee-finance",
    name: "Finance",
    description:
      "Maintains and facilitates the flow of financial resources for events, and continuously develops initiatives to guarantee sustainable and consistent funding.",
  },
  {
    id: "committee-secretariat",
    name: "Secretariat",
    description:
      "Handles the logistical and administrative matters of the organization, designing feedback mechanisms for the events, meetings, or activities of the organization.",
  },
  {
    id: "committee-human-resources",
    name: "Human Resources",
    description:
      "Manages the members within the organization, including their welfare, satisfaction, and involvement in the organization's events, meetings, and activities.",
  },
  {
    id: "committee-community-development",
    name: "Community Development",
    description:
      "Plans outreach programs with partner communities of the UST SIMBAHAYAN Community Development Office, while promoting social consciousness among members.",
  },
  {
    id: "committee-logistics",
    name: "Logistics",
    description:
      "Ensures equipment and materials are available during events, coordinating with the Facilities Management Office (FMO), and handling venue and equipment reservations.",
  },
  {
    id: "committee-documentation",
    name: "Documentation",
    description:
      "Documents the projects and activities of the organization for whatever official reason it may be used.",
  },
  {
    id: "committee-technicals",
    name: "Technicals",
    description:
      "Oversees and operates the technical aspects of every event, meeting, and activity the organization holds.",
  },
  {
    id: "committee-development",
    name: "Development",
    description:
      "Creates and produces online resources for organizational use, and educates members on how to utilize them effectively.",
  },
  {
    id: "committee-publications",
    name: "Publications",
    description:
      "Designs graphical advertisements, publications, and promotional materials for the organization's social media accounts.",
  },
  {
    id: "committee-media",
    name: "Media",
    description:
      "Produces and edits all video and multimedia production for events, meetings, and promotional purposes of the organization.",
  },
]

function directorPosition(
  slug: string,
  committeeId: string,
  label: string
): Position {
  return {
    id: `position-director-${slug}`,
    committeeId,
    name: `Director for ${label}`,
    description: `Leads the ${label} and coordinates its members and deliverables.`,
    responsibilities: [
      "Set committee direction.",
      "Coordinate members.",
      "Report to the department officer.",
    ],
  }
}

export const MOCK_POSITIONS: Position[] = [
  directorPosition("sponsorship", "committee-sponsorship", "Sponsorship"),
  directorPosition("external-affairs", "committee-external-affairs", "External Affairs"),
  directorPosition("marketing", "committee-marketing", "Marketing"),
  directorPosition("finance", "committee-finance", "Finance"),
  directorPosition("secretariat", "committee-secretariat", "Secretariat"),
  directorPosition("human-resources", "committee-human-resources", "Human Resources"),
  directorPosition(
    "community-development",
    "committee-community-development",
    "Community Development"
  ),
  directorPosition("logistics", "committee-logistics", "Logistics"),
  directorPosition("documentation", "committee-documentation", "Documentation"),
  directorPosition("technicals", "committee-technicals", "Technicals"),
  directorPosition("development", "committee-development", "Development"),
  directorPosition("publications", "committee-publications", "Publications"),
  directorPosition("media", "committee-media", "Media"),
]
