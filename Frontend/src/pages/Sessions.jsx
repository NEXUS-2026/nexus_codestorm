import { useEffect, useState } from 'react'
import { getSessions, getVideoUrl, getUploadUrl } from '../api'
import { ClipboardList, Play, X, RefreshCw, Box, Clock, Camera, Upload } from 'lucide-react'

export default function Sessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [playingId, setPlayingId]     = useState(null)
  const [playingType, setPlayingType] = useState(null) // 'recording' | 'upload'

  const playVideo = (id, type) => {
    if (playingId === id && playingType === type) { setPlayingId(null); setPlayingType(null); return }
    setPlayingId(id)
    setPlayingType(type)
  }

  const load = () => {
    setLoading(true)
    setFetchError(false)
    getSessions()
      .then(({ data }) => setSessions(data))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-sky-400" />
          <h1 className="text-base font-bold text-white">Sessions</h1>
          {!loading && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              {sessions.length}
            </span>
          )}
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Video replay */}
      {playingId && (
        <div className="mb-5 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-gray-400">
              {playingType === 'upload' ? 'Uploaded video' : 'Session recording'} ·{' '}
              <span className="text-gray-200 font-mono">{playingId}</span>
            </p>
            <button onClick={() => { setPlayingId(null); setPlayingType(null) }}
              className="text-gray-500 hover:text-gray-300 bg-gray-800 rounded-lg p-1">
              <X size={14} />
            </button>
          </div>
          <video
            src={playingType === 'upload' ? getUploadUrl(playingId) : getVideoUrl(playingId)}
            controls autoPlay
            className="w-full rounded-xl max-h-72 bg-black" />
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-600 text-sm gap-2">
          <span className="w-4 h-4 border-2 border-gray-700 border-t-sky-500 rounded-full animate-spin" />
          Loading sessions...
        </div>
      )}

      {!loading && fetchError && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
          <ClipboardList size={32} />
          <p className="text-sm">Could not connect to backend. Is the Flask server running on port 5000?</p>
          <button onClick={load}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors">
            Retry
          </button>
        </div>
      )}

      {!loading && !fetchError && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600">
          <ClipboardList size={32} />
          <p className="text-sm">No sessions yet. Start one from the Dashboard.</p>
        </div>
      )}

      {!loading && !fetchError && sessions.length > 0 && (
        <div className="flex flex-col gap-3">
          {sessions.map(s => (
            <div key={s._id}
              className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 flex items-center gap-4">

              {/* Count badge */}
              <div className="w-14 h-14 bg-gray-800 rounded-xl flex flex-col items-center justify-center shrink-0">
                <Box size={14} className="text-sky-500 mb-0.5" />
                <span className="text-lg font-black text-sky-400 tabular-nums leading-none">
                  {s.final_count ?? '—'}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white truncate">{s.batch_id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.status === 'completed'
                      ? 'bg-green-950 text-green-400 border border-green-800'
                      : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                  }`}>{s.status}</span>
                  {/* Source tag */}
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.source_type === 'upload'
                      ? 'bg-purple-950 text-purple-400 border border-purple-800'
                      : 'bg-sky-950 text-sky-400 border border-sky-800'
                  }`}>
                    {s.source_type === 'upload'
                      ? <><Upload size={9} /> Upload</>
                      : <><Camera size={9} /> Live</>}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Operator: <span className="text-gray-300">{s.operator_id}</span></p>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                  <Clock size={10} />
                  {fmt(s.started_at)}
                  {s.ended_at && <> → {fmt(s.ended_at)}</>}
                </div>
              </div>

              {/* Video buttons */}
              <div className="shrink-0 flex flex-col gap-1.5 items-end">
                {/* Recording — always shown if video_path exists */}
                {s.video_path
                  ? (
                    <button onClick={() => playVideo(s._id, 'recording')}
                      className="flex items-center gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                      <Play size={11} fill="white" />
                      {playingId === s._id && playingType === 'recording' ? 'Close' : 'Recording'}
                    </button>
                  )
                  : <span className="text-xs text-gray-700">No recording</span>
                }
                {/* Uploaded video — only for upload sessions */}
                {s.source_type === 'upload' && s.upload_path && (
                  <button onClick={() => playVideo(s._id, 'upload')}
                    className="flex items-center gap-1.5 text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                    <Upload size={11} />
                    {playingId === s._id && playingType === 'upload' ? 'Close' : 'Source Video'}
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </main>
  )
}
