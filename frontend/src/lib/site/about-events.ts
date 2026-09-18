export type AboutEvent = {
  id: string
  dateLabel: string
  title: string
  description: string
  imageSrc: string
}

/** Chronological order; images live under `public/events/sy-*`. */
export const ABOUT_EVENTS: AboutEvent[] = [
  {
    id: "freshman-orientation",
    dateLabel: "Aug 3, 2025",
    title: "Freshman Orientation",
    description:
      "Organization founder Josh Kenn Viray introduced incoming freshmen to the org—then AWS Learning Club – UST, now AWS Builders – UST—as they began their Thomasian journey.",
    imageSrc: "/events/sy-25-26/freshman-orientaion-2526.png",
  },
  {
    id: "general-assembly",
    dateLabel: "Oct 26, 2025",
    title: "AWS General Assembly - Cloud Express",
    description:
      "Opened the academic year with member updates, committee sign-ups, and the Cloud Express track.",
    imageSrc: "/events/sy-25-26/ga-2526.jpg",
  },
  {
    id: "lightsail",
    dateLabel: "Nov 24, 2025",
    title: "The Lightsail Expedition",
    description:
      "Hands-on labs and sessions exploring Amazon Lightsail and core cloud building blocks.",
    imageSrc: "/events/sy-25-26/lightsail-2526.jpg",
  },
  {
    id: "docker",
    dateLabel: "Feb 23, 2026",
    title: "Docking into Atlantis: A Deep Dive into Containers",
    description:
      "A container-focused workshop diving into Docker and how apps ship to the cloud.",
    imageSrc: "/events/sy-25-26/docker-2526.jpg",
  },
  {
    id: "harvesting-data",
    dateLabel: "Mar 28, 2026",
    title: "Harvesting Data: Adventure in Data Syetems",
    description:
      "An adventure through data systems concepts and practical AWS data tooling.",
    imageSrc: "/events/sy-25-26/data-harvesting-2526.jpg",
  },
  {
    id: "kiroquest",
    dateLabel: "Apr 13, 2026",
    title: "Kiroquest",
    description:
      "Builder challenges and collaborative learning during the Kiroquest program.",
    imageSrc: "/events/sy-25-26/kiroquest.jpg",
  },
  {
    id: "press-start",
    dateLabel: "Apr 19, 2026",
    title: "Press Start: Building Serverless Systems with AWS Lambda",
    description:
      "Leveled up serverless skills by building systems with AWS Lambda.",
    imageSrc: "/events/sy-25-26/press-start-2526.jpg",
  },
  {
    id: "kiro-challenge",
    dateLabel: "May 4 and May 7, 2026",
    title: "Kiro Challenge",
    description:
      "Competed and built through the Kiro Challenge experience with the community.",
    imageSrc: "/events/sy-26-27/kiro-challenge-2627.jpg",
  },
  {
    id: "beyond-the-clouds",
    dateLabel: "May 8, 2026",
    title: "To the Clouds and Beyond",
    description:
      "Sessions aimed at taking builders past the basics and further into the cloud.",
    imageSrc: "/events/sy-26-27/beyond-the-clouds-2627.jpg",
  },
  {
    id: "awssug-scd",
    dateLabel: "Sept 11, 2026",
    title: "AWSSUG Student Community Day Mega Manila 2026",
    description:
      "AWS Builders – UST served as a Platinum Partner of AWS Student User Group Philippines for Student Community Day Mega Manila 2026. This photo was taken on event day with our founder—who founded AWS Learning Club – UST, the org now known as AWS Builders – UST—and who spoke at the conference.",
    imageSrc: "/events/sy-26-27/awssug-scd-2627.jpg",
  },
]
