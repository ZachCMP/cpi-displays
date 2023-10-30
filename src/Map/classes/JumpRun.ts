import L from "leaflet";
import { getPointFromCenter } from "../utils";
import JumpMap from "./JumpMap";

export interface JumpRunOffset {
  angle: number;
  distance: number;
}

export interface JumpRunOpts {
  center?: L.LatLngExpression;
  offset?: JumpRunOffset;
  spot: number;
  distance?: number;
  redPrior?: number;
  angle: number;
  redLightColor?: L.PathOptions['color']
  greenLightColor?: L.PathOptions['color']
}

class JumpRun {
  map: L.Map;
  jumpMap: JumpMap;
  center: L.LatLng;
  offsetCenter: L.LatLng;
  options?: JumpRunOpts;
  spot: number;
  distance: number;
  angle: number;
  redPrior: number;
  redLightColor: L.PathOptions['color'];
  greenLightColor: L.PathOptions['color'];
  redLightElement: L.Polyline;
  greenLightElement: L.Polyline;
  mounted: boolean;

  constructor(jumpMap: JumpMap, options: JumpRunOpts) {
    const { center = jumpMap.center, offset, spot, distance = 0.75, redPrior = 0.3, angle, redLightColor = 'red', greenLightColor = 'lime' } = options

    this.mounted = false
    this.options = options
    this.map = jumpMap.map
    this.jumpMap = jumpMap
    this.center = L.latLng(center)
    this.offsetCenter = offset ? L.latLng(getPointFromCenter(center, offset.angle, offset.distance)) : this.center;
    this.spot = spot
    this.distance = distance
    this.angle = angle
    this.redPrior = redPrior
    this.redLightColor = redLightColor
    this.greenLightColor = greenLightColor

    const redLightStart = getPointFromCenter(this.offsetCenter, this.angle, this.spot - this.redPrior)
    const jumpRunEnd = getPointFromCenter(this.offsetCenter, this.angle, this.spot + this.distance)
    const greenLightStart = getPointFromCenter(this.offsetCenter, this.angle, this.spot)
    this.redLightElement = L.polyline([redLightStart, jumpRunEnd], { color: this.redLightColor });
    this.greenLightElement = L.polyline([greenLightStart, jumpRunEnd], { color: this.greenLightColor, weight: 5 });
  }

  private setup(jumpMap: JumpMap, options: JumpRunOpts) {
    const { center = jumpMap.center, offset, spot, distance = 0.75, redPrior = 0.3, angle, redLightColor = 'red', greenLightColor = 'lime' } = options

    this.options = options
    this.map = jumpMap.map
    this.jumpMap = jumpMap
    this.center = L.latLng(center)
    this.offsetCenter = offset ? L.latLng(getPointFromCenter(center, offset.angle, offset.distance)) : this.center;
    this.spot = spot
    this.distance = distance
    this.angle = angle
    this.redPrior = redPrior
    this.redLightColor = redLightColor
    this.greenLightColor = greenLightColor

    const redLightStart = getPointFromCenter(this.offsetCenter, this.angle, this.spot - this.redPrior)
    const jumpRunEnd = getPointFromCenter(this.offsetCenter, this.angle, this.spot + this.distance)
    const greenLightStart = getPointFromCenter(this.offsetCenter, this.angle, this.spot)
    this.redLightElement = L.polyline([redLightStart, jumpRunEnd], { color: this.redLightColor, weight: 5 });
    this.greenLightElement = L.polyline([greenLightStart, jumpRunEnd], { color: this.greenLightColor, weight: 10 });
  }

  mount() {
    this.redLightElement.addTo(this.map).bringToFront()
    this.greenLightElement.addTo(this.map).bringToFront()
    this.mounted = true
  }

  unmount() {
    if (!this.mounted) return
    this.redLightElement.removeFrom(this.map)
    this.greenLightElement.removeFrom(this.map)
    this.mounted = false
  }

  update(opts: JumpRunOpts) {
    this.unmount()
    this.setup(this.jumpMap, opts)
    this.mount()
  }
}

export default JumpRun
