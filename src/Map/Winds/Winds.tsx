import { useState } from "react";
import Winds from "../classes/Winds";

export const WindsComponent: React.FC<{ winds: Winds, onChangeWinds: (winds: Winds) => any, onFetchWinds: VoidFunction }> = ({
  winds,
  onChangeWinds,
  onFetchWinds,
}) => {
  const [newWindsLookup, setNewWindsLookup] = useState(winds.winds)
  const [editing, setEditing] = useState(false)

  return (
    <div
      style={{
        backgroundColor: 'rgba(0,0,0, 0.75)',
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        color: 'white',
      }}
    >
      <div>
        <button onClick={() => {
          if (editing) setNewWindsLookup(winds.winds)
          setEditing(prev => !prev)
        }}>
          {editing ? 'Cancel' : 'Edit'}
        </button>
        {editing && (
          <button onClick={() => {
            onChangeWinds(new Winds({ input: newWindsLookup }))
            setEditing(false)
          }}>
            Save
          </button>
        )}
      </div>
      <table>
        <tbody>
        {Object.entries(winds.getWindsForRange(14000, 0)).reverse().map(([key, val]) => {
          const alt = key as keyof typeof winds.winds
          return (
            <tr key={key}>
              <td>{alt === '0' ? 'Gnd' : alt}</td>
              <td>
                {editing ? (
                  <>
                    <input
                      style={{ width: '6ex' }}
                      value={newWindsLookup[alt].direction}
                      onChange={e => setNewWindsLookup(prev => ({ ...prev, [alt]: { ...prev[alt], direction: parseInt(e.target.value) } }))}
                      type="number"
                    />
                    °
                  </>
                ) : <>{val.direction}°</>}
              </td>
              <td>
                {editing ? (
                  <>
                    <input
                      style={{ width: '6ex' }}
                      value={newWindsLookup[alt].speed}
                      onChange={e => setNewWindsLookup(prev => ({ ...prev, [alt]: { ...prev[alt], speed: parseInt(e.target.value) } }))}
                      type="number"
                    />
                    <small> mph</small>
                  </>
                ) : (
                  <>
                    {val.speed}<small> mph</small>
                  </>
                )}
              </td>
              <td>{val.temp}<small>°F</small></td>
            </tr>
          )
        })}
        </tbody>
      </table>
    </div>
  );
};
