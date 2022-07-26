import { Context, Session, Command, makeArray, segment, Schema, Awaitable } from 'koishi'
import ascii2d from './ascii2d'
import saucenao from './saucenao'
import iqdb from './iqdb'

export const name = 'image-search'

export interface Config extends saucenao.Config {
  saucenaoApiKey?: string | string[]
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    saucenaoApiKey: Schema.array(Schema.string()).description('可用的 saucenao api key 列表。'),
  }),
  saucenao.Config,
])

async function mixedSearch(url: string, session: Session, config: Config) {
  return await saucenao(url, session, config, true) && ascii2d(url, session)
}

export function apply(ctx: Context, config: Config = {}) {
  let index = 0
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

  ctx.command('search [image]', '搜图片')
    .shortcut('搜图', { fuzzy: true })
    .action(search(mixedSearch))
  ctx.command('search/saucenao [image]', '使用 saucenao 搜图')
    .action(search(saucenao))
  ctx.command('search/ascii2d [image]', '使用 ascii2d 搜图')
    .action(search(ascii2d))
  ctx.command('search/iqdb [image]', '使用 iqdb 搜图')
    .action(search(iqdb))

  const pendings = new Set<string>()

  type SearchCallback = (url: string, session: Session, config: Config) => Awaitable<string | boolean | void>

  async function searchUrl(session: Session, url: string, callback: SearchCallback) {
    const id = session.channelId
    pendings.add(id)
    try {
      const result = await callback(url, session, config)
      if (typeof result === 'string') return result
    } catch (error) {
      ctx.logger('search').warn(error)
      return '搜索失败。'
    } finally {
      pendings.delete(id)
    }
  }

  function search(callback: SearchCallback): Command.Action {
    return async ({ session }) => {
      const id = session.channelId
      if (pendings.has(id)) return '存在正在进行的查询，请稍后再试。'

      const code = segment.from(session.content, { type: 'image' })
      if (code && code.data.url) {
        pendings.add(id)
        return searchUrl(session, code.data.url, callback)
      }

      const dispose = session.middleware(({ content }, next) => {
        dispose()
        const code = segment.from(content, { type: 'image' })
        if (!code || !code.data.url) return next()
        return searchUrl(session, code.data.url, callback)
      })

      return '请发送图片。'
    }
  }
}
