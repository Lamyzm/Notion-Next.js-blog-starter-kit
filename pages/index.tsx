import * as React from 'react';

import { NotionPage } from 'components';
import { domain } from 'lib/config';
import { resolveNotionPage } from 'lib/resolve-notion-page';
import ky from 'ky';

export const getTagPosts = async () => {
  const apiKey = process.env.NOTION_API_KEY;
  
  if (!apiKey) {
    console.warn('NOTION_API_KEY is not set. Skipping tag posts fetch.');
    return null;
  }

  try {
    const response = await ky
      .get('https://api.notion.com/v1/databases/4b9f229688d545aba687f7855e987ce3', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
      })
      .json();
    return response;
  } catch (error) {
    console.error('Failed to fetch tag posts:', error);
    return null;
  }
};

export const getStaticProps = async a => {
  try {
    const [props, tagPosts] = await Promise.all([resolveNotionPage(domain), getTagPosts()]);
    return {
      props: {
        ...props,
        tagPosts: tagPosts || null,
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
  // console.log('NotionDomainPage', props);
  return <NotionPage {...props} />;
}
