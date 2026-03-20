import { useEffect, useState } from 'react'
import { getOperatorStats } from '../api'
import { BarChart2, RefreshCw, User, Box, Hash } from 'lucide-react'

export default function OperatorStats() {
  const [stats, setStats]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getOperatorStats()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const maxBoxes = stats.length ? Math.max(...stats.map(s => s.total_boxes || 0)) : 1

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-sky-400" />
          <h1 className="text-base font-bold text-white">Operator Stats</h1>
          {!loading && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              {stats.length} operators
            </span>
          )}
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-600 text-sm gap-2">
          <span className="w-4 h-4 border-2 border-gray-700 border-t-sky-500 rounded-full animate-spin" />
          Loading stats...
        </div>
      )}

      {/* Empty */}
      {!loading && stats.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600">
          <BarChart2 size={32} />
          <p className="text-sm">No completed sessions yet.</p>
        </div>
      )}

      {/* Cards */}
      {!loading && stats.length > 0 && (
        <div className="flex flex-col gap-3">
          {stats.map((s, i) => (
            <div key={s._id}
              className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4">

              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                    <User size={14} className="text-sky-400" />
                  </div>
                  <span className="text-sm font-semibold text-white">{s._id}</span>
                  {i === 0 && (
                    <span className="text-xs bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded-full">
                      Top
                    </span>
                  )}
                </div>
                <span className="text-2xl font-black text-sky-400 tabular-nums">
                  {s.total_boxes ?? 0}
                  <span className="text-xs text-gray-500 font-normal ml-1">boxes</span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3">
                <div
                  className="bg-sky-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${((s.total_boxes || 0) / maxBoxes) * 100}%` }}
                />
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Hash size={10} /> {s.total_sessions} session{s.total_sessions !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Box size={10} /> {s.avg_count?.toFixed(1) ?? '—'} avg per session
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

    </main>
  )
}
