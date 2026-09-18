/** Shown at 96px; optimizer delivers ~3× for retina. */
export const PERSON_AVATAR_DISPLAY_PX = 96

export const personAvatarImageProps = {
  width: PERSON_AVATAR_DISPLAY_PX * 3,
  height: PERSON_AVATAR_DISPLAY_PX * 3,
  sizes: `${PERSON_AVATAR_DISPLAY_PX}px`,
  quality: 92,
}

/** Timeline photos are ~half width on desktop, full width on mobile. */
export const eventTimelineImageProps = {
  quality: 92,
  sizes: "(max-width: 768px) 100vw, (max-width: 1180px) 50vw, 600px",
}
