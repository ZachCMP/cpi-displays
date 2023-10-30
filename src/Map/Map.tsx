import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import JumpMap from "./classes/JumpMap";

const PEAS_CENTER = { lat: 41.92217333707784, lng: -72.45824575424196 };
const RUNWAY_CENTER = {lat: 41.925478140250775, lng: -72.45704412460329};

export const MapComponent: React.FC<{ center?: L.LatLngExpression }> = ({
  center = PEAS_CENTER,
}) => {
  const map = useRef<JumpMap | undefined>(undefined);
  const [spot, setSpot] = useState<number>(0)
  const [angle, setAngle] = useState<number>(0)
  const [origin, setOrigin] = useState<'PEAS' | 'RUNWAY'>('PEAS')

  useEffect(() => {
    const container = document.getElementById('map')
    if (container) map.current ||= new JumpMap({ center, container, distanceTicks: { interval: 0.1, compassOptions: { color: 'yellow' } } })

    if (!map.current) return

    const jrCenter = origin === 'RUNWAY' ? RUNWAY_CENTER : PEAS_CENTER

    map.current.mount()
    map.current.addJumpRun('main', { spot, angle, offset: { angle: 0, distance: 0 }, center: jrCenter })
  }, [center, spot, angle, origin]);

  return <>
    <div id="map" style={{ width: "100vw", height: "100vh" }}></div>
    <div
      style={{
        backgroundColor: 'white',
        padding: 8,
        position: 'fixed',
        right: 10,
        top: 10,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
    >
      <div>
        <label>Jump Run</label>
        <input
          value={angle}
          onChange={e => setAngle(parseFloat(e.target.value) || 0)}
          type="number"
          step={1}
        />
      </div>
      <div>
        <label>Spot</label>
        <input
          value={spot}
          onChange={e => setSpot(parseFloat(e.target.value) || 0)}
          type="number"
          step={0.1}
        />
      </div>
      <div>
        <label>Jump Run Center</label>
        <input type="radio" id="peas" name="fav_language" value="PEAS" onChange={e => setOrigin('PEAS')} checked={origin === 'PEAS'}/>
        <label htmlFor="html">Peas</label>
        <input type="radio" id="css" name="fav_language" value="RUNWAY"onChange={e => setOrigin('RUNWAY')} checked={origin === 'RUNWAY'}/>
        <label htmlFor="html">Runway</label>
      </div>
    </div>
  </>;
};
