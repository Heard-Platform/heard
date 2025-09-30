// URL parsing utilities for shareable debate links

export const parseRoomIdFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null
  
  const url = new URL(window.location.href)
  const pathParts = url.pathname.split('/')
  
  // Support formats like /room/[roomId] or /?room=[roomId]
  if (pathParts[1] === 'room' && pathParts[2]) {
    return pathParts[2]
  }
  
  const roomParam = url.searchParams.get('room')
  if (roomParam) {
    return roomParam
  }
  
  return null
}

export const createShareableLink = (roomId: string): string => {
  if (typeof window === 'undefined') return ''
  
  const baseUrl = window.location.origin
  return `${baseUrl}/room/${roomId}`
}

export const updateUrlForRoom = (roomId: string | null) => {
  if (typeof window === 'undefined') return
  
  const newPath = roomId ? `/room/${roomId}` : '/'
  
  // Update URL without triggering a page reload
  window.history.pushState(null, '', newPath)
}

export const clearRoomFromUrl = () => {
  updateUrlForRoom(null)
}