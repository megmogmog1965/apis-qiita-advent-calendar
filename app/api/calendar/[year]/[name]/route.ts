import { NextResponse } from 'next/server'
import { parse } from 'node-html-parser'

// 3 minutes response cache.
export const revalidate = 180

export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string; name: string }> },
) {
  const { year, name } = await params

  const html = await fetchHtml(year, name)
  if (!html) {
    const url = getQiitaAdventCalendarUrl(year, name)
    return NextResponse.json({ error: 'Not found', url: url }, { status: 404 })
  }

  const content = textContent(html, 'script[data-js-react-on-rails-store="AppStoreWithReactOnRails"]')
  const json = JSON.parse(content)

  return NextResponse.json(json)
}

async function fetchHtml(year: string, name: string): Promise<string | null> {
  const url = getQiitaAdventCalendarUrl(year, name)

  const res = await fetch(url)
  if (!res.ok) {
    return null
  }

  return await res.text()
}

function getQiitaAdventCalendarUrl(year: string, name: string) {
  return `https://qiita.com/advent-calendar/${year}/${name}`
}

function textContent(html: string, selector: string) {
  const element = parse(html).querySelector(selector)
  if (!element) {
    throw new Error('Element not found')
  }

  // <script> の中身はエンティティを解釈しない生のテキストなので、rawText を使う（jsdom の textContent と同じ値）
  const text = element.rawText
  if (!text) {
    throw new Error('Element text content not found')
  }

  return text
}
