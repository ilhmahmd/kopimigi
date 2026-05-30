import { useMemo, useState } from 'react'
import { Camera, Printer, QrCode, RefreshCw, ShoppingCart } from 'lucide-react'
import { buildAccessCodeUrl, formatRupiah, generateOrderNumber, generatePhotoAccessCode } from '@coffeeshop/shared/utils'

const demoItems = [
  { name: 'Latte', quantity: 1, price: 30000 },
  { name: 'Croissant', quantity: 1, price: 25000 },
]

export default function POSPage() {
  const [orderNumber, setOrderNumber] = useState(generateOrderNumber)
  const [photoboothEnabled, setPhotoboothEnabled] = useState(true)
  const [withPhoto, setWithPhoto] = useState(true)
  const [accessCode, setAccessCode] = useState(generatePhotoAccessCode)

  const subtotal = demoItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const photoboothFee = photoboothEnabled ? 15000 : 0
  const total = subtotal + photoboothFee
  const boothBaseUrl = import.meta.env.VITE_BOOTH_BASE_URL || 'http://localhost:5174'
  const accessUrl = useMemo(() => buildAccessCodeUrl(boothBaseUrl, accessCode), [accessCode, boothBaseUrl])

  function refreshSession() {
    setOrderNumber(generateOrderNumber())
    setAccessCode(generatePhotoAccessCode())
  }

  function printReceipt() {
    window.print()
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Kasir</h1>
              <p className="mt-1 text-sm text-gray-500">Checkout dengan opsi thermal photobooth.</p>
            </div>
            <button className="btn-secondary inline-flex items-center gap-2" onClick={refreshSession}>
              <RefreshCw size={16} />
              Order Baru
            </button>
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart size={20} className="text-coffee-600" />
            <h2 className="font-semibold">Item Transaksi</h2>
          </div>
          <div className="divide-y">
            {demoItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500">{item.quantity} x {formatRupiah(item.price)}</p>
                </div>
                <p className="font-semibold">{formatRupiah(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <Camera size={20} className="text-coffee-600" />
            <h2 className="font-semibold">Thermal Photobooth</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              className={`rounded-lg border p-4 text-left transition-colors ${photoboothEnabled ? 'border-coffee-500 bg-coffee-50' : 'bg-white'}`}
              onClick={() => setPhotoboothEnabled(true)}
            >
              <p className="font-semibold">Aktif</p>
              <p className="mt-1 text-xs text-gray-500">Cetak struk booth.</p>
            </button>
            <button
              className={`rounded-lg border p-4 text-left transition-colors ${photoboothEnabled && withPhoto ? 'border-coffee-500 bg-coffee-50' : 'bg-white'}`}
              onClick={() => {
                setPhotoboothEnabled(true)
                setWithPhoto(true)
              }}
            >
              <p className="font-semibold">Dengan Foto</p>
              <p className="mt-1 text-xs text-gray-500">Foto + background.</p>
            </button>
            <button
              className={`rounded-lg border p-4 text-left transition-colors ${photoboothEnabled && !withPhoto ? 'border-coffee-500 bg-coffee-50' : 'bg-white'}`}
              onClick={() => {
                setPhotoboothEnabled(true)
                setWithPhoto(false)
              }}
            >
              <p className="font-semibold">Tanpa Foto</p>
              <p className="mt-1 text-xs text-gray-500">Struk thermal saja.</p>
            </button>
          </div>

          <label className="mt-4 flex items-center gap-3 rounded-lg border p-3 text-sm">
            <input
              type="checkbox"
              checked={!photoboothEnabled}
              onChange={(event) => setPhotoboothEnabled(!event.target.checked)}
            />
            Transaksi ini tidak menggunakan photobooth
          </label>
        </div>
      </div>

      <aside className="card h-fit">
        <div id="receipt-print" className="mx-auto w-[280px] bg-white p-4 font-mono text-sm text-black">
          <div className="text-center">
            <p className="text-base font-bold">{import.meta.env.VITE_COFFEE_SHOP_NAME || 'Kopimigi'}</p>
            <p>Order {orderNumber}</p>
          </div>
          <div className="my-3 border-t border-dashed border-black" />
          {demoItems.map((item) => (
            <div key={item.name} className="mb-2">
              <div className="flex justify-between gap-3">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatRupiah(item.price * item.quantity).replace(/\s/g, '')}</span>
              </div>
            </div>
          ))}
          {photoboothEnabled && (
            <div className="flex justify-between gap-3">
              <span>Photobooth</span>
              <span>{formatRupiah(photoboothFee).replace(/\s/g, '')}</span>
            </div>
          )}
          <div className="my-3 border-t border-dashed border-black" />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatRupiah(total).replace(/\s/g, '')}</span>
          </div>
          {photoboothEnabled && (
            <>
              <div className="my-3 border-t border-dashed border-black" />
              <div className="text-center">
                <p className="font-bold">KODE PHOTOBOOTH</p>
                <p className="my-2 text-3xl font-bold tracking-widest">{accessCode}</p>
                <p>{withPhoto ? 'Dengan foto thermal' : 'Struk tanpa foto'}</p>
                <p className="mt-2 break-all text-[10px]">{accessUrl}</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {photoboothEnabled && (
            <div className="rounded-lg bg-coffee-50 p-3 text-sm text-coffee-900">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <QrCode size={16} />
                Kode akses: {accessCode}
              </div>
              <p className="break-all text-xs">{accessUrl}</p>
            </div>
          )}
          <button className="btn-primary inline-flex w-full items-center justify-center gap-2" onClick={printReceipt}>
            <Printer size={18} />
            Simpan & Cetak Struk
          </button>
        </div>
      </aside>
    </section>
  )
}
