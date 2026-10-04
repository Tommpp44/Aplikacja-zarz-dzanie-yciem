/** Unit conversion for display/input. Storage is always metric (kg, metres). */
export type Units = 'metric' | 'imperial'

const KG_PER_LB = 0.45359237
const M_PER_MI = 1609.344

export function weightUnit(units: Units) {
  return units === 'imperial' ? 'lb' : 'kg'
}

export function distanceUnit(units: Units) {
  return units === 'imperial' ? 'mi' : 'km'
}

export function kgToDisplay(kg: number, units: Units) {
  return units === 'imperial' ? kg / KG_PER_LB : kg
}

export function displayToKg(value: number, units: Units) {
  return units === 'imperial' ? value * KG_PER_LB : value
}

export function metersToDisplay(m: number, units: Units) {
  return units === 'imperial' ? m / M_PER_MI : m / 1000
}

export function displayToMeters(value: number, units: Units) {
  return units === 'imperial' ? value * M_PER_MI : value * 1000
}

const nf = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 })
const nf2 = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 })

export function formatWeight(kg: number, units: Units) {
  return `${nf.format(kgToDisplay(kg, units))} ${weightUnit(units)}`
}

export function formatDistance(m: number, units: Units) {
  return `${nf2.format(metersToDisplay(m, units))} ${distanceUnit(units)}`
}

/** Pace as "m:ss /km" (or /mi). */
export function formatPace(distanceM: number, durationMin: number, units: Units) {
  const dist = metersToDisplay(distanceM, units)
  if (!dist || !durationMin) return null
  const secPerUnit = Math.round((durationMin * 60) / dist)
  return `${Math.floor(secPerUnit / 60)}:${String(secPerUnit % 60).padStart(2, '0')} /${distanceUnit(units)}`
}
