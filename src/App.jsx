import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import AppRoutes from './routes/AppRoutes';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);

  const totalCartCount = cart.reduce((a, c) => a + c.quantity, 0);

  return (
    <div className="app-container">
      {/* Navbar នឹងបង្ហាញនៅលើគ្រប់ទំព័រទាំងអស់ */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        cartCount={totalCartCount}
      />

      {/* Routes សម្រាប់ប្តូរអេក្រង់ចម្បង */}
      <AppRoutes
        searchTerm={searchTerm}
        cart={cart}
        setCart={setCart}
      />

      <footer className="footer">
        <p>© 2026 PHONE KH - E-Commerce System Planning Project</p>
      </footer>
    </div>
  );
}

export default App;