import { useEffect, useState } from 'react'
import { getOperatorStats } from '../api'

export default function OperatorStats() {
  const [stats, setStats] = useState([])

  useEffect(() => {
    getOperatorStats().then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  return (
    <main className="p-6">
      <h1 className="text-lg font-bold mb-4">Operator Stats</h1>
      {stats.length === 0
        ? <p className="text-gray-500 text-sm">No data yet.</p>
        : (
          <table className="w-full text-sm border border-gray-800 rounded-xl overflow-hidden">
            <thead className="bg-gray-800 text-gray-400 text-xs">
              <tr>
                <th className="px-4 py-2 text-left">Operator</th>
                <th className="px-4 py-2 text-left">Sessions</th>
                <th className="px-4 py-2 text-left">Total Boxes</th>
                <th className="px-4 py-2 text-left">Avg per Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stats.map(s => (
                <tr key={s._id} className="bg-gray-900">
                  <td className="px-4 py-2 text-gray-200">{s._id}</td>
                  <td className="px-4 py-2 text-gray-400">{s.total_sessions}</td>
                  <td className="px-4 py-2 text-sky-400 font-bold">{s.total_boxes}</td>
                  <td className="px-4 py-2 text-gray-400">{s.avg_count?.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </main>
  )
}
