import { useEffect, useState } from 'react'
import { getSessions, getVideoUrl } from '../api'

export default function Sessions() {
  const [sessions, setSessions] = useState([])
  const [playingId, setPlayingId] = useState(null)

  useEffect(() => {
    getSessions().then(({ data }) => setSessions(data)).catch(() => {})
  }, [])

  return (
    <main className="p-6">
      <h1 className="text-lg font-bold mb-4">All Sessions</h1>

      {/* Video replay player */}
      {playingId && (
        <div className="mb-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-400">Replaying session: <span className="text-gray-200">{playingId}</span></p>
            <button onClick={() => setPlayingId(null)} className="text-gray-500 text-xs hover:text-gray-300">✕ Close</button>
          </div>
          <video
            src={getVideoUrl(playingId)}
            controls autoPlay
            className="w-full rounded-lg max-h-80"
          />
        </div>
      )}

      {sessions.length === 0
        ? <p className="text-gray-500 text-sm">No sessions found.</p>
        : (
          <table className="w-full text-sm border border-gray-800 rounded-xl overflow-hidden">
            <thead className="bg-gray-800 text-gray-400 text-xs">
              <tr>
                <th className="px-4 py-2 text-left">Batch</th>
                <th className="px-4 py-2 text-left">Operator</th>
                <th className="px-4 py-2 text-left">Boxes</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Replay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sessions.map(s => (
                <tr key={s._id} className="bg-gray-900">
                  <td className="px-4 py-2 text-gray-200">{s.batch_id}</td>
                  <td className="px-4 py-2 text-gray-400">{s.operator_id}</td>
                  <td className="px-4 py-2 text-sky-400 font-bold">{s.final_count ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-400">{s.status}</td>
                  <td className="px-4 py-2">
                    {s.video_path
                      ? <button onClick={() => setPlayingId(s._id)} className="text-sky-500 underline text-xs">▶ Play</button>
                      : <span className="text-gray-600 text-xs">No video</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </main>
  )
}
