export const COMMITTEE_IDS = [
  "external-affairs",
  "sponsorships",
  "marketing",
  "finance",
  "secretariat",
  "human-resources",
  "community-development",
  "logistics",
  "documentation",
  "technicals",
  "development",
  "publications",
  "media",
] as const

export type CommitteeId = (typeof COMMITTEE_IDS)[number]
export type ScoreKey = CommitteeId | "executive-assistant"
export type ScoreMap = Partial<Record<ScoreKey, number>>

export type QuizOption = {
  id: string
  label: string
  scores: ScoreMap
}

export type QuizQuestion = {
  code: string
  kicker?: string
  prompt: string
  options: QuizOption[]
}

export const COMMITTEES: Record<
  CommitteeId,
  { name: string; blurb: string }
> = {
  "external-affairs": {
    name: "External Affairs",
    blurb:
      "You’re the one who talks to people, represents the org, and turns a cold intro into an actual partnership.",
  },
  sponsorships: {
    name: "Sponsorships",
    blurb:
      "You see a budget gap and immediately start drafting the pitch. Getting a yes is the fun part.",
  },
  marketing: {
    name: "Marketing",
    blurb:
      "You think in campaigns. If nobody’s talking about the event yet, that’s your problem to solve.",
  },
  finance: {
    name: "Finance",
    blurb:
      "Every peso has a job. You’re the reason the org can actually afford the thing everyone wants to run.",
  },
  secretariat: {
    name: "Secretariat",
    blurb:
      "You keep the machine running — files, trackers, processes — so nobody has to guess what happens next.",
  },
  "human-resources": {
    name: "Human Resources",
    blurb:
      "People are the project. You notice when someone’s off, and you make the room feel like a team.",
  },
  "community-development": {
    name: "Community Development",
    blurb:
      "You want the work to matter outside the org. Outreach isn’t extra credit — it’s the point.",
  },
  logistics: {
    name: "Logistics",
    blurb:
      "Venues, cables, call times, Plan B. You’d rather the chaos stay backstage where it belongs.",
  },
  documentation: {
    name: "Documentation",
    blurb:
      "If it happened, you have the record. Future-you (and everyone else) will need that file.",
  },
  technicals: {
    name: "Technicals",
    blurb:
      "Mics, projectors, live setups — you’re the reason the program actually starts on time.",
  },
  development: {
    name: "Development",
    blurb:
      "You’re naturally drawn to building, solving problems, and turning ideas into something functional.",
  },
  publications: {
    name: "Publications",
    blurb:
      "You make the org look like itself. Posters, posts, and graphics people actually stop to look at.",
  },
  media: {
    name: "Media",
    blurb:
      "You tell the story in motion. If they couldn’t be there, your video makes them wish they were.",
  },
}

