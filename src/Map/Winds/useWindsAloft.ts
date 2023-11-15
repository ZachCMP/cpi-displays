import L from "leaflet";
import { useCallback, useMemo, useState } from "react"
import WINDS from '../winds.json'

export const WINDS_URL = 'https://www.markschulze.net/winds/winds.php?lat=41.9254167&lon=-72.4571111&hourOffset=0&referrer=MSWA'
const getUrl = (coords: L.LatLngExpression) => {
  const { lat, lng } = L.latLng(coords)
  return `https://www.markschulze.net/winds/winds.php?lat=${lat}&lon=${lng}&hourOffset=0&referrer=MSWA`
}

// TODO: Make backend so this request can happen
export const useWindsAloft = () => {
  const [input, setInput] = useState<typeof WINDS | undefined>()

  const fetchWinds = useCallback((coords: L.LatLngExpression) => {
    const url = getUrl(coords)
    fetch(WINDS_URL, {
      mode: 'no-cors',
      headers: {
        "Content-Type": "application/json",
      },
      referrerPolicy: "no-referrer"
    }).then(res => console.log(res))
  }, [])

  return useMemo(() => ({
    fetchWinds,
  }), [fetchWinds])
}
