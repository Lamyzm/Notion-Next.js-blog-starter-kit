import ky from 'ky';

/**
 * 태그 칩을 그리기 위한 Notion 데이터베이스 스키마.
 *
 * 글 목록이 아니라 DB 메타데이터를 가져온다.
 * 렌더러가 `tagPosts.properties['태그'].multi_select.options` 로 태그 목록을 읽는다.
 * (packages/react-notion-x/block.tsx 참고)
 *
 * 홈과 개별 글 페이지 양쪽에서 필요해 공용으로 분리했다.
 * 이 값이 없으면 글 페이지에서 태그 영역이 통째로 비어버린다.
 */

const TAG_DATABASE_ID = '4b9f229688d545aba687f7855e987ce3';

export async function getTagDatabase(): Promise<any | null> {
  const apiKey = process.env.NOTION_API_KEY;

  if (!apiKey) {
    console.warn('NOTION_API_KEY is not set. Skipping tag database fetch.');
    return null;
  }

  try {
    return await ky
      .get(`https://api.notion.com/v1/databases/${TAG_DATABASE_ID}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
      })
      .json();
  } catch (error) {
    // 태그를 못 가져와도 본문은 보여야 하므로 여기서 throw하지 않는다.
    console.error('Failed to fetch tag database:', error);
    return null;
  }
}
