import { defaultTheme, isServer } from 'lib/config';
import { atom, AtomEffect } from 'recoil';

interface PreferencesStoreValues {
  isDarkMode: boolean;
}

/**
 * 첫 렌더는 서버와 클라이언트가 반드시 같아야 한다.
 *
 * 예전에는 atom의 default에서 곧바로 localStorage와 matchMedia를 읽었는데,
 * 서버는 그 값을 알 수 없으므로 다크모드 사용자에게는 첫 렌더 결과가 서버와 달라졌다.
 * isDarkMode는 NotionRenderer의 darkMode prop으로 들어가 클래스와 텍스트를 바꾸기 때문에
 * React 하이드레이션이 통째로 깨졌다. (#418 / #423 / #425)
 *
 * 그래서 default는 서버가 만들 수 있는 값으로 고정하고,
 * 실제 사용자 설정은 하이드레이션이 끝난 뒤 effect에서 덮어쓴다.
 */

const serverSafeDefault: PreferencesStoreValues = {
  // 'system'이라도 서버는 사용자 OS 설정을 알 수 없으므로 라이트로 시작한다.
  isDarkMode: defaultTheme === 'dark',
};

function readStoredPreferences(): PreferencesStoreValues | null {
  try {
    const raw = localStorage.getItem('preferences');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (typeof parsed?.isDarkMode !== 'boolean') return null;

    return { isDarkMode: parsed.isDarkMode };
  } catch {
    // 저장값이 깨져 있으면 무시하고 기본값으로 간다.
    return null;
  }
}

function resolveUserPreference(): PreferencesStoreValues {
  const stored = readStoredPreferences();
  if (stored) return stored;

  if (defaultTheme === 'system' && window.matchMedia) {
    return { isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches };
  }

  return serverSafeDefault;
}

const localStorageSyncEffect: AtomEffect<PreferencesStoreValues> = ({ setSelf, onSet }) => {
  onSet(newValue => {
    if (isServer) return;
    localStorage.setItem('preferences', JSON.stringify(newValue));
  });

  if (isServer) return;

  // 동기로 setSelf를 부르면 첫 렌더에 반영돼 다시 불일치가 난다.
  // 하이드레이션이 끝난 다음 틱에 실제 값을 적용한다.
  const timer = window.setTimeout(() => {
    const preference = resolveUserPreference();

    setSelf(current => {
      const value = current as PreferencesStoreValues;
      // 값이 같으면 굳이 다시 세팅해 리렌더를 만들지 않는다.
      return value?.isDarkMode === preference.isDarkMode ? value : preference;
    });
  }, 0);

  return () => window.clearTimeout(timer);
};

export const preferencesStore = atom<PreferencesStoreValues>({
  key: 'preferences',
  default: serverSafeDefault,
  effects: [localStorageSyncEffect],
});
