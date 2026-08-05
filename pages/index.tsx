import * as React from 'react';

import { NotionPage } from 'components';
import { buildTimeFallback, isBuildPhase } from 'lib/build-phase';
import { domain } from 'lib/config';
import { getTagDatabase } from 'lib/get-tag-database';
import { resolveNotionPage } from 'lib/resolve-notion-page';

export const getStaticProps = async () => {
  try {
    const [props, tagPosts] = await Promise.all([resolveNotionPage(domain), getTagDatabase()]);
    return {
      props: {
        ...props,
        tagPosts: tagPosts || null,
      },
      revalidate: 10,
    };
  } catch (err) {
    console.error('page error', domain, err);

    // 빌드 중이면 배포를 살린다. 여기서 throw하면 프리렌더가 실패해
    // 배포 전체가 중단되고, Vercel은 직전 성공 배포를 계속 서빙한다.
    // 즉 아무리 푸시해도 사이트가 갱신되지 않는다.
    if (isBuildPhase()) {
      return buildTimeFallback(err instanceof Error ? err.message : String(err));
    }

    // 런타임이라면 기존 페이지를 유지하고 다음 요청에서 다시 시도하게 한다.
    throw err;
  }
};

export default function NotionDomainPage(props) {
  // console.log('NotionDomainPage', props);
  return <NotionPage {...props} />;
}
