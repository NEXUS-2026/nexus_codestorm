import { useState, useRef } from 'react'
import useWebSocket from '../hooks/useWebSocket'
import { getSessions } from '../api'

export default function Dashboard() {
  const [batchId, setBatchId]         = useState('BATCH-001')
  const [operatorId, setOperatorId]   = useState('OP-001')
  const [cameraIndex, setCameraIndex] = useState(0)
  const [sessions, setSessions]       = useState([])
  const imgRef = useRef(null)

  const fetchSessions = () =>
    getSessions().then(({ data }) => setSessions(data)).catch(() => {})

  const { status, count, error, start, stop, reset } = useWebSocket({
    onFrame: (f) => { if (imgRef.current) imgRef.current.src = `data:image/jpeg;base64,${f}` },
    onSessionEnd: fetchSessions,
  })

  return (
    <main className="p-4 flex gap-4">

      {/* Left — feed + count */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl aspect-video flex items-center justify-center overflow-hidden relative">
          <img ref={imgRef} className="w-full h-full object-cover" alt="feed" />
          {status !== 'running' && (
            <p className="absolute text-gray-600 text-sm">Camera feed will appear here</p>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-center">
          <span className="text-gray-400">Boxes Detected</span>
          <span className="text-5xl font-black text-sky-400">{count}</span>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      {/* Right — controls */}
      <div className="w-72 flex flex-col gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-bold text-gray-300">Session Setup</p>
          <input className="bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 outline-none"
            placeholder="Batch ID" value={batchId}
            onChange={e => setBatchId(e.target.value)} disabled={status === 'running'} />
          <input className="bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 outline-none"
            placeholder="Operator ID" value={operatorId}
            onChange={e => setOperatorId(e.target.value)} disabled={status === 'running'} />
          <input type="number" min={0}
            className="bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 outline-none"
            placeholder="Camera Index" value={cameraIndex}
            onChange={e => setCameraIndex(Number(e.target.value))} disabled={status === 'running'} />

          {status === 'idle'    && <button onClick={() => start({ batchId, operatorId, cameraIndex })} className="bg-blue-600 text-white py-2 rounded text-sm font-semibold">Start Session</button>}
          {status === 'running' && <button onClick={stop} className="bg-red-600 text-white py-2 rounded text-sm font-semibold">Stop Session</button>}
          {status === 'stopped' && <button onClick={reset} className="bg-gray-700 text-white py-2 rounded text-sm">New Session</button>}
        </div>

        {/* Recent sessions — no PDF for now */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold text-gray-300">Recent Sessions</p>
            <button onClick={fetchSessions} className="text-gray-500 text-xs">↻</button>
          </div>
          {sessions.length === 0
            ? <p className="text-xs text-gray-600">No sessions yet.</p>
            : sessions.map(s => (
              <div key={s._id} className="text-xs text-gray-400 border-t border-gray-800 pt-2">
                {s.batch_id} · {s.operator_id} · {s.final_count ?? '—'} boxes · {s.status}
              </div>
            ))
          }
        </div>
      </div>

    </main>
  )
}
