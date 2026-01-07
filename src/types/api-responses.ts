import { UserSession } from ".";
import { QRScanResult } from "../components/room/QRScanResultDialog";

export type FlyerVoteResponse = QRScanResult & { user: UserSession }
