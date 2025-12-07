import * as React from 'react';

import { domain } from 'lib/config';
import { GetStaticPaths, GetStaticProps } from 'next';
import ky from 'ky';
import { cs, NotionRenderer } from 'react-notion-x';
import { Header, Breadcrumbs, Search } from '~/packages/react-notion-x/components/header';
import { SearchIcon } from '~/packages/react-notion-x/icons/search-icon';
import { useNotionContext } from '~/packages/react-notion-x/context';
import Link from 'next/link';
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
        filteredPosts: filteredPosts || { results: [] },
        revalidate: 10,
      },
    };
  } catch (err) {
    console.error('page error', domain, err);

    // 에러가 발생해도 빈 결과로 페이지를 생성
    return {
      props: {
        filteredPosts: { results: [] },
        revalidate: 10,
      },
    };
  }
};
export const getTagPosts = async contain => {
  const apiKey = process.env.NOTION_API_KEY;

  if (!apiKey) {
    console.warn('NOTION_API_KEY is not set. Skipping tag posts fetch.');
    return { results: [] };
  }

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
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
  };

  try {
    const response = await ky
      .post('https://api.notion.com/v1/databases/4b9f229688d545aba687f7855e987ce3/query', {
        headers: config.headers,
        json: data,
      })
      .json();
    return response;
  } catch (error) {
    console.error('Failed to fetch tag posts:', error);
    return { results: [] };
  }
};

export default function NotionDomainPage({ filteredPosts }) {
  const router = useRouter();
  if (filteredPosts && filteredPosts.results?.length === 0) {
    return <Page404 />;
  }
  return (
    <>
      <header className="notion-header">
        <div className="notion-nav-header">
          {
            <div>
              <div role="button" className={cs('breadcrumb', 'button', 'notion-search-button')}>
                <Link href={'/'}>Home </Link>
              </div>
              <span>&gt;</span>
              <span className="title">{router.query.tag}</span>
            </div>
          }
        </div>
      </header>
      <main
        className={
          'notion notion-page notion-page-has-cover notion-page-has-icon notion-page-has-image-icon notion-full-page index-page'
        }
      >
        <h1>{router.query.tag}</h1>

        <div style={{ width: '100%' }} className="postListWrap ">
          <div className={'notion-tag-posts'}>
            {filteredPosts.results?.map((val, idx) => {
              if (!val) return null;

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

              // cover 이미지 URL 추출 (external 또는 file 타입 모두 지원)
              const coverUrl = cover?.external?.url || cover?.file?.url || null;

              return (
                <Link key={postId || idx} href={'/' + postId} className="notion-tag-post">
                  <div className="notion-tag-imgwrapper">
                    {coverUrl ? (
                      <Image
                        fill
                        style={{ objectFit: 'cover' }}
                        src={coverUrl}
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
