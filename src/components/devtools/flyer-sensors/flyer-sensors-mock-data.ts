import type { FlyerVoteTally } from "./flyer-votes";
import type { RoomOption } from "./RoomPicker";
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

export const MOCK_ROOMS: RoomOption[] = [
  { id: "room-dupont-bike-lanes", topic: "Should Connecticut Ave get protected bike lanes?", createdAt: Date.UTC(2026, 8, 20) },
  { id: "room-adams-morgan-noise", topic: "How should Adams Morgan handle late-night noise?", createdAt: Date.UTC(2026, 8, 12) },
  { id: "room-dc-housing", topic: "What should DC prioritize to make housing affordable?", createdAt: Date.UTC(2026, 7, 28) },
];

const ROOM_WITHOUT_VOTES_ID = "room-dc-housing";
const MAX_MOCK_VOTES_PER_FLYER = 30;

function hashString(value: string): number {
  return [...value].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7);
}

export function createMockFlyerVotes(roomId: string, tappedAtTimes: number[]): FlyerVoteTally[] {
  if (roomId === ROOM_WITHOUT_VOTES_ID) return [];
  const random = createSeededRandom(hashString(roomId));
  return tappedAtTimes.flatMap((tappedAtMs) => {
    const total = Math.floor(random() * MAX_MOCK_VOTES_PER_FLYER);
    if (total === 0) return [];
    const agrees = Math.round(total * random());
    return [{ tappedAtMs, agrees, disagrees: total - agrees }];
  });
}
