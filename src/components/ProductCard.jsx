import { Link } from 'react-router-dom';

function ProductCard({ product, addToCart }) {
  return (
    <article className="product-card">
      <Link className="product-image" to={`/products/${product._id}`}>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <img src={product.image} alt={product.name} loading="lazy" />
        <span className="quick-view">មើលព័ត៌មានលម្អិត</span>
      </Link>
      <div className="product-info">
        <div className="product-meta"><span>{product.brand || product.category}</span><span>★ {product.rating || '4.8'}</span></div>
        <Link to={`/products/${product._id}`}><h3>{product.name}</h3></Link>
        <div className="price-row">
          <strong>${Number(product.price).toLocaleString()}</strong>
          {product.oldPrice && <del>${Number(product.oldPrice).toLocaleString()}</del>}
        </div>
        <button className="add-button" onClick={() => addToCart(product)}>＋ បន្ថែមទៅកន្ត្រក</button>
      </div>
    </article>
  );
}

export default ProductCard;
