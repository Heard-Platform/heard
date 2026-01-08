import { DebateRoom, Rant, Statement, UserSession } from ".";
import { QRScanResult } from "../components/room/QRScanResultDialog";

export type RoomStatusResponse = {
  room: DebateRoom;
  statements: Statement[];
  rants: Rant[];
};

export type FlyerVoteResponse = QRScanResult & { user: UserSession }
