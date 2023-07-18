import { searchPic } from 'iqdb-client'
import { Quester, segment, Session } from 'koishi'

async function makeSearch(url: string): Promise<string> {
  const res = await searchPic(url, { lib: 'www' })
  if ('err' in res) {
    return '搜图时遇到问题：' + res.err
  } else if (res.ok || (res.data && res.data.length > 1)) {
    const data: any = res.data[1]
    const { head, sourceUrl, img, type, source } = data

    return [
      segment('image', { url: 'https://iqdb.org' + img }),
      '准度：' + head.toLowerCase(),
      '来源：' + sourceUrl,
      '色图：' + (type.toLowerCase() === 'safe' ? '否' : '是⚠️'),
      '源站：' + source.join(', '),
    ].join('\n')
  } else {
    return '搜图时遇到未知问题。'
  }
}

export default async function (http: Quester, url: string, session: Session) {
  let result = 'iqdb.org 搜图\n'
  try {
    result += await makeSearch(url)
  } catch (err) {
    result += '搜图时遇到问题：' + err
  }
  return result
}
