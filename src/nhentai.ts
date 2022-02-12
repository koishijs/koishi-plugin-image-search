import { API } from 'nhentai-api'
import { escape } from 'querystring'

const api = new API()

export default async function (name: string) {
  const result = await api.search(escape(name))
  return result.books[0]
}
