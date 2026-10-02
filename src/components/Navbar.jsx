import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ searchTerm, setSearchTerm, cartCount }) {
  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>PHONE<span>KH</span></h2>
        </Link>
      </div>

      {/* Menu Links */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>
          ទំព័រដើម
        </Link>
        <Link to="/about" style={{ color: '#00f2fe', textDecoration: 'none', fontWeight: 'bold' }}>
          អំពីហាង
        </Link>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="ស្វែងរកទូរស័ព្ទ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="cart-status">
        🛒 កន្ត្រក: <span>{cartCount}</span>
      </div>
    </nav>
  );
}

export default Navbar;