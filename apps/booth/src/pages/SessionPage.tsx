import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Camera, Image as ImageIcon, Printer, RefreshCw, Scissors } from 'lucide-react'

const backgrounds = [
  { id: 'arch', name: 'Arch', className: 'bg-[radial-gradient(circle_at_top,#f8fafc_0,#dbeafe_38%,#111827_39%,#111827_100%)]' },
  { id: 'burst', name: 'Burst', className: 'bg-[conic-gradient(from_0deg,#f8fafc,#93c5fd,#111827,#f8fafc)]' },
  { id: 'dots', name: 'Dots', className: 'bg-gray-100' },
]

function thermalize(dataUrl: string, callback: (nextUrl: string) => void) {
  const image = new Image()
  image.onload = () => {
    const canvas = document.createElement('canvas')
    const width = 420
    const height = Math.round((image.height / image.width) * width)
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return callback(dataUrl)
    ctx.drawImage(image, 0, 0, width, height)
    const frame = ctx.getImageData(0, 0, width, height)
    for (let i = 0; i < frame.data.length; i += 4) {
      const r = frame.data[i]
      const g = frame.data[i + 1]
      const b = frame.data[i + 2]
      const lightness = 0.299 * r + 0.587 * g + 0.114 * b
      const value = lightness > 142 ? 255 : 0
      frame.data[i] = value
      frame.data[i + 1] = value
      frame.data[i + 2] = value
    }
    ctx.putImageData(frame, 0, 0)
    callback(canvas.toDataURL('image/png'))
  }
  image.src = dataUrl
}

export default function SessionPage() {
  const params = useParams()
  const accessCode = params.accessCode || params.token || ''
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [thermalPhotoUrl, setThermalPhotoUrl] = useState('')
  const [withPhoto, setWithPhoto] = useState(true)
  const [backgroundId, setBackgroundId] = useState(backgrounds[0].id)
  const [status, setStatus] = useState('')

  const selectedBackground = useMemo(
    () => backgrounds.find((background) => background.id === backgroundId) || backgrounds[0],
    [backgroundId]
  )

  useEffect(() => {
    let stream: MediaStream | undefined

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setCameraReady(true)
        }
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Kamera tidak bisa dibuka')
      }
    }

    startCamera()
    return () => stream?.getTracks().forEach((track) => track.stop())
  }, [])

  function capturePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!video || !canvas || !ctx) return

    canvas.width = video.videoWidth || 960
    canvas.height = video.videoHeight || 540
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const nextPhoto = canvas.toDataURL('image/png')
    setPhotoUrl(nextPhoto)
    thermalize(nextPhoto, setThermalPhotoUrl)
  }

  function printReceipt() {
    window.print()
  }

  return (
    <main className="min-h-dvh bg-gray-950 px-4 py-6 text-white sm:p-6">
      <section className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-brand-600/20 border border-brand-400/30 px-4 py-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-brand-300 uppercase tracking-wide">Kode Akses</p>
              <h1 className="text-3xl font-semibold tracking-widest text-brand-200">{accessCode}</h1>
            </div>
          </div>

          <div className={`overflow-hidden rounded-lg border border-white/10 ${selectedBackground.className}`}>
            {withPhoto ? (
              photoUrl ? (
                <img className="h-full max-h-[58dvh] w-full object-contain grayscale contrast-125 mix-blend-multiply" src={photoUrl} alt="Foto pelanggan" />
              ) : (
                <video ref={videoRef} className="h-full max-h-[58dvh] w-full bg-black object-contain" autoPlay muted playsInline />
              )
            ) : (
              <div className="flex min-h-[320px] items-center justify-center bg-gray-900 text-center">
                <div>
                  <Printer className="mx-auto mb-3 text-brand-400" size={44} />
                  <p className="text-xl font-semibold">Mode Struk Tanpa Foto</p>
                </div>
              </div>
            )}
          </div>

          {status && <p className="rounded-lg bg-red-500/15 p-3 text-sm text-red-100">{status}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <button className="btn-booth inline-flex items-center justify-center gap-3" onClick={capturePhoto} disabled={!cameraReady || !withPhoto}>
              <Camera size={22} />
              Ambil Foto
            </button>
            <button className="btn-booth inline-flex items-center justify-center gap-3" onClick={() => { setPhotoUrl(''); setCameraReady(true); }}>
              <RefreshCw size={22} />
              Ulangi
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className={`option-tile ${withPhoto ? 'selected' : ''}`}
              onClick={() => setWithPhoto(true)}
            >
              <Camera className={`mb-2 ${withPhoto ? 'text-brand-300' : 'text-gray-400'}`} size={20} />
              <p className="font-semibold">Dengan Foto</p>
            </button>
            <button
              className={`option-tile ${!withPhoto ? 'selected' : ''}`}
              onClick={() => setWithPhoto(false)}
            >
              <Printer className={`mb-2 ${!withPhoto ? 'text-brand-300' : 'text-gray-400'}`} size={20} />
              <p className="font-semibold">Tanpa Foto</p>
            </button>
          </div>

          <div className="card-booth">
            <div className="mb-3 flex items-center gap-2 text-brand-300">
              <ImageIcon size={18} />
              <h2 className="font-semibold text-white">Background</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {backgrounds.map((background) => (
                <button
                  key={background.id}
                  className={`option-tile text-sm py-2 px-2 ${backgroundId === background.id ? 'selected' : ''}`}
                  onClick={() => setBackgroundId(background.id)}
                >
                  <span className={`mb-2 block h-14 rounded ${background.className}`} />
                  {background.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="card-booth">
          <div className="mb-3 flex items-center gap-2 text-brand-300">
            <Scissors size={18} />
            <h2 className="font-semibold text-white">Preview Thermal</h2>
          </div>

          <div id="booth-receipt-print" className="mx-auto w-[280px] bg-white p-4 font-mono text-sm text-black">
            <div className="text-center">
              <p className="text-base font-bold">{import.meta.env.VITE_COFFEE_SHOP_NAME || 'Kopimigi'}</p>
              <p className="text-xs">PHOTOBOOTH</p>
              <div className="my-2 border-t border-dashed border-black" />
              <p className="text-lg font-bold">Kode: {accessCode}</p>
              <div className="my-2 border-t border-dashed border-black" />
            </div>
            <div className="text-center text-xs my-2">
              <p>{new Date().toLocaleString('id-ID')}</p>
            </div>
            {withPhoto && (
              <div className="my-3">
                {thermalPhotoUrl ? (
                  <img className="w-full" src={thermalPhotoUrl} alt="Preview thermal" />
                ) : (
                  <div className="flex h-48 items-center justify-center text-center text-xs">Ambil foto untuk preview</div>
                )}
              </div>
            )}
            <div className="my-3 border-t border-dashed border-black" />
            <p className="text-center text-xs">Terima kasih sudah berkunjung</p>
            <p className="text-center text-[10px] mt-2">Preserving Memories, One Photo at a Time</p>
          </div>

          <button className="btn-booth mt-4 inline-flex w-full items-center justify-center gap-3" onClick={printReceipt}>
            <Printer size={22} />
            Cetak Struk
          </button>
        </aside>
      </section>
      <canvas ref={canvasRef} className="hidden" />
    </main>
  )
}
