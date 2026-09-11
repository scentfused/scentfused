const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/**
 * Uploads a File to Cloudinary using an unsigned upload preset and
 * returns the resulting hosted image URL (to be stored in Supabase
 * as the product's `image` field).
 */
export async function uploadImageToCloudinary(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Missing Cloudinary env vars. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file.'
    )
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Cloudinary upload failed: ${res.status} ${detail}`)
  }

  const data = await res.json()
  return data.secure_url
}
