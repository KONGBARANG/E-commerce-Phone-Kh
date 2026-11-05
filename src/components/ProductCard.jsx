import { Link, useNavigate } from 'react-router-dom';
import { getProductImageUrl } from '../utils/productImage';
import { TranslateTree } from '../context/LanguageProvider';

function ProductCard({ product, addToCart }) {
  const navigate = useNavigate();
  const outOfStock = Number(product.stock || 0) <= 0;

  return (
    <TranslateTree><article className="product-card">
      <Link
        className="product-image"
        to={`/products/${product._id}`}
        data-image-fit={product.imageFit || 'contain'}
        data-image-background={product.imageBackground || 'light'}
      >
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <img src={getProductImageUrl(product.image, 900)} alt={product.name} loading="lazy" />
        <span className="quick-view">មើលព័ត៌មានលម្អិត</span>
      </Link>
      <div className="product-info">
        <div className="product-meta"><span>{product.brand || product.category}</span><span>★ {product.rating || '4.8'}</span></div>
        <Link to={`/products/${product._id}`}><h3>{product.name}</h3></Link>
        {(product.sku || product.storage || product.ram) && <div className="product-specs">
          {product.sku && <span>SKU: {product.sku}</span>}
          {(product.storage || product.ram) && <span>{[product.storage, product.ram && `RAM ${product.ram}`].filter(Boolean).join(' · ')}</span>}
        </div>}
        <div className="price-row">
          <strong>${Number(product.price).toLocaleString()}</strong>
          {product.oldPrice && <del>${Number(product.oldPrice).toLocaleString()}</del>}
        </div>
        <button className="add-button" disabled={outOfStock} onClick={() => product.colors?.length ? navigate(`/products/${product._id}`) : addToCart(product)}>
          {outOfStock ? 'អស់ស្តុក' : product.colors?.length ? 'ជ្រើសរើសពណ៌' : '＋ បន្ថែមទៅកន្ត្រក'}
        </button>
      </div>
    </article></TranslateTree>
  );
}

export default ProductCard;
