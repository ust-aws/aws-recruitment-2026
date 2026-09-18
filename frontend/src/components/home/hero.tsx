"use client"

import Image from "next/image"
import Link from "next/link"
import { InteractiveHeroCloud } from "@/components/home/interactive-hero-cloud"
import { RecruitmentStatusBanner } from "@/components/shared/recruitment-status-banner"
import { Button } from "@/components/ui/button"
import { scrollToSection } from "@/lib/site/scroll-to-section"

const heroClasses =
  "relative left-1/2 -mt-16 mb-[-40px] flex min-h-[calc(100svh-10rem)] w-screen -translate-x-1/2 scroll-mt-16 overflow-hidden bg-cover bg-center text-center"
const backgroundClasses =
  "hero-cloud-drift -z-20 object-cover object-center"
const overlayClasses =
  "absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(23,15,51,0.1),rgba(42,18,89,0.03)_50%,rgba(23,15,51,0.2))]"
const contentClasses =
  "relative mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-[1180px] flex-col items-center justify-between pt-16"
const artworkClasses =
  "flex w-full shrink-0 flex-col items-center"
const titleClasses =
  "z-10 h-[clamp(190px,34vw,340px)] w-[min(100vw,1040px)] overflow-visible max-md:h-[clamp(175px,32vh,235px)] max-[700px]:h-[clamp(155px,34vw,205px)]"
const lowerContentClasses =
  "z-30 flex w-[min(94vw,720px)] flex-col items-center pb-[clamp(1.125rem,2.5vh,1.75rem)]"
const informationClasses =
  "flex w-full flex-col items-center gap-[clamp(1.25rem,2.5vh,2rem)]"
const descriptionClasses =
  "w-[min(88vw,640px)] text-xs leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(23,15,51,0.5)] sm:text-sm md:text-base"
const buttonRowClasses =
  "flex w-full flex-wrap items-center justify-center gap-2 sm:gap-4"
const buttonClasses =
  "h-11 px-5 text-sm transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none sm:h-12 sm:px-6 sm:text-base max-sm:h-10 max-sm:px-3 max-sm:text-xs"
const purpleButtonEffectClasses =
  "hover:shadow-[0_0_24px_rgba(183,140,240,0.45)]"
const cyanButtonEffectClasses =
  "hover:shadow-[0_0_24px_rgba(90,240,192,0.45)]"
const scrollClasses =
  "mt-[clamp(1.25rem,4vh,4rem)] flex flex-col items-center font-mono text-[clamp(0.7rem,1vw,0.9rem)] uppercase tracking-[0.2em] text-white"
const scrollArrowClasses = "mt-2 block text-xl leading-none sm:text-2xl"

export function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className={heroClasses}
    >
      <Image
        src="/hero/hero-background.webp"
        alt=""
        fill
        priority
        quality={80}
        sizes="100vw"
        className={backgroundClasses}
      />
      <div aria-hidden="true" className={overlayClasses} />
      <div className={contentClasses}>
        <div className={artworkClasses}>
          <h1
            id="hero-title"
            aria-label="What's in the Clouds?"
            className={titleClasses}
          >
            <svg
              aria-hidden="true"
              className="hero-title-fade h-full w-full overflow-visible"
              viewBox="0 0 1200 400"
              role="presentation"
            >
              <defs>
                <path id="hero-title-arch" d="M 100 350 Q 600 -110 1100 350" />
              </defs>
              <text
                fill="white"
                fontFamily="var(--font-poppins), sans-serif"
                fontSize="105"
                fontWeight="700"
                letterSpacing="1"
                textAnchor="middle"
              >
                <textPath href="#hero-title-arch" startOffset="50%">
                  What&apos;s in the Clouds?
                </textPath>
              </text>
            </svg>
          </h1>

          <InteractiveHeroCloud />
        </div>

        <div className={lowerContentClasses}>
          <div className={informationClasses}>
            <RecruitmentStatusBanner />
            <p className={descriptionClasses}>
              We&apos;re a student-led cloud &amp; AI community at the University of Santo Tomas
              &mdash; part of a global network of builders across the Philippines and beyond.
            </p>

            <div className={buttonRowClasses}>
              <Button
                color="cyan"
                className={`${buttonClasses} ${cyanButtonEffectClasses}`}
                nativeButton={false}
                render={<Link href="#careers" />}
              >
                Explore careers
              </Button>
              <Button
                color="purple"
                render={
                  <a
                    href="#committees"
                    aria-label="Find your committee"
                    onClick={(event) => {
                      event.preventDefault()
                      scrollToSection("committees")
                    }}
                  />
                }
                nativeButton={false}
                className={`${buttonClasses} ${purpleButtonEffectClasses}`}
              >
                Find your committee
              </Button>
              <Button
                color="purple"
                className={`${buttonClasses} ${purpleButtonEffectClasses}`}
                nativeButton={false}
                render={
                  <a
                    href="#about-us"
                    aria-label="Know more about us"
                    onClick={(event) => {
                      event.preventDefault()
                      scrollToSection("about-us")
                    }}
                  />
                }
              >
                Know more about us!
              </Button>
            </div>
          </div>

          <p className={scrollClasses}>
            Scroll down <span className={scrollArrowClasses}>↓</span>
          </p>
        </div>
      </div>
    </section>
  )
}
