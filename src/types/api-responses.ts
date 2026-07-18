import { DebateRoom, Rant, Statement, UserSession } from ".";
import { SingleQRScanResult } from "../components/room/QRScanResultDialog";

export type UserSessionResponse = {
  user: UserSession;
  sessionId: string;
};

export type RoomStatusResponse = {
  room: DebateRoom;
  statements: Statement[];
  rants: Rant[];
};

export type FlyerVoteResponse = Omit<SingleQRScanResult, 'mode'> & {
  user: UserSession;
  sessionId: string;
};

export type AskTheDataResponse = {
  id: string;
  status: "answered" | "rejected";
  response: string;
};