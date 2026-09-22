/** Shared fixtures describing the six teletext pages. */
export const PAGES = [
  { id: "p100", no: "100", label: "INDEX" },
  { id: "p200", no: "200", label: "ABOUT" },
  { id: "p300", no: "300", label: "WORK" },
  { id: "p400", no: "400", label: "SKILLS" },
  { id: "p500", no: "500", label: "PROJECTS" },
  { id: "p600", no: "600", label: "CONTACT" },
];

/** Freeze the header clock so nothing downstream depends on wall time. */
export async function freezeClock(page) {
  await page.clock.setFixedTime(new Date("2026-09-22T18:42:00"));
}
