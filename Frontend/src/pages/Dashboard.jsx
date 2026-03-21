import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Square, RotateCcw, Camera, User, Hash, Box, Package, Upload, Video, BarChart2, List, Activity, Server, Maximize2, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { useSession } from '../context/SessionContext'
import { getSessions, uploadVideo } from '../api'
import axios from 'axios'
import { FadeUp, ScalePop } from '../components/Motion'
import Tooltip from '../components/Tooltip'

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

  // Interactive mockup state
  const [confidence, setConfidence] = useState(72)
  const [heatmapEnabled, setHeatmapEnabled] = useState(false)
  const [statsVisible, setStatsVisible] = useState(true)

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

  // Stats calculations for the mockup block
  const totalSessions = sessions.length
  const totalBoxes = sessions.reduce((acc, s) => acc + (s.final_count || 0), 0)
  const avgPerSession = totalSessions > 0 ? (totalBoxes / totalSessions).toFixed(1) : '0.0'

  // ── STEP 1: Setup screen ──────────────────────────────────
  if (isIdle) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-transparent p-6 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        
        {/* Icon + title */}
        <FadeUp className="flex flex-col items-center gap-5 mb-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-sky-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-700 rounded-3xl flex items-center justify-center shadow-2xl border border-sky-400/30">
              <Package size={36} className="text-white drop-shadow-md" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tight">Packing Session</h1>
            <p className="text-[15px] text-gray-400 mt-2 font-medium">Configure session details to activate AI monitoring</p>
          </div>
        </FadeUp>

        {/* Form card */}
        <div className="bg-gray-900/60 backdrop-blur-2xl border border-gray-800/80 shadow-[0_8px_40px_rgba(0,0,0,0.8)] rounded-[2rem] p-8 flex flex-col gap-6 relative overflow-hidden">
          {/* Subtle inside glow edge */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />

          <div className="flex flex-col gap-2 relative group">
            <label className="text-[11px] text-gray-400 font-bold tracking-widest uppercase flex items-center gap-2 transition-colors group-focus-within:text-sky-400">
              <Hash size={13} className="text-gray-500 group-focus-within:text-sky-400 transition-colors" /> Batch ID
            </label>
            <div className="relative">
              <input
                autoFocus
                placeholder="e.g. BATCH-001"
                className={`w-full bg-gray-950/80 border rounded-2xl px-5 py-3.5 text-sm text-gray-100 outline-none transition-all duration-300 placeholder:text-gray-700 uppercase shadow-inner
                  ${batchError ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : batchValid && batchId ? 'border-green-500/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20' : 'border-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'}`}
                value={batchId}
                onChange={e => handleBatchChange(e.target.value)}
              />
              {batchChecking && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-600 border-t-sky-500 rounded-full animate-spin" />
              )}
            </div>
            {batchError
              ? <p className="text-xs text-red-400 font-medium animate-in fade-in">{batchError}</p>
              : <p className="text-[11px] text-gray-500 font-medium tracking-wide">Uppercase only · format: WORD-NUMBER (e.g. BATCH-001)</p>
            }
          </div>

          <div className="flex flex-col gap-2 group">
            <label className="text-[11px] text-gray-400 font-bold tracking-widest uppercase flex items-center gap-2 transition-colors group-focus-within:text-sky-400">
              <User size={13} className="text-gray-500 group-focus-within:text-sky-400 transition-colors" /> Operator ID
            </label>
            <input
              placeholder="e.g. OP-001"
              className="w-full bg-gray-950/80 border border-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-2xl px-5 py-3.5 text-sm text-gray-100 outline-none transition-all duration-300 placeholder:text-gray-700 shadow-inner"
              value={operatorId} onChange={e => setOperatorId(e.target.value)}
            />
          </div>

          {/* Source toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-gray-400 font-bold tracking-widest uppercase">Video Source</label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-gray-950/80 rounded-2xl border border-gray-800">
              <Tooltip label="Use live webcam feed">
                <button type="button" onClick={() => setSource('camera')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm w-full
                    ${source === 'camera' ? 'bg-sky-600 text-white shadow-sky-600/20 scale-[0.98]' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
                  <Camera size={16} /> Live Camera
                </button>
              </Tooltip>
              <Tooltip label="Upload a pre-recorded video">
                <button type="button" onClick={() => setSource('video')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm w-full
                    ${source === 'video' ? 'bg-sky-600 text-white shadow-sky-600/20 scale-[0.98]' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
                  <Video size={16} /> Upload Video
                </button>
              </Tooltip>
            </div>
          </div>

          {/* File picker */}
          {source === 'video' && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-[11px] text-gray-400 font-bold tracking-widest uppercase flex items-center gap-2">
                <Upload size={13} className="text-gray-500" /> Video File
              </label>
              <label className="flex items-center gap-4 bg-gray-950/80 border-2 border-dashed border-gray-700 hover:border-sky-500/50 rounded-2xl px-5 py-4 cursor-pointer transition-all duration-300 hover:bg-sky-500/5 group">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                  <Upload size={18} className="text-gray-400 group-hover:text-sky-400 transition-colors" />
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold truncate transition-colors ${videoFile ? 'text-sky-400' : 'text-gray-300 group-hover:text-sky-300'}`}>
                    {videoFile ? videoFile.name : 'Click to browse'}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">MP4, AVI, MOV, WEBM</span>
                </div>
                <input type="file" accept=".mp4,.avi,.mov,.mkv,.webm" className="hidden"
                  onChange={e => setVideoFile(e.target.files[0] || null)} />
              </label>
            </div>
          )}

          <Tooltip label={!canStart ? 'Fill in all fields to start' : 'Start AI monitoring session'}>
            <button
              onClick={handleStart}
              disabled={!canStart || uploading}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-2xl text-[15px] font-black tracking-wide shadow-lg shadow-sky-600/20 transition-all duration-300 hover:shadow-sky-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:shadow-none">
              {uploading
                ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                : <><Play size={18} fill="currentColor" /> START SESSION</>}
            </button>
          </Tooltip>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 animate-in fade-in">
              <p className="text-red-400 text-sm font-semibold text-center flex items-center justify-center gap-2"><Activity size={16}/> {error}</p>
            </div>
          )}
        </div>

        {/* Recent sessions below form */}
        {sessions.length > 0 && (
          <ScalePop delay={0.2} className="mt-6 bg-gray-900/40 backdrop-blur-lg border border-gray-800/80 rounded-3xl p-6 flex flex-col gap-3 shadow-xl hover:border-gray-800 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 flex items-center gap-2">
                <List size={14}/> Recent Sessions
              </p>
              <button onClick={fetchSessions} className="text-gray-500 hover:text-sky-400 transition-colors hover:rotate-180 duration-500 p-1">
                <RotateCcw size={14} />
              </button>
            </div>
            {sessions.slice(0, 4).map(s => (
              <div key={s._id} className="flex items-center justify-between text-sm border-t border-gray-800/50 pt-3 group">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-300 group-hover:text-white transition-colors">{s.batch_id}</span>
                  <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-800 rounded-md font-medium">{s.operator_id}</span>
                </div>
                <span className="text-sky-400 font-extrabold tabular-nums bg-sky-400/10 px-2.5 py-0.5 rounded-lg border border-sky-400/20">{s.final_count ?? '—'} <span className="text-[10px] text-sky-500 uppercase tracking-widest">box</span></span>
              </div>
            ))}
          </ScalePop>
        )}

      </div>
    </div>
  )

  // ── STEP 2: Live feed screen ──────────────────────────────
  if (isRunning) return (
    <div className="flex-1 flex flex-col bg-transparent p-4 lg:p-6 lg:px-8 gap-6 min-h-0 overflow-y-auto w-full animate-in fade-in duration-700 relative">
      {/* Background glow for Live Layout */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-[#4ed9a1]/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-[#2d8060]/[0.02] blur-[100px] pointer-events-none" />

      {/* Grid wrapper */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 max-w-[1920px] mx-auto w-full flex-1 z-10">
        
        {/* --- LEFT COLUMN --- */}
        <div className="flex flex-col gap-6 w-full">
          
          {/* Live Feed Container */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-[2rem] flex flex-col overflow-hidden w-full relative group">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50 z-10 bg-gray-900/50 relative">
              <div className="flex items-center gap-2.5 text-sm text-[#4ed9a1] font-bold tracking-wide">
                <Video size={18} className="animate-pulse" /> Live Feed — {source === 'camera' ? 'Warehouse Cam 01' : 'Video Upload'}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 font-bold tracking-wider relative">
                <span className="font-mono bg-gray-950/50 px-2.5 py-1 rounded-md border border-gray-800/50">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                <Maximize2 size={16} className="cursor-pointer text-gray-500 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95" />
              </div>
            </div>
            
            {/* Feed Area */}
            <div className="aspect-[16/9] lg:aspect-[21/9] xl:aspect-[16/7] bg-[#02040a] w-full relative flex items-center justify-center overflow-hidden" 
                 style={{ backgroundImage: 'linear-gradient(#1f2937 1px, transparent 1px), linear-gradient(90deg, #1f2937 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
              
              <img ref={imgRef} className="absolute inset-0 w-full h-full object-contain bg-transparent z-0 transition-opacity duration-500" alt="live-feed" />

              {/* Interactive Heatmap Overlay */}
              <div className={`absolute inset-0 w-full h-full bg-gradient-to-tr from-[#4ed9a1]/20 via-transparent to-rose-500/20 mix-blend-screen pointer-events-none transition-opacity duration-1000 ease-in-out z-10 ${heatmapEnabled ? 'opacity-100' : 'opacity-0'}`} />
              
              <div className="absolute top-5 left-5 flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/50 backdrop-blur-lg border border-white/10 z-20 shadow-xl shadow-black/50 animate-in fade-in zoom-in">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                <span className="text-[11px] font-black text-white tracking-[0.2em] leading-none mt-0.5">REC</span>
              </div>
            </div>
          </div>
          
          {/* Boxes Detected Widget */}
          <div className="bg-gradient-to-br from-gray-900/90 to-[#0a1510]/80 backdrop-blur-xl border border-[#2d8060]/30 shadow-[0_8px_30px_rgb(0,0,0,0.3)] shadow-[#4ed9a1]/5 rounded-[2rem] p-8 flex flex-col gap-4 w-full relative overflow-hidden group hover:border-[#4ed9a1]/50 transition-all duration-500">
             <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#4ed9a1]/20 rounded-full blur-[80px] pointer-events-none transition-all duration-1000 group-hover:bg-[#4ed9a1]/30" />
             
             <div className="flex items-center justify-between w-full relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#4ed9a1]/10 rounded-xl border border-[#4ed9a1]/20 shadow-inner">
                    <Box size={22} className="text-[#4ed9a1]" />
                  </div>
                  <span className="text-base font-bold text-gray-200 tracking-wide">Boxes Detected</span>
                </div>
                <div className="flex items-center gap-2 bg-[#2a6d54]/20 text-[#4ed9a1] border border-[#2d8060]/50 px-4 py-2 rounded-full text-[11px] font-bold tracking-widest shadow-[0_0_15px_rgba(42,109,84,0.3)]">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#4ed9a1] animate-pulse" /> LIVE
                </div>
             </div>
             
             <div className="flex items-baseline gap-4 mt-2 w-full relative z-10">
               <span className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500 leading-none tabular-nums tracking-tighter drop-shadow-sm transition-all duration-300">
                 {count}
               </span>
               <span className="text-xl text-[#4ed9a1] font-bold tracking-widest uppercase opacity-90">boxes</span>
             </div>
             
             {error && (
               <div className="mt-4 text-sm text-red-400 font-medium flex items-center gap-2 bg-red-400/10 w-max px-4 py-2.5 rounded-xl border border-red-400/20 shadow-inner animate-in fade-in">
                  <Activity size={16} /> {error}
               </div>
             )}
          </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="flex flex-col gap-6 w-full">
          
          {/* Dashboard Control Panel */}
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 hover:border-[#2d8060]/60 transition-colors duration-500 rounded-[2rem] p-7 flex flex-col gap-7 w-full relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#4ed9a1]/30 to-transparent" />
            
            <div className="flex items-center justify-between justify-start">
               <h3 className="text-[11px] font-black text-gray-300 tracking-[0.2em] uppercase flex items-center gap-2">
                 <Settings2 size={16} className="text-[#4ed9a1]" /> 
                 Session Control
               </h3>
               <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2a6d54]/20 border border-[#2d8060]/50 text-[#4ed9a1] text-[10px] font-bold tracking-widest uppercase shadow-inner shadow-[#4ed9a1]/5">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#4ed9a1] animate-pulse" /> Running
               </span>
            </div>
            
            {/* Input Displays */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.1em] text-gray-500 uppercase flex items-center gap-1.5"><Hash size={12}/> Batch ID</label>
                <div className="w-full bg-gray-950/80 border border-gray-800/80 rounded-2xl px-5 py-3.5 text-[15px] text-gray-300 font-extrabold uppercase shadow-inner opacity-70">
                  {batchId}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.1em] text-gray-500 uppercase flex items-center gap-1.5"><User size={12}/> Operator ID</label>
                <div className="w-full bg-gray-950/80 border border-gray-800/80 rounded-2xl px-5 py-3.5 text-[15px] text-gray-300 font-extrabold shadow-inner opacity-70">
                  {operatorId}
                </div>
              </div>
              
              <button
                onClick={stop}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-[#7f363c]/30 hover:bg-[#7f363c]/60 border border-[#9b3a42]/80 text-[#f26d78] py-4 rounded-2xl text-[15px] font-black tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(242,109,120,0.15)] hover:shadow-[0_0_30px_rgba(242,109,120,0.3)] hover:-translate-y-0.5 active:translate-y-0.5 group">
                <Square size={16} fill="currentColor" strokeWidth={0} className="group-hover:scale-110 transition-transform" /> STOP SESSION
              </button>
            </div>
            
            {/* Interactive Toggles & Sliders */}
            <div className="flex flex-col gap-7 border-t border-gray-800/80 pt-7">
              
              {/* Confidence Slider */}
              <div className="flex flex-col gap-4 group">
                 <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 transition-colors group-hover:text-gray-300">
                   <div className="flex items-center gap-2 uppercase tracking-wide">
                     <Activity size={15} className="text-[#4ed9a1]" /> Confidence Threshold
                   </div>
                   <div className="flex items-center gap-1 bg-[#2a6d54]/20 border border-[#2d8060]/50 px-3 py-1 rounded-lg text-[#4ed9a1] font-black text-sm shadow-inner tracking-wider">
                     {confidence}%
                   </div>
                 </div>
                 <input 
                   type="range" 
                   min="0"
                   max="100"
                   value={confidence}
                   onChange={(e) => setConfidence(e.target.value)}
                   className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer outline-none transition-all duration-300 hover:h-2.5 hover:shadow-[0_0_15px_rgba(78,217,161,0.25)] focus:ring-2 focus:ring-[#4ed9a1]/40" 
                   style={{ accentColor: '#4ed9a1' }} 
                 />
              </div>
              
              {/* Confidence Heatmap Toggle */}
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 group pt-1">
                 <span className="transition-colors group-hover:text-gray-300 uppercase tracking-wide">Confidence Heatmap</span>
                 <button 
                   onClick={() => setHeatmapEnabled(!heatmapEnabled)}
                   className={`w-14 h-7 rounded-full relative cursor-pointer flex items-center transition-all duration-400 outline-none shadow-inner ${heatmapEnabled ? 'bg-gradient-to-r from-[#2d8060] to-[#4ed9a1] shadow-[0_0_15px_rgba(45,128,96,0.6)]' : 'bg-gray-800 border-gray-700 hover:bg-gray-700 border hover:border-gray-600'}`}
                 >
                   <div className={`w-5 h-5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] transform transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${heatmapEnabled ? 'translate-x-8 bg-white scale-110' : 'translate-x-1 bg-gray-400 scale-100'}`} />
                 </button>
              </div>
            </div>
          </div>

          {/* System Info Panel */}
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-[2rem] p-7 flex flex-col gap-6 w-full hover:border-[#2d8060]/40 transition-all duration-500 shadow-xl group">
            <h3 className="text-[11px] font-black text-gray-300 tracking-[0.2em] uppercase flex items-center gap-2">
               <Server size={14} className="text-gray-500 group-hover:text-[#4ed9a1] transition-colors" /> System Status
            </h3>
            
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between text-xs font-bold bg-gray-950/40 p-3 rounded-xl border border-gray-800/50">
                <div className="flex items-center gap-2.5 text-gray-400">
                  <div className="p-1.5 bg-gray-800 rounded-lg"><Video size={14} className="text-[#4ed9a1]" /></div> Camera Feed
                </div>
                <span className="text-gray-200 tracking-wide">Active</span>
              </div>
              
              <div className="flex items-center justify-between text-xs font-bold bg-gray-950/40 p-3 rounded-xl border border-gray-800/50">
                <div className="flex items-center gap-2.5 text-gray-400">
                  <div className="p-1.5 bg-gray-800 rounded-lg"><Box size={14} className="text-[#4ed9a1]" /></div> YOLO Model
                </div>
                <span className="text-[#4ed9a1] bg-[#4ed9a1]/10 px-2.5 py-1 rounded-md border border-[#4ed9a1]/20 tracking-wide shadow-inner">v8n loaded</span>
              </div>
              
              <div className="flex items-center justify-between text-xs font-bold bg-gray-950/40 p-3 rounded-xl border border-gray-800/50">
                <div className="flex items-center gap-2.5 text-gray-400">
                  <div className="p-1.5 bg-gray-800 rounded-lg"><Server size={14} className="text-[#4ed9a1]" /></div> Storage
                </div>
                <span className="text-[#4ed9a1] bg-[#4ed9a1]/10 px-2.5 py-1 rounded-md border border-[#4ed9a1]/20 tracking-wide shadow-inner">847 GB free</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* --- BOTTOM OPERATOR PERFORMANCE --- */}
      <div className="max-w-[1920px] mx-auto w-full z-10 relative mt-2 pb-6">
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-[2rem] p-7 flex flex-col w-full overflow-hidden transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:border-[#2d8060]/40">
          <div className="flex items-center justify-between" style={{ borderBottomWidth: statsVisible ? '1px' : '0px', borderColor: 'rgba(31, 41, 55, 0.4)', paddingBottom: statsVisible ? '1.5rem' : '0rem', transition: 'all 0.5s ease' }}>
            <h3 className="text-sm font-black text-gray-200 tracking-wider">Operator Performance</h3>
            <button 
              onClick={() => setStatsVisible(!statsVisible)} 
              className="text-[11px] text-[#4ed9a1] hover:text-[#3db887] font-black tracking-widest uppercase transition-all duration-300 focus:outline-none flex items-center gap-1.5 bg-[#2a6d54]/10 hover:bg-[#2a6d54]/30 px-4 py-2 rounded-xl border border-[#2d8060]/30 hover:scale-105 active:scale-95 shadow-sm"
            >
              {statsVisible ? (
                <>Hide <ChevronUp size={14} className="mt-0.5" /></>
              ) : (
                <>Show <ChevronDown size={14} className="mt-0.5" /></>
              )}
            </button>
          </div>
          
          <div className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform origin-top overflow-hidden ${statsVisible ? 'opacity-100 max-h-[300px] mt-8 scale-y-100' : 'opacity-0 max-h-0 mt-0 scale-y-90 pointer-events-none'}`}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              
              <div className="flex flex-col gap-4 lg:border-r border-gray-800/80 md:pr-6 group transition-transform hover:-translate-y-1 duration-300 cursor-default">
                <div className="flex items-center gap-2.5 text-gray-400 text-[11px] font-bold uppercase tracking-widest group-hover:text-[#4ed9a1] transition-colors">
                  <div className="p-1.5 bg-gray-800 rounded-lg group-hover:bg-[#4ed9a1]/10 transition-colors"><BarChart2 size={15} className="text-[#4ed9a1]" /></div> Total Sessions
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 leading-none tracking-tighter drop-shadow-sm">{totalSessions > 0 ? totalSessions : 47}</span>
                  <span className="text-[11px] font-bold text-[#4ed9a1] mb-1.5 bg-[#4ed9a1]/10 px-2 py-1 rounded-md border border-[#4ed9a1]/20">+{Math.max(1, Math.min(3, totalSessions))} this week</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 lg:border-r border-gray-800/80 lg:px-6 group transition-transform hover:-translate-y-1 duration-300 cursor-default">
                <div className="flex items-center gap-2.5 text-gray-400 text-[11px] font-bold uppercase tracking-widest group-hover:text-[#4ed9a1] transition-colors">
                  <div className="p-1.5 bg-gray-800 rounded-lg group-hover:bg-[#4ed9a1]/10 transition-colors"><Box size={15} className="text-[#4ed9a1]" /></div> Total Packed
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 leading-none tracking-tighter drop-shadow-sm">{totalBoxes > 0 ? totalBoxes.toLocaleString() : "6,284"}</span>
                  <span className="text-[11px] font-bold text-[#4ed9a1] mb-1.5 bg-[#4ed9a1]/10 px-2 py-1 rounded-md border border-[#4ed9a1]/20">+{sessions[0]?.final_count || 412} this week</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:border-r border-gray-800/80 lg:px-6 group transition-transform hover:-translate-y-1 duration-300 cursor-default">
                <div className="flex items-center gap-2.5 text-gray-400 text-[11px] font-bold uppercase tracking-widest group-hover:text-[#4ed9a1] transition-colors">
                  <div className="p-1.5 bg-gray-800 rounded-lg group-hover:bg-[#4ed9a1]/10 transition-colors"><Activity size={15} className="text-[#4ed9a1]" /></div> Avg. Session
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 leading-none tracking-tighter drop-shadow-sm">{totalSessions > 0 ? avgPerSession : "133.7"}</span>
                  <span className="text-[11px] font-bold text-[#4ed9a1] mb-1.5 bg-[#4ed9a1]/10 px-2 py-1 rounded-md border border-[#4ed9a1]/20">↑ 4.2% / month</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:pl-6 group transition-transform hover:-translate-y-1 duration-300 cursor-default">
                <div className="flex items-center gap-2.5 text-gray-400 text-[11px] font-bold uppercase tracking-widest group-hover:text-[#4ed9a1] transition-colors">
                  <div className="p-1.5 bg-gray-800 rounded-lg group-hover:bg-[#4ed9a1]/10 transition-colors"><Activity size={15} className="text-[#4ed9a1]" /></div> Accuracy Rate
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 leading-none tracking-tighter drop-shadow-sm">98.3%</span>
                  <span className="text-[11px] font-bold text-gray-400 mb-1.5 bg-gray-800 px-2 py-1 rounded-md border border-gray-700">Stable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ── STEP 3: Session ended screen ──────────────────────────
  if (isStopped) return (
    <div className="flex-1 flex items-center justify-center bg-transparent p-6 relative overflow-hidden">
      {/* Background glowing rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none duration-1000 animate-pulse" />

      <div className="w-full max-w-md flex flex-col items-center gap-8 relative z-10 animate-in fade-in zoom-in-95 duration-700 ease-out">

        <div className="relative group">
          <div className="absolute inset-0 bg-sky-500 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/80 rounded-[2rem] flex items-center justify-center shadow-2xl">
            <Box size={40} className="text-sky-400 drop-shadow-md" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tight">Session Complete</h2>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs tracking-widest uppercase text-gray-400 font-bold bg-gray-900/60 backdrop-blur-md py-2 px-5 rounded-full border border-gray-800/80 shadow-inner inline-flex">
            <span className="text-gray-300">{batchId}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <span className="text-gray-300">{operatorId}</span>
          </div>
        </div>

        {/* Final count */}
        <div className="bg-gray-900/60 backdrop-blur-2xl border border-gray-800/80 shadow-[0_8px_40px_rgba(2,132,199,0.15)] rounded-[2.5rem] p-10 flex flex-col items-center gap-2 w-full relative overflow-hidden group hover:border-sky-900/50 transition-colors">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-60" />
          
          <p className="text-[11px] text-sky-500 font-black uppercase tracking-[0.3em] mb-2">Final Count</p>
          <span className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tabular-nums tracking-tighter leading-none pb-2 drop-shadow-md group-hover:scale-105 transition-transform duration-500">{count}</span>
          <p className="text-[13px] text-gray-500 font-bold tracking-wide mt-3 uppercase">Verified Boxes Detected</p>
        </div>

        <button onClick={reset}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white py-4.5 rounded-2xl text-[15px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(2,132,199,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(2,132,199,0.5)] hover:-translate-y-1 active:translate-y-0.5">
          <RotateCcw size={18} strokeWidth={2.5} /> Start New Session
        </button>

        <div className="grid grid-cols-2 gap-4 w-full">
          <button onClick={() => navigate('/sessions')}
            className="flex items-center justify-center gap-2 bg-gray-900/80 backdrop-blur-md hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 text-gray-300 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-black/20 group">
            <List size={16} className="text-gray-500 group-hover:text-gray-300 transition-colors" /> Details
          </button>
          <button onClick={() => navigate('/stats')}
            className="flex items-center justify-center gap-2 bg-gray-900/80 backdrop-blur-md hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 text-gray-300 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-black/20 group">
            <BarChart2 size={16} className="text-gray-500 group-hover:text-gray-300 transition-colors" /> Analytics
          </button>
        </div>

      </div>
    </div>
  )
}
