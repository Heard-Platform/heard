import type { LiveEventView, LiveHeartbeat, Statement } from "../../src/types/index.ts";
import {
  type AttendeeScreen,
  EVENT_POLL_MS,
  getAttendeeScreen,
  getIntervalWithBackoff,
  pickNewestState,
  type SentHeartbeat,
  shouldSendHeartbeat,
  toLiveScreen,
} from "../../src/utils/live-event.ts";
import { type HeardApiClient, HeardApiError } from "../shared/heard-api-client.ts";
import { sleep } from "../shared/sleep.ts";
import {
  type AttendeePostPlan,
  findCardsLeftToVote,
  pickCardThinkingMs,
  pickFromList,
  pickStatementWritingMs,
  pickVote,
  planAttendeePost,
  type RandomNumberSource,
} from "./attendee-behavior.ts";
import type { StateChangeTracker, VoteLedger } from "./simulation-measurements.ts";
import { SIMULATED_ATTENDEE_STATEMENTS } from "./simulation-content.ts";

export const SIMULATED_ENVIRONMENT_NAME = "event-simulation";

const POST_LOAD_RETRY_MS = 3000;
const JOIN_ATTEMPT_LIMIT = 5;
const IDLE_CHECK_MS = 500;

export interface SimulatedAttendeeDependencies {
  api: HeardApiClient;
  eventId: string;
  random: RandomNumberSource;
  stateChanges: StateChangeTracker;
  voteLedger: VoteLedger;
  onEventStateSeen: (eventState: LiveEventView) => void;
}

interface ShownPost {
  roomId: string;
  statements: Statement[];
  shownAt: number;
}

export class SimulatedAttendee {
  hasJoined = false;
  private userId = "";
  private eventState: LiveEventView | null = null;
  private shownPost: ShownPost | null = null;
  private loadingRoomId: string | null = null;
  private readonly votedStatementIds = new Set<string>();
  private readonly postPlansByRoomId = new Map<string, AttendeePostPlan>();
  private readonly roomIdsWithStatementWritten = new Set<string>();
  private readonly roomIdsWithPhoneLocked = new Set<string>();
  private lastSentHeartbeat: SentHeartbeat | null = null;
  private consecutivePollFailures = 0;
  private phoneLockedUntil = 0;
  private isWritingStatement = false;

  constructor(
    readonly attendeeNumber: number,
    private readonly dependencies: SimulatedAttendeeDependencies,
  ) {}

  get api(): HeardApiClient {
    return this.dependencies.api;
  }

  async run(stopSignal: AbortSignal) {
    await this.join(stopSignal);
    await Promise.all([this.pollEventState(stopSignal), this.actOnScreen(stopSignal)]);
  }

  private async join(stopSignal: AbortSignal) {
    for (let attempt = 1; attempt <= JOIN_ATTEMPT_LIMIT && !stopSignal.aborted; attempt++) {
      try {
        const account = await this.api.createAnonymousUser(
          SIMULATED_ENVIRONMENT_NAME,
          `${SIMULATED_ENVIRONMENT_NAME}-${this.attendeeNumber}`,
        );
        this.userId = account.user.id;
        this.hasJoined = true;
        await this.api.loadFeed().catch(() => {});
        return;
      } catch {
        await sleep(POST_LOAD_RETRY_MS, stopSignal);
      }
    }
    throw new Error(`Attendee ${this.attendeeNumber} couldn't join`);
  }

  private hasEventEnded(): boolean {
    return this.eventState?.status === "ended";
  }

  private isPhoneLocked(): boolean {
    return Date.now() < this.phoneLockedUntil;
  }

  private currentRoomId(): string | null {
    return this.eventState?.status === "live" ? this.eventState.currentRoomId : null;
  }

  private currentPost(): ShownPost | null {
    return this.shownPost && this.shownPost.roomId === this.currentRoomId() ? this.shownPost : null;
  }

  private cardsLeftToVote(): Statement[] {
    const post = this.currentPost();
    return post ? findCardsLeftToVote(post.statements, this.userId, this.votedStatementIds) : [];
  }

  private currentScreen(): AttendeeScreen | null {
    if (!this.eventState) return null;
    return getAttendeeScreen(this.eventState, this.cardsLeftToVote().length > 0, this.isWritingStatement);
  }

  private currentHeartbeat(): LiveHeartbeat | null {
    const screen = this.currentScreen();
    const isLoadingPost = (screen === "swiping" || screen === "waiting") && !this.currentPost();
    if (!screen || isLoadingPost) return null;
    return { screen: toLiveScreen(screen), shownRoomId: this.currentRoomId() };
  }

  private heartbeatToSend(): LiveHeartbeat | undefined {
    const heartbeat = this.currentHeartbeat();
    const now = Date.now();
    if (!heartbeat || !shouldSendHeartbeat(this.lastSentHeartbeat, heartbeat, now)) return undefined;
    this.lastSentHeartbeat = { heartbeat, sentAt: now };
    return heartbeat;
  }

  private async pollEventState(stopSignal: AbortSignal) {
    while (!stopSignal.aborted && !this.hasEventEnded()) {
      if (!this.isPhoneLocked()) await this.refreshEventState(stopSignal);
      await sleep(getIntervalWithBackoff(EVENT_POLL_MS, this.consecutivePollFailures), stopSignal);
    }
  }

  private async refreshEventState(stopSignal: AbortSignal) {
    try {
      const { live } = await this.api.getLiveEvent(this.dependencies.eventId, this.heartbeatToSend());
      this.consecutivePollFailures = 0;
      this.applyEventState(live, stopSignal);
    } catch {
      this.consecutivePollFailures += 1;
    }
  }

