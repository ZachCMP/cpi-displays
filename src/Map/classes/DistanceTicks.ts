import L from "leaflet";
import JumpMap from "./JumpMap";
import { getAnglesWithInterval, getPointFromCenter } from "../utils";

export interface CompassOptions {
  interval?: number;
  numberInterval?: number;
  distanceFromCenter?: number;
  color?: L.PathOptions['color']
}

export interface DistanceTicksOpts {
  center?: L.LatLngExpression;
  interval: number;
  end?: number;
  compass?: boolean;
  compassOptions?: CompassOptions
}

class DistanceTicks {
  map: L.Map;
  jumpMap: JumpMap;
  center: L.LatLng;
  options?: DistanceTicksOpts;
  interval: number;
  mounted: boolean;
  end: number;
  layerGroup: L.LayerGroup;
  compass: boolean
  compassGroup: L.LayerGroup;
  compassOptions: Required<CompassOptions>;

  constructor(jumpMap: JumpMap, opts: DistanceTicksOpts) {
    const { center = jumpMap.center, interval, end = 1, compass = true, compassOptions } = opts

    this.options = opts
    this.mounted = false
    this.map = jumpMap.map
    this.jumpMap = jumpMap
    this.center = center ? L.latLng(center) : jumpMap.center
    this.interval = interval
    this.end = end
    this.compass = compass
    this.compassOptions = { interval: 1, numberInterval: 10, distanceFromCenter: 0.425, color: 'yellow', ...compassOptions }
    this.layerGroup = L.layerGroup()
    this.compassGroup = L.layerGroup()

    this.setup()
  }

  setup() {
    new Array(Math.floor(this.end / this.interval))
      .fill(undefined)
      .map((_, i, arr) => (i + 1) * this.interval)
      .forEach((distance) => {
        const circle = L.circle(this.center, { radius: distance * 1609.34, fillOpacity: 0, color: 'white', weight: 1, dashArray: [4], }).addTo(
          this.layerGroup
        );

        const labelPos = L.latLng({
          lat: L.latLng(this.center)
            .toBounds(circle.getRadius() * 2)
            .getNorth(),
          lng: L.latLng(this.center).lng,
        });
        L.marker(labelPos, {
          icon: L.divIcon({
            html: `<div style="color: white; background-color: rgba(0,0,0,0.0); font-size: 8pt; width: 25px; height: 15px; display: flex; justify-content: center; align-items: center; border-radius: 4px;">${distance.toFixed(
              2
            )}</div>`,
            iconAnchor: [12.5, 17],
            iconSize: [25, 15],
          }),

        }).addTo(this.layerGroup);
      });

    if (this.compass) {
      const { interval, numberInterval, distanceFromCenter, color } = this.compassOptions
      getAnglesWithInterval(interval).forEach((angle) => {
        const isNumbered = angle % numberInterval === 0
        const start = getPointFromCenter(this.center, angle, distanceFromCenter)
        const end = getPointFromCenter(this.center, angle, distanceFromCenter + (isNumbered ? 0.028 : 0.02))
        L.polyline([start, end], { color, weight: 1 }).addTo(this.compassGroup)

        if (isNumbered) {
          L.marker(getPointFromCenter(this.center, angle, distanceFromCenter + 0.045), {
            icon: L.divIcon({
              html: `<div style="color: ${color}; background-color: transparent; font-size: 8pt; width: 25px; height: 25px; display: flex; justify-content: center; align-items: center; border-radius: 400px;">${angle}</div>`,
              iconAnchor: [12.5, 12.5],
              iconSize: [25, 25],
            })}).addTo(this.compassGroup)
        }

      })
    }
  }

  mount() {
    this.layerGroup.addTo(this.map)
    if (this.compass) this.compassGroup.addTo(this.map)
    this.mounted = true
  }

  unmount() {
    this.layerGroup.removeFrom(this.map)
    this.mounted = false
  }
}

export default DistanceTicks
