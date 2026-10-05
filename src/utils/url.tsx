// URL parsing utilities for shareable post links and sub-heards
import type { SubHeard, VoteType } from '../types';

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

export const parseAnonymousLinkIdFromUrl = (): string | null => {
  return parseFromUrl('join');
}

export const parseCohostInviteTokenFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null
  return new URL(window.location.href).searchParams.get('cohostInvite')
}

export const parseLinkSourceFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null
  return new URL(window.location.href).searchParams.get('src')
}

const QUERY_PARAMS = {
  emailLoginToken: 'loginToken',
} as const

type QueryParamName = keyof typeof QUERY_PARAMS
export type QueryParams = Partial<Record<QueryParamName, string>>

export const parseQueryParams = (): QueryParams => {
  if (typeof window === 'undefined') return {}
  const searchParams = new URL(window.location.href).searchParams
  const params: QueryParams = {}
  for (const [name, key] of Object.entries(QUERY_PARAMS) as [QueryParamName, string][]) {
    const value = searchParams.get(key)
    if (value !== null) params[name] = value
  }
  return params
}

export const createParamUrl = (path: string, params: QueryParams): string => {
  const url = new URL(path, window.location.origin)
  for (const [name, value] of Object.entries(params) as [QueryParamName, string][]) {
    url.searchParams.set(QUERY_PARAMS[name], value)
  }
  return url.toString()
}

export const removeQueryParams = (...names: QueryParamName[]) => {
  const url = new URL(window.location.href)
  names.forEach((name) => url.searchParams.delete(QUERY_PARAMS[name]))
  window.history.replaceState({}, '', url.pathname + url.search)
}

export const parseReferrerIdFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null
  return new URL(window.location.href).searchParams.get('ref')
}

export const parseFlyerDataFromUrl = (): { flyerId: string; statementId: string; vote: VoteType; flyerGroup?: number } | null => {
  if (typeof window === 'undefined') return null
  
  const pathParts = window.location.pathname.split('/')
  
  if (pathParts[1] === 'flyer' && pathParts[2] && pathParts[3] && pathParts[4]) {
    const vote = pathParts[4].toLowerCase()
    const validVotes: VoteType[] = ['agree', 'disagree', 'pass', 'super_agree']
    if (validVotes.includes(vote as VoteType)) {
      const flyerGroup = pathParts[5] ? parseInt(pathParts[5]) : undefined // CN-6
      return {
        statementId: pathParts[3],
        vote: vote as VoteType,
        flyerId: pathParts[2],
        flyerGroup,
      }
    }
  }
  
  return null
};

export const parseEventIdFromUrl = (): string | null => {
  return parseFromUrl('event')
}

export const parseStatementIdFromUrl = (): string | null => {
  return parseFromUrl('statement', 'statement')
}

export const updateUrlForEvent = (eventId: string | null) => {
  if (typeof window === 'undefined') return
  const newPath = eventId ? `/event/${eventId}` : '/'
  window.history.pushState(null, '', newPath)
}

export const createShareableLink = (roomId: string): string => {
  if (typeof window === 'undefined') return ''

  const baseUrl = window.location.origin
  return `${baseUrl}/room/${roomId}`
}

export const createCohostInviteLink = (roomId: string, token: string): string => {
  if (typeof window === 'undefined') return ''

  return `${createShareableLink(roomId)}?cohostInvite=${token}`
}

export const createReferralLink = (roomId: string, referrerId: string): string => {
  if (typeof window === 'undefined') return ''

  return `${createShareableLink(roomId)}?src=user&ref=${referrerId}`
}

export const createSubHeardLink = (subHeard: SubHeard): string => {
  if (typeof window === 'undefined') return ''

  const baseUrl = window.location.origin
  return `${baseUrl}/h/${subHeard.name}`
}

export const createModInviteLink = (subHeardName: string, token: string): string => {
  if (typeof window === 'undefined') return ''

  const baseUrl = window.location.origin
  return `${baseUrl}/h/${subHeardName}?modInvite=${token}`
}

export const parseModInviteTokenFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null

  const url = new URL(window.location.href)
  return url.searchParams.get('modInvite')
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

export const parseDevToolsTabFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null
  
  const pathParts = window.location.pathname.split('/')
  if (pathParts[1] === 'devtools' && pathParts[2]) {
    return pathParts[2]
  }
  
  return null
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

export const updateUrlForDevTools = (tab: string | null) => {
  if (typeof window === 'undefined') return
  
  const newPath = tab ? `/devtools/${tab}` : '/'
  window.history.pushState(null, '', newPath)
}

export const clearRoomFromUrl = () => {
  updateUrlForRoom(null)
}

export const updateUrlForActivityFeed = (active: boolean) => {
  if (typeof window === 'undefined') return
  window.history.pushState(null, '', active ? '/activity-feed' : '/')
}