import { Session } from 'koishi'
import { load } from 'cheerio'

export default async function danbooru(url: string, session: Session) {
  const data = await session.app.http.get(url)
  const $ = load(data)
  return $('#image-container').attr('data-normalized-source')
}
