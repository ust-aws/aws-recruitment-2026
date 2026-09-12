export type AboutEvent = {
  id: string
  academicYear: string
  title: string
  description: string
  imageSrc: string
}

/** Chronological order; images live under `public/events/sy-*`. */
export const ABOUT_EVENTS: AboutEvent[] = [
  {
    id: "freshman-orientation",
    academicYear: "SY 2025–26",
    title: "Freshman Orientation",
    description:
      "Welcomed new Thomasians to AWS Builders – UST and introduced how to get involved on campus.",
    imageSrc: "/events/sy-25-26/freshman-orientaion-2526.png",
  },
  {
    id: "general-assembly",
    academicYear: "SY 2025–26",
    title: "AWS General Assembly - Cloud Express",
    description:
      "Opened the academic year with member updates, committee sign-ups, and the Cloud Express track.",
    imageSrc: "/events/sy-25-26/ga-2526.jpg",
  },
  {
    id: "lightsail",
    academicYear: "SY 2025–26",
    title: "The Lighsail Expedition",
    description:
      "Hands-on labs and sessions exploring Amazon Lightsail and core cloud building blocks.",
    imageSrc: "/events/sy-25-26/lightsail-2526.jpg",
  },
  {
    id: "docker",
    academicYear: "SY 2025–26",
    title: "Docking into Atlantis: A Deep Dive into Containers",
    description:
      "A container-focused workshop diving into Docker and how apps ship to the cloud.",
    imageSrc: "/events/sy-25-26/docker-2526.jpg",
  },
  {
    id: "harvesting-data",
    academicYear: "SY 2025–26",
    title: "Harvesting Data: Adventure in Data Syetems",
    description:
      "An adventure through data systems concepts and practical AWS data tooling.",
    imageSrc: "/events/sy-25-26/data-harvesting-2526.jpg",
  },
  {
    id: "kiroquest",
    academicYear: "SY 2025–26",
    title: "Kiroquest",
    description:
      "Builder challenges and collaborative learning during the Kiroquest program.",
    imageSrc: "/events/sy-25-26/kiroquest.jpg",
  },
  {
    id: "press-start",
    academicYear: "SY 2025–26",
    title: "Press Start: Building Serverless Systems with AWS Lambda",
    description:
      "Leveled up serverless skills by building systems with AWS Lambda.",
    imageSrc: "/events/sy-25-26/press-start-2526.jpg",
  },
  {
    id: "kiro-challenge",
    academicYear: "SY 2026–27",
    title: "Kiro Challenge",
    description:
      "Competed and built through the Kiro Challenge experience with the community.",
    imageSrc: "/events/sy-26-27/kiro-challenge-2627.jpg",
  },
  {
    id: "beyond-the-clouds",
    academicYear: "SY 2026–27",
    title: "To the Clouds and Beyond",
    description:
      "Sessions aimed at taking builders past the basics and further into the cloud.",
    imageSrc: "/events/sy-26-27/beyond-the-clouds-2627.jpg",
  },
  {
    id: "awssug-scd",
    academicYear: "SY 2026–27",
    title: "AWSSUG Student Community Day Mega Manila 2026",
    description:
      "Joined AWS User Group Student Community Day Mega Manila with peers and industry builders.",
    imageSrc: "/events/sy-26-27/awssug-scd-2627.jpg",
  },
]
