import * as types from './types';

/**
 * `next build` 중인지 판별한다.
 *
 * Notion 비공식 API는 데이터센터 IP에 403을 자주 준다.
 * Vercel 빌드 서버도 예외가 아니라서, getStaticProps가 throw하면
 * 프리렌더가 실패하고 배포 자체가 중단된다.
 * 그러면 Vercel은 직전 성공 배포를 계속 서빙하므로,
 * 아무리 푸시해도 사이트가 갱신되지 않는 상태에 빠진다.
 *
 * 그래서 실패를 두 상황으로 나눠 다룬다.
 *
 *   빌드 중  → 에러 페이지 props로 넘겨 빌드를 통과시킨다.
 *             배포는 성공하고, 실제 내용은 첫 요청 때 ISR이 채운다.
 *   런타임   → throw한다. 기존 페이지가 유지되고 다음 요청에서 재생성을 다시 시도한다.
 *             여기서 관대하게 처리하면 깨진 페이지가 캐시에 굳는다.
 */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

/**
 * 빌드 실패를 피하기 위한 임시 props.
 * revalidate를 짧게 둬서 배포 직후 첫 요청에 곧바로 재생성되게 한다.
 */
export function buildTimeFallback(message: string) {
  return {
    props: {
      error: {
        message: `빌드 시점에 Notion 응답을 받지 못했습니다: ${message}`,
        statusCode: 503,
      },
    } as types.PageProps,
    revalidate: 10,
  };
}
