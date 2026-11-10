import { useLanguage } from '../context/useLanguage';

function LanguageFlag({ language }) {
  return (
    <img
      src={language === 'km' ? '/flags/cambodia.webp' : '/flags/united-kingdom.webp'}
      alt=""
      aria-hidden="true"
    />
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
