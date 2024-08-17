import { Context, h, HTTP, Session } from 'koishi'
import type { Image } from '@koishijs/canvas'

interface AnimeTraceRequest {
  model: AnimeTraceModel
  ai_detect: 1 | 0
  force_one: 1 | 0
}

type AnimeTraceModel =
  | 'large_model_preview'
  | 'anime'
  | 'anime_model_lovelive'
  | 'pre_stable'
  | 'game'
  | 'game_model_kirakira'

interface AnimeTraceResponse {
  ai: boolean
  code: number
  data: ResponseData[]
  new_code: number
}

interface ResponseData {
  box: number[]
  char: ResponseDataChar[]
  box_id: string
}

interface ResponseDataChar {
  name: string
  cartoonname: string
  acc: number
}

async function crop(ctx: Context, image: Image, box: ResponseData['box']) {
  const width = image.naturalWidth ?? image['width']
  const height = image.naturalHeight ?? image['height']
  const outputWidth = width * (box[2] - box[0])
  const outputHeight = height * (box[3] - box[1])
  const canvas = await ctx.canvas.createCanvas(outputWidth, outputHeight)
  canvas.getContext('2d').drawImage(
    image,
    width * box[0],
    height * box[1],
    width * (box[2] - box[0]),
    height * (box[3] - box[1]),
    0,
    0,
    width * (box[2] - box[0]),
    height * (box[3] - box[1])
  )
  return await canvas.toBuffer('image/png')
}

async function makeSearch(http: HTTP, url: string, ctx: Context): Promise<string> {
  const { data, filename, type } = await http.file(url)
  const form = new FormData()
  const value = new Blob([data], { type })
  form.append('image', value, filename)

  const res = await http.post<AnimeTraceResponse>('https://aiapiv2.animedb.cn/ai/api/detect', form, {
    responseType: 'json',
    params: {
      force_one: 1,
      model: 'anime_model_lovelive',
      ai_detect: 0
    } as AnimeTraceRequest
  })

  const image = await ctx.canvas.loadImage(data)
  const elements = []
  for (const v of res.data) {
    elements.push(
      h.image(await crop(ctx, image, v.box), 'image/png'),
      h.text(`角色：${v.char[0].name}`),
      h.text(`来源：${v.char[0].cartoonname}`)
    )
  }
  return elements.join('\n')
}

export default async function (http: HTTP, url: string, session: Session) {
  let result = 'AnimeTrace 搜图\n'
  try {
    result += await makeSearch(http, url, session.app)
  } catch (err) {
    if (http.isError(err) && err.response.data?.msg) {
      result += '搜图时遇到问题：' + err.response.data.msg
    } else {
      result += '搜图时遇到问题：' + err
    }
  }
  return result
}