/**
 * Notion 비공식 API(`/api/v3/loadPageChunk`) 호출용 재시도 헬퍼.
 *
 * 이 API는 인증 없이 쓰는 대신, 데이터센터 IP에서 오는 요청에 간헐적으로
 * 403이나 5xx를 돌려준다. 서버리스 환경에서는 이게 꽤 자주 발생한다.
 *
 * 문제는 실패가 조용히 끝나지 않는다는 점이다.
 * getStaticProps가 실패하면 ISR 재생성이 깨지고, Next.js는 이미 만들어둔
 * 페이지를 계속 STALE로 내보낸다. revalidate가 10초여도 몇 시간 전 내용이
 * 그대로 보이는 이유가 이것이다.
 *
 * 한두 번만 다시 시도해도 대부분 통과하므로, 호출 지점을 이 헬퍼로 감싼다.
 */

const RETRYABLE_STATUS = new Set([403, 408, 425, 429, 500, 502, 503, 504]);

const DEFAULT_RETRIES = 3;
const BASE_DELAY_MS = 400;
const MAX_DELAY_MS = 4000;

function getStatusCode(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;

  const anyErr = err as any;

  // got(HTTPError) / ky / fetch 래퍼마다 위치가 다르다.
  return (
    anyErr.response?.statusCode ??
    anyErr.response?.status ??
    anyErr.statusCode ??
    anyErr.status ??
    null
  );
}

function isRetryable(err: unknown): boolean {
  const status = getStatusCode(err);
  if (status !== null) return RETRYABLE_STATUS.has(status);

  // 네트워크 계층 오류(타임아웃, 커넥션 리셋)도 재시도 대상이다.
  const code = (err as any)?.code;
  return (
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'EAI_AGAIN' ||
    code === 'ENOTFOUND'
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withNotionRetry<T>(
  label: string,
  fn: () => Promise<T>,
  retries: number = DEFAULT_RETRIES,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === retries || !isRetryable(err)) break;

      // 지수 백오프에 지터를 섞는다.
      // 여러 페이지가 동시에 재생성될 때 재시도가 같은 순간에 몰리는 걸 막는다.
      const backoff = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
      const jitter = Math.floor(Math.random() * (backoff / 2));

      console.warn(
        `[notion-retry] ${label} 실패 (status=${getStatusCode(err) ?? 'n/a'}), ` +
          `${attempt + 1}/${retries} 재시도 · ${backoff + jitter}ms 후`,
      );

      await delay(backoff + jitter);
    }
  }

  throw lastError;
}