  private applyEventState(incoming: LiveEventView, stopSignal: AbortSignal) {
    const previous = this.eventState;
    const next = pickNewestState(previous, incoming);
    if (previous?.updatedAt !== next.updatedAt) {
      this.dependencies.stateChanges.recordObservation(next, Date.now(), previous === null);
    }
    this.eventState = next;
    this.dependencies.onEventStateSeen(next);

    const isReload = previous !== null && previous.reloadNonce !== next.reloadNonce;
    if (isReload) this.reloadPage(stopSignal);
    else if (next.status === "live" && next.currentRoomId && next.currentRoomId !== this.shownPost?.roomId) {
      this.loadPost(next.currentRoomId, stopSignal);
    }
  }

  private reloadPage(stopSignal: AbortSignal) {
    this.shownPost = null;
    this.lastSentHeartbeat = null;
    this.api.getUser().catch(() => {});
    this.api.loadFeed().catch(() => {});
    const roomId = this.currentRoomId();
    if (roomId) this.loadPost(roomId, stopSignal);
  }

  private async loadPost(roomId: string, stopSignal: AbortSignal) {
    if (this.loadingRoomId === roomId) return;
    this.loadingRoomId = roomId;
    this.shownPost = null;
    while (!stopSignal.aborted && this.currentRoomId() === roomId) {
      try {
        const { statements } = await this.api.getPost(roomId);
        this.showPost(roomId, statements);
        break;
      } catch {
        await sleep(POST_LOAD_RETRY_MS, stopSignal);
      }
    }
    if (this.loadingRoomId === roomId) this.loadingRoomId = null;
  }

  private showPost(roomId: string, statements: Statement[]) {
    if (this.currentRoomId() !== roomId) return;
    const shownAt = this.shownPost?.roomId === roomId ? this.shownPost.shownAt : Date.now();
    this.shownPost = { roomId, statements, shownAt };
    if (!this.postPlansByRoomId.has(roomId)) {
      this.postPlansByRoomId.set(roomId, planAttendeePost(this.dependencies.random));
    }
  }

  private async actOnScreen(stopSignal: AbortSignal) {
    while (!stopSignal.aborted && !this.hasEventEnded()) {
      const post = this.currentPost();
      if (this.isPhoneLocked()) await sleep(IDLE_CHECK_MS, stopSignal);
      else if (post && this.isTimeToLockPhone(post)) this.lockPhone(post);
      else if (post && this.currentScreen() === "swiping") await this.voteOnNextCard(post, stopSignal);
      else if (post && this.currentScreen() === "waiting") await this.waitForMoreCards(post, stopSignal);
      else await sleep(IDLE_CHECK_MS, stopSignal);
    }
  }

  private isTimeToLockPhone(post: ShownPost): boolean {
    const phoneLock = this.postPlansByRoomId.get(post.roomId)?.phoneLock;
    return !!phoneLock && !this.roomIdsWithPhoneLocked.has(post.roomId) &&
      Date.now() - post.shownAt >= phoneLock.startsAfterMs;
  }

  private lockPhone(post: ShownPost) {
    const phoneLock = this.postPlansByRoomId.get(post.roomId)!.phoneLock!;
    this.roomIdsWithPhoneLocked.add(post.roomId);
    this.phoneLockedUntil = Date.now() + phoneLock.lastsMs;
  }

  private async voteOnNextCard(post: ShownPost, stopSignal: AbortSignal) {
    const card = this.cardsLeftToVote()[0];
    await sleep(pickCardThinkingMs(this.dependencies.random), stopSignal);
    if (stopSignal.aborted || this.currentPost() !== post || this.currentScreen() !== "swiping") return;

    const vote = pickVote(this.dependencies.random);
    this.votedStatementIds.add(card.id);
    try {
      await this.api.voteOnStatement(card.id, vote);
      this.dependencies.voteLedger.recordVoteCounted(card.id, vote);
    } catch (error) {
      if (!(error instanceof HeardApiError)) throw error;
    }
  }

  private async waitForMoreCards(post: ShownPost, stopSignal: AbortSignal) {
    if (this.shouldStartWritingStatement(post)) this.writeStatement(post, stopSignal);
    await this.refreshShownPost(post.roomId);
    await sleep(EVENT_POLL_MS, stopSignal);
  }

  private shouldStartWritingStatement(post: ShownPost): boolean {
    return !this.isWritingStatement &&
      !this.roomIdsWithStatementWritten.has(post.roomId) &&
      !!this.postPlansByRoomId.get(post.roomId)?.willWriteStatement;
  }

  private async writeStatement(post: ShownPost, stopSignal: AbortSignal) {
    this.isWritingStatement = true;
    this.roomIdsWithStatementWritten.add(post.roomId);
    await sleep(pickStatementWritingMs(this.dependencies.random), stopSignal);
    const isStillOnPost = this.currentPost()?.roomId === post.roomId && this.eventState?.votingPaused === false;
    if (!stopSignal.aborted && isStillOnPost) {
      const text = pickFromList(this.dependencies.random, SIMULATED_ATTENDEE_STATEMENTS);
      await this.api.addStatement(post.roomId, text).catch(() => {});
      await this.refreshShownPost(post.roomId);
    }
    this.isWritingStatement = false;
  }

  private async refreshShownPost(roomId: string) {
    const response = await this.api.getPost(roomId).catch(() => null);
    if (response) this.showPost(roomId, response.statements);
  }
}
