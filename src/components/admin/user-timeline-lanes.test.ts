import { describe, expect, it } from "vitest";
import { getLaneForEntry } from "./user-timeline-lanes";
import { UserTimelineEvent } from "../../types";

const trackedEvent = (type: string): UserTimelineEvent => ({
  timestamp: 0,
  kind: "tracked_event",
  label: type,
  wasAnonymous: false,
});

describe("getLaneForEntry", () => {
  it("places email capture events in the account lane", () => {
    expect(getLaneForEntry(trackedEvent("anon_response_tripwire_submitted")).label).toBe("Account");
    expect(getLaneForEntry(trackedEvent("certify_card_email_submitted")).label).toBe("Account");
    expect(getLaneForEntry(trackedEvent("flyer_screen_email_added")).label).toBe("Account");
  });

  it("places post views in the posts lane", () => {
    expect(getLaneForEntry(trackedEvent("post_viewed")).label).toBe("Posts");
  });

  it("places email clicks in the emails lane", () => {
    expect(getLaneForEntry(trackedEvent("response_votes_notif_button_clicked")).label).toBe("Emails");
  });

  it("falls back to other events for unmapped event types", () => {
    expect(getLaneForEntry(trackedEvent("initial_load")).label).toBe("Other events");
  });

  it("places non-tracked entries by kind", () => {
    const vote: UserTimelineEvent = { timestamp: 0, kind: "vote_cast", label: "Voted agree", wasAnonymous: false };
    expect(getLaneForEntry(vote).label).toBe("Votes");
  });
});
