/**
 * The named text styles (design principles §2 and §9). Each `className` is a Tailwind
 * `@utility` defined in src/app/globals.css; use these instead of ad hoc size classes.
 * This list drives the /dev/theme specimen and the typography tests.
 */
export interface TypeStyle {
  className: string;
  name: string;
  use: string;
  sample: string;
}

export const TYPE_STYLES: readonly TypeStyle[] = [
  {
    className: "type-script",
    name: "Script",
    use: "The couple's names only. Uses the theme's script font, or the display font.",
    sample: "Uchenna & Adaora",
  },
  {
    className: "type-display",
    name: "Display",
    use: "One hero line per page: the invitation headline.",
    sample: "Two stories. One ending: forever.",
  },
  {
    className: "type-heading",
    name: "Heading",
    use: "Page and section headings.",
    sample: "Kindly reply",
  },
  {
    className: "type-subheading",
    name: "Subheading",
    use: "Card titles and sub-sections.",
    sample: "Who's walking in with you?",
  },
  {
    className: "type-label",
    name: "Label",
    use: "Small caps labels: eyebrows, table numbers.",
    sample: "The celebration · Table 12",
  },
  {
    className: "type-body-lg",
    name: "Body large",
    use: "Lead paragraphs.",
    sample: "You've been part of our story. Come and see the best chapter yet.",
  },
  {
    className: "type-body",
    name: "Body",
    use: "Running text and form copy.",
    sample: "Open your personal invitation to RSVP, add your tag-alongs and choose your meals.",
  },
  {
    className: "type-staff-id",
    name: "Staff identifier",
    use: "Names and table numbers on scanner results and boards.",
    sample: "Table 12",
  },
  {
    className: "type-staff",
    name: "Staff text",
    use: "Body and control text on staff screens.",
    sample: "Party of 2 · Admitted 19:42 by Gate 1",
  },
];
