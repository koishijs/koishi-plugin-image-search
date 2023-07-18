import { Quester, Schema, segment } from 'koishi'

export function getLink(url: string) {
  const pidSearch = /pixiv.+illust_id=(\d+)/.exec(url)
  if (pidSearch) return 'https://www.pixiv.net/i/' + pidSearch[1]
  const uidSearch = /pixiv.+member\.php\?id=(\d+)/.exec(url)
  if (uidSearch) return 'https://www.pixiv.net/u/' + uidSearch[1]
  return url
}

export interface OutputConfig {
  thumbnail?: boolean
}

export const OutputConfig: Schema<OutputConfig> = Schema.object({
  thumbnail: Schema.boolean().default(true).description('是否在搜索结果中显示缩略图。'),
}).description('输出设置')

export interface SearchConfig {
  saucenaoApiKey?: string | string[]
  maxTrials?: number
  lowSimilarity?: number
  highSimilarity?: number
}

export const SearchConfig: Schema<SearchConfig> = Schema.object({
  saucenaoApiKey: Schema.union([
    Schema.array(String),
    Schema.transform(String, key => [key]),
  ]).description('可用的 SauceNAO API key 列表。'),
  maxTrials: Schema.natural().description('最大尝试访问次数。').default(3),
  lowSimilarity: Schema.number().description('相似度较低的认定标准 (百分比)。当 SauceNAO 给出的相似度低于这个值时，将不会显示 SauceNAO 本身的搜索结果 (但是 ascii2d 的结果会显示)。').default(40),
  highSimilarity: Schema.number().description('相似度较高的认定标准 (百分比)。当 SauceNAO 给出的相似度高于这个值时，将不会使用 ascii2d 再次搜索。').default(60),
}).description('搜索设置')

export interface Config extends SearchConfig, Quester.Config {
  output?: OutputConfig
}

export const Config: Schema<Config> = Schema.intersect([
  SearchConfig,
  Schema.object({
    output: OutputConfig,
  }),
  Quester.createConfig(),
])

export interface ShareData {
  imageUrl: string
  title: string
  thumbnail: string
  authorUrl?: string
  source?: string | void
}

export function getShareText({ imageUrl, title, thumbnail, authorUrl, source }: ShareData, config: OutputConfig) {
  const output = [title]
  if (config.thumbnail) output.push(segment.image(thumbnail).toString())
  if (imageUrl) output.push(`链接：${getLink(imageUrl)}`)
  if (authorUrl) output.push(`作者：${getLink(authorUrl)}`)
  if (source) output.push(`来源：${getLink(source)}`)
  return output.join('\n')
}

export function checkHost(source: string, name: string) {
  return source && source.includes(name)
}
