import pMemoize from 'p-memoize';
import { parsePageId } from 'notion-utils';
import ExpiryMap from 'expiry-map';

import { includeNotionIdInUrls } from './config';
import { notion } from './notion-api';
import { getCanonicalPageId } from './get-canonical-page-id';
import * as config from './config';
import * as types from './types';

const uuid = !!includeNotionIdInUrls;
// 사이트맵 크롤은 비싸므로(전체 스페이스 순회) 넉넉히 캐시한다.
// 10초로 두면 빌드 중 getStaticPaths + 페이지별 getStaticProps가 매번 재크롤해
// 300초 타임아웃이 난다.
const cache = new ExpiryMap(60 * 60 * 1000);

export async function getSiteMap(): Promise<types.SiteMap> {
  const partialSiteMap = await getAllPages(config.rootNotionPageId, config.rootNotionSpaceId);

  return {
    site: config.site,
    ...partialSiteMap,
  } as types.SiteMap;
}

const getAllPages = pMemoize(getAllPagesImpl, {
  cacheKey: (...args) => JSON.stringify(args),
  cache,
});

async function getAllPagesImpl(
  rootNotionPageId: string,
  _rootNotionSpaceId: string,
): Promise<Partial<types.SiteMap>> {
  // 경량 사이트맵: 전체 스페이스를 재귀 크롤하지 않는다.
  // 글 목록(제목·ID)은 루트 페이지의 컬렉션(DB) 조회 결과에 이미 다 들어있으므로,
  // 루트를 딱 한 번 가져와 거기서 슬러그→pageId 매핑을 만든다.
  // (기존 getAllPagesInSpace는 글마다 개별 fetch + 재귀 + 재시도로 글이 많아지면
  //  런타임/빌드에서 300초 타임아웃이 났다. 이미지 signed-url도 사이트맵엔 불필요해 끈다.)
  const recordMap = await notion.getPage(rootNotionPageId, {
    signFileUrls: false,
    fetchMissingBlocks: false,
  });

  const rootId = parsePageId(rootNotionPageId) as string;
  const pageMap: types.SiteMap['pageMap'] = { [rootId]: recordMap } as any;
  const canonicalPageMap: { [canonicalPageId: string]: string } = {};

  // 루트에 임베드된 컬렉션 뷰들에서 글(row) pageId 수집
  const childPageIds = new Set<string>();
  for (const block of Object.values(recordMap.block || {})) {
    const value: any = (block as any)?.value;
    if (value?.type !== 'collection_view' && value?.type !== 'collection_view_page') {
      continue;
    }
    const defaultViewId = value.view_ids?.[0];
    const collectionId =
      value.collection_id ||
      recordMap.collection_view?.[defaultViewId]?.value?.format?.collection_pointer?.id;
    const blockIds =
      (recordMap.collection_query as any)?.[collectionId]?.[defaultViewId]
        ?.collection_group_results?.blockIds || [];
    for (const id of blockIds) {
      childPageIds.add(id);
    }
  }

  // 제목은 루트 recordMap(컬렉션 조회 시 row 블록이 병합됨)에 있으므로 개별 fetch 불필요
  for (const pageId of childPageIds) {
    if (!recordMap.block?.[pageId]) {
      continue;
    }
    const canonicalPageId = getCanonicalPageId(pageId, recordMap, { uuid });
    if (canonicalPageId && !canonicalPageMap[canonicalPageId]) {
      canonicalPageMap[canonicalPageId] = pageId;
      pageMap[pageId] = recordMap;
    }
  }

  return {
    pageMap,
    canonicalPageMap,
  };
}
