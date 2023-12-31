import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import JumpMap from "./classes/JumpMap";
import WINDS from "./winds.json";
import Canopy from "./classes/Canopy";
import Winds from "./classes/Winds";
import { WindsComponent } from "./Winds/Winds";
import { useWindsAloft } from "./Winds/useWindsAloft";
import { JumpRunOffset } from "./classes/JumpRun";

const PEAS_CENTER = { lat: 41.92217333707784, lng: -72.45824575424196 };
const RUNWAY_CENTER = { lat: 41.925478140250775, lng: -72.45704412460329 };
// const PEAS_OFFSET = { angle: 0, distance: 0 }
// const RUNWAY_OFFSET = { angle: 16, distance: 0.23 }

const baseWinds = new Winds({ input: Winds.lookupFromInput(WINDS) })

export const MapComponent: React.FC<{ center?: L.LatLngExpression }> = ({
  center = PEAS_CENTER,
}) => {
  const { fetchWinds } = useWindsAloft()
  const map = useRef<JumpMap | undefined>(undefined);
  const [spot, setSpot] = useState<number>(0);
  const [angle, setAngle] = useState<number>(0);
  const [groups, setGroups] = useState<number>(5);
  const [offset, setOffset] = useState<JumpRunOffset>({ angle: 0, distance: 0 })
  const [origin, setOrigin] = useState<"PEAS" | "RUNWAY">("PEAS");
  const [showCanopy, setShowCanopy] = useState(false)
  const [canopy, setCanopy] = useState<Canopy | undefined>()
  const [winds, setWinds] = useState<Winds>(baseWinds)

  useEffect(() => {
    const container = document.getElementById("map");
    if (container)
      map.current ||= new JumpMap({
        center,
        container,
        distanceTicks: { interval: 0.1, compassOptions: { color: "yellow" } },
        winds,
      });

    const currentMap = map.current

    if (!currentMap) return;

    currentMap.updateWinds(winds)

    const jrCenter = origin === "RUNWAY" ? RUNWAY_CENTER : PEAS_CENTER;

    currentMap.mount();
    currentMap.addJumpRun("main", {
      spot,
      angle,
      offset,
      center: jrCenter,
      groups,
    });

    if (showCanopy) {
      currentMap.onClick = evt => {
        const newCanopy = new Canopy(currentMap, { location: evt.latlng, altitude: 2500, glideRatio: 2, horizontalSpeed: 25 })
        setCanopy(prev => {
          prev?.unmount()
          newCanopy.mount()
          return newCanopy
        })
      }
    }
  }, [center, spot, angle, origin, showCanopy, groups, winds, offset]);

  useEffect(() => {
    if (showCanopy && !canopy?.mounted) canopy?.mount()
    if (!showCanopy && canopy?.mounted) canopy?.unmount()
  }, [showCanopy, canopy])

  return (
    <>
      <div id="map" style={{ width: "100vw", height: "100vh" }}></div>
      <div
        style={{
          backgroundColor: "white",
          padding: 8,
          position: "fixed",
          right: 10,
          top: 10,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div>
          <label>Heading</label>
          <input
            value={angle}
            onChange={(e) => {
              const value = parseFloat(e.target.value)
              const angle = value ? (value < 0 ? 360 + value : value) : 0
              setAngle(angle)
            }}
            type="number"
            step={1}
          />
        </div>
        <div>
          <label>Spot</label>
          <input
            value={spot}
            onChange={(e) => setSpot(parseFloat(e.target.value) || 0)}
            type="number"
            step={0.1}
          />
        </div>
        <div>
          <label>Offset Angle</label>
          <input
            value={offset.angle}
            onChange={(e) => {
              const value = parseFloat(e.target.value)
              const angle = value ? (value < 0 ? 360 + value : value) : 0
              setOffset(prev => ({ ...prev, angle }))
            }}
            type="number"
            step={1}
          />
        </div>
        <div>
          <label>Offset Distance</label>
          <input
            value={offset.distance}
            onChange={(e) => setOffset(prev => ({ ...prev, distance: parseFloat(e.target.value) || 0 }))}
            type="number"
            step={0.1}
          />
        </div>
        <div>
          <label>Groups</label>
          <input
            value={groups}
            onChange={(e) => setGroups(parseFloat(e.target.value) || 0)}
            type="number"
          />
        </div>
        <div>
          <label>Jump Run Center</label>
          <input
            type="radio"
            id="peas"
            name="fav_language"
            value="PEAS"
            onChange={(e) => setOrigin("PEAS")}
            checked={origin === "PEAS"}
          />
          <label htmlFor="html">Peas</label>
          <input
            type="radio"
            id="css"
            name="fav_language"
            value="RUNWAY"
            onChange={(e) => setOrigin("RUNWAY")}
            checked={origin === "RUNWAY"}
          />
          <label htmlFor="html">Runway</label>
        </div>
        <div>
          <button
            onClick={() => setShowCanopy(prev => !prev)}
          >
            {showCanopy ? 'Hide Canopy' : 'Show Canopy'}
          </button>
        </div>
      </div>

      {winds && (
        <div
          style={{
            position: "fixed",
            left: 10,
            bottom: 10,
            zIndex: 1000,
          }}
        >
          <WindsComponent winds={winds} onChangeWinds={setWinds} onFetchWinds={() => fetchWinds(center)} />
        </div>
      )}
    </>
  );
};
