import L from "leaflet";

export function degreesToRadians (degrees: number) {
  return degrees * (Math.PI / 180)
}

export function milesToMeters(miles: number) {
  return miles * 1609.34
}

export function feetToMeters(feet: number) {
  return feet * 0.3048
}

export function knotsToMeters(knots: number) {
  return knots * 1852
}

export function knotsToMiles(knots: number) {
  return knots * 0.868976
}

export function knotsToMph(knots: number) {
  return knots * 1.15078
}

export function celsiusToFarenheit(celsius: number) {
  return celsius * (9 / 5) + 32
}

export function freefallTimeForDistance(distance: number) {
  return distance / (120 * 5280 / 60 / 60)
}

export function getPointFromCenter(center: L.LatLngExpression, angle: number, distance: number) {
  const bounds = L.latLng(center).toBounds(feetToMeters(Math.abs(distance) * 5280) * 2)
  const c = L.latLng(center)
  const a = Math.abs(bounds.getNorth() - c.lat)
  const b = Math.abs(bounds.getEast() - c.lng)
  const ang = degreesToRadians(distance > 0 ? angle : ((180 + angle) % 360))
  const x = b * Math.sin(ang)
  const y = a * Math.cos(ang)

  return { lat: y + c.lat, lng: x + c.lng }
}

export function getComponentsFromVector(angle: number, distance: number) {
  const ang = degreesToRadians(angle)
  const x = distance * Math.sin(ang)
  const y = distance * Math.cos(ang)

  return { x, y }
}

export function getAnglesWithInterval(interval: number) {
  return new Array(Math.floor(360 / interval)).fill(undefined).map((_, i, arr) => i * interval)
}
