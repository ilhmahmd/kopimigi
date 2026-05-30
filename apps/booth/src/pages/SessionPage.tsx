import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Camera, Timer, RotateCcw, Download, Printer, Coffee, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

type Stage = 'loading' | 'invalid' | 'ready' | 'countdown' | 'preview' | 'done'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export default function SessionPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [stage, setStage] = useState<Stage>('loading')
  const [session, setSession] = useState<any>(null)
  const [order, setOrder] = useState<any>(null)
  const [countdown, setCountdown] = useState(3)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Validate token
  useEffect(() => {
    const validate = async () => {
      const { data } = await supabase
        .from('photo_sessions')
        .select('*, orders(*, order_items(*))')
        .eq('token', token)
        .single()

      if (!data || data.status === 'used') { setStage('invalid'); return }
      if (new Date(data.expires_at) < new Date()) {
        await supabase.from('photo_sessions').update({ status: 'expired' }).eq('id', data.id)
        setStage('invalid'); return
      }
      setSession(data)
      setOrder(data.orders)
      setStage('ready')
    }
    validate()
  }, [token])

  // Start camera
  useEffect(() => {
    if (stage !== 'ready' && stage !== 'countdown') return
    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' }, audio: false })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      })
      .catch(() => toast.error('Tidak bisa mengakses kamera'))
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [stage])

  // Countdown
  const startCountdown = useCallback(() => {
    setStage('countdown')
    setCountdown(3)
    let c = 3
    const iv = setInterval(() => {
      c -= 1
      setCountdown(c)
      if (c <= 0) {
        clearInterval(iv)
        capturePhoto()
      }
    }, 1000)
  }, [])

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(video, -canvas.width, 0)
    ctx.restore()

    // Draw branding overlay
    ctx.fillStyle = 'rgba(43,64,131,0.85)'
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70)
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 24px 'Google Sans Display', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('KopiMigi', canvas.width / 2, canvas.height - 38)
    ctx.font = `14px 'Google Sans', sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText(new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }), canvas.width / 2, canvas.height - 16)

    setFlash(true)
    setTimeout(() => setFlash(false), 300)
    setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.92))
    streamRef.current?.getTracks().forEach(t => t.stop())
    setStage('preview')
  }

  const retake = () => {
    setPhotoDataUrl(null)
    setStage('ready')
  }

  const confirmPhoto = async () => {
    if (!photoDataUrl || !session) return
    setUploading(true)
    try {
      const blob = await (await fetch(photoDataUrl)).blob()
      const filename = `${session.order_id}/${token}.jpg`
      const { error: upErr } = await supabase.storage.from('photobooth').upload(filename, blob, { contentType: 'image/jpeg', upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('photobooth').getPublicUrl(filename)
      await supabase.from('photo_sessions').update({ status: 'used', photo_url: publicUrl, used_at: new Date().toISOString() }).eq('id', session.id)
      setStage('done')
      toast.success('Foto tersimpan!')
    } catch (e: any) {
      toast.error('Gagal menyimpan foto: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  const downloadPhoto = () => {
    if (!photoDataUrl) return
    const a = document.createElement('a'); a.href = photoDataUrl; a.download = `kopimigi-${token?.slice(0, 8)}.jpg`; a.click()
  }

  // ── Stages ──────────────────────────────────────
  if (stage === 'loading') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (stage === 'invalid') return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 p-8 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <h2 className="text-2xl font-display font-bold text-white">QR Tidak Valid</h2>
      <p className="text-slate-400 max-w-xs">Token ini sudah digunakan atau telah kadaluarsa. Minta struk baru dari kasir.</p>
      <button onClick={() => navigate('/')} className="mt-4 bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-3 rounded-2xl transition-colors">
        Kembali ke Layar Utama
      </button>
    </div>
  )

  if (stage === 'done') return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 p-8 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center">
        <CheckCircle size={40} className="text-emerald-400" />
      </div>
      <div>
        <h2 className="text-3xl font-display font-bold text-white mb-2">Foto Tersimpan! 📸</h2>
        <p className="text-slate-400">Terima kasih sudah mengunjungi KopiMigi</p>
      </div>
      {photoDataUrl && (
        <div className="relative animate-pop">
          <img src={photoDataUrl} alt="Hasil foto" className="w-72 rounded-2xl shadow-2xl border border-white/10" />
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={downloadPhoto} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-3 rounded-2xl transition-colors">
          <Download size={18} /> Unduh Foto
        </button>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-3 rounded-2xl transition-colors">
          Selesai
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Flash effect */}
      {flash && <div className="absolute inset-0 bg-white z-50 animate-flash pointer-events-none" />}

      <canvas ref={canvasRef} className="hidden" />

      {stage === 'preview' ? (
        /* ── Preview ── */
        <div className="flex flex-col items-center gap-5 p-6 w-full max-w-lg animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-brand-600 flex items-center justify-center">
              <Coffee size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-white">KopiMigi</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-white">Suka fotonya?</h2>
          <div className="relative w-full max-w-sm">
            <img src={photoDataUrl!} alt="Preview" className="w-full rounded-2xl shadow-2xl border border-white/10" />
          </div>
          {/* Order info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full max-w-sm text-sm">
            <p className="text-slate-400 text-xs mb-2">Order #{order?.order_number}</p>
            <div className="space-y-1">
              {order?.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-white/80">
                  <span>{item.product_name} ×{item.quantity}</span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-1 mt-1 flex justify-between font-bold text-white">
                <span>Total</span><span>{formatRupiah(order?.total)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full max-w-sm">
            <button onClick={retake} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium py-4 rounded-2xl transition-all">
              <RotateCcw size={18} /> Ulangi
            </button>
            <button onClick={confirmPhoto} disabled={uploading} className="flex-2 flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl transition-all">
              {uploading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Printer size={18} />Cetak & Simpan</>}
            </button>
          </div>
        </div>
      ) : (
        /* ── Camera ── */
        <div className="flex flex-col items-center gap-5 p-6 w-full max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-xl bg-brand-600 flex items-center justify-center">
              <Coffee size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-white">KopiMigi Photobooth</span>
          </div>

          {/* Camera frame */}
          <div className="relative w-full max-w-xl aspect-video bg-gray-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />

            {/* Corner decorations */}
            {['top-3 left-3 border-t-2 border-l-2 rounded-tl-xl', 'top-3 right-3 border-t-2 border-r-2 rounded-tr-xl',
              'bottom-3 left-3 border-b-2 border-l-2 rounded-bl-xl', 'bottom-3 right-3 border-b-2 border-r-2 rounded-br-xl'
            ].map((cls, i) => (
              <div key={i} className={`absolute w-8 h-8 border-brand-400 ${cls}`} />
            ))}

            {/* Countdown overlay */}
            {stage === 'countdown' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span key={countdown} className="text-9xl font-display font-bold text-white drop-shadow-2xl animate-countdown">
                  {countdown > 0 ? countdown : '📸'}
                </span>
              </div>
            )}

            {/* Branding strip */}
            <div className="absolute bottom-0 inset-x-0 h-12 bg-brand-600/80 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm tracking-wide">KopiMigi</span>
            </div>
          </div>

          {stage === 'ready' && (
            <>
              <p className="text-slate-400 text-sm">Posisikan diri Anda di frame, lalu tekan tombol</p>
              <button
                onClick={startCountdown}
                className="flex items-center gap-3 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-lg px-10 py-5 rounded-full transition-all shadow-xl shadow-brand-900/40 animate-pop"
              >
                <Camera size={24} />
                Ambil Foto
              </button>
            </>
          )}
          {stage === 'countdown' && (
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <Timer size={16} className="text-brand-400" /> Bersiap…
            </p>
          )}
        </div>
      )}
    </div>
  )
}