export const QUESTIONS: QuizQuestion[] = [
  {
    code: "Emergency Protocol",
    kicker: "Guys… may problem.",
    prompt:
      "An event starts in an hour and something suddenly goes wrong. What’s your first instinct?",
    options: [
      {
        id: "A",
        label: "“Okay, what exactly isn’t working?” Start troubleshooting.",
        scores: { technicals: 3, development: 3 },
      },
      {
        id: "B",
        label:
          "“Okay, what do we need and who can handle it?” Start coordinating people and materials.",
        scores: { logistics: 3, secretariat: 1, "executive-assistant": 2 },
      },
      {
        id: "C",
        label: "“Wait, is everyone okay?” Check on the team first.",
        scores: {
          "human-resources": 3,
          "community-development": 2,
          "executive-assistant": 1,
        },
      },
      {
        id: "D",
        label:
          "“Who can we contact about this?” Reach out to people who might be able to help.",
        scores: { "external-affairs": 3, sponsorships: 2 },
      },
      {
        id: "E",
        label:
          "Quietly remember exactly what happened, because someone will need that later.",
        scores: { documentation: 3, secretariat: 3 },
      },
    ],
  },
  {
    code: "Side Quest Unlocked",
    prompt: "You suddenly have a completely free afternoon. What are you most likely to do?",
    options: [
      {
        id: "A",
        label: "Build a small website, because why not?",
        scores: { development: 3, technicals: 1 },
      },
      {
        id: "B",
        label: "Make a poster for an imaginary event.",
        scores: { publications: 3, marketing: 2 },
      },
      {
        id: "C",
        label: "Turn random clips into an unnecessarily cinematic video.",
        scores: { media: 3, publications: 1 },
      },
      {
        id: "D",
        label: "Join an outreach activity.",
        scores: { "community-development": 3, "human-resources": 1 },
      },
      {
        id: "E",
        label: "Organize your files, trackers, and folders. They’ve been bothering you.",
        scores: { secretariat: 3, documentation: 2 },
      },
      {
        id: "F",
        label: "Look for companies or orgs you think would be cool to work with.",
        scores: { "external-affairs": 3, sponsorships: 3 },
      },
    ],
  },
  {
    code: "New Party Member",
    prompt:
      "You’re assigned to a group project with people you’ve never met. Five minutes later, you’re probably…",
    options: [
      {
        id: "A",
        label: "Assigning tasks and figuring out the timeline.",
        scores: { "executive-assistant": 3, logistics: 2, secretariat: 1 },
      },
      {
        id: "B",
        label: "Asking everyone what they’re good at.",
        scores: { "human-resources": 3, "executive-assistant": 1 },
      },
      {
        id: "C",
        label: "Making the Drive, tracker, and shared documents.",
        scores: { secretariat: 3, documentation: 2 },
      },
      {
        id: "D",
        label: "Already starting the actual output.",
        scores: { development: 3, technicals: 2 },
      },
      {
        id: "E",
        label: "Thinking about how the final presentation should look and feel.",
        scores: { publications: 3, marketing: 2, media: 1 },
      },
      {
        id: "F",
        label: "Somehow already talking comfortably with everyone.",
        scores: {
          "external-affairs": 3,
          sponsorships: 2,
          "human-resources": 1,
        },
      },
    ],
  },
  {
    code: "Boss Battle",
    prompt: "Choose the problem you’d actually rather deal with.",
    options: [
      {
        id: "A",
        label: "A bug appears five minutes before the demo.",
        scores: { development: 3, technicals: 2 },
      },
      {
        id: "B",
        label: "The microphone and projector suddenly stop cooperating.",
        scores: { technicals: 3, logistics: 2 },
      },
      {
        id: "C",
        label: "A potential sponsor has left you on Seen.",
        scores: { sponsorships: 3, "external-affairs": 2 },
      },
      {
        id: "D",
        label: "The campaign looks okay… but nobody is engaging with it.",
        scores: { marketing: 3, publications: 2, media: 1 },
      },
      {
        id: "E",
        label: "62 people attended, but somehow the attendance sheet says 47.",
        scores: { secretariat: 3, documentation: 2 },
      },
      {
        id: "F",
        label: "Two members aren’t getting along and it’s affecting the team.",
        scores: { "human-resources": 3, "executive-assistant": 2 },
      },
    ],
  },
  {
    code: "Achievement Unlocked",
    prompt: "Which compliment would hit the hardest?",
    options: [
      {
        id: "A",
        label: "“How did you even fix that?”",
        scores: { development: 3, technicals: 2 },
      },
      {
        id: "B",
        label: "“Everything went so smoothly.”",
        scores: { logistics: 3, "executive-assistant": 2 },
      },
      {
        id: "C",
        label: "“ANG GANDA.”",
        scores: { publications: 3, marketing: 2 },
      },
      {
        id: "D",
        label: "“That video made me wish I was there.”",
        scores: { media: 3, marketing: 1 },
      },
      {
        id: "E",
        label: "“You made everyone feel welcome.”",
        scores: { "human-resources": 3, "community-development": 2 },
      },
      {
        id: "F",
        label: "“How did you convince them to agree to that?”",
        scores: { sponsorships: 3, "external-affairs": 3 },
      },
    ],
  },
  {
    code: "AWS Architecture, But Make It You",
    kicker: "No actual AWS knowledge required. Vibes are enough.",
    prompt: "If you were a component in a cloud architecture, you’d be…",
    options: [
      {
        id: "A",
        label: "The thing actually building and running the application.",
        scores: { development: 3 },
      },
      {
        id: "B",
        label: "The connection making sure different systems can communicate.",
        scores: { "external-affairs": 3, "executive-assistant": 1 },
      },
      {
        id: "C",
        label: "The monitoring system that notices when something is about to explode.",
        scores: { technicals: 3, development: 1 },
      },
      {
        id: "D",
        label: "The storage system keeping everything safe, because baka kailanganin.",
        scores: { secretariat: 3, documentation: 2 },
      },
      {
        id: "E",
        label: "The interface making everything usable and nice to look at.",
        scores: { publications: 3, marketing: 2 },
      },
      {
        id: "F",
        label: "The cost optimizer asking why we’re paying for something nobody uses.",
        scores: { finance: 3, sponsorships: 1 },
      },
    ],
  },
  {
    code: "Budget Drop",
    prompt:
      "AWS Builders–UST suddenly receives ₱50,000 for an event. Your brain immediately goes:",
    options: [
      {
        id: "A",
        label: "“Okay, let’s budget every peso.”",
        scores: { finance: 3, secretariat: 1 },
      },
      {
        id: "B",
        label: "“How can we turn this ₱50,000 into more support?”",
        scores: { sponsorships: 3, "external-affairs": 2 },
      },
      {
        id: "C",
        label: "“What venue, equipment, and materials do we need?”",
        scores: { logistics: 3, finance: 1 },
      },
      {
        id: "D",
        label: "“How do we make people actually want to attend?”",
        scores: { marketing: 3, publications: 2, media: 1 },
      },
      {
        id: "E",
        label: "“Can we use part of this to create something meaningful for a community?”",
        scores: { "community-development": 3, "human-resources": 1 },
      },
      {
        id: "F",
        label: "“What tech can we build or improve for this?”",
        scores: { development: 3, technicals: 2 },
      },
    ],
  },
  {
    code: "Choose Your Weapon",
    prompt: "Which setup are you most likely to have open?",
    options: [
      {
        id: "A",
        label: "VS Code + 28 browser tabs",
        scores: { development: 3, technicals: 1 },
      },
      {
        id: "B",
        label: "Canva / Photoshop / Illustrator",
        scores: { publications: 3, marketing: 2 },
      },
      {
        id: "C",
        label: "Camera + Premiere / CapCut",
        scores: { media: 3, marketing: 1 },
      },
      {
        id: "D",
        label: "Google Sheets + Drive + Notion",
        scores: { secretariat: 3, documentation: 2 },
      },
      {
        id: "E",
        label: "Email + Messenger + LinkedIn",
        scores: { "external-affairs": 3, sponsorships: 2 },
      },
      {
        id: "F",
        label: "Laptop + HDMI adapters + cables that nobody else understands",
        scores: { technicals: 3, logistics: 2 },
      },
    ],
  },
  {
    code: "What’s the Mission?",
    prompt: "What should AWS Builders–UST be known for?",
    options: [
      {
        id: "A",
        label: "Building genuinely useful technology.",
        scores: { development: 3, technicals: 1 },
      },
      {
        id: "B",
        label: "Running events so smoothly that nobody sees the chaos behind them.",
        scores: { logistics: 3, technicals: 1 },
      },
      {
        id: "C",
        label: "Being an organization where people actually feel like they belong.",
        scores: { "human-resources": 3, "community-development": 2 },
      },
      {
        id: "D",
        label: "Having a brand and content people instantly recognize.",
        scores: { marketing: 3, publications: 2, media: 2 },
      },
      {
        id: "E",
        label: "Creating opportunities through companies, sponsors, and organizations.",
        scores: { "external-affairs": 3, sponsorships: 3 },
      },
      {
        id: "F",
        label: "Being organized enough that everything has a process, record, and person responsible.",
        scores: { secretariat: 3, documentation: 2 },
      },
    ],
  },
  {
    code: "Final Sync",
    prompt:
      "Someone says: “We need somebody to—”. Which sentence are you most likely to finish with “I can do that”?",
    options: [
      {
        id: "A",
        label: "“…build or fix the tech.”",
        scores: { development: 3, technicals: 2 },
      },
      {
        id: "B",
        label: "“…organize everything and make sure it actually happens.”",
        scores: { logistics: 3, secretariat: 2 },
      },
      {
        id: "C",
        label: "“…make it look good and tell the story.”",
        scores: { publications: 3, media: 3, marketing: 1 },
      },
      {
        id: "D",
        label: "“…talk to them, pitch the idea, and represent us.”",
        scores: { "external-affairs": 3, sponsorships: 3 },
      },
      {
        id: "E",
        label: "“…take care of the people and make the project meaningful.”",
        scores: { "human-resources": 3, "community-development": 3 },
      },
      {
        id: "F",
        label: "“…coordinate everyone and keep track of what’s going on.”",
        scores: { "executive-assistant": 3, secretariat: 2 },
      },
    ],
  },
]
