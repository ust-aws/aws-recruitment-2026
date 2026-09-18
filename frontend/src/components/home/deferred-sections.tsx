"use client"

import dynamic from "next/dynamic"
import { LazyWhenVisible } from "@/components/shared/lazy-when-visible"

const AboutUs = dynamic(() =>
  import("@/components/home/about-us").then((mod) => mod.AboutUs),
)
const MissionVision = dynamic(() =>
  import("@/components/home/mission-vision").then((mod) => mod.MissionVision),
)
const OurMoments = dynamic(() =>
  import("@/components/home/our-moments").then((mod) => mod.OurMoments),
)
const StackSection = dynamic(() =>
  import("@/components/home/stack-section").then((mod) => mod.StackSection),
)
const Committees = dynamic(() =>
  import("@/components/home/committees").then((mod) => mod.Committees),
)
const FAQSection = dynamic(() =>
  import("@/components/home/faq-section").then((mod) => mod.FAQSection),
)
const PeopleDirectory = dynamic(() =>
  import("@/components/people/people-directory").then((mod) => mod.PeopleDirectory),
)
const CareersSection = dynamic(() =>
  import("@/components/home/careers-section").then((mod) => mod.CareersSection),
)
const ContactSection = dynamic(() =>
  import("@/components/home/contact-section").then((mod) => mod.ContactSection),
)

export function HomeDeferredSections() {
  return (
    <>
      <LazyWhenVisible minHeight="12rem" anchorId="about-us">
        <AboutUs />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="12rem">
        <MissionVision />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="28rem" anchorId="our-moments">
        <OurMoments />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="10rem">
        <StackSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="22rem" anchorId="committees">
        <Committees />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="14rem">
        <FAQSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="24rem" anchorId="people">
        <PeopleDirectory />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="14rem" anchorId="careers">
        <CareersSection />
      </LazyWhenVisible>
      <LazyWhenVisible minHeight="14rem" anchorId="contact">
        <ContactSection />
      </LazyWhenVisible>
    </>
  )
}
