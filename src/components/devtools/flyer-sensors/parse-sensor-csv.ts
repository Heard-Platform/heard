import Papa from "papaparse";
import type { AccelerometerSample, LocationFix } from "./sensor-types";

type CsvRow = Record<string, string>;

const NANOSECONDS_PER_MS = 1_000_000;

const ACCELEROMETER_COLUMNS = ["time", "x", "y", "z"];
const LOCATION_COLUMNS = ["time", "latitude", "longitude", "horizontalAccuracy"];

function parseCsvRows<T>(
  file: File,
  requiredColumns: string[],
  toRecord: (row: CsvRow) => T | null,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const records: T[] = [];
    let headerChecked = false;

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      chunk: (results, parser) => {
        if (!headerChecked) {
          const fields = results.meta.fields ?? [];
          const missing = requiredColumns.filter((column) => !fields.includes(column));
          if (missing.length > 0) {
            parser.abort();
            reject(new Error(`${file.name} is missing columns: ${missing.join(", ")}`));
            return;
          }
          headerChecked = true;
        }
        for (const row of results.data) {
          const record = toRecord(row);
          if (record) records.push(record);
        }
      },
      complete: () => resolve(records),
      error: (error) => reject(error),
    });
  });
}

function nanosecondsToMs(value: string): number {
  return Number(value) / NANOSECONDS_PER_MS;
}

function allFinite(...values: number[]): boolean {
  return values.every(Number.isFinite);
}

function toAccelerometerSample(row: CsvRow): AccelerometerSample | null {
  const timeMs = nanosecondsToMs(row.time);
  const x = Number(row.x);
  const y = Number(row.y);
  const z = Number(row.z);
  if (!allFinite(timeMs, x, y, z)) return null;
  return { timeMs, x, y, z, magnitude: Math.hypot(x, y, z) };
}

function toLocationFix(row: CsvRow): LocationFix | null {
  const timeMs = nanosecondsToMs(row.time);
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  const horizontalAccuracyM = Number(row.horizontalAccuracy);
  if (!allFinite(timeMs, latitude, longitude, horizontalAccuracyM)) return null;
  return { timeMs, latitude, longitude, horizontalAccuracyM };
}

function byTime<T extends { timeMs: number }>(a: T, b: T): number {
  return a.timeMs - b.timeMs;
}

export async function parseAccelerometerCsv(file: File): Promise<AccelerometerSample[]> {
  const samples = await parseCsvRows(file, ACCELEROMETER_COLUMNS, toAccelerometerSample);
  return samples.sort(byTime);
}

export async function parseLocationCsv(file: File): Promise<LocationFix[]> {
  const fixes = await parseCsvRows(file, LOCATION_COLUMNS, toLocationFix);
  return fixes.sort(byTime);
}
