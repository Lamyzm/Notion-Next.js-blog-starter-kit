import * as React from 'react';
import { GetStaticProps } from 'next';
import { buildTimeFallback, isBuildPhase } from 'lib/build-phase';
import { isDev, domain } from 'lib/config';
import { getSiteMap } from 'lib/get-site-map';
import { getTagDatabase } from 'lib/get-tag-database';
import { resolveNotionPage } from 'lib/resolve-notion-page';
import { PageProps, Params } from 'lib/types';
import { NotionPage } from 'components';

export const getStaticProps: GetStaticProps<PageProps, Params> = async context => {
  const rawPageId = context.params.pageId as string;
  // console.log('Page ID:', context.params.pageId);
  try {
    // 태그 스키마도 함께 넘긴다. 홈에서만 넘기고 있어서 개별 글 페이지에서는
    // tagPosts가 undefined가 되고, 태그 영역이 통째로 비어 있었다.
    const [props, tagPosts] = await Promise.all([
      resolveNotionPage(domain, rawPageId),
      getTagDatabase(),
    ]);

    return {
      props: {
        ...props,
        tagPosts: tagPosts || null,
      },
      revalidate: 10,
    };
  } catch (err) {
    console.error('page error', domain, rawPageId, err);

    if (isBuildPhase()) {
      return buildTimeFallback(err instanceof Error ? err.message : String(err));
    }

    // 여기서 아무것도 반환하지 않으면 getStaticProps가 undefined를 돌려주고,
    // Next.js는 재생성 실패로 간주해 기존 페이지를 무한정 STALE로 내보낸다.
    // (revalidate: 10 인데도 age가 몇 시간씩 쌓이던 원인)
    // throw 해야 실패가 명시적으로 기록되고, 다음 요청에서 재생성을 다시 시도한다.
    throw err;
  }
};

export async function getStaticPaths() {
  // 빌드 시 전체 스페이스를 크롤(getSiteMap)하면 글이 많아질수록 300초 타임아웃이 난다.
  // 각 글은 최초 요청 시 ISR로 생성하고, 슬러그→페이지 해석은 런타임에서
  // 캐시된 getSiteMap(1시간)이 처리한다.
  return {
    paths: [],
    fallback: 'blocking' as const,
  };
}

export default function NotionDomainDynamicPage(props) {
  // console.log('NotionDomainDynamicPage', props);
  return <NotionPage {...props} />;
}
