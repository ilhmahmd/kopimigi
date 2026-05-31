const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase service credentials' })
  }

  const { email, password, full_name, role } = req.body || {}

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Semua field wajib diisi' })
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apiKey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error_description || data?.message || data?.error || 'Gagal membuat pengguna' })
    }

    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Server error' })
  }
}
