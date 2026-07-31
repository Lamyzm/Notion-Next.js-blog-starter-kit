import { Block, BlockMap } from 'notion-types'
import { isUrl, formatDate, formatNotionDateTime } from 'notion-utils'

export { isUrl, formatDate, formatNotionDateTime }

export const defaultMapImageUrl = (url: string, block: Block) => {
  if (!url) {
    return null
  }

  if (url.startsWith('data:')) {
    return url
  }

  // more recent versions of notion don't proxy unsplash images
  if (url.startsWith('https://images.unsplash.com')) {
    return url
  }

  // 새로운 노션 파일 서버 URL은 그대로 사용
  if (url.startsWith('https://file.notion.so')) {
    return url
  }

  // img.notionusercontent.com URL은 exp/sig 서명이 붙어 1시간 뒤 만료된다(→ 아이콘 엑박).
  // 그대로 두지 말고, 경로에 인코딩된 원본 S3 주소를 복원해 아래 프록시 로직으로 넘긴다.
  // 형태: https://img.notionusercontent.com/s3/<encoded: prod-files-secure/KEY>/size/...?exp&sig
  if (url.includes('notionusercontent.com')) {
    const m = url.match(/\/s3\/([^/]+)/)
    if (m) {
      const decoded = decodeURIComponent(m[1]) // "prod-files-secure/<KEY>"
      const slash = decoded.indexOf('/')
      if (slash > 0) {
        const bucket = decoded.slice(0, slash)
        const key = decoded.slice(slash + 1)
        url = `https://${bucket}.s3.us-west-2.amazonaws.com/${key}`
      } else {
        return url
      }
    } else {
      return url
    }
  }

  // 노션 S3(prod-files-secure 등)의 서명된/무서명 URL은 만료되거나 접근 불가이므로 그대로 쓰지 않는다.
  // 아래 로직에서 https://www.notion.so/image/... 프록시로 감싸면, 노션이 요청 시마다
  // 재서명해 주므로 URL이 만료되지 않고 상수로 관리해도 안전하다.
  // (unsplash / file.notion.so 는 위에서 이미 통과 처리됨)

  if (url.startsWith('/images')) {
    url = `https://www.notion.so${url}`
  }

  url = `https://www.notion.so${
    url.startsWith('/image') ? url : `/image/${encodeURIComponent(url)}`
  }`

  const notionImageUrlV2 = new URL(url)
  let table = block.parent_table === 'space' ? 'block' : block.parent_table
  if (table === 'collection') {
    table = 'block'
  }
  notionImageUrlV2.searchParams.set('table', table)
  notionImageUrlV2.searchParams.set('id', block.id)
  notionImageUrlV2.searchParams.set('cache', 'v2')

  url = notionImageUrlV2.toString()

  return url
}

export const defaultMapPageUrl = (rootPageId?: string) => (pageId: string) => {
  pageId = (pageId || '').replace(/-/g, '')

  if (rootPageId && pageId === rootPageId) {
    return '/'
  } else {
    return `/${pageId}`
  }
}

export const cs = (...classes: Array<string | undefined | false>) =>
  classes.filter((a) => !!a).join(' ')

const groupBlockContent = (blockMap: BlockMap): string[][] => {
  const output: string[][] = []

  let lastType: string | undefined = undefined
  let index = -1

  Object.keys(blockMap).forEach((id) => {
    const blockValue = blockMap[id]?.value

    if (blockValue) {
      blockValue.content?.forEach((blockId) => {
        const blockType = blockMap[blockId]?.value?.type

        if (blockType && blockType !== lastType) {
          index++
          lastType = blockType
          output[index] = []
        }

        if (index > -1) {
          output[index].push(blockId)
        }
      })
    }

    lastType = undefined
  })

  return output
}

export const getListNumber = (blockId: string, blockMap: BlockMap) => {
  const groups = groupBlockContent(blockMap)
  const group = groups.find((g) => g.includes(blockId))

  if (!group) {
    return
  }

  return group.indexOf(blockId) + 1
}

export const getHashFragmentValue = (url: string) => {
  return url.includes('#') ? url.replace(/^.+(#.+)$/, '$1') : ''
}

export const isBrowser = typeof window !== 'undefined'

const youtubeDomains = new Set([
  'youtu.be',
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com'
])

export const getYoutubeId = (url: string): string | null => {
  try {
    const { hostname } = new URL(url)
    if (!youtubeDomains.has(hostname)) {
      return null
    }
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/i

    const match = url.match(regExp)
    if (match && match[2].length == 11) {
      return match[2]
    }
  } catch {
    // ignore invalid urls
  }

  return null
}
