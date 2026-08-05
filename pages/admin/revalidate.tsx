import * as React from 'react';

import Head from 'next/head';

/**
 * 관리자용 재검증 화면.
 *
 * 서버에 시크릿을 두지 않고, 관리자가 입력한 값을 그대로 API에 전달한다.
 * 페이지 자체는 공개돼 있어도 시크릿을 모르면 아무것도 할 수 없다.
 * 입력한 시크릿은 localStorage에만 두어 매번 치지 않게 한다.
 */

type Result = {
  revalidated: string[];
  failed: { path: string; error: string }[];
};

const STORAGE_KEY = 'revalidate-secret';

export default function AdminRevalidatePage() {
  const [secret, setSecret] = React.useState('');
  const [path, setPath] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setSecret(saved);
  }, []);

  const run = async (mode: 'base' | 'all' | 'path') => {
    if (!secret) {
      setError('시크릿을 입력해 주세요.');
      return;
    }
    if (mode === 'path' && !path.trim()) {
      setError('재검증할 경로를 입력해 주세요.');
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    window.localStorage.setItem(STORAGE_KEY, secret);

    const params = new URLSearchParams({ secret });
    if (mode === 'all') params.set('all', '1');
    if (mode === 'path') params.set('path', path.trim());

    try {
      const res = await fetch(`/api/revalidate?${params.toString()}`, { method: 'POST' });
      const json = await res.json();

      if (!res.ok && res.status !== 207) {
        setError(json.error ?? `요청이 실패했습니다 (${res.status})`);
        return;
      }
      setResult(json as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head>
        <title>재검증</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main style={styles.wrap}>
        <h1 style={styles.title}>페이지 재검증</h1>
        <p style={styles.desc}>
          Notion에서 글을 고친 뒤 이 화면에서 재검증하면 바로 반영됩니다.
          <br />
          재검증하지 않으면 캐시가 만료될 때까지 예전 내용이 보일 수 있습니다.
        </p>

        <label style={styles.label}>
          시크릿
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="REVALIDATE_SECRET"
            style={styles.input}
            autoComplete="off"
          />
        </label>

        <div style={styles.row}>
          <button onClick={() => run('base')} disabled={busy} style={styles.button}>
            홈 · 피드 · 사이트맵
          </button>
          <button onClick={() => run('all')} disabled={busy} style={styles.buttonPrimary}>
            글 전체
          </button>
        </div>

        <label style={styles.label}>
          특정 경로만 (콤마로 여러 개)
          <input
            type="text"
            value={path}
            onChange={e => setPath(e.target.value)}
            placeholder="/my-post, /tags/nextjs"
            style={styles.input}
          />
        </label>
        <button onClick={() => run('path')} disabled={busy} style={styles.button}>
          이 경로만 재검증
        </button>

        {busy && <p style={styles.busy}>재검증 중… 글이 많으면 시간이 걸립니다.</p>}

        {error && <p style={styles.error}>{error}</p>}

        {result && (
          <section style={styles.result}>
            <p style={styles.ok}>성공 {result.revalidated.length}건</p>
            <ul style={styles.list}>
              {result.revalidated.map(p => (
                <li key={p}>{p}</li>
              ))}
            </ul>

            {result.failed.length > 0 && (
              <>
                <p style={styles.fail}>실패 {result.failed.length}건</p>
                <ul style={styles.list}>
                  {result.failed.map(f => (
                    <li key={f.path}>
                      {f.path} — {f.error}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
      </main>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 560,
    margin: '0 auto',
    padding: '48px 20px 80px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    lineHeight: 1.6,
  },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 8 },
  desc: { fontSize: 14, opacity: 0.7, marginBottom: 28 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginTop: 20, marginBottom: 6 },
  input: {
    display: 'block',
    width: '100%',
    marginTop: 6,
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid rgba(128,128,128,0.35)',
    borderRadius: 8,
    background: 'transparent',
    color: 'inherit',
    fontWeight: 400,
  },
  row: { display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' },
  button: {
    padding: '10px 16px',
    fontSize: 14,
    borderRadius: 8,
    border: '1px solid rgba(128,128,128,0.35)',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    marginTop: 10,
  },
  buttonPrimary: {
    padding: '10px 16px',
    fontSize: 14,
    borderRadius: 8,
    border: 'none',
    background: '#2f6feb',
    color: '#fff',
    cursor: 'pointer',
    marginTop: 10,
  },
  busy: { marginTop: 20, fontSize: 14, opacity: 0.7 },
  error: { marginTop: 20, fontSize: 14, color: '#e5484d' },
  result: { marginTop: 28 },
  ok: { fontSize: 14, fontWeight: 600, color: '#30a46c' },
  fail: { fontSize: 14, fontWeight: 600, color: '#e5484d', marginTop: 16 },
  list: { fontSize: 13, opacity: 0.8, paddingLeft: 18, marginTop: 6 },
};
