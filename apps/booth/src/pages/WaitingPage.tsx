import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, KeyRound } from 'lucide-react'

export default function WaitingPage() {
  const [accessCode, setAccessCode] = useState('')
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = accessCode.replace(/\D/g, '').slice(0, 6)
    if (normalized.length >= 4) navigate(`/access/${normalized}`)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-950 px-4 py-6 text-center sm:p-6">
      <section className="w-full max-w-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-coffee-600">
          <Camera size={38} />
        </div>
        <h1 className="text-3xl font-semibold">{import.meta.env.VITE_COFFEE_SHOP_NAME || 'Photobooth'}</h1>
        <p className="mx-auto mt-3 max-w-md text-gray-300">Masukkan kode akses dari struk kasir.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-left text-sm font-medium text-gray-200">
            Kode Akses
            <input
              className="mt-2 block w-full rounded-lg border border-white/10 bg-white px-4 py-4 text-center text-3xl font-bold tracking-[0.3em] text-gray-950 outline-none focus:ring-2 focus:ring-coffee-500"
              inputMode="numeric"
              maxLength={6}
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
            />
          </label>
          <button className="btn-booth inline-flex w-full items-center justify-center gap-3">
            <KeyRound size={22} />
            Buka Sesi
          </button>
        </form>
      </section>
    </main>
  )
}
