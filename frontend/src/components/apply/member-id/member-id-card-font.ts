import { Poppins } from "next/font/google"

// The card artwork needs ExtraBold and italic, which the rest of the site
// does not. Its own instance keeps those files off every other page, and
// preload is off so the applicant page only fetches them when the card shows.
export const memberIdCardFont = Poppins({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  style: ["normal", "italic"],
  preload: false,
})
