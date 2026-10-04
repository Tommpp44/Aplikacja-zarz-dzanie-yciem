import type { WorkoutType } from '@/lib/workouts/schemas'
import type { ImportedWorkout } from './apple-health'

const R = 6371000
export function haversine(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function typeFrom(text: string): WorkoutType {
  const t = text.toLowerCase()
  if (/run|bieg|^9$/.test(t)) return 'running'
  if (/ride|cycl|bike|rower|^1$/.test(t)) return 'cycling'
  if (/walk|hik|spacer|^10$|^11$/.test(t)) return 'walking'
  if (/swim|pływ/.test(t)) return 'swimming'
  return 'custom'
}

/** Parses a GPX track (Strava, Garmin, Komoot exports) into a workout summary. */
export function parseGpx(xml: string, fallbackName = 'Imported workout'): ImportedWorkout | null {
  const points: { lat: number; lon: number; ele: number | null; time: string | null }[] = []
  for (const m of xml.matchAll(/<trkpt\s+([^>]*?)\/?>([\s\S]*?)(?:<\/trkpt>|(?=<trkpt)|$)/g)) {
    const lat = Number(/lat="([^"]+)"/.exec(m[1]!)?.[1])
    const lon = Number(/lon="([^"]+)"/.exec(m[1]!)?.[1])
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const ele = /<ele>([^<]+)<\/ele>/.exec(m[2] ?? '')?.[1]
    const time = /<time>([^<]+)<\/time>/.exec(m[2] ?? '')?.[1] ?? null
    points.push({ lat, lon, ele: ele !== undefined ? Number(ele) : null, time })
  }
  if (points.length < 2) return null
  let distance = 0
  let gain = 0
  for (let i = 1; i < points.length; i++) {
    distance += haversine(
      [points[i - 1]!.lat, points[i - 1]!.lon],
      [points[i]!.lat, points[i]!.lon],
    )
    const de = (points[i]!.ele ?? 0) - (points[i - 1]!.ele ?? 0)
    if (points[i]!.ele !== null && points[i - 1]!.ele !== null && de > 0.5) gain += de
  }
  const first = points.find((p) => p.time)?.time ?? null
  const last = [...points].reverse().find((p) => p.time)?.time ?? null
  const start = first ? new Date(first) : null
  const minutes =
    start && last ? Math.round((new Date(last).getTime() - start.getTime()) / 60000) : null
  const name = /<trk>[\s\S]*?<name>([^<]+)<\/name>/.exec(xml)?.[1]?.trim() || fallbackName
  const typeText = /<trk>[\s\S]*?<type>([^<]+)<\/type>/.exec(xml)?.[1] ?? name
  return {
    external_id: `gpx:${first ?? `${points[0]!.lat},${points[0]!.lon}:${Math.round(distance)}`}`,
    workout_type: typeFrom(typeText),
    name: name.slice(0, 120),
    performed_on: (first ?? new Date().toISOString()).slice(0, 10),
    started_at: start ? start.toISOString() : null,
    duration_minutes: minutes !== null && minutes > 0 ? Math.min(1440, minutes) : null,
    distance_m: Math.round(distance * 10) / 10,
    calories: null,
    elevation_m: Math.round(gain * 10) / 10,
  }
}
