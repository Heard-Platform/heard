import { Hono } from "npm:hono";
import { getAllRealUsers, getWebDriverUsers } from "./kv-utils.tsx";
import { getUserReports, getFlyerEmails, getFlyerScans, getCertifyCardEvents, getOneBillionEvents, getFundingEvents, getUniqueUserIdsForEvent } from "./model-utils.ts";
import { countRecords } from "./db-utils.ts";

const app = new Hono();

app.get("/make-server-f1a393b4/stats/features", async (c) => {
  try {
    const users = await getAllRealUsers();

    const webDriverUsers = (await getWebDriverUsers()).length;

    const uniqueIpAddresses = new Set(
      users
        .map(u => u.ipAddress)
        .filter(ip => ip && ip !== "unknown")
    ).size;
    
    const uniqueFingerprints = new Set(
      users
        .map(u => u.fingerprint)
        .filter(fp => fp && fp !== "unknown")
    ).size;
    
    const uniqueUserAgents = new Set(
      users
        .map(u => u.userAgent)
        .filter(ua => ua && ua !== "unknown")
    ).size;
    
    const tosAgreedUsers = users.filter(
      u => u.tosAgreedToAt
    ).length;
    
    const privacyPolicyAgreedUsers = users.filter(
      u => u.privacyPolicyAgreedToAt
    ).length;
    
    const flyerEmails = (await getFlyerEmails()).length;
    
    const userReports = (await getUserReports()).length;
    
    const phoneVerifiedUsers = users.filter(
      u => !u.isAnonymous && u.phoneVerified === true
    ).length;
    
    const convertedFromAnonUsers = users.filter(
      u => !u.isAnonymous && u.convertedFromAnonAt
    ).length;
    
    const flyerUsers = users.filter(
      u => u.flyerId
    ).length;

    const avatarAnimalUsers = users.filter(
      u => u.avatarAnimal
    ).length;

    const avatarAnimalCounts: Record<string, number> = {};
    for (const u of users) {
      if (u.avatarAnimal) {
        const currentCount = avatarAnimalCounts[u.avatarAnimal] ?? 0;
        avatarAnimalCounts[u.avatarAnimal] = currentCount + 1;
      }
    }

    const avatarAnimalData = { counts: avatarAnimalCounts };

    const phoneSubmissions = await countRecords("phone_submissions");
    const flyerScans = (await getFlyerScans()).length;
    const roomViews = await countRecords("room_views");
    const roomFollows = await countRecords("room_follows");

    const certifyCardEvents = await getCertifyCardEvents();
    const certifyCardCounts: Record<string, number> = {};
    for (const row of certifyCardEvents) {
      certifyCardCounts[row.type] = (certifyCardCounts[row.type] ?? 0) + 1;
    }
    const certifyCardData = {
      shown: certifyCardCounts["certify_card_shown"] ?? 0,
      emailSubmitted: certifyCardCounts["certify_card_email_submitted"] ?? 0,
      phoneSubmitted: certifyCardCounts["certify_card_phone_submitted"] ?? 0,
      verified: certifyCardCounts["certify_card_verified"] ?? 0,
      dismissed: certifyCardCounts["certify_card_dismissed"] ?? 0,
    };
    const certifyCardShownSince = new Date("2026-04-21").getTime();

    const flyerResultsClicked = (await getUniqueUserIdsForEvent("flyer_results_get_results_clicked")).size;
    const flyerResultsClickedSince = new Date("2026-05-28").getTime();

    const llmApiCalls = await countRecords("llm_api_calls");
    const llmApiCallsSince = new Date("2026-06-04").getTime();

    const ggwashPublished = await countRecords("scraped_items", { source: "ggwash", status: "published" });
    const ggwashRejected = await countRecords("scraped_items", { source: "ggwash", status: "rejected" });
    const ggwashPending = await countRecords("scraped_items", { source: "ggwash", status: "scraped" });
    const ggwashSince = new Date("2026-06-20").getTime();

    const oneBillionEventRows = await getOneBillionEvents();
    const realNonDevUserIds = new Set(
      users.filter((u) => !u.isDeveloper).map((u) => u.id),
    );
    const oneBillionCounts: Record<string, number> = {};
    for (const row of oneBillionEventRows) {
      if (!row.userId || !realNonDevUserIds.has(row.userId)) continue;
      oneBillionCounts[row.type] = (oneBillionCounts[row.type] ?? 0) + 1;
    }
    const oneBillionEvents = {
      pageLoad: oneBillionCounts["one_billion_page_load"] ?? 0,
      clickProjects: oneBillionCounts["one_billion_click_projects"] ?? 0,
      clickOrg: oneBillionCounts["one_billion_click_org"] ?? 0,
      clickForm: oneBillionCounts["one_billion_click_form"] ?? 0,
      clickCopy: oneBillionCounts["one_billion_click_copy"] ?? 0,
    };

    const fundingEventRows = await getFundingEvents();
    const fundingCounts: Record<string, number> = {};
    const fundingUserSets: Record<string, Set<string>> = {};
    for (const row of fundingEventRows) {
      fundingCounts[row.type] = (fundingCounts[row.type] ?? 0) + 1;
      if (row.userId) {
        if (!fundingUserSets[row.type]) fundingUserSets[row.type] = new Set();
        fundingUserSets[row.type].add(row.userId);
      }
    }
    const fu = (key: string) => fundingUserSets[key]?.size ?? 0;
    const fundingEvents = {
      pageView: fundingCounts["funding_page_view"] ?? 0,
      pageViewUsers: fu("funding_page_view"),
      swipeDonate: fundingCounts["funding_swipe_donate"] ?? 0,
      swipeDonateUsers: fu("funding_swipe_donate"),
      amountPickerOpened: fundingCounts["funding_amount_picker_opened"] ?? 0,
      amountPickerOpenedUsers: fu("funding_amount_picker_opened"),
      amountSelected: fundingCounts["funding_amount_selected"] ?? 0,
      amountSelectedUsers: fu("funding_amount_selected"),
      customAmountConfirmed: fundingCounts["funding_custom_amount_confirmed"] ?? 0,
      customAmountConfirmedUsers: fu("funding_custom_amount_confirmed"),
      checkoutStarted: fundingCounts["funding_checkout_started"] ?? 0,
      checkoutStartedUsers: fu("funding_checkout_started"),
      checkoutError: fundingCounts["funding_checkout_error"] ?? 0,
      checkoutErrorUsers: fu("funding_checkout_error"),
      donationSuccess: fundingCounts["funding_donation_success"] ?? 0,
      donationSuccessUsers: fu("funding_donation_success"),
      shareCopy: fundingCounts["funding_share_copy"] ?? 0,
      shareCopyUsers: fu("funding_share_copy"),
      shareNative: fundingCounts["funding_share_native"] ?? 0,
      shareNativeUsers: fu("funding_share_native"),
      shareDismissed: fundingCounts["funding_share_dismissed"] ?? 0,
      shareDismissedUsers: fu("funding_share_dismissed"),
      goToHeardClicked: fundingCounts["funding_go_to_heard_clicked"] ?? 0,
      goToHeardClickedUsers: fu("funding_go_to_heard_clicked"),
      substackLinkClicked: fundingCounts["funding_substack_link_clicked"] ?? 0,
      substackLinkClickedUsers: fu("funding_substack_link_clicked"),
      nugmodeToggled: fundingCounts["funding_nugmode_toggled"] ?? 0,
      nugmodeToggledUsers: fu("funding_nugmode_toggled"),
      exitClicked: fundingCounts["funding_exit_clicked"] ?? 0,
      exitClickedUsers: fu("funding_exit_clicked"),
      fallbackDonate: fundingCounts["funding_fallback_donate_clicked"] ?? 0,
      fallbackDonateUsers: fu("funding_fallback_donate_clicked"),
    };
    const fundingEventsSince = new Date("2026-06-16").getTime();

    const webDriverUsersSince = new Date("2026-03-03").getTime();
    const uniqueIpAddressesSince = new Date("2026-03-03").getTime();
    const uniqueFingerprintsSince = new Date("2026-03-03").getTime();
    const uniqueUserAgentsSince = new Date("2026-03-03").getTime();
    const tosAgreedSince = new Date("2026-02-25").getTime();
    const privacyPolicyAgreedSince = new Date("2026-03-03").getTime();
    const flyerEmailsSince = new Date("2026-02-11").getTime();
    const userReportsSince = new Date("2026-02-04").getTime();
    const phoneVerifiedSince = new Date("2026-01-26").getTime();
    const convertedFromAnonSince = new Date("2026-01-22").getTime();
    const flyerUsersSince = new Date("2026-01-05").getTime();
    const avatarAnimalUsersSince = new Date("2026-03-26").getTime();
    const phoneSubmissionsSince = new Date("2026-04-17").getTime();
    const flyerScansSince = new Date("2026-04-17").getTime();
    const roomViewsSince = new Date("2026-05-15").getTime();
    const roomFollowsSince = new Date("2026-05-15").getTime();

    return c.json({
      webDriverUsers,
      webDriverUsersSince,
      uniqueIpAddresses,
      uniqueIpAddressesSince,
      uniqueFingerprints,
      uniqueFingerprintsSince,
      uniqueUserAgents,
      uniqueUserAgentsSince,
      tosAgreedUsers,
      tosAgreedSince,
      privacyPolicyAgreedUsers,
      privacyPolicyAgreedSince,
      flyerEmails,
      flyerEmailsSince,
      userReports,
      userReportsSince,
      phoneVerifiedUsers,
      phoneVerifiedSince,
      convertedFromAnonUsers,
      convertedFromAnonSince,
      flyerUsers,
      flyerUsersSince,
      avatarAnimalUsers,
      avatarAnimalUsersSince,
      avatarAnimalData,
      phoneSubmissions,
      phoneSubmissionsSince,
      flyerScans,
      flyerScansSince,
      roomViews,
      roomViewsSince,
      roomFollows,
      roomFollowsSince,
      certifyCardShown: certifyCardData.shown,
      certifyCardShownSince,
      certifyCardData,
      flyerResultsClicked,
      flyerResultsClickedSince,
      oneBillionEvents,
      llmApiCalls,
      llmApiCallsSince,
      ggwashPublished,
      ggwashRejected,
      ggwashPending,
      ggwashSince,
      fundingEvents,
      fundingEventsSince,
    });
  } catch (error) {
    console.error("Error fetching feature stats:", error);
    return c.json({ error: "Failed to fetch feature stats" }, 500);
  }
});

export { app as featuresResultsTrackerApi };