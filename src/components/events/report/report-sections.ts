export const REPORT_SECTION_IDS = {
  opening: "opening",
  time: "time",
  prompts: "prompts",
  floor: "floor",
  camps: "camps",
  bridges: "bridges",
  commonGround: "common-ground",
  timeline: "timeline",
  summary: "summary",
} as const;

export interface ReportNavigationLink {
  sectionId: string;
  label: string;
}

export const REPORT_NAVIGATION_LINKS: ReportNavigationLink[] = [
  { sectionId: REPORT_SECTION_IDS.prompts, label: "Prompts" },
  { sectionId: REPORT_SECTION_IDS.floor, label: "The floor" },
  { sectionId: REPORT_SECTION_IDS.camps, label: "Camps" },
  {
    sectionId: REPORT_SECTION_IDS.commonGround,
    label: "Common ground",
  },
  {
    sectionId: REPORT_SECTION_IDS.timeline,
    label: "Minute by minute",
  },
  { sectionId: REPORT_SECTION_IDS.summary, label: "Summary" },
];