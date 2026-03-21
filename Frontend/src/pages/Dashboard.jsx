import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Square, RotateCcw, Camera, User, Hash, Box, Package, Upload, Video, BarChart2, List } from 'lucide-react'
import { useSession } from '../context/SessionContext'
import { getSessions, uploadVideo } from '../api'
import axios from 'axios'

const BATCH_RE = /^[A-Z][A-Z0-9]*-\d+$/

export default function Dashboard() {
  const navigate = useNavigate()
  const [batchId, setBatchId]         = useState('')
  const [operatorId, setOperatorId]   = useState('')
  const [source, setSource]           = useState('camera')
  const [videoFile, setVideoFile]     = useState(null)
  const [uploading, setUploading]     = useState(false)
  const [sessions, setSessions]       = useState([])
  const [batchError, setBatchError]   = useState('')
  const [batchChecking, setBatchChecking] = useState(false)
  const imgRef = useRef(null)
  const batchDebounce = useRef(null)

  const fetchSessions = () =>
    getSessions().then(({ data }) => setSessions(data)).catch(() => {})

  const { status, count, error, start, stop, reset, setOnFrame, setOnSessionEnd } = useSession()

  useEffect(() => {
    setOnFrame((f) => { if (imgRef.current) imgRef.current.src = `data:image/jpeg;base64,${f}` })
    setOnSessionEnd(fetchSessions)
  }, [setOnFrame, setOnSessionEnd])

  // Auto-uppercase + debounced duplicate check
  const handleBatchChange = useCallback((raw) => {
    const val = raw.toUpperCase()
    setBatchId(val)
    setBatchError('')
    clearTimeout(batchDebounce.current)

    if (!val) return

    if (!BATCH_RE.test(val)) {
      setBatchError('Format must be WORD-NUMBER, e.g. BATCH-001')
      return
    }

    // Check duplicate against backend
    setBatchChecking(true)
    batchDebounce.current = setTimeout(async () => {
      try {
        await axios.post('http://localhost:5000/validate/batch', { batch_id: val })
        setBatchError('')
      } catch (e) {
        setBatchError(e.response?.data?.error || 'Invalid batch ID')
      } finally {
        setBatchChecking(false)
      }
    }, 400)
  }, [])

  const isIdle    = status === 'idle'
  const isRunning = status === 'running'
  const isStopped = status === 'stopped'

  const batchValid = BATCH_RE.test(batchId) && !batchError && !batchChecking
  const canStart = batchValid && operatorId.trim() && (source === 'camera' || videoFile)

  const handleStart = async () => {
    if (source === 'video' && videoFile) {
      setUploading(true)
      try {
        const { data } = await uploadVideo(videoFile)
        start({ batchId, operatorId, videoPath: data.path })
      } catch {
        // error handled by ws hook
      } finally {
        setUploading(false)
      }
    } else {
      start({ batchId, operatorId, cameraIndex: 0 })
    }
  }

  // ── STEP 1: Setup screen ──────────────────────────────────
  if (isIdle) return (
    <div className="flex-1 flex items-center justify-center bg-gray-950 p-6">
      <div className="w-full max-w-md">

        {/* Icon + title */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-sky-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-900/40">
            <Package size={26} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Start a Packing Session</h1>
            <p className="text-sm text-gray-500 mt-1">Fill in the details to begin counting</p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
              <Hash size={11} className="text-gray-500" /> Batch ID
            </label>
            <div className="relative">
              <input
                autoFocus
                placeholder="e.g. BATCH-001"
                className={`w-full bg-gray-950 border rounded-xl px-4 py-2.5 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-700 uppercase
                  ${batchError ? 'border-red-600 focus:border-red-500' : batchValid && batchId ? 'border-green-700 focus:border-green-600' : 'border-gray-800 focus:border-sky-600'}`}
                value={batchId}
                onChange={e => handleBatchChange(e.target.value)}
              />
              {batchChecking && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-600 border-t-sky-500 rounded-full animate-spin" />
              )}
            </div>
            {batchError
              ? <p className="text-xs text-red-400">{batchError}</p>
              : <p className="text-xs text-gray-600">Uppercase only · format: WORD-NUMBER (e.g. BATCH-001)</p>
            }
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
              <User size={11} className="text-gray-500" /> Operator ID
            </label>
            <input
              placeholder="e.g. OP-001"
              className="bg-gray-950 border border-gray-800 focus:border-sky-600 rounded-xl px-4 py-2.5 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-700"
              value={operatorId} onChange={e => setOperatorId(e.target.value)}
            />
          </div>

          {/* Source toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Video Source</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setSource('camera')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors
                  ${source === 'camera' ? 'bg-sky-600 border-sky-600 text-white' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                <Camera size={14} /> Live Camera
              </button>
              <button type="button" onClick={() => setSource('video')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors
                  ${source === 'video' ? 'bg-sky-600 border-sky-600 text-white' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                <Video size={14} /> Upload Video
              </button>
            </div>
          </div>

          {/* File picker — only when upload selected */}
          {source === 'video' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <Upload size={11} className="text-gray-500" /> Video File
              </label>
              <label className="flex items-center gap-3 bg-gray-950 border border-dashed border-gray-700 hover:border-sky-600 rounded-xl px-4 py-3 cursor-pointer transition-colors">
                <Upload size={15} className="text-gray-500 shrink-0" />
                <span className="text-sm text-gray-400 truncate">
                  {videoFile ? videoFile.name : 'Click to select a video file'}
                </span>
                <input type="file" accept=".mp4,.avi,.mov,.mkv,.webm" className="hidden"
                  onChange={e => setVideoFile(e.target.files[0] || null)} />
              </label>
              <p className="text-xs text-gray-600">Accepted: MP4, AVI, MOV, MKV, WEBM</p>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!canStart || uploading}
            className="mt-2 w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-colors">
            {uploading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
              : <><Play size={15} fill="currentColor" /> Start Session</>}
          </button>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}
        </div>

        {/* Recent sessions below form */}
        {sessions.length > 0 && (
          <div className="mt-4 bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-gray-400">Recent Sessions</p>
              <button onClick={fetchSessions} className="text-gray-600 hover:text-gray-400">
                <RotateCcw size={12} />
              </button>
            </div>
            {sessions.slice(0, 4).map(s => (
              <div key={s._id} className="flex items-center justify-between text-xs border-t border-gray-800 pt-2">
                <span className="text-gray-300">{s.batch_id} · {s.operator_id}</span>
                <span className="text-sky-400 font-bold">{s.final_count ?? '—'} boxes</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )

  // ── STEP 2: Live feed screen ──────────────────────────────
  if (isRunning) return (
    <div className="flex-1 flex flex-col bg-gray-950 p-5 gap-4">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white">{batchId}</h1>
          <p className="text-xs text-gray-500">Operator: {operatorId}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-green-950 border border-green-800 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-xs font-semibold">Live</span>
          </div>
          <button onClick={stop}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors">
            <Square size={13} fill="white" /> Stop
          </button>
        </div>
      </div>

      {/* Feed + count */}
      <div className="flex gap-4 flex-1">

        {/* Video */}
        <div className="flex-1 relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <img ref={imgRef} className="w-full h-full object-cover" alt="feed" />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-xs font-semibold">REC</span>
          </div>
        </div>

        {/* Count panel */}
        <div className="w-48 flex flex-col gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 flex-1">
            <Box size={22} className="text-sky-500" />
            <p className="text-xs text-gray-500 font-medium">Boxes</p>
            <span className="text-7xl font-black text-sky-400 tabular-nums leading-none">{count}</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-1">
            <p className="text-xs text-gray-600">Batch</p>
            <p className="text-sm font-semibold text-gray-200 truncate">{batchId}</p>
            <p className="text-xs text-gray-600 mt-1">Operator</p>
            <p className="text-sm font-semibold text-gray-200 truncate">{operatorId}</p>
          </div>
        </div>

      </div>
    </div>
  )

  // ── STEP 3: Session ended screen ──────────────────────────
  if (isStopped) return (
    <div className="flex-1 flex items-center justify-center bg-gray-950 p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        <div className="w-16 h-16 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center">
          <Box size={28} className="text-sky-400" />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Session Complete</h2>
          <p className="text-sm text-gray-500 mt-1">{batchId} · {operatorId}</p>
        </div>

        {/* Final count */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-10 py-6 flex flex-col items-center gap-1 w-full">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Final Count</p>
          <span className="text-8xl font-black text-sky-400 tabular-nums leading-none">{count}</span>
          <p className="text-xs text-gray-600 mt-1">boxes detected</p>
        </div>

        <button onClick={reset}
          className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
          <RotateCcw size={15} /> Start New Session
        </button>

        <div className="grid grid-cols-2 gap-3 w-full">
          <button onClick={() => navigate('/sessions')}
            className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <List size={14} /> Session Details
          </button>
          <button onClick={() => navigate('/stats')}
            className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <BarChart2 size={14} /> View Stats
          </button>
        </div>

      </div>
    </div>
  )
}
