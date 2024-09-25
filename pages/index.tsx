import * as React from 'react';

import { NotionPage } from 'components';
import { domain } from 'lib/config';
import { resolveNotionPage } from 'lib/resolve-notion-page';
import ky from 'ky';

export const getTagPosts = async () => {
  const response = await ky
    .get('https://api.notion.com/v1/databases/4b9f229688d545aba687f7855e987ce3', {
      headers: {
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
    })
    .json();
  return response;
};

export const getStaticProps = async a => {
  try {
    const [props, tagPosts] = await Promise.all([resolveNotionPage(domain), getTagPosts()]);
    return {
      props: {
        ...props,
        tagPosts,
      },
      revalidate: 10,
    };
  } catch (err) {
    console.error('page error', domain, err);

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err;
  }
};

export default function NotionDomainPage(props) {
  // console.log(props);
  return <NotionPage {...props} />;
}
