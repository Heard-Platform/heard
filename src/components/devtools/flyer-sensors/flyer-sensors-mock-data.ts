import type {
  FlyerStatementOption,
  NewFlyerPlacementsRequest,
  RoomFlyerPlacements,
  SavedFlyerPlacement,
} from "../../../utils/dev-api";
import type { RoomSearchOption } from "../../RoomSearchPicker";
import type { AccelerometerSample, LocationFix } from "./sensor-types";

interface FlyerStop {
  latitude: number;
  longitude: number;
  tapMagnitudes: number[];
}

export interface MockSensorRecording {
  accelerometerSamples: AccelerometerSample[];
  locationFixes: LocationFix[];
}

const RECORDING_START_MS = Date.UTC(2026, 8, 22, 22, 0, 0);
const ACCELEROMETER_INTERVAL_MS = 10;
const GPS_INTERVAL_MS = 1000;
const WALK_DURATION_MS = 40_000;
const STAND_DURATION_MS = 15_000;
const TAP_SPACING_MS = 220;
const WALK_STEP_HZ = 1.9;
const METERS_PER_DEGREE_LATITUDE = 111_320;

const DC_FLYER_STOPS: FlyerStop[] = [
  { latitude: 38.90962, longitude: -77.04341, tapMagnitudes: [38, 52, 64] },
  { latitude: 38.91243, longitude: -77.04566, tapMagnitudes: [42, 45, 60] },
  { latitude: 38.91531, longitude: -77.04513, tapMagnitudes: [33, 51, 73] },
  { latitude: 38.92146, longitude: -77.04239, tapMagnitudes: [48, 30, 55] },
  { latitude: 38.92265, longitude: -77.03598, tapMagnitudes: [66, 88, 58, 81] },
  { latitude: 38.91704, longitude: -77.03196, tapMagnitudes: [38, 48, 77] },
  { latitude: 38.90962, longitude: -77.02968, tapMagnitudes: [31, 41, 43] },
];

const WALK_START = { latitude: 38.90718, longitude: -77.04325 };

function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

function lerp(from: number, to: number, fraction: number): number {
  return from + (to - from) * fraction;
}

export function createMockSensorRecording(seed = 20260922): MockSensorRecording {
  const random = createSeededRandom(seed);
  const noise = (scale: number) => (random() - 0.5) * 2 * scale;

  const accelerometerSamples: AccelerometerSample[] = [];
  const locationFixes: LocationFix[] = [];

  const pushAcceleration = (timeMs: number, x: number, y: number, z: number) => {
    accelerometerSamples.push({ timeMs, x, y, z, magnitude: Math.hypot(x, y, z) });
  };

  const pushFix = (timeMs: number, latitude: number, longitude: number, accuracyM: number) => {
    const jitterDegrees = accuracyM / METERS_PER_DEGREE_LATITUDE / 3;
    locationFixes.push({
      timeMs,
      latitude: latitude + noise(jitterDegrees),
      longitude: longitude + noise(jitterDegrees),
      horizontalAccuracyM: accuracyM,
    });
  };

  let clockMs = RECORDING_START_MS;
  let position = WALK_START;

  for (const stop of DC_FLYER_STOPS) {
    const walkStartMs = clockMs;
    for (let elapsed = 0; elapsed < WALK_DURATION_MS; elapsed += ACCELEROMETER_INTERVAL_MS) {
      const phase = (2 * Math.PI * WALK_STEP_HZ * elapsed) / 1000;
      const heelStrike = Math.max(0, Math.sin(phase)) ** 6 * 14;
      pushAcceleration(
        walkStartMs + elapsed,
        noise(1.5),
        Math.sin(phase) * 3 + noise(1),
        heelStrike + noise(1.5),
      );
    }
    for (let elapsed = 0; elapsed < WALK_DURATION_MS; elapsed += GPS_INTERVAL_MS) {
      const fraction = elapsed / WALK_DURATION_MS;
      pushFix(
        walkStartMs + elapsed,
        lerp(position.latitude, stop.latitude, fraction),
        lerp(position.longitude, stop.longitude, fraction),
        8 + random() * 10,
      );
    }
    clockMs += WALK_DURATION_MS;

    const standStartMs = clockMs;
    const firstTapMs = standStartMs + STAND_DURATION_MS - 2000;
    const tapIndexByTime = new Map(
      stop.tapMagnitudes.map((magnitude, index) => [firstTapMs + index * TAP_SPACING_MS, magnitude]),
    );
    for (let elapsed = 0; elapsed < STAND_DURATION_MS; elapsed += ACCELEROMETER_INTERVAL_MS) {
      const timeMs = standStartMs + elapsed;
      const tapMagnitude = tapIndexByTime.get(timeMs);
      if (tapMagnitude !== undefined) {
        pushAcceleration(timeMs, noise(3), noise(3), tapMagnitude);
      } else {
        pushAcceleration(timeMs, noise(0.4), noise(0.4), noise(0.6));
      }
    }
    for (let elapsed = 0; elapsed < STAND_DURATION_MS; elapsed += GPS_INTERVAL_MS) {
      pushFix(standStartMs + elapsed, stop.latitude, stop.longitude, 5 + random() * 8);
    }
    clockMs += STAND_DURATION_MS;
    position = stop;
  }

  return { accelerometerSamples, locationFixes };
}

