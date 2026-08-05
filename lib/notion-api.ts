import { NotionAPI } from 'notion-client';

/**
 * Notion 비공식 API 클라이언트.
 *
 * ── 왜 이런 래핑이 필요한가 ──────────────────────────────────────────────
 *
 * 어느 순간부터 www.notion.so/api/v3/loadPageChunk 가 403을 돌려주기 시작했다.
 * 빌드와 ISR 재생성이 통째로 실패했고, 배포조차 되지 않았다.
 *
 * IP 문제로 보였지만 아니었다. 같은 머신에서 curl로 같은 페이지를 익명 호출하면
 * 200이 나온다. 인증도, 공개 설정도, IP도 원인이 아니었다.
 *
 * 차이는 헤더뿐이었다. notion-client는 내부적으로 got을 쓰는데,
 * got의 기본 User-Agent(`got (https://github.com/sindresorhus/got)`)를
 * Notion이 봇으로 보고 차단한다.
 *
 * 그래서 모든 요청에 브라우저 User-Agent를 붙인다.
 * notion-client는 호출마다 gotOptions를 받지만 클라이언트 레벨 기본값이 없어,
 * fetch를 감싸 한 곳에서 주입한다.
 * ─────────────────────────────────────────────────────────────────────────
 */

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
};

const client = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  // 아래 둘은 선택. 익명으로도 동작하지만, 넣으면 접근 제한에 덜 걸린다.
  authToken: process.env.NOTION_TOKEN_V2,
  activeUser: process.env.NOTION_ACTIVE_USER,
});

// 모든 호출이 이 fetch를 지나므로 여기서 헤더를 한 번만 얹는다.
const originalFetch = client.fetch.bind(client);

client.fetch = function patchedFetch(params: any) {
  return originalFetch({
    ...params,
    gotOptions: {
      ...params?.gotOptions,
      headers: {
        ...BROWSER_HEADERS,
        ...params?.gotOptions?.headers,
      },
    },
  });
} as typeof client.fetch;

export const notion = client;
