import L from "leaflet";
import WINDS from '../winds.json'
import { getComponentsFromVector, getPointFromCenter, knotsToMph } from "../utils";

export interface WindsEntry {
  speed: number;
  direction: number;
  temp: number;
}

export interface WindsOpts {
  input: typeof WINDS;
}

class Winds {
  options: WindsOpts;
  input: WindsOpts['input'];
  winds: Record<keyof typeof WINDS.speed, WindsEntry>
  mounted: boolean;

  constructor(options: WindsOpts) {
    const {
      input
    } = options

    this.mounted = false
    this.options = options
    this.input = input

    this.winds = WINDS.altFt.reduce((acc, e) => {
      const alt = String(e) as keyof typeof WINDS.speed;

      return {
        ...acc,
        [alt]: {
          speed: WINDS.speed[alt],
          direction: WINDS.direction[alt],
          temp: WINDS.temp[alt],
        },
      };
    }, {} as Record<keyof typeof WINDS.speed, WindsEntry>);
  }

  getWindsForRange(upper: number, lower: number) {
    const upperTopWindow = Math.ceil(upper / 1000) * 1000;
    const lowerBottomWindow = Math.floor(lower / 1000) * 1000;

    const altitudes = WINDS.altFt.filter((alt) => alt <= upperTopWindow && alt >= lowerBottomWindow)

    return altitudes.reduce((acc, altitude) => {
      const key = String(altitude) as keyof typeof WINDS.speed
      return { ...acc, [key]: this.winds[key] }
    }, {} as Record<keyof typeof WINDS.speed, WindsEntry>)
  }

  getWindsAvgForAltitudeRange(upper: number, lower: number = 0) {
    const upperTopWindow = Math.ceil(upper / 1000) * 1000;
    const lowerBottomWindow = Math.floor(lower / 1000) * 1000;

    const ranges = WINDS.altFt
      .filter((alt) => alt <= upperTopWindow && alt >= lowerBottomWindow)
      .map((alt) => String(alt) as keyof typeof WINDS.speed);

    const avgSpeed = ranges.reduce((acc, alt) => acc + this.winds[alt].speed, 0) / ranges.length;
    const avgDir = ranges.reduce((acc, alt) => acc + this.winds[alt].direction, 0) / ranges.length;

    return {
      speed: avgSpeed,
      direction: avgDir,
    };
  };

  adjustPointForWinds(point: L.LatLngExpression, timeInWinds: number, upper: number, lower: number = 0) {
    const { speed, direction } = this.getWindsAvgForAltitudeRange(upper, lower)
    return getPointFromCenter(L.latLng(point), direction, - (((knotsToMph(speed) * 1.467) * timeInWinds) / 5280))
  }

  adjustAirspeed(airspeed: number, heading: number, altitude: number) {
    const upperWindow = Math.ceil(altitude / 1000) * 1000;
    const lowerWindow = Math.floor(altitude / 1000) * 1000;
    const upperDiff = upperWindow - altitude;
    const closest = upperDiff > 500 ? lowerWindow : upperWindow
    const windsAtAltitude = this.winds[String(closest) as keyof typeof WINDS.speed]

    const { x: wx, y: wy} = getComponentsFromVector(windsAtAltitude.direction, windsAtAltitude.speed)
    const { x: sx, y: sy} = getComponentsFromVector(heading, airspeed)

    return Math.sqrt(Math.pow(sx - wx, 2) + Math.pow(sy - wy, 2))
  }
}

export default Winds
