import L from "leaflet";
import JumpMap from "./JumpMap";
import WINDS from '../winds.json'
import { getPointFromCenter, knotsToMph } from "../utils";

export interface WindsEntry {
  speed: number;
  direction: number;
  temp: number;
}

export interface WindsOpts {
  input: typeof WINDS;
}

class Winds {
  map: L.Map;
  jumpMap: JumpMap;
  options: WindsOpts;
  input: WindsOpts['input'];
  winds: Record<keyof typeof WINDS.speed, WindsEntry>
  mounted: boolean;

  constructor(jumpMap: JumpMap, options: WindsOpts) {
    const {
      input
    } = options

    this.mounted = false
    this.options = options
    this.map = jumpMap.map
    this.jumpMap = jumpMap
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
}

export default Winds
