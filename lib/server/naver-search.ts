/**
 * Naver Search API Server Utilities
 * 
 * Blog + Web + Local Search
 * Server-side only - canonical implementation
 * 
 * Replaces: lib/integrations/naver-local.ts (extends with Blog/Web)
 */

import { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } from '@/lib/integrations/env'

const NAVER_API_BASE = 'https://openapi.naver.com/v1/search'

// ============================================
// Types
// ============================================

export interface NaverBlogItem {
  title: string
  link: string
  description: string
  bloggername: string
  bloggerlink: string
  postdate: string
}

export interface NaverWebItem {
  title: string
  link: string
  description: string
}

export interface NaverLocalItem {
  title: string
  link: string
  category: string
  description: string
  telephone: string
  address: string
  roadAddress: string
  mapx: string
  mapy: string
}

export interface NaverBlogResult {
  title: string
  url: string
  snippet: string
  blogName: string
  publishedAt: string
}

export interface NaverWebResult {
  title: string
  url: string
  snippet: string
}

export interface NaverLocalResult {
  name: string
  category: string
  address: string
  roadAddress: string
  phone: string
  lat: number
  lng: number
  mapUrl: string
}

// ============================================
// Blog Search
// ============================================

export async function searchNaverBlog(
  query: string,
  options: {
    display?: number
    start?: number
    sort?: 'sim' | 'date'
  } = {}
): Promise<NaverBlogResult[]> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    throw new Error('NAVER_CLIENT_ID and NAVER_CLIENT_SECRET must be set')
  }

  const { display = 10, start = 1, sort = 'sim' } = options
  
  const encodedQuery = encodeURIComponent(query)
  const url = `${NAVER_API_BASE}/blog?query=${encodedQuery}&display=${display}&start=${start}&sort=${sort}`

  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Naver Blog API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json() as {
    items: NaverBlogItem[]
    total: number
  }

  return data.items.map(item => ({
    title: stripHtmlTags(item.title),
    url: item.link,
    snippet: stripHtmlTags(item.description),
    blogName: item.bloggername,
    publishedAt: item.postdate,
  }))
}

// ============================================
// Web Search
// ============================================

export async function searchNaverWeb(
  query: string,
  options: {
    display?: number
    start?: number
  } = {}
): Promise<NaverWebResult[]> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    throw new Error('NAVER_CLIENT_ID and NAVER_CLIENT_SECRET must be set')
  }

  const { display = 10, start = 1 } = options
  
  const encodedQuery = encodeURIComponent(query)
  const url = `${NAVER_API_BASE}/webkr?query=${encodedQuery}&display=${display}&start=${start}`

  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Naver Web API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json() as {
    items: NaverWebItem[]
    total: number
  }

  return data.items.map(item => ({
    title: stripHtmlTags(item.title),
    url: item.link,
    snippet: stripHtmlTags(item.description),
  }))
}

// ============================================
// Local Search
// ============================================

export async function searchNaverLocal(
  query: string,
  options: {
    display?: number
    sort?: 'random' | 'comment'
  } = {}
): Promise<NaverLocalResult[]> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    throw new Error('NAVER_CLIENT_ID and NAVER_CLIENT_SECRET must be set')
  }

  const { display = 5, sort = 'random' } = options
  
  const encodedQuery = encodeURIComponent(query)
  const url = `${NAVER_API_BASE}/local?query=${encodedQuery}&display=${display}&sort=${sort}`

  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Naver Local API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json() as {
    items: NaverLocalItem[]
  }

  return data.items.map(item => ({
    name: stripHtmlTags(item.title),
    category: item.category,
    address: item.address,
    roadAddress: item.roadAddress,
    phone: item.telephone,
    lat: 0,
    lng: 0,
    mapUrl: item.link,
  }))
}

// ============================================
// Utilities
// ============================================

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}
