import { describe, expect, it } from 'vitest'
import { AppleHealthParser, appleDateToIso } from './apple-health'
import { haversine, parseGpx } from './gpx'

const XML = `<?xml version="1.0"?>
<HealthData locale="pl_PL">
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" startDate="2026-10-01 08:00:00 +0200" endDate="2026-10-01 08:10:00 +0200" value="4000"/>
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" startDate="2026-10-01 18:00:00 +0200" endDate="2026-10-01 18:10:00 +0200" value="3000"/>
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Apple Watch" unit="count" startDate="2026-10-01 08:00:00 +0200" endDate="2026-10-01 08:10:00 +0200" value="6500"/>
 <Record type="HKQuantityTypeIdentifierDistanceWalkingRunning" sourceName="iPhone" unit="km" startDate="2026-10-01 08:00:00 +0200" endDate="2026-10-01 08:10:00 +0200" value="5.2"/>
 <Record type="HKQuantityTypeIdentifierActiveEnergyBurned" sourceName="Apple Watch" unit="kJ" startDate="2026-10-01 08:00:00 +0200" endDate="2026-10-01 08:10:00 +0200" value="418.4"/>
 <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" unit="count/min" startDate="2026-10-01 08:00:00 +0200" endDate="2026-10-01 08:00:00 +0200" value="70"/>
 <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="31.5" durationUnit="min" sourceName="Apple Watch" startDate="2026-10-01 07:00:00 +0200" endDate="2026-10-01 07:31:30 +0200">
  <WorkoutStatistics type="HKQuantityTypeIdentifierDistanceWalkingRunning" startDate="x" endDate="y" sum="5.1" unit="km"/>
  <WorkoutStatistics type="HKQuantityTypeIdentifierActiveEnergyBurned" startDate="x" endDate="y" sum="320" unit="kcal"/>
 </Workout>
 <Workout workoutActivityType="HKWorkoutActivityTypeYoga" duration="1200" durationUnit="s" sourceName="Apple Watch" startDate="2026-09-01 19:00:00 +0200" endDate="2026-09-01 19:20:00 +0200"/>
</HealthData>`

describe('Apple Health import', () => {
  it('aggregates per day without double counting sources, across chunk boundaries', () => {
    const p = new AppleHealthParser()
    for (let i = 0; i < XML.length; i += 37) p.feed(XML.slice(i, i + 37))
    const { days, workouts } = p.result()
    expect(days).toEqual([
      { date: '2026-10-01', steps: 7000, distance_m: 5200, active_minutes: null, calories: 100 },
    ])
    expect(workouts).toHaveLength(2)
    expect(workouts[0]).toMatchObject({
      workout_type: 'running',
      performed_on: '2026-10-01',
      duration_minutes: 32,
      distance_m: 5100,
      calories: 320,
      started_at: '2026-10-01T05:00:00.000Z',
    })
    expect(workouts[1]).toMatchObject({ workout_type: 'mobility', duration_minutes: 20 })
  })

  it('can skip history before a date', () => {
    const p = new AppleHealthParser({ since: '2026-09-15' })
    p.feed(XML)
    expect(p.result().workouts).toHaveLength(1)
    expect(appleDateToIso('bad')).toBeNull()
  })
})

const GPX = `<?xml version="1.0"?><gpx><trk><name>Morning Run</name><type>running</type><trkseg>
<trkpt lat="52.2297" lon="21.0122"><ele>100</ele><time>2026-10-02T05:00:00Z</time></trkpt>
<trkpt lat="52.2387" lon="21.0122"><ele>104</ele><time>2026-10-02T05:05:00Z</time></trkpt>
<trkpt lat="52.2477" lon="21.0122"><ele>102</ele><time>2026-10-02T05:10:00Z</time></trkpt>
</trkseg></trk></gpx>`

describe('GPX import', () => {
  it('computes distance, duration, elevation gain and type', () => {
    const w = parseGpx(GPX)!
    expect(w.workout_type).toBe('running')
    expect(w.name).toBe('Morning Run')
    expect(w.duration_minutes).toBe(10)
    expect(w.distance_m).toBeGreaterThan(1990)
    expect(w.distance_m).toBeLessThan(2010)
    expect(w.elevation_m).toBe(4)
    expect(w.external_id).toBe('gpx:2026-10-02T05:00:00Z')
  })

  it('rejects files without a track', () => {
    expect(parseGpx('<gpx></gpx>')).toBeNull()
    expect(Math.round(haversine([0, 0], [0, 1]) / 1000)).toBe(111)
  })
})
