import { NotionAPI } from 'notion-client';

/**
 * Notion 비공식 API 클라이언트.
 *
 * 공개 페이지는 인증 없이도 읽히지만, 데이터센터 IP에서 오는 요청에는
 * 403이 자주 돌아온다. Vercel 빌드 서버와 서버리스가 정확히 그 대상이라
 * 프리렌더와 ISR 재생성이 통째로 실패해 왔다.
 *
 * NOTION_TOKEN_V2를 넣으면 로그인된 요청으로 취급돼 403이 크게 줄어든다.
 * (Notion 웹의 token_v2 쿠키 값. 계정에 따라 NOTION_ACTIVE_USER도 필요하다.)
 * 없으면 기존처럼 익명으로 동작하므로 설정은 선택이다.
 *
 * 토큰으로도 403이 남으면 NOTION_API_BASE_URL로 프록시를 경유시킨다.
 */
export const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  authToken: process.env.NOTION_TOKEN_V2,
  activeUser: process.env.NOTION_ACTIVE_USER,
});
