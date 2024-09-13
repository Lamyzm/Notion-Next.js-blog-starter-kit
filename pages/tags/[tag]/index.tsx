import * as React from 'react';

import { NotionPage } from 'components';
import { domain } from 'lib/config';
import { resolveNotionPage } from 'lib/resolve-notion-page';
import { GetStaticPaths, GetStaticProps } from 'next';
import ky from 'ky';
import { cs, NotionRenderer } from 'react-notion-x';
import { Header, Breadcrumbs, Search } from '~/packages/react-notion-x/components/header';
import { SearchIcon } from '~/packages/react-notion-x/icons/search-icon';
import { useNotionContext } from '~/packages/react-notion-x/context';
import Link from 'next/link';
import { PageBlock } from 'notion-types';
import { CollectionCard } from '~/packages/react-notion-x/third-party/collection-card';
import Image from 'next/image';
import * as siteConfig from 'lib/config';
import Router, { useRouter } from 'next/router';
import { Page404 } from 'components';

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [{ params: { tag: 'example-tag-1' } }, { params: { tag: 'example-tag-2' } }];

  return {
    paths,
    fallback: 'blocking', // 또는 true/false
  };
};

export const getStaticProps = async a => {
  console.log('static prorp', a);
  try {
    const filteredPosts = await getTagPosts(a.params.tag);
    // const props = await resolveNotionPage(domain);

    return {
      props: {
        filteredPosts,
        revalidate: 10,
      },
    };
  } catch (err) {
    console.error('page error', domain, err);

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err;
  }
};
export const getTagPosts = async contain => {
  const data = {
    filter: {
      property: '태그',
      multi_select: {
        contains: contain,
      },
    },
  };

  const config = {
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
  };
  const response = await ky
    .post('https://api.notion.com/v1/databases/4b9f229688d545aba687f7855e987ce3/query', {
      headers: config.headers,
      json: data,
    })
    .json();
  return response;
};

export default function NotionDomainPage({ filteredPosts }) {
  if (filteredPosts && filteredPosts.results?.length === 0) {
    return <Page404 />;
  }
  return (
    <>
      <header className="notion-header">
        <div className="notion-nav-header">
          {
            <div role="button" className={cs('breadcrumb', 'button', 'notion-search-button')}>
              <Link href={'/'}>Home </Link>
              {<span className="title">{'nextjs'}</span>}
            </div>
          }
        </div>
      </header>
      <main
        className={
          'notion notion-page notion-page-has-cover notion-page-has-icon notion-page-has-image-icon notion-full-page index-page'
        }
      >
        <h1>nextjs</h1>

        <div style={{ width: '100%' }} className="postListWrap ">
          <div className={'notion-tag-posts'}>
            {filteredPosts.results.map((val, idx) => {
              console.log(val);
              const { id: postId, cover, properties } = val;

              const title = properties?.['이름']?.title?.[0]?.plain_text || siteConfig.name;
              const description = properties?.['설명']?.rich_text?.[0]?.plain_text || '';
              const publishedAt = properties?.['작성일']?.created_time;
              const publishedAtString = publishedAt
                ? new Date(publishedAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : siteConfig.domain;
              return (
                <Link key={idx} href={'/' + postId} className="notion-tag-post">
                  <div className="notion-tag-imgwrapper">
                    {cover.external.url ? (
                      <Image
                        fill
                        style={{ objectFit: 'cover' }}
                        src={cover.external.url}
                        alt="notion-post-cover-image"
                      />
                    ) : null}
                  </div>
                  <div className="notion-tag-content">
                    <div style={{ padding: '0 20px' }}>
                      <h3>{title}</h3>
                      <p style={{ fontSize: '14px' }}>{description}</p>
                    </div>
                    <time style={{ padding: '10px 30px' }} className="post-create-time">
                      {publishedAtString}
                    </time>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
