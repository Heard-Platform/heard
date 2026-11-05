import { describe, expect, it } from "vitest";
import type { SavedNewsletter } from "../../../types";
import {
  canSendNewsletterEdition,
  getDefaultNewsletterEdition,
  getNewsletterToEdit,
  listBuilderEditionOptions,
  makeEmptyNewsletter,
} from "./newsletter-editions";

const makeSavedNewsletter = (
  editionNumber: number,
  overrides: Partial<SavedNewsletter> = {},
): SavedNewsletter => ({
  ...makeEmptyNewsletter(editionNumber),
  subject: `Newsletter #${editionNumber}`,
  updatedAt: 0,
  ...overrides,
});

describe("getNewsletterToEdit", () => {
  it("is null for hand-coded editions", () => {
    expect(getNewsletterToEdit([], 24)).toBeNull();
  });

  it("is an empty newsletter for an edition not saved yet", () => {
    expect(getNewsletterToEdit([], 25)).toEqual(
      makeEmptyNewsletter(25),
    );
  });

  it("is the saved newsletter when it has not been sent", () => {
    const savedNewsletter = makeSavedNewsletter(25);
    expect(getNewsletterToEdit([savedNewsletter], 25)).toBe(
      savedNewsletter,
    );
  });

  it("is null once the newsletter has been sent", () => {
    const sentNewsletter = makeSavedNewsletter(25, { sentAt: 1 });
    expect(getNewsletterToEdit([sentNewsletter], 25)).toBeNull();
  });
});

describe("getDefaultNewsletterEdition", () => {
  it("is the next edition when nothing is saved", () => {
    expect(getDefaultNewsletterEdition([], 25)).toBe(25);
  });

  it("is the next edition when every saved newsletter was sent", () => {
    const sentNewsletter = makeSavedNewsletter(25, { sentAt: 1 });
    expect(getDefaultNewsletterEdition([sentNewsletter], 26)).toBe(
      26,
    );
  });

  it("is the newest unsent newsletter", () => {
    const savedNewsletters = [
      makeSavedNewsletter(27),
      makeSavedNewsletter(26, { sentAt: 1 }),
      makeSavedNewsletter(25),
    ];
    expect(getDefaultNewsletterEdition(savedNewsletters, 28)).toBe(
      27,
    );
  });
});

describe("canSendNewsletterEdition", () => {
  it("allows hand-coded editions", () => {
    expect(canSendNewsletterEdition([], 12)).toBe(true);
  });

  it("allows saved editions", () => {
    expect(
      canSendNewsletterEdition([makeSavedNewsletter(25)], 25),
    ).toBe(true);
  });

  it("blocks an edition that has not been saved", () => {
    expect(canSendNewsletterEdition([], 25)).toBe(false);
  });
});

describe("listNewsletterBuilderEditionOptions", () => {
  it("lists saved editions with their subjects, then the new one", () => {
    const savedNewsletters = [
      makeSavedNewsletter(26),
      makeSavedNewsletter(25),
    ];
    expect(
      listBuilderEditionOptions(savedNewsletters, 27),
    ).toEqual([
      { editionNumber: 25, label: "Newsletter #25 - Newsletter #25" },
      { editionNumber: 26, label: "Newsletter #26 - Newsletter #26" },
      { editionNumber: 27, label: "Newsletter #27 (new)" },
    ]);
  });

  it("offers only the new edition when nothing is saved", () => {
    expect(listBuilderEditionOptions([], 25)).toEqual([
      { editionNumber: 25, label: "Newsletter #25 (new)" },
    ]);
  });
});
