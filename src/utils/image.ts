export function highRes(url: string | undefined, options?: { width?: number, quality?: number }): string | undefined {
  if (!url) return undefined
  try {
    // detect Cloudinary URLs and inject transformation for higher resolution
    const u = new URL(url)
    if (u.hostname.includes('res.cloudinary.com')){
      // example: https://res.cloudinary.com/<cloud>/image/upload/v123/.../file.jpg
      // insert /q_auto:good,w_{width},f_auto/ after /upload
      const parts = u.pathname.split('/upload/')
      const transform: string[] = []
      if (options?.quality) transform.push(`q_${options.quality}`)
      if (options?.width) transform.push(`w_${options.width}`)
      // ensure format auto for best results
      transform.push('f_auto')
      const t = transform.join(',')
      if (parts.length === 2) {
        return `${u.protocol}//${u.host}${parts[0]}/upload/${t}/${parts[1]}`
      }
    }
  } catch(error_) {
    console.warn('highRes: invalid url', error_)
    return undefined
  }
  return url
}
