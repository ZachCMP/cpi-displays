import L from "leaflet";
import JumpRun, { JumpRunOpts } from "./JumpRun";
import { fromPairs } from "lodash-es";
import DistanceTicks, { DistanceTicksOpts } from "./DistanceTicks";

export interface JumpMapOpts {
  container: HTMLElement;
  center: L.LatLngExpression
  jumpRuns?: Record<string, JumpRunOpts>;
  distanceTicks?: DistanceTicksOpts;
}

class JumpMap {
  container: HTMLElement;
  center: L.LatLng;
  map: L.Map;
  tileLayer: L.TileLayer;
  jumpRuns: Record<string, JumpRun>;
  mounted: boolean;
  distanceTicks: DistanceTicks;

  constructor({ container, center, jumpRuns, distanceTicks }: JumpMapOpts) {
    this.container = container
    this.mounted = false
    this.center = L.latLng(center)

    this.map = L.map(container, {
      center: this.center,
      zoom: 16,
      maxZoom: 16,
    })

    this.tileLayer = L.tileLayer(
      "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 20,
        attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>',
      }
    );

    this.distanceTicks = new DistanceTicks(this, { interval: 0.1, end: 1.5, ...distanceTicks })

    this.jumpRuns = jumpRuns ? fromPairs(Object.entries(jumpRuns).map(([key, opts]) => [key, new JumpRun(this, opts)])) : {}
  }

  mount() {
    this.tileLayer.addTo(this.map)
    this.map.on("click", console.log);
    this.distanceTicks.mount();
    Object.values(this.jumpRuns).forEach(run => !run.mounted && run.mount())
    this.mounted = true
  }

  addJumpRun(id: string, opts: JumpRunOpts) {
    if (this.jumpRuns[id]) {
      this.jumpRuns[id].update(opts)
    } else {
      this.jumpRuns[id] = new JumpRun(this, opts)
    }
    if (this.mounted) this.jumpRuns[id].mount()
    return this.jumpRuns[id]
  }

  removeJumpRun(id: string) {
    const run = this.jumpRuns[id]
    if (this.mounted) run.unmount()
    delete this.jumpRuns[id]
    return run
  }

  updateJumpRun(id: string, opts: JumpRunOpts) {
    const run = this.jumpRuns[id]
    run.update(opts)
    return run
  }
}

export default JumpMap
