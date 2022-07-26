import { load } from 'cheerio'
import { Session, Logger } from 'koishi'
import { Config, getShareText, OutputConfig } from './utils'

const baseURL = 'https://ascii2d.net'
const logger = new Logger('search')

export default async function (url: string, session: Session, config: Config) {
  try {
    const tasks: Promise<string[]>[] = []
    const response = await session.app.http.axios(`${baseURL}/search/url/${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'PostmanRuntime/7.29.0',
      },
    })
    tasks.push(session.send('ascii2d 色合检索\n' + getDetail(response.data, config.output)))
    try {
      const bovwURL = getTokujouUrl(response.data)
      const bovwHTML = await session.app.http.get(bovwURL)
      tasks.push(session.send('ascii2d 特征检索\n' + getDetail(bovwHTML, config.output)))
    } catch (err) {
      logger.warn(`[error] ascii2d bovw ${err}`)
    }
    await Promise.all(tasks)
  } catch (err) {
    logger.warn(`[error] ascii2d color ${err}`)
    return '访问失败。'
  }
}

function getDetail(html: string, config: OutputConfig) {
  const $ = load(html, { decodeEntities: false })
  const $box = $($('.item-box')[1])
  const thumbnail = baseURL + $box.find('.image-box img').attr('src')
  const $link = $box.find('.detail-box a')
  const $title = $($link[0])
  const $author = $($link[1])
  return getShareText({
    imageUrl: $title.attr('href'),
    title: $author
      ? `「${$title.html()}」/「${$author.html()}」`
      : $title.html(),
    thumbnail,
    authorUrl: $author.attr('href'),
  }, config)
}

function getTokujouUrl(html: string) {
  const $ = load(html, { decodeEntities: false })
  const $box = $($('.item-box')[1])
  const $link = $($box.find('.btn-block a')[1])
  return baseURL + $link.attr('href')
}
