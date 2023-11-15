import L from "leaflet";
import { feetToMeters, freefallTimeForDistance, getPointFromCenter, knotsToMiles } from "../utils";
import JumpMap from "./JumpMap";
import Winds from "./Winds";

export interface JumpRunOffset {
  angle: number;
  distance: number;
}

export interface JumpRunOpts {
  center?: L.LatLngExpression;
  offset?: JumpRunOffset;
  spot: number;
  redPrior?: number;
  angle: number;
  redLightColor?: L.PathOptions["color"];
  greenLightColor?: L.PathOptions["color"];
  winds?: Winds;
  airspeed?: number;
  altitude?: number;
  groups?: number;
}

class JumpRun {
  map: L.Map;
  jumpMap: JumpMap;
  center: L.LatLng;
  offsetCenter: L.LatLng;
  options?: JumpRunOpts;
  spot: number;
  groups: number;
  angle: number;
  redPrior: number;
  redLightColor: L.PathOptions["color"];
  greenLightColor: L.PathOptions["color"];
  redLightElement: L.Polyline;
  greenLightElement: L.Polyline;
  groupsElement: L.LayerGroup;
  centerElement: L.CircleMarker;
  mounted: boolean;
  winds?: Winds;
  airspeed: number;
  altitude: number;

  constructor(jumpMap: JumpMap, options: JumpRunOpts) {
    const {
      center = jumpMap.center,
      offset,
      spot,
      groups = 5,
      redPrior = 0.3,
      angle,
      redLightColor = "red",
      greenLightColor = "lime",
      winds,
      airspeed = 120,
      altitude = 13500,
    } = options;

    this.mounted = false;
    this.options = options;
    this.map = jumpMap.map;
    this.jumpMap = jumpMap;
    this.center = L.latLng(center);
    this.offsetCenter = offset
      ? L.latLng(getPointFromCenter(center, offset.angle, offset.distance))
      : this.center;
    this.spot = spot;
    this.angle = angle;
    this.redPrior = redPrior;
    this.redLightColor = redLightColor;
    this.greenLightColor = greenLightColor;
    this.winds = winds || jumpMap.winds;
    this.airspeed = airspeed;
    this.altitude = altitude;
    this.groups = groups;

    const redLightStart = getPointFromCenter(
      this.offsetCenter,
      this.angle,
      this.spot - this.redPrior
    );
    const jumpRunEnd = getPointFromCenter(this.offsetCenter, this.angle, this.spot + this.distance);
    const greenLightStart = getPointFromCenter(this.offsetCenter, this.angle, this.spot);
    this.redLightElement = L.polyline([redLightStart, jumpRunEnd], { color: this.redLightColor });
    this.greenLightElement = L.polyline([greenLightStart, jumpRunEnd], {
      color: this.greenLightColor,
      weight: 5,
    });
    this.groupsElement = L.layerGroup();
    this.centerElement = L.circleMarker(this.offsetCenter, { radius: 6 })
    this.setupGroups()
  }

  get distance() {
    return (this.groups * 1000 - 1000) / 5280
  }

  get groundspeed() {
    if (!this.winds) return this.airspeed;

    return this.winds.adjustAirspeed(this.airspeed, this.angle, this.altitude);
  }

  getSeparation(distance: number = 1000) {
    return distance / ((this.groundspeed * 5280) / 60 / 60);
  }

  private setup(jumpMap: JumpMap, options: JumpRunOpts) {
    const {
      center = jumpMap.center,
      offset,
      spot,
      groups = 5,
      redPrior = 0.3,
      angle,
      redLightColor = "red",
      greenLightColor = "lime",
      winds,
    } = options;

    this.options = options;
    this.map = jumpMap.map;
    this.jumpMap = jumpMap;
    this.center = L.latLng(center);
    this.offsetCenter = offset
      ? L.latLng(getPointFromCenter(center, offset.angle, offset.distance))
      : this.center;
    this.spot = spot;
    this.groups = groups;
    this.angle = angle;
    this.redPrior = redPrior;
    this.redLightColor = redLightColor;
    this.greenLightColor = greenLightColor;
    this.winds = winds || jumpMap.winds;

    const redLightStart = getPointFromCenter(
      this.offsetCenter,
      this.angle,
      this.spot - this.redPrior
    );
    const jumpRunEnd = getPointFromCenter(this.offsetCenter, this.angle, this.spot + this.distance);
    const greenLightStart = getPointFromCenter(this.offsetCenter, this.angle, this.spot);
    this.redLightElement = L.polyline([redLightStart, jumpRunEnd], {
      color: this.redLightColor,
      weight: 5,
    });
    this.greenLightElement = L.polyline([greenLightStart, jumpRunEnd], {
      color: this.greenLightColor,
      weight: 10,
    });
    this.centerElement = L.circleMarker(this.offsetCenter, { radius: 6 })
    this.setupGroups()
  }

  private setupGroups() {
    this.groupsElement.remove()
    this.groupsElement = L.layerGroup()
    new Array(this.groups)
      .fill(undefined)
      .forEach((_, groupIndex) => {
        const groupSpot = (groupIndex * 1000) / 5280;
        const exit = getPointFromCenter(this.offsetCenter, this.angle, this.spot + groupSpot)
        const opening = this.winds ? this.winds.adjustPointForWinds(exit, freefallTimeForDistance(this.altitude - 3500), this.altitude, 3500) : exit
        const exitMarker = L.circleMarker(
          getPointFromCenter(this.offsetCenter, this.angle, this.spot + groupSpot),
          { radius: 8, color: this.greenLightColor, fillColor: this.greenLightColor, fillOpacity: 1, }
        );
        const path = L.polyline(
          [exit, opening],
          { weight: 4, color: this.greenLightColor, dashArray: [6, 10], opacity: 0.5 }
        );
        const openingMarker = L.circle(opening, { radius: feetToMeters(500), weight: 1, dashArray: [4], color: this.greenLightColor })
        path.addTo(this.groupsElement)
        exitMarker.addTo(this.groupsElement)
        openingMarker.addTo(this.groupsElement)
      });
  }

  setForWinds(winds: Winds | undefined = this.winds) {
    if (!winds) return;

    const { direction, speed } = winds?.getWindsAvgForAltitudeRange(13500, 5000);

    this.update({
      spot: knotsToMiles(speed / 60) * 1,
      angle: direction,
    });
  }

  mount() {
    this.centerElement.addTo(this.map)
    this.redLightElement.addTo(this.map).bringToFront();
    this.greenLightElement.addTo(this.map).bringToFront();
    this.groupsElement.addTo(this.map);
    this.mounted = true;
  }

  unmount() {
    if (!this.mounted) return;
    this.centerElement.removeFrom(this.map)
    this.redLightElement.removeFrom(this.map);
    this.greenLightElement.removeFrom(this.map);
    this.groupsElement.removeFrom(this.map);
    this.mounted = false;
  }

  update(opts: JumpRunOpts) {
    this.unmount();
    this.setup(this.jumpMap, opts);
    this.mount();
  }
}

export default JumpRun;
