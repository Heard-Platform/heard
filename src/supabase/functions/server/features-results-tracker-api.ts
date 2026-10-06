import { Hono } from "npm:hono";
import { getAllRealUsers, getWebDriverUsers, getAllAskTheDataRecords } from "./kv-utils.tsx";
import { getUserReports, getFlyerEmails, getFlyerScans, getCertifyCardEvents, getOneBillionEvents, getFundingEvents, getOrganizersEvents, getUniqueUserIdsForEvent, countEventsOfType, getCommunityTeaserEvents } from "./model-utils.ts";
import { countRecords } from "./db-utils.ts";
import type { UserEvent } from "./types.tsx";
import { toTimestamp } from "./time-utils.ts";
import { FLYER_WELCOME_EMAIL_TYPE } from "./template-flyer-welcome.ts";
import { FLYER_RESULTS_EMAIL_TYPE } from "./template-flyer-results.ts";
import { getClusterNamingTokens, getClusterStabilityStats, getResponseVotesNotifStats, getFlyerSwipeFunnel, getFlyerLandingFunnel, getFlyerScreenFunnel } from "./feature-tracker-utils.ts";

const app = new Hono();

app.get("/make-server-f1a393b4/stats/features", async (c) => {
  try {
    const [
      users,
      webDriverUserList,
      flyerEmailList,
      userReportList,
      phoneSubmissions,
      flyerScanList,
      roomViews,
      roomFollows,
      certifyCardEvents,
      flyerResultsClickedUserIds,
      llmApiCalls,
      ggwashPublished,
      ggwashRejected,
      ggwashPending,
      modInvitesAccepted,
      verifyHumanShown,
      verifyHumanClicked,
      roomAnalyticsOpened,
      cohostInviteAccepted,
      oneBillionEventRows,
      fundingEventRows,
      organizersEventRows,
      askTheDataRecords,
      communityTeaserEventRows,
      subscribeUpdatesClicked,
      voteSwingSeen,
      voteSwingShareClicked,
      newPostButtonTapped,
      sessionExpiredRecovered,
      sessionExpiryBypassed,
      sessionExpiryBypassedUserIds,
      responseVotesNotifStats,
      clusterStabilityStats,
      clusterNamingTokens,
      anonResponseTripwireShown,
      anonResponseTripwireEmailSubmitted,
      flyerSwipeFunnel,
      flyerLandingFunnel,
      flyerScreenFunnel,
      flyerWelcomeEmailsSent,
      flyerResultsEmailsSent,
    ] = await Promise.all([
      getAllRealUsers(),
      getWebDriverUsers(),
      getFlyerEmails(),
      getUserReports(),
      countRecords("phone_submissions"),
      getFlyerScans(),
      countRecords("room_views"),
      countRecords("room_follows"),
      getCertifyCardEvents(),
      getUniqueUserIdsForEvent("flyer_results_get_results_clicked"),
      countRecords("llm_api_calls"),
      countRecords("scraped_items", { source: "ggwash", status: "published" }),
      countRecords("scraped_items", { source: "ggwash", status: "rejected" }),
      countRecords("scraped_items", { source: "ggwash", status: "scraped" }),
      countEventsOfType("mod_invite_accepted"),
      countEventsOfType("verify_human_shown"),
      countEventsOfType("verify_human_clicked"),
      countEventsOfType("room_analytics_opened"),
      countEventsOfType("cohost_invite_accepted"),
      getOneBillionEvents(),
      getFundingEvents(),
      getOrganizersEvents(),
      getAllAskTheDataRecords(),
      getCommunityTeaserEvents(),
      countEventsOfType("subscribe_updates_clicked"),
      countEventsOfType("vote_swing_seen"),
      countEventsOfType("vote_swing_share_clicked"),
      countEventsOfType("new_post_button_tapped"),
      countEventsOfType("session_expired_recovered"),
      countEventsOfType("session_expiry_bypassed"),
      getUniqueUserIdsForEvent("session_expiry_bypassed"),
      getResponseVotesNotifStats(),
      getClusterStabilityStats(),
      getClusterNamingTokens(),
      countEventsOfType("anon_response_tripwire_shown"),
      countEventsOfType("anon_response_tripwire_submitted"),
      getFlyerSwipeFunnel(),
      getFlyerLandingFunnel(),
      getFlyerScreenFunnel(),
      countRecords("sent_emails", { emailType: FLYER_WELCOME_EMAIL_TYPE }),
      countRecords("sent_emails", { emailType: FLYER_RESULTS_EMAIL_TYPE }),
    ]);

    const webDriverUsers = webDriverUserList.length;

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
    
    const flyerEmails = flyerEmailList.length;
    
    const userReports = userReportList.length;
    
    const phoneVerifiedUsers = users.filter(
      u => !u.isAnonymous && u.phoneVerified === true
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

    const flyerScans = flyerScanList.length;

    const countCertifyCardEvents = (events: UserEvent[]) => ({
      shown: events.filter((row) => row.type === "certify_card_shown").length,
      emailSubmitted: events.filter((row) => row.type === "certify_card_email_submitted").length,
    });
    const certifyCardShownSince = new Date("2026-09-22").getTime();

    const certifyCardMonthlyBuckets: Record<string, UserEvent[]> = {};
    for (const row of certifyCardEvents) {
      const date = new Date(toTimestamp(row.createdAt));
      const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      (certifyCardMonthlyBuckets[month] ??= []).push(row);
    }
    const certifyCardMonthly = Object.keys(certifyCardMonthlyBuckets)
      .sort()
      .map((month) => ({
        month,
        ...countCertifyCardEvents(certifyCardMonthlyBuckets[month]),
      }));

    const flyerResultsClicked = flyerResultsClickedUserIds.size;
    const flyerResultsClickedSince = new Date("2026-05-28").getTime();

    const llmApiCallsSince = new Date("2026-06-04").getTime();

    const ggwashSince = new Date("2026-06-20").getTime();

    const modInvitesAcceptedSince = new Date("2026-06-29").getTime();

    const verifyHumanShownSince = new Date("2026-09-22").getTime();

    const roomAnalyticsOpenedSince = new Date("2026-09-01").getTime();

    const cohostInviteAcceptedSince = new Date("2026-06-29").getTime();

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
      teaserClicked: fundingCounts["funding_teaser_clicked"] ?? 0,
      teaserClickedUsers: fu("funding_teaser_clicked"),
      teaserDismissed: fundingCounts["funding_teaser_dismissed"] ?? 0,
      teaserDismissedUsers: fu("funding_teaser_dismissed"),
    };
    const fundingEventsSince = new Date("2026-06-16").getTime();

    const organizersCounts: Record<string, number> = {};
    const organizersUserSets: Record<string, Set<string>> = {};
    for (const row of organizersEventRows) {
      organizersCounts[row.type] = (organizersCounts[row.type] ?? 0) + 1;
      if (row.userId) {
        if (!organizersUserSets[row.type]) organizersUserSets[row.type] = new Set();
        organizersUserSets[row.type].add(row.userId);
      }
    }
    const ou = (key: string) => organizersUserSets[key]?.size ?? 0;
    const organizersEvents = {
      pageView: organizersCounts["organizers_page_view"] ?? 0,
      pageViewUsers: ou("organizers_page_view"),
      scrolledBelowFold: organizersCounts["organizers_scrolled_below_fold"] ?? 0,
      scrolledBelowFoldUsers: ou("organizers_scrolled_below_fold"),
      demoVoteAgree: organizersCounts["organizers_demo_vote_agree"] ?? 0,
      demoVoteDisagree: organizersCounts["organizers_demo_vote_disagree"] ?? 0,
      demoVotePass: organizersCounts["organizers_demo_vote_pass"] ?? 0,
      demoVoteSuperAgree: organizersCounts["organizers_demo_vote_super_agree"] ?? 0,
      demoCompleted: organizersCounts["organizers_demo_completed"] ?? 0,
      demoCompletedUsers: ou("organizers_demo_completed"),
      clickScheduleTop: organizersCounts["organizers_click_schedule_top"] ?? 0,
      clickScheduleTopUsers: ou("organizers_click_schedule_top"),
      clickScheduleBottom: organizersCounts["organizers_click_schedule_bottom"] ?? 0,
      clickScheduleBottomUsers: ou("organizers_click_schedule_bottom"),
      clickFounderLinkedin: organizersCounts["organizers_click_founder_linkedin"] ?? 0,
      clickFounderInstagram: organizersCounts["organizers_click_founder_instagram"] ?? 0,
      clickFounderYoutube: organizersCounts["organizers_click_founder_youtube"] ?? 0,
      clickVtaiwanLink: organizersCounts["organizers_click_vtaiwan_link"] ?? 0,
      clickExitLogo: organizersCounts["organizers_click_exit_logo"] ?? 0,
      clickTestimonialBeagleFreedomProject: organizersCounts["organizers_click_testimonial_beagle_freedom_project"] ?? 0,
      clickTestimonialInterdependanceDay: organizersCounts["organizers_click_testimonial_interdependance_day"] ?? 0,
      resultsExpanded: organizersCounts["organizers_results_expanded"] ?? 0,
      resultsExpandedUsers: ou("organizers_results_expanded"),
      resultsCollapsed: organizersCounts["organizers_results_collapsed"] ?? 0,
      resultsLoadError: organizersCounts["organizers_results_load_error"] ?? 0,
    };
    const organizersEventsSince = new Date("2026-07-17").getTime();

    const askTheDataQuestions = askTheDataRecords.length;
    const askTheDataQuestionsSince = new Date("2026-07-01").getTime();

    const communityTeaserEvents = communityTeaserEventRows.length;
    const communityTeaserEventsSince = new Date("2026-08-19").getTime();

    const subscribeUpdatesClickedSince = new Date("2026-09-09").getTime();

    const voteSwingSeenSince = new Date("2026-09-11").getTime();
    const voteSwingShareClickedSince = new Date("2026-09-11").getTime();

    const newPostButtonTappedSince = new Date("2026-09-14").getTime();

    const sessionExpiredRecoveredSince = new Date("2026-09-17").getTime();

    const sessionExpiryBypassedUsers = sessionExpiryBypassedUserIds.size;
    const sessionExpiryBypassedSince = new Date("2026-09-18").getTime();

    const responseVotesNotifEmailsSent = responseVotesNotifStats.emailsSent;
    const responseVotesNotifEmailsSentSince = new Date("2026-09-16").getTime();
    const responseVotesNotifButtonClicks = responseVotesNotifStats.buttonClicks;
    const responseVotesNotifReturnedWithinWeek = responseVotesNotifStats.returnedWithinWeek;

    const clusterRecomputesSince = new Date("2026-09-28").getTime();

    const clusterNamingTokensSince = new Date("2026-09-28").getTime();


    const anonResponseTripwireSince = new Date("2026-09-21").getTime();

    const flyerSwipeFunnelSince = new Date("2026-09-30").getTime();

    const flyerLandingFunnelSince = new Date("2026-10-01").getTime();

    const flyerScreenFunnelSince = new Date("2026-10-03").getTime();

    const flyerEmailsSentSince = new Date("2026-10-03").getTime();

    const webDriverUsersSince = new Date("2026-03-03").getTime();
    const uniqueIpAddressesSince = new Date("2026-03-03").getTime();
    const uniqueFingerprintsSince = new Date("2026-03-03").getTime();
    const uniqueUserAgentsSince = new Date("2026-03-03").getTime();
    const tosAgreedSince = new Date("2026-02-25").getTime();
    const privacyPolicyAgreedSince = new Date("2026-03-03").getTime();
    const flyerEmailsSince = new Date("2026-02-11").getTime();
    const userReportsSince = new Date("2026-02-04").getTime();
    const phoneVerifiedSince = new Date("2026-01-26").getTime();
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
      certifyCardShown: certifyCardMonthly.reduce((sum, m) => sum + m.shown, 0),
      certifyCardShownSince,
      certifyCardMonthly,
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
      organizersEvents,
      organizersEventsSince,
      modInvitesAccepted,
      modInvitesAcceptedSince,
      verifyHumanShown,
      verifyHumanClicked,
      verifyHumanShownSince,
      roomAnalyticsOpened,
      roomAnalyticsOpenedSince,
      cohostInviteAccepted,
      cohostInviteAcceptedSince,
      askTheDataQuestions,
      askTheDataQuestionsSince,
      communityTeaserEvents,
      communityTeaserEventsSince,
      subscribeUpdatesClicked,
      subscribeUpdatesClickedSince,
      voteSwingSeen,
      voteSwingSeenSince,
      voteSwingShareClicked,
      voteSwingShareClickedSince,
      newPostButtonTapped,
      newPostButtonTappedSince,
      responseVotesNotifEmailsSent,
      responseVotesNotifEmailsSentSince,
      responseVotesNotifButtonClicks,
      responseVotesNotifReturnedWithinWeek,
      clusterRecomputesLast7Days: clusterStabilityStats.recomputesLast7Days,
      clusterRecomputesSince,
      clusterRecomputesWeekly: clusterStabilityStats.recomputesWeekly,
      clusterIdentityKeptPercent: clusterStabilityStats.identityKeptPercent,
      clusterNamingTokens,
      clusterNamingTokensSince,
      sessionExpiredRecovered,
      sessionExpiredRecoveredSince,
      sessionExpiryBypassed,
      sessionExpiryBypassedUsers,
      sessionExpiryBypassedSince,
      anonResponseTripwireShown,
      anonResponseTripwireEmailSubmitted,
      anonResponseTripwireSince,
      flyerSwipeFunnel,
      flyerSwipeFunnelSince,
      flyerLandingFunnel,
      flyerLandingFunnelSince,
      flyerScreenFunnel,
      flyerScreenFunnelSince,
      flyerWelcomeEmailsSent,
      flyerResultsEmailsSent,
      flyerEmailsSentSince,
    });
  } catch (error) {
    console.error("Error fetching feature stats:", error);
    return c.json({ error: "Failed to fetch feature stats" }, 500);
  }
});

export { app as featuresResultsTrackerApi };