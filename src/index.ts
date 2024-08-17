import { Awaitable, Command, Context, Dict, makeArray, Quester, Session } from 'koishi'
import ascii2d from './ascii2d'
import saucenao from './saucenao'
import iqdb from './iqdb'
import animetrace from './animetrace'
import { Config } from './utils'

export { Config }

export const name = 'image-search'
export const inject = ['http', 'canvas']

async function mixedSearch(http: Quester, url: string, session: Session, config: Config) {
  return await saucenao(http, url, session, config, true) && ascii2d(http, url, session, config)
}

export function apply(ctx: Context, config: Config = {}) {
  let index = 0
  const http = ctx.http.extend(config)
  const keys = makeArray(config.saucenaoApiKey)

  ctx.on('saucenao/get-key', () => {
    const result = keys[index]
    index = (index + 1) % keys.length
    return result
  })

  ctx.on('saucenao/drop-key', (key) => {
    if (keys.indexOf(key) < 0) return
    if (index === 0) {
      keys.pop()
    } else {
      keys.splice(--index, 1)
    }
    return '令牌失效导致访问失败，请联系机器人作者。'
  })

  ctx.command('search [image:image]', '搜图片')
    .shortcut('搜图', { fuzzy: true })
    .action(search(mixedSearch))
  ctx.command('search/saucenao [image:image]', '使用 saucenao 搜图')
    .action(search(saucenao))
  ctx.command('search/ascii2d [image:image]', '使用 ascii2d 搜图')
    .action(search(ascii2d))
  ctx.command('search/iqdb [image:image]', '使用 iqdb 搜图')
    .action(search(iqdb))
  ctx.command('search/animetrace [image:image]', '使用 animetrace 搜图')
    .action(search(animetrace))

  const pendings = new Set<string>()

  type SearchCallback = (http: Quester, url: string, session: Session, config: Config) => Awaitable<string | boolean | void>

  async function searchUrl(session: Session, url: string, callback: SearchCallback) {
    const id = session.channelId
    pendings.add(id)
    try {
      const isPrivate = await http.isLocal(url)
      if (isPrivate) {
        const { data, mime } = await http.file(url)
        const formData = new FormData()
        formData.append('photo', new Blob([data], { type: mime }))
        formData.append('isAjax', 'true')
        const uploadResponse = await http.post('https://imgops.com/store', formData)
        url = 'https:/' + uploadResponse
      }
      const result = await callback(http, url, session, config)
      if (typeof result === 'string') return result
    } catch (error) {
      ctx.logger('search').warn(error)
      return '搜索失败。'
    } finally {
      pendings.delete(id)
    }
  }

  function search(callback: SearchCallback): Command.Action {
    return async ({ session }, image: Dict) => {
      const id = session.channelId
      if (pendings.has(id)) return '存在正在进行的查询，请稍后再试。'

      if (image?.src) {
        pendings.add(id)
        return searchUrl(session, image.src, callback)
      }

      const dispose = session.middleware(({ content }, next) => {
        dispose()
        if (!image?.src) return next()
        return searchUrl(session, image.src, callback)
      })

      return '请发送图片。'
    }
  }
}
