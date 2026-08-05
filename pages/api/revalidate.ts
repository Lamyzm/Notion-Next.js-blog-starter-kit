import { NextApiRequest, NextApiResponse } from 'next';

import { getSiteMap } from 'lib/get-site-map';

/**
 * 온디맨드 재검증(On-demand ISR) 엔드포인트.
 *
 * Notion은 웹훅을 제공하지 않기 때문에 글을 고쳐도 `revalidate: 10`이 만료될 때까지
 * 기다려야 한다. 게다가 백그라운드 재생성이 한 번 실패하면 Next.js는 옛 페이지를
 * 계속 STALE로 내주기 때문에, 실패 상태에서 스스로 빠져나오지 못한다.
 * 이 엔드포인트로 특정 경로를 즉시 다시 만들 수 있다.
 *
 * 사용:
 *   POST /api/revalidate?secret=...            → 홈·피드·사이트맵만
 *   POST /api/revalidate?secret=...&all=1      → 전체 글 + 태그 페이지까지
 *   POST /api/revalidate?secret=...&path=/foo  → 특정 경로만 (콤마로 여러 개)
 */

const BASE_PATHS = ['/', '/feed', '/sitemap.xml'];

// 한 번에 너무 많이 돌리면 Notion API rate limit에 걸리고 함수도 타임아웃 난다.
const MAX_PATHS = 60;

type RevalidateResult = {
  revalidated: string[];
  failed: { path: string; error: string }[];
  skipped?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RevalidateResult | { error: string }>,
) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return res.status(500).json({ error: 'REVALIDATE_SECRET이 설정되지 않았습니다.' });
  }

  const provided = (req.query.secret as string) ?? req.headers['x-revalidate-secret'];

  if (provided !== secret) {
    // 토큰이 틀렸을 때 404를 주면 엔드포인트 존재 자체가 덜 드러난다.
    return res.status(404).json({ error: 'Not found' });
  }

  const paths = await resolvePaths(req);

  const revalidated: string[] = [];
  const failed: { path: string; error: string }[] = [];

  // 순차 처리한다. 병렬로 돌리면 각 경로가 Notion을 다시 긁으면서
  // rate limit에 걸려 오히려 재검증이 실패한다.
  for (const path of paths) {
    try {
      await res.revalidate(path);
      revalidated.push(path);
    } catch (err) {
      failed.push({ path, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return res.status(failed.length ? 207 : 200).json({ revalidated, failed });
}

async function resolvePaths(req: NextApiRequest): Promise<string[]> {
  const explicit = req.query.path as string | undefined;

  if (explicit) {
    return explicit
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => (p.startsWith('/') ? p : `/${p}`))
      .slice(0, MAX_PATHS);
  }

  if (req.query.all !== '1') {
    return BASE_PATHS;
  }

  try {
    const siteMap = await getSiteMap();
    const slugs = Object.keys(siteMap.canonicalPageMap ?? {}).map(slug => `/${slug}`);

    return [...BASE_PATHS, ...slugs].slice(0, MAX_PATHS);
  } catch {
    // 사이트맵을 못 읽어도 홈은 갱신해준다.
    return BASE_PATHS;
  }
}
