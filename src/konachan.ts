import { Session } from 'koishi'
import { load } from 'cheerio'

export default async function konachan(url: string, session: Session) {
  const data = await session.app.http.get(url)
  const $ = load(data)
  let source = null
  $('#stats li').each((i, e) => {
    if (/^Source:/.exec($(e).text())) {
      source = $(e).find('a').attr('href')
    }
  })
  return source
}
