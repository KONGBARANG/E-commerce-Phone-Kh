import React, { useState } from 'react';
import './App.css';

// ទិន្នន័យគំរូនៃផលិតផល PHONE KH
const initialProducts = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max',
    category: 'Phone',
    price: 1199,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24 Ultra',
    category: 'Phone',
    price: 1299,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 3,
    name: 'Fast Charger 65W GaN',
    category: 'Accessory',
    price: 29,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 4,
    name: 'Premium Leather Case',
    category: 'Accessory',
    price: 19,
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&q=80&w=400',
  },
];

function App() {
  const [products] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // មុខងារបន្ថែមទំនិញចូល Cart
  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // មុខងារលុប ឬបន្ថយទំនិញពី Cart
  const removeFromCart = (id) => {
    const existing = cart.find((item) => item.id === id);
    if (existing.quantity === 1) {
      setCart(cart.filter((item) => item.id !== id));
    } else {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
      );
    }
  };

  // គណនាតម្លៃសរុប
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Filter ផលិតផលតាម Search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="logo">
          <h2>PHONE<span>KH</span></h2>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="ស្វែងរកទូរស័ព្ទ ឬគ្រឿងបន្លាស់..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="cart-status">
          🛒 កន្ត្រក: <span>{cart.reduce((a, c) => a + c.quantity, 0)}</span>
        </div>
      </nav>

      {/* Hero Banner Section */}
      <header className="hero-banner">
        <h1>ស្វាគមន៍មកកាន់ PHONE KH</h1>
        <p>ប្រភពទិញទូរស័ព្ទឆ្លាតវៃ និងគ្រឿងបន្លាស់គុណភាពខ្ពស់ តម្លៃសមរម្យ</p>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Products Grid Section */}
        <section className="products-section">
          <h3>បញ្ជីផលិតផល (Products)</h3>
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <img src={product.image} alt={product.name} />
                <h4>{product.name}</h4>
                <p className="category">{product.category}</p>
                <p className="price">${product.price}</p>
                <button onClick={() => addToCart(product)}>
                  + បន្ថែមចូលកន្ត្រក
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Shopping Cart Section */}
        <aside className="cart-sidebar">
          <h3>កន្ត្រកទំនិញ (Shopping Cart)</h3>
          {cart.length === 0 ? (
            <p className="empty-cart">មិនទាន់មានទំនិញក្នុងកន្ត្រកទេ</p>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div>
                    <h5>{item.name}</h5>
                    <p>${item.price} x {item.quantity}</p>
                  </div>
                  <div className="cart-controls">
                    <button onClick={() => removeFromCart(item.id)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => addToCart(item)}>+</button>
                  </div>
                </div>
              ))}
              <div className="cart-summary">
                <h4>សរុប: <span>${totalPrice}</span></h4>
                <button className="checkout-btn">បង់ប្រាក់ (KHQR Payment)</button>
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 PHONE KH - E-Commerce System Planning Project</p>
      </footer>
    </div>
  );
}

export default App;