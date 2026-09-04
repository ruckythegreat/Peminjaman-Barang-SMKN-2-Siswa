export function mediaUrl(path) {
  if (!path) return null
  if (path.startsWith('blob:') || path.startsWith('data:')) return path
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path)
      if (url.pathname.startsWith('/storage/')) return url.pathname
    } catch {
      return path
    }
    return path
  }
  if (path.startsWith('/storage/')) return path
  if (path.startsWith('storage/')) return `/${path}`
  return `/storage/${path}`
}

export function publicUser(data) {
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    class: data.class,
    role: data.role,
    profile_image: data.profile_image,
    trust_points: data.trust_points,
    is_blocked: Boolean(data.is_blocked),
  }
}
