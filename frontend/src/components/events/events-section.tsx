import { EventsCalendarMock } from "@/components/events/calendar-mock"
import { SectionHeader } from "@/components/shared/section-header"
import { EVENTS_PAGE_TIMELINE } from "@/lib/site/events-schedule"

const sectionClasses = "flex w-full flex-col gap-10"
const headerWidthClasses = "[&>h2]:max-w-[46rem] [&>p:last-child]:max-w-[38rem]"
const layoutClasses =
  "grid grid-cols-1 items-start gap-12 md:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] md:gap-16 lg:gap-24"
const timelineShellClasses = "relative"
const timelineClasses = "flex flex-col gap-10"
const lineClasses =
  "pointer-events-none absolute top-2 bottom-2 left-1.5 w-px bg-biloba-flower/25"
const timelineItemClasses = "relative pl-8"
const dotClasses =
  "absolute top-1.5 left-0 size-3 rounded-full bg-aquamarine shadow-[0_0_10px_rgba(90,240,192,0.45)]"
const tagClasses = "font-mono text-xs font-medium text-aquamarine"
const titleClasses = "mt-1 font-sans text-xl font-bold text-blue-chalk"
const descriptionClasses = "mt-2 max-w-[36rem] font-sans text-sm leading-relaxed text-prelude"

export function EventsSection() {
  return (
    <section
      id="events"
      aria-labelledby="events-page-title"
      className={sectionClasses}
    >
      <SectionHeader
        className={headerWidthClasses}
        eyebrow="// events"
        title={
          <span id="events-page-title">What&apos;s been happening</span>
        }
        subtitle="Stay updated by checking our past and incoming events here!"
      />

      <div className={layoutClasses}>
        <div className={timelineShellClasses}>
          <div className={lineClasses} aria-hidden />
          <ol className={timelineClasses}>
          {EVENTS_PAGE_TIMELINE.map((item) => (
            <li key={item.id} className={timelineItemClasses}>
              <span className={dotClasses} aria-hidden />
              <p className={tagClasses}>{item.tag}</p>
              <h3 className={titleClasses}>{item.title}</h3>
              <p className={descriptionClasses}>{item.description}</p>
            </li>
          ))}
          </ol>
        </div>

        <EventsCalendarMock />
      </div>
    </section>
  )
}
