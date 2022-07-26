# [koishi-plugin-image-search](https://koishi.js.org/plugins/other/image-search)
 
[![npm](https://img.shields.io/npm/v/koishi-plugin-image-search?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-image-search)

koishi-plugin-image-search 封装了一系列搜图相关的指令，目前支持以下平台：

- [SauceNAO](https://saucenao.com/)
- [ascii2d](https://ascii2d.net/)
- [danbooru](https://github.com/danbooru/danbooru)
- [Konachan](http://konachan.net/)
- [nhentai](https://nhentai.net/)

参考了 [Tsuk1ko](https://github.com/Tsuk1ko/CQ-picfinder-robot) 的机器人实现。

## 指令：image-search

- **别名：搜图**

image-search 指令检测当前输入中的全部图片，并依次进行搜索。如果 image-search 所在消息内没有检测到图片，则该指令会给出提示，并对下一条信息中的图片进行处理。

在搜索过程中，image-search 指令会首先使用 saucenao 进行搜索，当相似度低于 60% 时，会在搜索完成后使用 ascii2d 再次搜索。当相似度低于 40% 时，将不会显示 saucenao 本身的搜索结果（但是 ascii2d 的结果会显示）。

<!-- <panel-view title="聊天记录">
<chat-message nickname="Alice" color="#cc0066">
<p>搜图</p>
<p><img src="/image-search/68670776_p0_master1200.jpg" width="240"/></p>
</chat-message>
<chat-message nickname="Koishi" avatar="/koishi.png">
<p>(95.4%) 地上 / ぢせ</p>
<p><img src="/image-search/68670776_p0_master1200.jpg" width="240"/></p>
<p>Link: <a href="https://www.pixiv.net/i/68670776" target="_blank" rel="noopener noreferrer">https://www.pixiv.net/i/68670776</a></p>
<p>Author: <a href="https://www.pixiv.net/u/4790" target="_blank" rel="noopener noreferrer">https://www.pixiv.net/u/4790</a></p>
</chat-message>
<chat-message nickname="Bob" color="#00994d">搜图</chat-message>
<chat-message nickname="Koishi" avatar="/koishi.png">请发送图片。</chat-message>
<chat-message nickname="Bob" color="#00994d">
<p><img src="/image-search/73212619_p0_master1200.jpg" width="240"/></p>
</chat-message>
<chat-message nickname="Koishi" avatar="/koishi.png">
<p>(93.18%) 書斎 / ぢせ</p>
<p><img src="/image-search/73212619_p0_master1200.jpg" width="240"/></p>
<p>Link: <a href="https://www.pixiv.net/i/73212619" target="_blank" rel="noopener noreferrer">https://www.pixiv.net/i/73212619</a></p>
<p>Author: <a href="https://www.pixiv.net/u/4790" target="_blank" rel="noopener noreferrer">https://www.pixiv.net/u/4790</a></p>
</chat-message>
</panel-view> -->

## 指令：saucenao

saucenao 指令是 image-search 指令的子指令。它使用 saucenao 进行图片搜索，机制与上面完全相同，但当相似度较低时不会使用 ascii2d 再次搜索，也不会略去本身的搜索结果。

## 指令：ascii2d

ascii2d 指令也是 image-search 指令的子指令。它使用 ascii2d 进行图片搜索，机制与上面完全相同。

## 配置项

### saucenaoApiKey

- 类型: `string | string[]`

可用的 SauceNAO API key 列表。SauceNAO 的 API key 可以通过[注册 SauceNAO 账户](https://saucenao.com/user.php)的方式获取。注册后即可在 API 页中获取到 API key。如果填入多个 API key，则会自动进行负载均衡。

### lowSimilarity

- 类型: `number`
- 默认值: `40`

相似度较低的认定标准（百分比）。

### highSimilarity

- 类型: `number`
- 默认值: `60`

相似度较高的认定标准（百分比）。

### output.thumbnail

- 类型: `boolean`
- 默认值: `true`

是否在搜索结果中显示缩略图。
