import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../services/productService';

function HomePage({ searchTerm, cart, setCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    const existing = cart.find((item) => item._id === product._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    const existing = cart.find((item) => item._id === id);
    if (existing.quantity === 1) {
      setCart(cart.filter((item) => item._id !== id));
    } else {
      setCart(
        cart.map((item) =>
          item._id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
      );
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <header className="hero-banner">
        <h1>ស្វាគមន៍មកកាន់ PHONE KH</h1>
        <p>ប្រភពទិញទូរស័ព្ទឆ្លាតវៃ និងគ្រឿងបន្លាស់គុណភាពខ្ពស់ តម្លៃសមរម្យ</p>
      </header>

      <main className="main-content">
        <section className="products-section">
          <h3>បញ្ជីផលិតផល (Products)</h3>
          {loading ? (
            <p>កំពុងទាញយកទិន្នន័យពី Server...</p>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  addToCart={addToCart}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="cart-sidebar">
          <h3>កន្ត្រកទំនិញ (Shopping Cart)</h3>
          {cart.length === 0 ? (
            <p className="empty-cart">មិនទាន់មានទំនិញក្នុងកន្ត្រកទេ</p>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item._id} className="cart-item">
                  <div>
                    <h5>{item.name}</h5>
                    <p>${item.price} x {item.quantity}</p>
                  </div>
                  <div className="cart-controls">
                    <button onClick={() => removeFromCart(item._id)}>-</button>
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
    </>
  );
}

export default HomePage;