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
          <Link className="icon-link account-link" to={user ? '/account' : '/login'} aria-label="គណនី">
            <span>♙</span><small>{user ? user.name : 'គណនី'}</small>
          </Link>
          <Link className="icon-link cart-link" to="/cart" aria-label={`កន្ត្រក ${cartCount} មុខ`}>
            <span>♧<i>{cartCount}</i></span><small>កន្ត្រក</small>
          </Link>
        </div>
      </header>
      <div className="category-nav">
        <Link to="/products">ផលិតផលទាំងអស់</Link>
        <Link to="/products?brand=Apple">Apple</Link>
        <Link to="/products?brand=Samsung">Samsung</Link>
        <Link to="/products?category=Accessories">គ្រឿងបន្លាស់</Link>
        <Link to="/products?sort=price-asc">តម្លៃពិសេស</Link>
        <Link className="admin-shortcut" to="/admin">ផ្ទាំងគ្រប់គ្រង →</Link>
      </div>
    </>
  );
}

export default Navbar;
