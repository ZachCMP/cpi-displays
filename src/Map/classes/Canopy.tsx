import L from "leaflet";
import JumpMap from "./JumpMap";
import Winds from "./Winds";
import { getAnglesWithInterval, getPointFromCenter } from "../utils";
import CANOPY_IMG from './canopy.png'

export interface CanopyOpts {
  location: L.LatLngExpression;
  altitude: number;
  flightAngle?: number;
  glideRatio: number;
  horizontalSpeed: number;
  color?: L.PathOptions['color']
  winds?: Winds;
  heading?: number;
}

class Canopy {
  map: L.Map;
  jumpMap: JumpMap;
  options: CanopyOpts;
  location: L.LatLng;
  altitude: number;
  flightAngle: number;
  glideRatio: number;
  horizontalSpeed: number;
  color?: L.PathOptions['color'];
  layerGroupElement: L.LayerGroup;
  winds?: Winds;
  mounted: boolean;
  icon: L.DivIcon;
  heading: number;

  constructor(jumpMap: JumpMap, options: CanopyOpts) {
    const {
      location,
      altitude,
      flightAngle = 0,
      glideRatio = 3,
      horizontalSpeed = 25,
      color = 'cyan',
      winds,
      heading,
    } = options

    this.mounted = false
    this.options = options
    this.map = jumpMap.map
    this.jumpMap = jumpMap
    this.location = L.latLng(location)
    this.altitude = altitude;
    this.flightAngle = flightAngle
    this.glideRatio = glideRatio
    this.horizontalSpeed = horizontalSpeed
    this.winds = winds || jumpMap.winds
    this.color = color
    this.heading = heading || (this.winds && this.winds.getWindsAvgForAltitudeRange(this.altitude, this.altitude).direction + 180) || 0

    this.layerGroupElement = L.layerGroup()
    // this.icon = L.icon({
    //   iconUrl: CANOPY_IMG,
      // iconSize: [256 / 7, 114 / 7],
      // iconAnchor: [128 / 7, 57 / 7],
    // })

    this.icon = L.divIcon({
      html: `<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;"><img src="${CANOPY_IMG}" width="${256 / 7}px" height="${114 / 7}px" style="transform: rotate(${this.winds?.getWindsAvgForAltitudeRange(this.altitude, this.altitude)?.direction || 0}deg)" /></div>`,
      iconAnchor: [128 / 7, 128 / 7],
      iconSize: [256 / 7, 256 / 7],
    })
  }

  get verticalSpeed() {
    return this.horizontalSpeed / this.glideRatio
  }

  getCanopyIcon(heading: number = this.heading) {
    return L.divIcon({
      html: `
        <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
          <img src="${CANOPY_IMG}" width="${256 / 7}px" height="${114 / 7}px" style="transform: rotate(${this.heading}deg)" />
        </div>
      `,
      iconAnchor: [128 / 7, 128 / 7],
      iconSize: [256 / 7, 256 / 7],
    })
  }

  timeToAltitude(endAltitude: number = 0) {
    return (this.glideRatio * (this.altitude - endAltitude)) / (1.467 * this.horizontalSpeed)
  }

  rangeToAltitude(endAltitude: number = 0) {
    return (this.altitude - endAltitude) * this.glideRatio
  }

  rangeAtHeading(heading: number, endAltitude: number = 0) {
    const fullRangePoint = getPointFromCenter(this.location, heading, this.rangeToAltitude(endAltitude) / 5280)
    if (!this.winds) return fullRangePoint

    return this.winds.adjustPointForWinds(fullRangePoint, this.timeToAltitude(endAltitude), this.altitude, endAltitude)
  }

  private rangePolygonPoints(getLatLng: (angle: number) => L.LatLngExpression, interval: number = 10) {
    return getAnglesWithInterval(interval).map(angle => getLatLng(angle))
  }

  mount() {
    const marker2 = L.circleMarker(this.location, { radius: 2, fillColor: this.color, color: this.color, })
    const marker = L.marker(this.location, { icon: this.getCanopyIcon() })
    // const fullRange = L.circle(this.location, { radius: feetToMeters(this.windlessRange), color: this.color, fillColor: this.color })
    const windPatternRange = L.polygon(this.rangePolygonPoints(angle => this.rangeAtHeading(angle, 1000)),
      { color: this.color, fillColor: this.color, fillOpacity: 0.075, weight: 2, dashArray: [6, 6] }
    )
    const windGroundRange = L.polygon(this.rangePolygonPoints(angle => this.rangeAtHeading(angle, 0)),
      { color: this.color, fillColor: this.color, fillOpacity: 0.05,  weight: 2, opacity: 0.5 }
    )
    windPatternRange.addTo(this.layerGroupElement)
    windGroundRange.addTo(this.layerGroupElement)
    // fullRange.addTo(this.layerGroupElement)
    marker.addTo(this.layerGroupElement)
    marker2.addTo(this.layerGroupElement)
    this.layerGroupElement.addTo(this.map)
    this.mounted = true
  }

  unmount() {
    if (!this.mounted) return
    this.layerGroupElement.removeFrom(this.map)
    this.mounted = false
  }
}

export default Canopy
