import React from 'react';

function ProductCard({ product, addToCart }) {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h4>{product.name}</h4>
      <p className="category">{product.category}</p>
      <p className="price">${product.price}</p>
      <button onClick={() => addToCart(product)}>
        + បន្ថែមចូលកន្ត្រក
      </button>
    </div>
  );
}

export default ProductCard;