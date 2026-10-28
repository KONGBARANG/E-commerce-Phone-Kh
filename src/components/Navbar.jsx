import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/useShop';

function Navbar() {
  const { cartCount, user } = useShop();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

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
      <div className="category-nav">
        <Link to="/products">ផលិតផលទាំងអស់</Link>
        <Link to="/products?brand=Apple">Apple</Link>
        <Link to="/products?brand=Samsung">Samsung</Link>
        <Link to="/products?category=Accessories">គ្រឿងបន្លាស់</Link>
        <Link to="/products?sort=price-asc">តម្លៃពិសេស</Link>
      </div>
    </>
  );
}

export default Navbar;
