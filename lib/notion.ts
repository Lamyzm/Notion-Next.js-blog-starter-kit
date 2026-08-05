import { ExtendedRecordMap, SearchParams, SearchResults } from 'notion-types';
import { mergeRecordMaps } from 'notion-utils';
import pMap from 'p-map';
import pMemoize from 'p-memoize';

import { isPreviewImageSupportEnabled, navigationStyle, navigationLinks } from './config';
import { notion } from './notion-api';
import { getPreviewImageMap } from './preview-images';
import { withNotionRetry } from './retry-notion';

const getNavigationLinkPages = pMemoize(async (): Promise<ExtendedRecordMap[]> => {
  const navigationLinkPageIds = (navigationLinks || []).map(link => link.pageId).filter(Boolean);

  if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
    return pMap(
      navigationLinkPageIds,
      async navigationLinkPageId =>
        withNotionRetry(`getPage(nav:${navigationLinkPageId})`, () =>
          notion.getPage(navigationLinkPageId, {
            chunkLimit: 1,
            fetchMissingBlocks: false,
            fetchCollections: false,
            signFileUrls: false,
          }),
        ),
      {
        concurrency: 4,
      },
    );
  }

  return [];
});

export interface GetPageOptions {
  draftView?: boolean;
}

export async function getPage(
  pageId: string,
  options: GetPageOptions = {},
): Promise<ExtendedRecordMap> {
  // Notion이 데이터센터 IP에 간헐적으로 403을 준다.
  // 여기서 실패하면 ISR 재생성이 통째로 깨지므로 재시도로 흡수한다.
  let recordMap = await withNotionRetry(`getPage(${pageId})`, () =>
    notion.getPage(pageId, options),
  );

  if (navigationStyle !== 'default') {
    // ensure that any pages linked to in the custom navigation header have
    // their block info fully resolved in the page record map so we know
    // the page title, slug, etc.
    const navigationLinkRecordMaps = await getNavigationLinkPages();

    if (navigationLinkRecordMaps?.length) {
      recordMap = navigationLinkRecordMaps.reduce(
        (map, navigationLinkRecordMap) => mergeRecordMaps(map, navigationLinkRecordMap),
        recordMap,
      );
    }
  }

  if (isPreviewImageSupportEnabled) {
    const previewImageMap = await getPreviewImageMap(recordMap);
    (recordMap as any).preview_images = previewImageMap;
  }

  return recordMap;
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params);
}
