// URL parsing utilities for shareable debate links and sub-heards
import type { SubHeard } from '../types';

/**
 * Generic URL path parser utility
 * Parses values from URL paths like /prefix/value or from query params
 */
const parseFromUrl = (prefix: string, queryParam?: string): string | null => {
  if (typeof window === 'undefined') return null
  
  const url = new URL(window.location.href)
  const pathParts = url.pathname.split('/')
  
  // Support format like /prefix/[value]
  if (pathParts[1] === prefix && pathParts[2]) {
    return pathParts[2]
  }
  
  // Support query param format (if provided)
  if (queryParam) {
    const param = url.searchParams.get(queryParam)
    if (param) {
      return param
    }
  }
  
  return null
}

export const parseRoomIdFromUrl = (): string | null => {
  return parseFromUrl('room', 'room')
}

export const parseSubHeardFromUrl = (): string | null => {
  return parseFromUrl('h')
}

export const createShareableLink = (roomId: string): string => {
  if (typeof window === 'undefined') return ''
  
  const baseUrl = window.location.origin
  return `${baseUrl}/room/${roomId}`
}

export const createSubHeardLink = (subHeard: SubHeard): string => {
  if (typeof window === 'undefined') return ''
  
  const baseUrl = window.location.origin
  return `${baseUrl}/h/${subHeard.name}`
}

export const updateUrlForRoom = (roomId: string | null) => {
  if (typeof window === 'undefined') return
  
  const newPath = roomId ? `/room/${roomId}` : '/'
  
  // Update URL without triggering a page reload
  window.history.pushState(null, '', newPath)
}

export const updateUrlForSubHeard = (subHeard: string | null) => {
  if (typeof window === 'undefined') return
  
  const newPath = subHeard ? `/h/${subHeard}` : '/'
  
  // Update URL without triggering a page reload
  window.history.pushState(null, '', newPath)
}

export const parseAnalysisRoomIdFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null
  
  const url = new URL(window.location.href)
  return url.searchParams.get('analysis')
}

export const updateUrlForAnalysis = (roomId: string | null) => {
  if (typeof window === 'undefined') return
  
  const url = new URL(window.location.href)
  
  if (roomId) {
    url.searchParams.set('analysis', roomId)
  } else {
    url.searchParams.delete('analysis')
  }
  
  window.history.pushState(null, '', url.toString())
}

export const clearRoomFromUrl = () => {
  updateUrlForRoom(null)
}