import { useLanguage } from '../context/useLanguage';

function LanguageFlag({ language }) {
  if (language === 'km') {
    return (
      <svg viewBox="0 0 36 24" aria-hidden="true">
        <path fill="#032EA1" d="M0 0h36v24H0z" />
        <path fill="#E00025" d="M0 6h36v12H0z" />
        <g fill="#fff" stroke="#101c37" strokeLinejoin="round" strokeWidth=".35">
          <path d="M4.5 17.1h27v-.9h-2v-1h-1.8v-1h-1.8v-1h-2.2V9.7h-1.2V8.5h-1.2V7h-1.1V5.5h-.8V4h-.8v1.5h-.8V7h-1.1v1.5h-1.2v1.2h-1.2v3.5h-2.2v1H10v1H8v1H4.5v.9Z" />
          <path d="M9.5 13.2h2v-2.1h1.1V9.5h1.2v2.1h1.1v1.6h1.2V9.7h1.1V8.2h1.2V6.8h.8V5.2h.7v1.6h.8v1.4H23v1.5h1.1v3.5h1.2v-1.6h1.1V9.5h1.2v1.6h1.1v2.1h1.3v1.1H9.5v-1.1Z" />
          <path d="M7.5 16.1h21v-.8h-21zM10 15h16M12 14h12M15 12.8h6M17 11.6h2" />
          <path d="M12.1 13.5v2.4m2.5-2.4v2.4m6.8-2.4v2.4m2.5-2.4v2.4M17.1 9.8v2.3m1.8-2.3v2.3" fill="none" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 36 24" aria-hidden="true">
      <path fill="#012169" d="M0 0h36v24H0z" />
      <path fill="#fff" d="M0 0h4.2L36 20.9V24h-4.2L0 3.1zm36 0v3.1L4.2 24H0v-3.1L31.8 0z" />
      <path fill="#C8102E" d="M0 0h1.6L36 22.7V24h-1.6L0 1.3zm36 0v1.3L1.6 24H0v-1.3L34.4 0z" />
      <path fill="#fff" d="M14 0h8v24h-8zM0 8h36v8H0z" />
      <path fill="#C8102E" d="M15.7 0h4.6v24h-4.6zM0 9.7h36v4.6H0z" />
    </svg>
  );
}

function LanguagePicker() {
  const { language, setLanguage } = useLanguage();
  const currentLanguageName = language === 'km' ? 'ខ្មែរ' : 'English';

  return (
    <details className="theme-picker language-picker">
      <summary aria-label={`ប្តូរភាសា · ${currentLanguageName}`} title={currentLanguageName}>
        <span className="language-flag"><LanguageFlag language={language} /></span>
      </summary>
      <div className="theme-menu language-menu" role="group" aria-label="ជ្រើសរើសភាសា">
        <button type="button" className={language === 'km' ? 'active' : ''} aria-pressed={language === 'km'} onClick={(event) => { setLanguage('km'); event.currentTarget.closest('details')?.removeAttribute('open'); }}>
          <span className="language-flag"><LanguageFlag language="km" /></span>
          <span>ខ្មែរ</span>{language === 'km' && <b aria-hidden="true">✓</b>}
        </button>
        <button type="button" className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} onClick={(event) => { setLanguage('en'); event.currentTarget.closest('details')?.removeAttribute('open'); }}>
          <span className="language-flag"><LanguageFlag language="en" /></span>
          <span>English</span>{language === 'en' && <b aria-hidden="true">✓</b>}
        </button>
      </div>
    </details>
  );
}

export default LanguagePicker;
