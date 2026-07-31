import * as React from 'react';
import { GetStaticProps } from 'next';
import { isDev, domain } from 'lib/config';
import { getSiteMap } from 'lib/get-site-map';
import { resolveNotionPage } from 'lib/resolve-notion-page';
import { PageProps, Params } from 'lib/types';
import { NotionPage } from 'components';

export const getStaticProps: GetStaticProps<PageProps, Params> = async context => {
  const rawPageId = context.params.pageId as string;
  // console.log('Page ID:', context.params.pageId);
  try {
    const props = await resolveNotionPage(domain, rawPageId);
    return {
      props,
      revalidate: 10,
    };
  } catch (err) {
    console.error('page error', domain, rawPageId, err);

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    // throw err;
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
