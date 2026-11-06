export interface CampColorClassNames {
  accentText: string;
  strongText: string;
  tintBackground: string;
  solidBackground: string;
  circle: string;
}

const CAMP_COLOR_CLASS_NAMES: CampColorClassNames[] = [
  {
    accentText: "report-first-camp-accent-text",
    strongText: "report-first-camp-strong-text",
    tintBackground: "report-first-camp-tint-bg",
    solidBackground: "report-first-camp-solid-bg",
    circle: "report-first-camp-circle",
  },
  {
    accentText: "report-second-camp-accent-text",
    strongText: "report-second-camp-strong-text",
    tintBackground: "report-second-camp-tint-bg",
    solidBackground: "report-second-camp-solid-bg",
    circle: "report-second-camp-circle",
  },
  {
    accentText: "report-third-camp-accent-text",
    strongText: "report-third-camp-strong-text",
    tintBackground: "report-third-camp-tint-bg",
    solidBackground: "report-third-camp-solid-bg",
    circle: "report-third-camp-circle",
  },
];

export function getCampColorClassNames(
  campIndex: number,
): CampColorClassNames {
  return CAMP_COLOR_CLASS_NAMES[
    campIndex % CAMP_COLOR_CLASS_NAMES.length
  ];
}