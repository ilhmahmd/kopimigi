import { Coffee, Camera, QrCode } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function WaitingPage() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-brand-900 opacity-30 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-brand-700 opacity-20 blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 flex flex-col items-center text-center px-8 animate-fade-in">
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl bg-brand-600 flex items-center justify-center mb-6 shadow-2xl">
          <Coffee size={40} className="text-white" />
        </div>

        <h1 className="text-5xl font-display font-bold text-white mb-2 tracking-tight">KopiMigi</h1>
        <p className="text-brand-400 text-lg font-medium mb-12">Photobooth Station</p>

        {/* Clock */}
        <div className="text-6xl font-display font-bold text-white mb-2 tabular-nums tracking-tighter">
          {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <p className="text-slate-500 text-sm mb-16">
          {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {/* Instruction card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl px-10 py-8 max-w-sm w-full">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-brand-600/30 flex items-center justify-center">
              <QrCode size={20} className="text-brand-400" />
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="w-10 h-10 rounded-2xl bg-brand-600/30 flex items-center justify-center">
              <Camera size={20} className="text-brand-400" />
            </div>
          </div>
          <p className="text-white font-display font-semibold text-lg mb-2">Cara Menggunakan</p>
          <ol className="text-slate-400 text-sm space-y-2 text-left">
            <li className="flex gap-2"><span className="text-brand-400 font-bold flex-shrink-0">1.</span>Minta QR code dari kasir setelah memesan</li>
            <li className="flex gap-2"><span className="text-brand-400 font-bold flex-shrink-0">2.</span>Scan QR dengan kamera ponsel Anda</li>
            <li className="flex gap-2"><span className="text-brand-400 font-bold flex-shrink-0">3.</span>Berpose dan ambil foto kenangan!</li>
          </ol>
        </div>

        <p className="text-slate-600 text-xs mt-8">QR code berlaku 30 menit sejak dicetak</p>
      </div>
    </div>
  )
}
