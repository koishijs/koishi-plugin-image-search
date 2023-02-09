import { load } from 'cheerio'
import { Session, Logger } from 'koishi'
import { Config, getShareText, OutputConfig } from './utils'
import FormData from 'form-data'

const baseURL = 'https://ascii2d.net'
const logger = new Logger('search')

export default async function (url: string, session: Session, config: Config) {
  try {
    const tasks: Promise<string[]>[] = []
    const form = new FormData()
    form.append('file', await session.app.http.get(url, { responseType: 'stream' }))
    const colorHTML = await session.app.http.post(`${baseURL}/search/file`, form, {
      headers: {
        'User-Agent': 'PostmanRuntime/7.29.0',
        ...form.getHeaders(),
      },
    })
    tasks.push(session.send('ascii2d 色合检索\n' + getDetail(colorHTML, config.output)))
    try {
      const bovwURL = getTokuchouUrl(colorHTML)
      const bovwHTML = await session.app.http.get(bovwURL, {
        headers: {
          'User-Agent': 'PostmanRuntime/7.29.0',
          "Content-Type": 'multipart/form-data',
        },
      })
      tasks.push(session.send('ascii2d 特征检索\n' + getDetail(bovwHTML, config.output)))
    } catch (err) {
      logger.warn(`[error] ascii2d bovw ${err}`)
    }
    await Promise.all(tasks)
  } catch (err) {
    logger.warn(`[error] ascii2d color ${err}`)
    logger.warn(err)
    return '访问失败。'
  }
}

function getDetail(html: string, config: OutputConfig) {
  const $ = load(html, { decodeEntities: false })
  const $box = $($('.item-box')[1])
  if ($box.length === 0) {
    logger.warn('[error] ascii2d bovw cannot find images in web page')
    return '没有找到相似图片。'
  }
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

function getTokuchouUrl(html: string) {
  const $ = load(html, { decodeEntities: false })
  return `${baseURL}/search/bovw/${$($(".hash")[0]).text().trim()}`
}

