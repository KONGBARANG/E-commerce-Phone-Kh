import { useTheme } from '../context/ThemeContext';

function ThemePicker() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const closeMenu = (event) => event.currentTarget.closest('details')?.removeAttribute('open');

  return (
    <details className="theme-picker">
      <summary aria-label="កំណត់របៀបបង្ហាញ" title="កំណត់របៀបភ្លឺ ឬងងឹត">
        {themeMode === 'system' ? (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></svg>
        ) : theme === 'dark' ? (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5a8.6 8.6 0 1 0 12 12Z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
        )}
      </summary>
      <div className="theme-menu" role="group" aria-label="របៀបបង្ហាញ">
        <button type="button" className={themeMode === 'light' ? 'active' : ''} aria-pressed={themeMode === 'light'} onClick={(event) => { setThemeMode('light'); closeMenu(event); }}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l-1.42 1.42m11.3-11.3 1.42-1.42" /></svg>
          <span>ភ្លឺ</span>{themeMode === 'light' && <b aria-hidden="true">✓</b>}
        </button>
        <button type="button" className={themeMode === 'dark' ? 'active' : ''} aria-pressed={themeMode === 'dark'} onClick={(event) => { setThemeMode('dark'); closeMenu(event); }}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5a8.6 8.6 0 1 0 12 12Z" /></svg>
          <span>ងងឹត</span>{themeMode === 'dark' && <b aria-hidden="true">✓</b>}
        </button>
        <button type="button" className={themeMode === 'system' ? 'active' : ''} aria-pressed={themeMode === 'system'} onClick={(event) => { setThemeMode('system'); closeMenu(event); }}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></svg>
          <span>តាមប្រព័ន្ធ</span>{themeMode === 'system' && <b aria-hidden="true">✓</b>}
        </button>
      </div>
    </details>
  );
}

export default ThemePicker;