export const MOCK_ROOMS: RoomSearchOption[] = [
  { id: "room-dupont-bike-lanes", topic: "Should Connecticut Ave get protected bike lanes?", detail: "Sep 20, 2026" },
  { id: "room-adams-morgan-noise", topic: "How should Adams Morgan handle late-night noise?", detail: "Sep 12, 2026" },
  { id: "room-dc-housing", topic: "What should DC prioritize to make housing affordable?", detail: "Aug 28, 2026" },
];

const MAX_MOCK_VOTES_PER_FLYER = 30;
const SIMULATED_LATENCY_MS = 500;

interface MockSavedFlyerSeed {
  statementId: string;
  flyerGroup: number;
  latitude: number;
  longitude: number;
  headingDeg: number | null;
}

interface MockRoomSeed {
  statements: FlyerStatementOption[];
  flyers: MockSavedFlyerSeed[];
}

const MOCK_ROOM_SEEDS: Record<string, MockRoomSeed> = {
  "room-dupont-bike-lanes": {
    statements: [
      { id: "stmt-protected-lanes", text: "Connecticut Ave should get protected bike lanes even if it removes parking." },
      { id: "stmt-bus-priority", text: "Buses should get their own lane on Connecticut Ave at rush hour." },
    ],
    flyers: [
      { statementId: "stmt-protected-lanes", flyerGroup: 1, latitude: 38.91148, longitude: -77.03852, headingDeg: 90 },
      { statementId: "stmt-protected-lanes", flyerGroup: 2, latitude: 38.91362, longitude: -77.03861, headingDeg: 270 },
      { statementId: "stmt-protected-lanes", flyerGroup: 3, latitude: 38.90983, longitude: -77.03884, headingDeg: null },
      { statementId: "stmt-protected-lanes", flyerGroup: 4, latitude: 38.90762, longitude: -77.03797, headingDeg: 180 },
      { statementId: "stmt-bus-priority", flyerGroup: 1, latitude: 38.91091, longitude: -77.04112, headingDeg: 0 },
    ],
  },
  "room-adams-morgan-noise": {
    statements: [{ id: "stmt-quiet-hours", text: "Bars on 18th St should close their patios at midnight on weeknights." }],
    flyers: [
      { statementId: "stmt-quiet-hours", flyerGroup: 1, latitude: 38.91952, longitude: -77.04051, headingDeg: 45 },
      { statementId: "stmt-quiet-hours", flyerGroup: 2, latitude: 38.92253, longitude: -77.04448, headingDeg: 225 },
      { statementId: "stmt-quiet-hours", flyerGroup: 3, latitude: 38.91814, longitude: -77.04183, headingDeg: null },
    ],
  },
  "room-dc-housing": {
    statements: [{ id: "stmt-upzoning", text: "DC should allow apartment buildings near every Metro station." }],
    flyers: [],
  },
};

function hashString(value: string): number {
  return [...value].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7);
}

function seedSavedFlyers(roomId: string, seeds: MockSavedFlyerSeed[]): SavedFlyerPlacement[] {
  const random = createSeededRandom(hashString(roomId));
  return seeds.map((seed) => {
    const total = Math.floor(random() * MAX_MOCK_VOTES_PER_FLYER);
    const agrees = Math.round(total * random());
    return { ...seed, id: `${seed.statementId}-${seed.flyerGroup}`, agrees, disagrees: total - agrees };
  });
}

function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
}

export interface MockFlyerBackend {
  loadRoomFlyers: (roomId: string) => Promise<RoomFlyerPlacements>;
  saveFlyers: (request: NewFlyerPlacementsRequest) => Promise<void>;
}

export function createMockFlyerBackend(): MockFlyerBackend {
  const roomsById = new Map<string, RoomFlyerPlacements>(
    Object.entries(MOCK_ROOM_SEEDS).map(([roomId, seed]) => [
      roomId,
      { statements: seed.statements, flyers: seedSavedFlyers(roomId, seed.flyers) },
    ]),
  );

  const loadRoomFlyers = async (roomId: string) => {
    await simulateLatency();
    const room = roomsById.get(roomId);
    if (!room) throw new Error("Room not found");
    return room;
  };

  const saveFlyers = async ({ roomId, statementId, flyers }: NewFlyerPlacementsRequest) => {
    await simulateLatency();
    const room = roomsById.get(roomId);
    if (!room) throw new Error("Room not found");

    const savedGroups = new Set(
      room.flyers.filter((flyer) => flyer.statementId === statementId).map((flyer) => flyer.flyerGroup),
    );
    const conflicts = flyers.filter((flyer) => savedGroups.has(flyer.flyerGroup));
    if (conflicts.length > 0) {
      throw new Error(`Flyer groups are already saved for this statement: ${conflicts.map((flyer) => flyer.flyerGroup).join(", ")}`);
    }

    const newFlyers = flyers.map((flyer) => ({
      ...flyer,
      statementId,
      id: `${statementId}-${flyer.flyerGroup}`,
      agrees: 0,
      disagrees: 0,
    }));
    roomsById.set(roomId, { ...room, flyers: [...room.flyers, ...newFlyers] });
  };

  return { loadRoomFlyers, saveFlyers };
}
