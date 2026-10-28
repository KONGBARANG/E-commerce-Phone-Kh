import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/useShop';

function Navbar({ theme, themeMode, setThemeMode }) {
  const { cartCount, user, products } = useShop();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  const brands = [...new Set(products.map((product) => product.brand).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));
  const countBy = (field, value) => products.filter((product) => product[field] === value).length;

  const search = (event) => {
    event.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      <div className="topline">ដឹកជញ្ជូនឥតគិតថ្លៃ សម្រាប់ការកុម្ម៉ង់លើស $300 <span>•</span> សេវាបម្រើ 7 ថ្ងៃក្នុងមួយសប្ដាហ៍</div>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="PHONE KH homepage">
          <span className="brand-mark">P</span>
          <span>PHONE<span className="brand-accent">KH</span><small>TECH FOR EVERYONE</small></span>
        </Link>
        <nav className="primary-nav" aria-label="Main navigation">
          <Link to="/">ទំព័រដើម</Link>
          <Link to="/products">ផលិតផល</Link>
          <Link to="/about">អំពីយើង</Link>
          <Link to="/contact">ទំនាក់ទំនង</Link>
        </nav>
        <form className="search-box" onSubmit={search}>
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="ស្វែងរកផលិតផល"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ស្វែងរកទូរស័ព្ទ និងគ្រឿងបន្លាស់..."
          />
          {query && (
            <div className="search-suggestions">
              <button type="submit">ស្វែងរក “{query}” →</button>
            </div>
          )}
        </form>
        <div className="header-actions">
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
              <button type="button" className={themeMode === 'light' ? 'active' : ''} aria-pressed={themeMode === 'light'} onClick={() => { setThemeMode('light'); document.activeElement?.closest('details')?.removeAttribute('open'); }}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
                <span>ភ្លឺ</span>{themeMode === 'light' && <b aria-hidden="true">✓</b>}
              </button>
              <button type="button" className={themeMode === 'dark' ? 'active' : ''} aria-pressed={themeMode === 'dark'} onClick={() => { setThemeMode('dark'); document.activeElement?.closest('details')?.removeAttribute('open'); }}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5a8.6 8.6 0 1 0 12 12Z" /></svg>
                <span>ងងឹត</span>{themeMode === 'dark' && <b aria-hidden="true">✓</b>}
              </button>
              <button type="button" className={themeMode === 'system' ? 'active' : ''} aria-pressed={themeMode === 'system'} onClick={() => { setThemeMode('system'); document.activeElement?.closest('details')?.removeAttribute('open'); }}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></svg>
                <span>តាមប្រព័ន្ធ</span>{themeMode === 'system' && <b aria-hidden="true">✓</b>}
              </button>
            </div>
          </details>
          <Link className="icon-link account-link" to={user ? '/account' : '/login'} aria-label={user ? `គណនី ${user.name}` : 'ចូលគណនី'}>
            <span className="header-action-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
              </svg>
            </span>
            <span className="header-action-copy"><small>គណនី</small><b>{user ? user.name : 'ចូលគណនី'}</b></span>
          </Link>
          <Link className="icon-link cart-link" to="/cart" aria-label={`កន្ត្រក ${cartCount} មុខ`}>
            <span className="header-action-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.5L21 8H6" />
                <path d="M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              </svg>
              <i>{cartCount}</i>
            </span>
            <span className="header-action-copy"><small>កន្ត្រក</small><b>{cartCount} មុខ</b></span>
          </Link>
        </div>
      </header>
      <nav className="category-nav" aria-label="រុករកផលិតផលតាមប្រភេទ និងម៉ាក">
        <span className="category-nav-label">រុករកតាម</span>
        <div className="category-nav-links">
          <Link className="category-chip" to="/products"><span>ផលិតផលទាំងអស់</span><small>{products.length}</small></Link>
          {categories.map((category) => (
            <Link className="category-chip" to={`/products?category=${encodeURIComponent(category)}`} key={category}>
              <span>{category === 'Smartphone' ? 'ទូរស័ព្ទ' : category === 'Accessories' ? 'គ្រឿងបន្លាស់' : category}</span>
              <small>{countBy('category', category)}</small>
            </Link>
          ))}
          {brands.map((brand) => (
            <Link className="category-chip category-brand-chip" to={`/products?brand=${encodeURIComponent(brand)}`} key={brand}>
              <span>{brand}</span><small>{countBy('brand', brand)}</small>
            </Link>
          ))}
          <Link className="category-chip category-deal-chip" to="/products?sort=price-asc">តម្លៃទាប</Link>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
