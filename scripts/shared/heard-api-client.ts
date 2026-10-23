import type {
  DebateRoom,
  Event,
  EventSummary,
  LiveEventView,
  LiveHeartbeat,
  NewDebateRoom,
  NewEvent,
  Statement,
  UserSession,
  VoteType,
} from "../../src/types/index.ts";
import type { RoomStatusResponse } from "../../src/types/api-responses.ts";
import type { HeardScriptEnvironment } from "./heard-script-environment.ts";

export interface ApiCallRecord {
  routeName: string;
  status: number | null;
  durationMs: number;
  finishedAt: number;
}

export type ApiCallListener = (record: ApiCallRecord) => void;

export interface AnonymousAccount {
  user: UserSession;
  sessionId: string;
}

export class HeardApiError extends Error {
  constructor(
    readonly routeName: string,
    readonly status: number | null,
    message: string,
  ) {
    super(`${routeName} failed (${status ?? "no response"}): ${message}`);
  }
}

type HttpMethod = "GET" | "POST";

export class HeardApiClient {
  constructor(
    private readonly environment: HeardScriptEnvironment,
    private sessionId: string | null = null,
    private readonly onApiCall?: ApiCallListener,
  ) {}

  async createAnonymousUser(environmentName: string, fingerprint: string): Promise<AnonymousAccount> {
    const account = await this.send<AnonymousAccount>("POST", "POST /user/anonymous", "/user/anonymous", {
      environment: environmentName,
      fingerprint,
      userAgent: `Heard script (${environmentName})`,
      webdriver: false,
    });
    this.sessionId = account.sessionId;
    return account;
  }

  getUser() {
    return this.send<{ user: UserSession }>("GET", "GET /user/me", "/user/me");
  }

  loadFeed() {
    return this.send<{ rooms: DebateRoom[] }>(
      "POST",
      "POST /rooms/active",
      "/rooms/active?onlyJoined=false&includeDemographics=false",
    );
  }

  getEvent(eventId: string) {
    return this.send<{ event: Event }>("GET", "GET /event/:id", `/event/${eventId}`);
  }

  getLiveEvent(eventId: string, heartbeat?: LiveHeartbeat) {
    const query = heartbeat
      ? `?${new URLSearchParams({ screen: heartbeat.screen, shownRoomId: heartbeat.shownRoomId ?? "" })}`
      : "";
    return this.send<{ live: LiveEventView }>("GET", "GET /event/:id/live", `/event/${eventId}/live${query}`);
  }

  getPost(roomId: string) {
    return this.send<RoomStatusResponse>("GET", "GET /room/:id", `/room/${roomId}`);
  }

  voteOnStatement(statementId: string, voteType: VoteType) {
    return this.send<{ statement: Statement }>("POST", "POST /statement/:id/vote", `/statement/${statementId}/vote`, {
      voteType,
    });
  }

  addStatement(roomId: string, text: string) {
    return this.send<{ statement: Statement }>("POST", "POST /room/:id/statement", `/room/${roomId}/statement`, {
      text,
    });
  }

  createEvent(newEvent: NewEvent) {
    return this.send<{ event: EventSummary }>("POST", "POST /event/create", "/event/create", newEvent);
  }

  createPost(newPost: NewDebateRoom) {
    return this.send<DebateRoom>("POST", "POST /room/create", "/room/create", newPost);
  }

  private async send<T>(method: HttpMethod, routeName: string, path: string, body?: unknown): Promise<T> {
    const startedAt = performance.now();
    let status: number | null = null;
    try {
      const response = await fetch(`${this.environment.apiBaseUrl}${path}`, {
        method,
        headers: this.buildHeaders(),
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      status = response.status;
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new HeardApiError(routeName, status, payload.message ?? payload.error ?? response.statusText);
      }
      return payload as T;
    } catch (error) {
      if (error instanceof HeardApiError) throw error;
      throw new HeardApiError(routeName, null, error instanceof Error ? error.message : String(error));
    } finally {
      this.onApiCall?.({ routeName, status, durationMs: performance.now() - startedAt, finishedAt: Date.now() });
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.environment.supabaseAnonKey}`,
      "X-API-Key": this.environment.heardApiSecret,
    };
    if (this.sessionId) headers["X-Session-Id"] = this.sessionId;
    return headers;
  }
}
