import * as React from 'react';
import { GetStaticProps } from 'next';
import { isDev, domain } from 'lib/config';
import { getSiteMap } from 'lib/get-site-map';
import { resolveNotionPage } from 'lib/resolve-notion-page';
import { PageProps, Params } from 'lib/types';
import { NotionPage } from 'components';
import ky from 'ky';

export const getTagPosts = async () => {
  const response = await ky
    .post('https://api.notion.com/v1/databases/4b9f229688d545aba687f7855e987ce3/query', {
      headers: {
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
    })
    .json();
  return response;
};

export const getStaticProps: GetStaticProps<PageProps, Params> = async context => {
  const rawPageId = context.params.pageId as string;
  console.log('Page ID:', context.params.pageId);
  try {
    const [props, tagPosts] = await Promise.all([
      resolveNotionPage(domain, rawPageId),
      getTagPosts(),
    ]);
    console.log(tagPosts, '엄준식!');
    return {
      props: {
        ...props,
        tagPosts,
      },
      revalidate: 10,
    };
  } catch (err) {
    console.error('page error', domain, rawPageId, err);

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err;
  }
};

export async function getStaticPaths() {
  if (isDev) {
    return {
      paths: [],
      fallback: true,
    };
  }

  const siteMap = await getSiteMap();

  const staticPaths = {
    paths: Object.keys(siteMap.canonicalPageMap).map(pageId => ({
      params: {
        pageId,
      },
    })),
    // paths: [],
    fallback: true,
  };

  return staticPaths;
}

export default function NotionDomainDynamicPage(props) {
  return <NotionPage {...props} />;
}
