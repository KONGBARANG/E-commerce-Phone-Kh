import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import CartIcon from '../components/CartIcon';
import { useShop } from '../context/useShop';
import { fetchMyContactMessages, fetchOrder, replyToMyContactMessage, submitContactMessage, validateCoupon } from '../services/api';
import { getProductImageUrl } from '../utils/productImage';
import { TranslateTree } from '../context/LanguageProvider';

const money = (amount) => `$${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PageIntro({ eyebrow, title, description }) {
  return <header className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</header>;
}

async function prepareProfileImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('សូមជ្រើសរើសរូបភាព JPEG, PNG ឬ WebP។');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('រូបភាពដើមមិនអាចធំជាង 10 MB បានទេ។');
  }
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();
    const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('មិនអាចអានរូបភាពដែលបានជ្រើសរើសទេ។');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    const encodedImage = dataUrl.split(',')[1] || '';
    const imageSize = Math.floor(encodedImage.length * 3 / 4);
    if (imageSize > 1024 * 1024) throw new Error('មិនអាចបង្រួមរូបភាពឲ្យតូចជាង 1 MB បានទេ។ សូមជ្រើសរូបផ្សេង។');
    return dataUrl;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function ProductsPage({ search = false, categoryDefault = '' }) {
  const { products, addToCart, loading } = useShop();
  const [params, setParams] = useSearchParams();
  const keyword = params.get('q') || '';
  const brand = params.get('brand') || 'all';
  const category = params.get('category') || categoryDefault || 'all';
  const sort = params.get('sort') || 'featured';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const storage = params.get('storage') || 'all';
  const brands = useMemo(
    () => [...new Set(products.map((product) => product.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [products]
  );
  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [products]
  );
  const storageOptions = useMemo(
    () => [...new Set(products.map((product) => product.storage).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [products]
  );
  const priceRangeInvalid = minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice);

  const filtered = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase();
    const matches = products.filter((product) => {
      const searchableFields = [
        product.name,
        product.sku,
        product.brand,
        product.category,
        product.description,
        product.storage,
        product.ram,
        ...(product.colors || []),
      ];
      const queryMatches = !normalizedKeyword || searchableFields.some((field) => String(field || '').toLocaleLowerCase().includes(normalizedKeyword));
      const brandMatches = brand === 'all' || product.brand === brand;
      const categoryMatches = category === 'all' || product.category === category;
      const priceMatches = !priceRangeInvalid
        && (!minPrice || Number(product.price) >= Number(minPrice))
        && (!maxPrice || Number(product.price) <= Number(maxPrice));
      const storageMatches = storage === 'all' || String(product.storage || '').toLocaleLowerCase() === storage.toLocaleLowerCase();
      return queryMatches && brandMatches && categoryMatches && priceMatches && storageMatches;
    });
    if (sort === 'price-asc') matches.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price-desc') matches.sort((a, b) => Number(b.price) - Number(a.price));
    return matches;
  }, [products, keyword, brand, category, minPrice, maxPrice, storage, sort, priceRangeInvalid]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === 'all' || !value) next.delete(key);
    else next.set(key, value);
    setParams(next);
  };
  const clearFilters = () => {
    const next = new URLSearchParams();
    if (keyword) next.set('q', keyword);
    if (category !== categoryDefault || params.has('category')) next.set('category', category);
    setParams(next);
  };
  const categoryTitle = category === 'Smartphone' ? 'ទូរស័ព្ទ' : category === 'Chargers' ? 'ឆ្នាំងសាក' : category === 'Accessories' ? 'គ្រឿងបន្លាស់' : 'ផលិតផលទាំងអស់';

  return (
    <TranslateTree><main className="content-wrap listing-page">
      <PageIntro eyebrow={search ? 'លទ្ធផលស្វែងរក' : 'រុករកផលិតផល'} title={search ? `លទ្ធផលសម្រាប់ “${keyword}”` : categoryTitle} description="ជ្រើសរើសប្រភេទផលិតផល ដើម្បីស្វែងរកទំនិញបានងាយ និងមិនលាយគ្នា។" />
      {!search && <nav className="product-category-tabs" aria-label="ប្រភេទផលិតផល">
        <Link className={category === 'Smartphone' ? 'active' : ''} to="/phones">ទូរស័ព្ទ <span>{products.filter((product) => product.category === 'Smartphone').length}</span></Link>
        <Link className={category === 'Chargers' ? 'active' : ''} to="/chargers">ឆ្នាំងសាក <span>{products.filter((product) => product.category === 'Chargers').length}</span></Link>
        <Link className={category === 'Accessories' ? 'active' : ''} to="/products?category=Accessories">គ្រឿងបន្លាស់ <span>{products.filter((product) => product.category === 'Accessories').length}</span></Link>
        <Link className={category === 'all' ? 'active' : ''} to="/products?category=all">ផលិតផលទាំងអស់ <span>{products.length}</span></Link>
      </nav>}
      <div className="listing-layout">
        <aside className="filter-panel">
          <div className="filter-title"><h3>តម្រង{category === 'Smartphone' ? 'ទូរស័ព្ទ' : category === 'Chargers' ? 'ឆ្នាំងសាក' : 'ផលិតផល'}</h3><button type="button" onClick={clearFilters}>សម្អាត</button></div>
          <div className="filter-fields">
            <label>ម៉ាក
              <select value={brand} onChange={(event) => update('brand', event.target.value)}>
                <option value="all">ម៉ាកទាំងអស់</option>{brands.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>ប្រភេទ
              <select value={category} onChange={(event) => update('category', event.target.value)}>
                <option value="all">ប្រភេទទាំងអស់</option>{categories.map((item) => <option key={item} value={item}>{item === 'Smartphone' ? 'ស្មាតហ្វូន' : item === 'Accessories' ? 'គ្រឿងបន្លាស់' : item === 'Chargers' ? 'ឆ្នាំងសាក' : item}</option>)}
              </select>
            </label>
            <div className="price-filter">
              <div className="filter-label">តម្លៃ ($)</div>
              <div className="price-inputs"><input aria-label="តម្លៃទាបបំផុត" type="number" min="0" placeholder="ពី" value={minPrice} onChange={(event) => update('minPrice', event.target.value)} /><span>—</span><input aria-label="តម្លៃខ្ពស់បំផុត" type="number" min="0" placeholder="ដល់" value={maxPrice} onChange={(event) => update('maxPrice', event.target.value)} /></div>
              {priceRangeInvalid && <small className="filter-error" role="alert">តម្លៃទាបបំផុតត្រូវតិចជាង ឬស្មើតម្លៃខ្ពស់បំផុត។</small>}
            </div>
            <label>ទំហំ / លក្ខណៈ
              <select value={storage} onChange={(event) => update('storage', event.target.value)}><option value="all">ទាំងអស់</option>{storageOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            </label>
          </div>
          <div className="filter-note">ផលិតផលទាំងអស់មានការធានា និងការត្រួតពិនិត្យគុណភាព។</div>
        </aside>
        <section className="listing-results">
          <div className="listing-toolbar"><span>បង្ហាញ <b>{filtered.length}</b> ផលិតផល</span><label>តម្រៀបតាម
            <select value={sort} onChange={(event) => update('sort', event.target.value)}><option value="featured">ពេញនិយម</option><option value="price-asc">តម្លៃ៖ ទាបទៅខ្ពស់</option><option value="price-desc">តម្លៃ៖ ខ្ពស់ទៅទាប</option></select>
          </label></div>
          {loading ? <p className="loading-note">កំពុងទាញផលិតផលពី Database...</p> : filtered.length ? <div className="products-grid">{filtered.map((product) => <ProductCard key={product._id} product={product} addToCart={addToCart} />)}</div> : <div className="empty-state"><span>⌕</span><h2>{priceRangeInvalid ? 'សូមពិនិត្យចន្លោះតម្លៃ' : 'មិនមានផលិតផលត្រូវនឹងការស្វែងរក'}</h2><p>{priceRangeInvalid ? 'កំណត់តម្លៃទាបបំផុតឱ្យតិចជាង ឬស្មើតម្លៃខ្ពស់បំផុត។' : 'សូមព្យាយាមប្ដូរពាក្យស្វែងរក ឬតម្រងរបស់អ្នក។'}</p><button className="button-primary" type="button" onClick={clearFilters}>សម្អាតតម្រង</button></div>}
        </section>
      </div>
    </main></TranslateTree>
  );
}

export function ProductDetailsPage() {
  const { id } = useParams();
  const { products, addToCart, loading } = useShop();
  const product = products.find((item) => item._id === id);
  if (loading) return <TranslateTree><main className="empty-state"><p className="loading-note">កំពុងទាញព័ត៌មានផលិតផល...</p></main></TranslateTree>;
  if (!product) return <TranslateTree><div className="empty-state"><h2>រកមិនឃើញផលិតផល</h2><Link className="button-primary" to="/products">ត្រឡប់ទៅផលិតផល</Link></div></TranslateTree>;
  return <ProductDetails key={product._id} product={product} addToCart={addToCart} />;
}

function ProductDetails({ product, addToCart }) {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || '');
  const images = [...new Set([product.image, ...(product.images || [])].filter(Boolean))].slice(0, 4);
  const stock = Number(product.stock || 0);
  const outOfStock = stock <= 0;
  const addSelectedToCart = () => outOfStock ? null : addToCart(product, quantity, selectedColor);

  return (
    <TranslateTree><main className="content-wrap details-page">
      <div className="breadcrumbs"><Link to="/">ទំព័រដើម</Link><span>/</span><Link to="/products">ផលិតផល</Link><span>/</span>{product.name}</div>
      <div className="product-details">
        <div className="detail-gallery">
          <div className="detail-image" data-image-background={product.imageBackground || 'light'}><span className="product-badge">{product.badge || 'មានក្នុងស្តុក'}</span><img src={getProductImageUrl(images[selectedImage] || product.image, 1800)} alt={`${product.name}${selectedColor ? ` - ${selectedColor}` : ''}`} /></div>
          {images.length > 1 && <div className="detail-thumbnails" aria-label="រូបភាពផលិតផល">
            {images.map((image, index) => <button className={selectedImage === index ? 'active' : ''} type="button" onClick={() => setSelectedImage(index)} aria-label={`មើលរូបភាព ${index + 1}`} aria-pressed={selectedImage === index} key={`${image}-${index}`}><img src={getProductImageUrl(image, 400)} alt="" /></button>)}
          </div>}
        </div>
        <div className="detail-copy"><span className="eyebrow">{product.brand} · {product.category}</span><h1>{product.name}</h1>{product.sku && <p className="product-sku">SKU: {product.sku}</p>}<div className="detail-rating">★★★★★ <span>{product.rating || 4.8} · មានការវាយតម្លៃពីអតិថិជន</span></div>
          <div className="detail-price">{money(product.price)} {product.oldPrice && <del>{money(product.oldPrice)}</del>}</div>
          <p className="detail-description">{product.description || 'ផលិតផលគុណភាពខ្ពស់ មានការធានាពេញលេញ និងរួចរាល់សម្រាប់ដឹកជញ្ជូន។'}</p>
          {product.colors?.length > 0 && <fieldset className="color-options"><legend>ជ្រើសរើសពណ៌ <span>{selectedColor}</span></legend><div>{product.colors.map((color) => <button className={selectedColor === color ? 'selected' : ''} type="button" onClick={() => { setSelectedColor(color); setSelectedImage(0); }} aria-pressed={selectedColor === color} key={color}>{color}</button>)}</div></fieldset>}
          <div className="spec-grid">{product.category === 'Chargers' ? <div><small>កម្លាំងសាក / លក្ខណៈ</small><b>{product.storage || '—'}</b></div> : <><div><small>អង្គផ្ទុកទិន្នន័យ</small><b>{product.storage || '—'}</b></div><div><small>RAM</small><b>{product.ram || '—'}</b></div></>}<div><small>ស្តុក</small><b>{product.stock > 0 ? `${product.stock} គ្រឿង` : 'ទាក់ទងមកយើង'}</b></div></div>
          <div className="detail-buy"><div className="quantity-picker"><button aria-label="បន្ថយចំនួន" disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><span>{quantity}</span><button aria-label="បង្កើនចំនួន" disabled={quantity >= stock} onClick={() => setQuantity(Math.min(stock, quantity + 1))}>＋</button></div><button className="button-primary" disabled={outOfStock} onClick={addSelectedToCart}>{outOfStock ? 'អស់ស្តុក' : 'បន្ថែមទៅកន្ត្រក'}</button></div>
          <button className="button-outline full-button" disabled={outOfStock} onClick={async () => { const updated = await addSelectedToCart(); if (updated) navigate('/checkout'); }}>{outOfStock ? 'អស់ស្តុក' : 'ទិញឥឡូវនេះ →'}</button>
          <div className="delivery-note">✓ ដឹកជញ្ជូនឥតគិតថ្លៃលើការកុម្ម៉ង់ $300 ឡើងទៅ<br />✓ ធានាផលិតផល 12 ខែ · អាចប្ដូរបានក្នុង 7 ថ្ងៃ</div>
        </div>
      </div>
    </main></TranslateTree>
  );
}

export function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, loading, user } = useShop();
  const [coupon, setCoupon] = useState('');
  const [couponEdited, setCouponEdited] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountMinimumSubtotal, setDiscountMinimumSubtotal] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const activeCouponCode = couponEdited ? coupon : user?.welcomeCouponCode || coupon;
  const applicableDiscount = cartTotal >= discountMinimumSubtotal ? discount : 0;
  const couponBelowMinimum = Boolean(discountCode) && cartTotal < discountMinimumSubtotal;
  const shipping = cartTotal - applicableDiscount >= 300 || cartTotal === 0 ? 0 : 3;
  const applyCoupon = async () => {
    try {
      const validCoupon = await validateCoupon(activeCouponCode, cartTotal, Boolean(user));
      const couponDiscount = validCoupon.discountAmount || Math.round(cartTotal * validCoupon.discountPercent) / 100;
      setDiscount(couponDiscount);
      setDiscountMinimumSubtotal(validCoupon.minimumSubtotal || 0);
      setDiscountCode(validCoupon.code);
      setCouponMessage(`កូដ ${validCoupon.code} ត្រូវបានអនុវត្តដោយជោគជ័យ។`);
    } catch (error) {
      setDiscount(0);
      setDiscountMinimumSubtotal(0);
      setDiscountCode('');
      setCouponMessage(error.message);
    }
  };

  return (
    <TranslateTree><main className="content-wrap cart-page"><PageIntro eyebrow="ទំនិញដែលអ្នកជ្រើសរើស" title="កន្ត្រកទំនិញ" description={`${cart.length} ប្រភេទផលិតផលក្នុងកន្ត្រករបស់អ្នក`} />
      {loading ? <p className="loading-note">កំពុងទាញកន្ត្រកពី Database...</p> : cart.length === 0 ? <div className="empty-state"><span className="empty-state-cart-icon"><CartIcon /></span><h2>កន្ត្រករបស់អ្នកនៅទទេ</h2><p>ស្វែងរកផលិតផលដែលអ្នកចូលចិត្ត ហើយបន្ថែមចូលកន្ត្រក។</p><Link className="button-primary" to="/products">ចាប់ផ្ដើមទិញទំនិញ →</Link></div> :
        <div className="cart-layout"><section className="cart-table"><div className="cart-table-head"><span>ផលិតផល</span><span>តម្លៃ</span><span>ចំនួន</span><span>សរុប</span></div>
          {cart.map((item) => <div className="cart-row" key={`${item._id}-${item.selectedColor}`}><div className="cart-product"><Link to={`/products/${item._id}`}><img src={getProductImageUrl(item.image, 320)} alt={item.name} /></Link><div><Link to={`/products/${item._id}`}><b>{item.name}</b></Link><small>{[item.brand, item.storage, item.selectedColor && `ពណ៌ ${item.selectedColor}`].filter(Boolean).join(' · ') || 'ផលិតផលមានគុណភាព'}</small><button className="remove-link" onClick={() => removeFromCart(item)}>ដកចេញ</button></div></div><span>{money(item.price)}</span><div className="quantity-picker"><button onClick={() => updateQuantity(item, item.quantity - 1)}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item, item.quantity + 1)}>＋</button></div><b>{money(item.price * item.quantity)}</b></div>)}
          <Link className="continue-link" to="/products">← បន្តការទិញទំនិញ</Link>
        </section>
        <aside className="order-summary"><h2>សរុបការកុម្ម៉ង់</h2><div className="coupon-box"><label htmlFor="coupon">លេខកូដបញ្ចុះតម្លៃ</label><div><input id="coupon" value={activeCouponCode} onChange={(event) => { setCoupon(event.target.value); setCouponEdited(true); }} placeholder="បញ្ចូលកូដ" /><button type="button" onClick={applyCoupon}>អនុវត្ត</button></div>{user?.welcomeCouponCode && <small>លេខកូដស្វាគមន៍៖ បញ្ចុះ $50 លើសរុបផលិតផលចាប់ពី $500 និងប្រើបាន ២ ដង។</small>}{couponMessage && <small className={discount && !couponBelowMinimum ? 'success-text' : 'error-text'}>{couponBelowMinimum ? `កូដនេះត្រូវការសរុបផលិតផលយ៉ាងតិច ${money(discountMinimumSubtotal)}។` : couponMessage}</small>}</div><div className="summary-line"><span>សរុបរង</span><b>{money(cartTotal)}</b></div>{applicableDiscount > 0 && <div className="summary-line discount-line"><span>បញ្ចុះតម្លៃ{discountCode ? ` (${discountCode})` : ''}</span><b>−{money(applicableDiscount)}</b></div>}<div className="summary-line"><span>ដឹកជញ្ជូន</span><b>{shipping ? money(shipping) : 'ឥតគិតថ្លៃ'}</b></div><div className="summary-total"><span>សរុប</span><b>{money(cartTotal - applicableDiscount + shipping)}</b></div><Link className="button-primary full-button" to={`/checkout${discountCode ? `?coupon=${encodeURIComponent(discountCode)}` : ''}`}>បន្តទៅការទូទាត់ →</Link><p className="secure-note">🔒 ការទូទាត់ប្រកបដោយសុវត្ថិភាព</p></aside></div>}
    </main></TranslateTree>
  );
}

export function CheckoutPage() {
  const { cart, cartTotal, user, placeOrder, loading } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState('ABA');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const couponCode = searchParams.get('coupon') || '';
  const currentUserId = user?.id || null;
  const isAuthenticated = Boolean(currentUserId);
  const [validatedCoupon, setValidatedCoupon] = useState(null);
  useEffect(() => {
    if (!couponCode) return;
    let active = true;
    validateCoupon(couponCode, cartTotal, isAuthenticated)
      .then((result) => { if (active) { setValidatedCoupon({ ...result, validatedSubtotal: cartTotal, validatedUserId: currentUserId }); setError(''); } })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [couponCode, cartTotal, isAuthenticated, currentUserId]);
  const coupon = validatedCoupon?.code === couponCode
    && validatedCoupon.validatedSubtotal === cartTotal
    && validatedCoupon.validatedUserId === currentUserId
    ? validatedCoupon
    : null;
  const discount = coupon
    ? coupon.discountAmount || Math.round(cartTotal * coupon.discountPercent) / 100
    : 0;
  const shipping = cartTotal - discount >= 300 ? 0 : 3;
  const submit = async (event) => {
    event.preventDefault();
    if (!cart.length) { setError('សូមបន្ថែមផលិតផលក្នុងកន្ត្រកជាមុន។'); return; }
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    setError('');
    try {
      const order = await placeOrder({
        customer: data.get('name'),
        email: user?.email || '',
        phone: String(data.get('phone') || '').trim(),
        address: `${data.get('address')}, ${data.get('city')}`,
        note: data.get('note'),
        payment: payment === 'COD' ? 'COD' : 'KHQR',
        paymentProvider: payment === 'COD' ? '' : payment,
        paymentReceipt,
        couponCode,
      });
      navigate(`/order-complete/${order.orderNumber}`, { state: { order } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) return <TranslateTree><main className="empty-state checkout-empty"><p className="loading-note">កំពុងទាញព័ត៌មានពី Database...</p></main></TranslateTree>;
  if (!cart.length) return <TranslateTree><main className="empty-state checkout-empty"><span className="empty-state-cart-icon"><CartIcon /></span><h2>កន្ត្រកទំនិញនៅទទេ</h2><Link className="button-primary" to="/products">ស្វែងរកផលិតផល</Link></main></TranslateTree>;

  return <TranslateTree><main className="content-wrap checkout-page"><PageIntro eyebrow="បញ្ជាក់ព័ត៌មាន" title="ទូទាត់ និងបញ្ជាទិញ" description="បំពេញព័ត៌មានដឹកជញ្ជូន និងជ្រើសរើសវិធីទូទាត់ដែលអ្នកពេញចិត្ត។" />
    <form className="checkout-layout" onSubmit={submit}><div className="checkout-form">
      {error && <div className="form-error">{error}</div>}
      <section className="form-section"><div className="form-section-heading"><span>01</span><div><h2>ព័ត៌មានដឹកជញ្ជូន</h2><p>សូមបញ្ចូលព័ត៌មានរបស់អ្នកឱ្យបានត្រឹមត្រូវ</p></div></div>
        <div className="form-grid"><label>ឈ្មោះពេញ<input required name="name" defaultValue={user?.name || ''} placeholder="ឧ. សុខា សុវណ្ណ" /></label><label>លេខទូរស័ព្ទ<input required name="phone" type="tel" defaultValue={user?.phone || ''} placeholder="+855 12 345 678" /></label><label className="span-two">អាសយដ្ឋាន<input required name="address" placeholder="ផ្ទះលេខ, ផ្លូវ, សង្កាត់/ឃុំ" /></label><label>ខេត្ត/រាជធានី<input required name="city" placeholder="ភ្នំពេញ" /></label><label>កំណត់ចំណាំ (ស្រេចចិត្ត)<input name="note" placeholder="ព័ត៌មានបន្ថែមសម្រាប់អ្នកដឹកជញ្ជូន" /></label></div>
      </section>
      <section className="form-section"><div className="form-section-heading"><span>02</span><div><h2>វិធីទូទាត់</h2><p>ជ្រើសរើសវិធីទូទាត់ដែលងាយស្រួលសម្រាប់អ្នក</p></div></div>
        <div className="payment-options">{[['ABA', '▦', 'ABA KHQR', 'ស្កេន KHQR តាមកម្មវិធី ABA'], ['ACLEDA', '▦', 'ACLEDA KHQR', 'ស្កេន KHQR តាមកម្មវិធី ACLEDA'], ['COD', '៛', 'បង់ប្រាក់ពេលទទួល', 'ទូទាត់ជាសាច់ប្រាក់ជាមួយអ្នកដឹកជញ្ជូន']].map(([value, icon, title, desc]) => <label className={`payment-option ${payment === value ? 'selected' : ''}`} key={value}><input type="radio" name="payment" value={value} checked={payment === value} onChange={() => { setPayment(value); setPaymentReceipt(''); setReceiptFileName(''); setError(''); }} /><span className="payment-icon">{icon}</span><span><b>{title}</b><small>{desc}</small></span><i>{payment === value ? '●' : '○'}</i></label>)}</div>
        {payment !== 'COD' && <div className="khqr-payment-details"><div className="khqr-code-card"><img src={payment === 'ABA' ? '/payment-aba.png' : '/payment-acleda.png'} alt={`${payment} KHQR របស់ KONG BARANG`} /><div><span className="eyebrow">{payment === 'ABA' ? 'ABA PAY' : 'ACLEDA BANK'}</span><h3>KONG BARANG</h3><p>សូមបញ្ចូលចំនួនប្រាក់ខាងក្រោមក្នុងកម្មវិធីធនាគារ មុនស្កេន QR។</p><strong>{money(cartTotal - discount + shipping)}</strong><small>QR នេះជា static KHQR ហើយមិនបាន encode ចំនួនប្រាក់ជាមុនទេ។ សូមផ្ទៀងផ្ទាត់ឈ្មោះទទួលប្រាក់ មុនបង់។</small></div></div><label className="receipt-upload">បង្កាន់ដៃបង់ប្រាក់<input type="file" accept="image/png,image/jpeg,image/webp" required={!paymentReceipt} onChange={(event) => { const file = event.target.files?.[0]; setPaymentReceipt(''); setReceiptFileName(''); if (!file) return; if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('សូមជ្រើសរើសរូបភាព PNG, JPG ឬ WEBP។'); event.target.value = ''; return; } if (file.size > 4 * 1024 * 1024) { setError('ទំហំរូបភាពបង្កាន់ដៃមិនអាចលើស 4 MB បានទេ។'); event.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === 'string') { setPaymentReceipt(reader.result); setReceiptFileName(file.name); setError(''); } }; reader.onerror = () => setError('មិនអាចអានរូបភាពបង្កាន់ដៃបានទេ។ សូមព្យាយាមម្ដងទៀត។'); reader.readAsDataURL(file); }} /><small>ផ្ទុករូបភាពភស្តុតាងការទូទាត់ (PNG/JPG/WEBP, អតិបរមា 4 MB)។</small></label>{paymentReceipt && <div className="receipt-upload-preview"><img src={paymentReceipt} alt="មើលរូបបង្កាន់ដៃដែលបានជ្រើសរើស" /><span>បានជ្រើសរើស៖ {receiptFileName}</span></div>}</div>}
      </section>
      {(payment === 'COD' || paymentReceipt) ? <button className="button-primary full-button place-order" type="submit" disabled={submitting}>{submitting ? 'កំពុងរក្សាទុក...' : 'បញ្ជាក់ការកុម្ម៉ង់ →'}</button> : <p className="receipt-required-note">សូមបង់ប្រាក់ និងផ្ទុករូបបង្កាន់ដៃ ដើម្បីបង្ហាញប៊ូតុងបញ្ជាក់ការកុម្ម៉ង់។</p>}<p className="secure-note">🔒 បង្កាន់ដៃ KHQR នឹងរង់ចាំ Admin ផ្ទៀងផ្ទាត់ មិនមែនការបញ្ជាក់ទូទាត់ស្វ័យប្រវត្តិទេ។</p>
    </div><aside className="order-summary checkout-summary"><h2>ការកុម្ម៉ង់របស់អ្នក</h2>{cart.map((item) => <div className="checkout-item" key={`${item._id}-${item.selectedColor}`}><img src={getProductImageUrl(item.image, 320)} alt={item.name} /><div><b>{item.name}</b><small>{item.selectedColor ? `ពណ៌ ${item.selectedColor} · ` : ''}ចំនួន ${item.quantity}</small></div><b>{money(item.price * item.quantity)}</b></div>)}<div className="summary-line"><span>សរុបរង</span><b>{money(cartTotal)}</b></div>{coupon && <div className="summary-line discount-line"><span>កូដ {coupon.code} ({coupon.discountAmount ? money(coupon.discountAmount) : `${coupon.discountPercent}%`})</span><b>−{money(discount)}</b></div>}<div className="summary-line"><span>ដឹកជញ្ជូន</span><b>{shipping ? money(shipping) : 'ឥតគិតថ្លៃ'}</b></div><div className="summary-total"><span>សរុបត្រូវបង់</span><b>{money(cartTotal - discount + shipping)}</b></div><p className="secure-note">បង់ប្រាក់មានសុវត្ថិភាព · ទំនិញមានការធានា</p></aside></form>
  </main></TranslateTree>;
}

export function OrderCompletePage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [error, setError] = useState('');
  const [creatingPdf, setCreatingPdf] = useState(false);
  useEffect(() => {
    if (order) return;
    fetchOrder(id).then(setOrder).catch((requestError) => setError(requestError.message));
  }, [id, order]);
  const downloadReceiptPdf = async () => {
    const receipt = document.querySelector('.customer-print-receipt');
    if (!(receipt instanceof HTMLElement)) {
      setError('មិនអាចរកវិក្កយបត្រដើម្បីបង្កើត PDF បានទេ។');
      return;
    }
    setCreatingPdf(true);
    setError('');
    receipt.classList.add('pdf-exporting');
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = await html2canvas(receipt, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      if (!canvas.width || !canvas.height) throw new Error('វិក្កយបត្រទទេ មិនអាចបង្កើត PDF បានទេ។');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const margin = 12;
      const contentWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const contentHeight = pdf.internal.pageSize.getHeight() - margin * 2;
      const pageHeightPixels = Math.floor(canvas.width * contentHeight / contentWidth);
      let offset = 0;
      while (offset < canvas.height) {
        const sliceHeight = Math.min(pageHeightPixels, canvas.height - offset);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const context = pageCanvas.getContext('2d');
        if (!context) throw new Error('កម្មវិធីមិនអាចបង្កើតរូបភាព PDF បានទេ។');
        context.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        if (offset > 0) pdf.addPage();
        const sliceHeightMm = sliceHeight * contentWidth / canvas.width;
        pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, contentWidth, sliceHeightMm, undefined, 'FAST');
        offset += sliceHeight;
      }
      pdf.save(`${order.orderNumber}-receipt.pdf`);
    } catch (requestError) {
      console.error('Unable to generate customer receipt PDF:', requestError);
      setError('មិនអាចទាញយក PDF បានទេ។ សូមសាកល្បងម្ដងទៀត។');
    } finally {
      receipt.classList.remove('pdf-exporting');
      setCreatingPdf(false);
    }
  };
  return <TranslateTree><main className="empty-state order-complete"><span className="complete-check">✓</span><span className="eyebrow">ការកុម្ម៉ង់ជោគជ័យ</span><h1>សូមអរគុណសម្រាប់ការកុម្ម៉ង់!</h1><p>យើងបានទទួលការកុម្ម៉ង់របស់អ្នក ហើយកំពុងរៀបចំទំនិញ។</p>{order && <article className="customer-print-receipt"><header className="customer-receipt-header"><div><strong>PHONE KH</strong><span>បង្កាន់ដៃការកុម្ម៉ង់</span></div><div><h2>វិក្កយបត្រ</h2><b>{order.orderNumber}</b></div></header><div className="customer-receipt-meta"><div><span>អតិថិជន</span><b>{order.customer}</b></div><div><span>ទូរស័ព្ទ</span><b>{order.phone}</b></div><div><span>កាលបរិច្ឆេទ</span><b>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</b></div><div><span>វិធីទូទាត់</span><b>{order.payment === 'COD' ? 'បង់ប្រាក់ពេលទទួល' : `${order.paymentProvider || 'KHQR'} · KHQR`} · {order.paymentStatus === 'Paid' ? 'បានបង់ប្រាក់' : 'មិនទាន់បង់'}</b></div><div className="customer-receipt-address"><span>អាសយដ្ឋានដឹកជញ្ជូន</span><b>{order.address}</b></div></div><div className="customer-receipt-items"><div className="customer-receipt-item-head"><span>ផលិតផល</span><span>សរុប</span></div>{order.items?.map((item, index) => <div className="customer-receipt-item" key={`${item.product || item.name}-${index}`}><span>{item.name}{[item.storage, item.color].filter(Boolean).length ? ` · ${[item.storage, item.color].filter(Boolean).join(' · ')}` : ''} × ${item.quantity}</span><b>{money(item.price * item.quantity)}</b></div>)}</div><div className="customer-receipt-totals"><div><span>សរុបរង</span><b>{money(order.subtotal)}</b></div>{order.discount > 0 && <div><span>បញ្ចុះតម្លៃ{order.discountCode ? ` (${order.discountCode})` : ''}</span><b>−{money(order.discount)}</b></div>}<div><span>ដឹកជញ្ជូន</span><b>{order.shipping ? money(order.shipping) : 'ឥតគិតថ្លៃ'}</b></div><div className="customer-receipt-grand-total"><span>សរុបត្រូវបង់</span><b>{money(order.total)}</b></div></div><footer>សូមអរគុណដែលបានគាំទ្រ PHONE KH</footer></article>}{error && <p className="error-text">{error}</p>}{order && <><button className="button-primary customer-print-button" type="button" onClick={downloadReceiptPdf} disabled={creatingPdf}>{creatingPdf ? 'កំពុងបង្កើត PDF...' : '⬇ ទាញយកវិក្កយបត្រ PDF'}</button><small className="customer-pdf-help">PDF នឹងទាញយកទៅក្នុងឧបករណ៍របស់អ្នកដោយផ្ទាល់។</small></>}<Link className="button-primary" to={order?.user ? '/account' : '/products'}>{order?.user ? 'មើលស្ថានភាពការកុម្ម៉ង់' : 'បន្តទិញទំនិញ'}</Link></main></TranslateTree>;
}

export function LoginPage({ register = false }) {
  const { signIn, signUp } = useShop();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    setError('');
    try {
      const credentials = {
        email: data.get('email'),
        password: data.get('password'),
      };
      if (register) {
        await signUp({
          ...credentials,
          name: data.get('name'),
          phone: data.get('phone') || '',
        });
      } else {
        await signIn(credentials);
      }
      navigate(params.get('next') || '/account', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };
  return <TranslateTree><main className="auth-page"><div className="auth-art"><span className="eyebrow">PHONE KH MEMBERS</span><h2>ពិភពបច្ចេកវិទ្យា<br />ចាប់ផ្ដើមពីទីនេះ</h2><p>ចូលរួមជាមួយ PHONE KH និងទទួលបានបទពិសោធន៍ទិញទំនិញកាន់តែងាយស្រួល។</p><div className="auth-art-mark">P<span>K</span></div></div><form className="auth-form" onSubmit={submit}><span className="eyebrow">{register ? 'បង្កើតគណនីថ្មី' : 'សូមស្វាគមន៍ត្រឡប់មកវិញ'}</span><h1>{register ? 'ចូលរួមជាមួយយើង' : 'ចូលគណនីរបស់អ្នក'}</h1><p>បញ្ចូលព័ត៌មានរបស់អ្នកដើម្បីបន្ត</p>{error && <div className="form-error">{error}</div>}
    {register && <label>ឈ្មោះពេញ<input required name="name" placeholder="ឈ្មោះរបស់អ្នក" /></label>}<label>អ៊ីមែល<input required name="email" type="email" placeholder="you@example.com" /></label>{register && <label>លេខទូរស័ព្ទ<input name="phone" type="tel" placeholder="+855 12 345 678" /></label>}<label>ពាក្យសម្ងាត់<input required name="password" type="password" minLength="6" placeholder="យ៉ាងតិច 6 តួអក្សរ" /></label><button className="button-primary full-button" type="submit" disabled={submitting}>{submitting ? 'កំពុងរក្សាទុក...' : register ? 'បង្កើតគណនី →' : 'ចូលគណនី →'}</button><div className="auth-switch">{register ? 'មានគណនីរួចហើយ?' : 'មិនទាន់មានគណនី?'} <Link to={register ? '/login' : '/register'}>{register ? 'ចូលគណនី' : 'ចុះឈ្មោះឥឡូវនេះ'}</Link></div><small className="demo-notice">គណនី និងពាក្យសម្ងាត់ត្រូវបានផ្ទៀងផ្ទាត់ និងរក្សាទុកដោយ backend។</small></form></main></TranslateTree>;
}

export function AccountPage() {
  const { user, signOut, orders, loading, saveUserProfile, cancelOrder, confirmRefundReceived, confirmOrderReceived } = useShop();
  const navigate = useNavigate();
  const [profileImageDraft, setProfileImageDraft] = useState(null);
  const profileImage = profileImageDraft && profileImageDraft.userId === user?.id
    ? profileImageDraft.value
    : user?.profileImage || '';
  const [profileError, setProfileError] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [cancellationOrder, setCancellationOrder] = useState(null);
  const [refundQrDraft, setRefundQrDraft] = useState('');
  const [cancellationError, setCancellationError] = useState('');
  const [cancellationNotice, setCancellationNotice] = useState('');
  const [cancellationSaving, setCancellationSaving] = useState(false);
  const [refundConfirmationOrder, setRefundConfirmationOrder] = useState('');
  const [receiptConfirmationOrder, setReceiptConfirmationOrder] = useState('');
  const [contactMessages, setContactMessages] = useState([]);
  const [contactMessagesError, setContactMessagesError] = useState('');
  const [contactReplyDrafts, setContactReplyDrafts] = useState({});
  const [replyingToContactMessage, setReplyingToContactMessage] = useState('');
  const profileImageInput = useRef(null);
  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    const loadContactMessages = async () => {
      try {
        const messages = await fetchMyContactMessages();
        if (active) {
          setContactMessages(messages);
          setContactMessagesError('');
        }
      } catch (requestError) {
        if (active) setContactMessagesError(requestError.message);
      }
    };
    loadContactMessages();
    const interval = window.setInterval(loadContactMessages, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user]);
  const sendContactReply = async (event, messageId) => {
    event.preventDefault();
    const body = String(contactReplyDrafts[messageId] || '').trim();
    if (!body) return;
    setReplyingToContactMessage(messageId);
    setContactMessagesError('');
    try {
      const updated = await replyToMyContactMessage(messageId, body);
      setContactMessages((current) => current.map((message) => message._id === updated._id ? updated : message));
      setContactReplyDrafts((current) => ({ ...current, [messageId]: '' }));
    } catch (requestError) {
      setContactMessagesError(requestError.message);
    } finally {
      setReplyingToContactMessage('');
    }
  };
  if (loading) return <TranslateTree><main className="empty-state"><p className="loading-note">កំពុងទាញព័ត៌មានគណនីពី Database...</p></main></TranslateTree>;
  if (!user) return <TranslateTree><main className="empty-state"><span className="account-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg></span><h2>សូមចូលគណនីរបស់អ្នក</h2><p>ចូលគណនីដើម្បីមើលព័ត៌មាន និងប្រវត្តិការកុម្ម៉ង់។</p><Link className="button-primary" to="/login">ចូលគណនី →</Link></main></TranslateTree>;
  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfileError('');
    setProfileNotice('');
    try {
      setProfileImageDraft({ userId: user.id, value: await prepareProfileImage(file) });
    } catch (requestError) {
      setProfileError(requestError.message || 'មិនអាចដំណើរការរូបភាពបានទេ។');
      event.target.value = '';
    }
  };
  const saveProfileImage = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileNotice('');
    try {
      await saveUserProfile({ profileImage });
      setProfileImageDraft(null);
      setProfileNotice('រូបភាពប្រវត្តិរូបត្រូវបានរក្សាទុក។');
    } catch (requestError) {
      setProfileError(requestError.message);
    } finally {
      setProfileSaving(false);
    }
  };
  const handleRefundQrChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) {
      setCancellationError('សូមជ្រើសរើសរូបភាព QR ប្រភេទ JPEG, PNG ឬ WebP ដែលមានទំហំមិនលើស 4 MB។');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setCancellationError('មិនអាចអានរូបភាព QR បានទេ។');
        return;
      }
      setRefundQrDraft(reader.result);
      setCancellationError('');
    };
    reader.onerror = () => setCancellationError('មិនអាចអានរូបភាព QR បានទេ។');
    reader.readAsDataURL(file);
  };
  const submitOrderCancellation = async (event) => {
    event.preventDefault();
    if (!cancellationOrder) return;
    if (cancellationOrder.payment === 'KHQR' && !refundQrDraft) {
      setCancellationError('សូមដាក់រូបភាព QR គណនីដែលត្រូវទទួលប្រាក់ត្រឡប់។');
      return;
    }
    setCancellationSaving(true);
    setCancellationError('');
    try {
      await cancelOrder(cancellationOrder.orderNumber, refundQrDraft);
      setCancellationNotice(`ការកុម្ម៉ង់ ${cancellationOrder.orderNumber} ត្រូវបានបោះបង់${cancellationOrder.payment === 'KHQR' ? '។ សំណើសងប្រាក់ត្រូវបានផ្ញើទៅ Admin' : ''}។`);
      setCancellationOrder(null);
      setRefundQrDraft('');
    } catch (requestError) {
      setCancellationError(requestError.message);
    } finally {
      setCancellationSaving(false);
    }
  };
  const closeCancellation = () => {
    if (cancellationSaving) return;
    setCancellationOrder(null);
    setRefundQrDraft('');
    setCancellationError('');
  };
  const acknowledgeRefund = async (orderNumber) => {
    setRefundConfirmationOrder(orderNumber);
    setCancellationError('');
    try {
      await confirmRefundReceived(orderNumber);
      setCancellationNotice(`បានបញ្ជាក់ថាអ្នកបានទទួលប្រាក់សងវិញសម្រាប់ការកុម្ម៉ង់ ${orderNumber}។`);
    } catch (requestError) {
      setCancellationError(requestError.message);
    } finally {
      setRefundConfirmationOrder('');
    }
  };
  const acknowledgeOrderReceived = async (orderNumber) => {
    setReceiptConfirmationOrder(orderNumber);
    setCancellationError('');
    try {
      await confirmOrderReceived(orderNumber);
      setCancellationNotice(`បានបញ្ជាក់ថាអ្នកបានទទួលទំនិញពីការកុម្ម៉ង់ ${orderNumber}។`);
    } catch (requestError) {
      setCancellationError(requestError.message);
    } finally {
      setReceiptConfirmationOrder('');
    }
  };
  return (
    <TranslateTree><main className="content-wrap account-page">
      <PageIntro eyebrow="គណនីរបស់អ្នក" title={`សួស្តី ${user.name}`} description="គ្រប់គ្រងព័ត៌មានគណនី និងតាមដានការកុម្ម៉ង់របស់អ្នក។" />
      <div className="account-layout">
        <aside className="account-card">
          <form className="profile-image-form" onSubmit={saveProfileImage}>
            <button className="profile-avatar-picker" type="button" onClick={() => profileImageInput.current?.click()} aria-label={profileImage ? 'ប្តូររូបភាពប្រវត្តិរូប' : 'ជ្រើសរើសរូបភាពប្រវត្តិរូប'} title="ចុចដើម្បីជ្រើសរើសរូបភាព">
              {profileImage ? <img src={profileImage} alt="" /> : <span>{String(user.name).charAt(0).toUpperCase()}</span>}
              <span className="profile-avatar-overlay"><span aria-hidden="true">📷</span><small>{profileImage ? 'ប្តូររូប' : 'ដាក់រូប'}</small></span>
            </button>
            <input ref={profileImageInput} className="profile-image-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfileImageChange} tabIndex="-1" aria-label="ជ្រើសរើសរូបភាពប្រវត្តិរូប" />
            <small className="profile-image-hint">ចុចលើរូបក្នុងរង្វង់ដើម្បីជ្រើសរើសរូបថ្មី</small>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            {user.welcomeCouponCode && <div className="welcome-coupon-card"><small>លេខកូដស្វាគមន៍</small><strong>{user.welcomeCouponCode}</strong><p>បញ្ចុះ $50 លើសរុបផលិតផលចាប់ពី $500 និងប្រើបាន ២ ដង។</p></div>}
            {profileError && <p className="form-error" role="alert">{profileError}</p>}
            {profileNotice && <p className="success-box" role="status">{profileNotice}</p>}
            <button className="button-primary full-button" type="submit" disabled={profileSaving}>{profileSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុករូបភាព'}</button>
            {profileImage && <button className="profile-image-remove" type="button" disabled={profileSaving} onClick={() => { setProfileImageDraft({ userId: user.id, value: '' }); setProfileNotice(''); }}>ដករូបភាពចេញ</button>}
          </form>
          <div className="account-menu">
            <span className="active"><svg className="account-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>ទិដ្ឋភាពគណនី</span>
            <a href="#orders">▤ ប្រវត្តិការកុម្ម៉ង់</a>
            {user.role === 'admin' && <Link className="account-admin-link" to="/admin"><svg className="account-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="5" rx="1" /><rect x="13" y="10" width="8" height="11" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /></svg>ផ្ទាំងគ្រប់គ្រង Admin<span aria-hidden="true">→</span></Link>}
            <button onClick={async () => { await signOut(); navigate('/'); }}>↪ ចាកចេញ</button>
          </div>
        </aside>
        <section className="account-orders" id="orders">
          <div className="section-heading"><div><h2>ការកុម្ម៉ង់របស់ខ្ញុំ</h2><p>តាមដាន និងមើលប្រវត្តិការទិញរបស់អ្នក</p></div><Link className="text-link" to="/products">ទិញទំនិញ →</Link></div>
          {cancellationNotice && <p className="success-box" role="status">{cancellationNotice}</p>}
          {cancellationError && !cancellationOrder && <p className="form-error" role="alert">{cancellationError}</p>}
          {orders.length ? orders.map((order) => <div className="account-order" key={order._id}><div><small>លេខកុម្ម៉ង់</small><b>{order.orderNumber}</b></div><div><small>កាលបរិច្ឆេទ</small><b>{new Date(order.createdAt).toLocaleDateString()}</b></div><div><small>សរុប</small><b>{money(order.total)}</b></div><span className="status-pill">{order.status === 'Pending' ? 'រង់ចាំ' : order.status === 'Processing' ? 'កំពុងរៀបចំ' : order.status === 'Completed' ? 'ដល់ទីតាំង · រង់ចាំទទួល' : order.status === 'Received' ? 'បានទទួលទំនិញ' : 'បានបោះបង់'}</span>{order.status === 'Completed' && <button className="button-primary refund-received-button" type="button" disabled={receiptConfirmationOrder === order.orderNumber} onClick={() => acknowledgeOrderReceived(order.orderNumber)}>{receiptConfirmationOrder === order.orderNumber ? 'កំពុងបញ្ជាក់...' : 'បញ្ជាក់ថាបានទទួលទំនិញ'}</button>}{order.refundStatus === 'Requested' && <span className="refund-status">កំពុងរង់ចាំ Admin បាញ់ប្រាក់</span>}{['Sent', 'Completed'].includes(order.refundStatus) && <><span className="refund-status">Admin បានបាញ់ប្រាក់ · សូមពិនិត្យគណនី</span><button className="button-primary refund-received-button" type="button" disabled={refundConfirmationOrder === order.orderNumber} onClick={() => acknowledgeRefund(order.orderNumber)}>{refundConfirmationOrder === order.orderNumber ? 'កំពុងបញ្ជាក់...' : 'បញ្ជាក់ថាបានទទួលប្រាក់'}</button></>}{order.refundStatus === 'Received' && <span className="refund-status complete">បានទទួលប្រាក់សងវិញ</span>}{['Pending', 'Processing'].includes(order.status) && <button className="table-action account-cancel-button" type="button" onClick={() => { setCancellationOrder(order); setCancellationError(''); setCancellationNotice(''); }}>បោះបង់ការកុម្ម៉ង់</button>}</div>) : null}
          {!orders.length && <p className="account-orders-empty">មិនទាន់មានការកុម្ម៉ង់ទេ។</p>}
          <div className="account-message-threads">
            <div className="section-heading"><div><h2>សាររបស់ខ្ញុំ</h2><p>សំណើដែលអ្នកបានផ្ញើ និងចម្លើយពី PHONE KH</p></div><Link className="text-link" to="/contact">ផ្ញើសារថ្មី →</Link></div>
            {contactMessagesError && <p className="form-error" role="alert">{contactMessagesError}</p>}
            {contactMessages.length ? contactMessages.map((message) => <article className="account-message-thread" key={message._id}><div className="account-message-thread-heading"><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>{message.status === 'Replied' && <span>បានឆ្លើយតបពី Admin</span>}</div><div className="account-message-bubble customer"><b>សាររបស់អ្នក</b><p>{message.message}</p></div>{message.replies?.map((reply, index) => <div className={`account-message-bubble ${reply.authorRole === 'admin' ? 'admin' : 'customer'}`} key={`${message._id}-${reply.createdAt || index}`}><b>{reply.authorRole === 'admin' ? 'ចម្លើយពី PHONE KH' : 'សាររបស់អ្នក'}</b><time dateTime={reply.createdAt}>{new Date(reply.createdAt).toLocaleString()}</time><p>{reply.body}</p></div>)}<form className="account-message-reply" onSubmit={(event) => sendContactReply(event, message._id)}><textarea value={contactReplyDrafts[message._id] || ''} maxLength="5000" rows="2" required placeholder="សរសេរសារឆ្លើយតប..." onChange={(event) => setContactReplyDrafts((current) => ({ ...current, [message._id]: event.target.value }))} /><button className="button-primary" type="submit" disabled={replyingToContactMessage === message._id || !contactReplyDrafts[message._id]?.trim()}>{replyingToContactMessage === message._id ? 'កំពុងផ្ញើ...' : 'ផ្ញើចម្លើយ'}</button></form></article>) : !contactMessagesError && <p className="account-orders-empty">មិនទាន់មានសារទេ។</p>}
          </div>
        </section>
      </div>
      {cancellationOrder && <div className="receipt-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) closeCancellation(); }}><form className="receipt-modal cancellation-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-order-title" onSubmit={submitOrderCancellation}><header><div><h2 id="cancel-order-title">បោះបង់ការកុម្ម៉ង់ · {cancellationOrder.orderNumber}</h2><p>{cancellationOrder.payment === 'KHQR' ? 'សូមបញ្ចូល QR គណនី ABA/ACLEDA របស់អ្នក ដើម្បីឲ្យ Admin ផ្ទេរប្រាក់ត្រឡប់។' : 'តើអ្នកប្រាកដថាចង់បោះបង់ការកុម្ម៉ង់នេះទេ?'}</p></div><button type="button" onClick={closeCancellation} aria-label="បិទផ្ទាំង" disabled={cancellationSaving}>×</button></header>{cancellationOrder.payment === 'KHQR' && <><label className="refund-qr-upload">រូបភាព QR សម្រាប់ទទួលប្រាក់ត្រឡប់<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleRefundQrChange} required={!refundQrDraft} /></label>{refundQrDraft && <img className="refund-qr-preview" src={refundQrDraft} alt="QR សម្រាប់ទទួលប្រាក់ត្រឡប់" />}</>}{cancellationError && <p className="form-error" role="alert">{cancellationError}</p>}<footer><button className="table-action" type="button" onClick={closeCancellation} disabled={cancellationSaving}>ត្រឡប់</button><button className="button-primary cancel-submit-button" type="submit" disabled={cancellationSaving}>{cancellationSaving ? 'កំពុងដំណើរការ...' : 'បញ្ជាក់ការបោះបង់'}</button></footer></form></div>}
    </main></TranslateTree>
  );
}

export function ContactPage() {
  const { user } = useShop();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const sendMessage = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setError('');
    setSent(false);
    const form = new FormData(formElement);
    try {
      await submitContactMessage({ message: String(form.get('message') || '').trim() });
      formElement.reset();
      setSent(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };
  return <TranslateTree><main className="content-wrap contact-page"><PageIntro eyebrow="យើងនៅទីនេះដើម្បីជួយអ្នក" title="ទាក់ទងមកយើង" description="មានសំណួរ ឬត្រូវការជំនួយ? ផ្ញើសារមកកាន់ក្រុមការងាររបស់យើង។" /><div className="contact-layout"><div className="contact-info"><h2>យើងរីករាយក្នុងការជួយអ្នក</h2><p>ទាក់ទងមកក្រុមការងារ PHONE KH តាមរយៈវិធីណាមួយខាងក្រោម។</p><div><b>⌖ &nbsp; អាសយដ្ឋាន</b><span>រាជធានីភ្នំពេញ, កម្ពុជា</span></div><div><b>☎ &nbsp; ទូរស័ព្ទ</b><span>+855 12 345 678</span></div><div><b>✉ &nbsp; អ៊ីមែល</b><span>hello@phonekh.com</span></div><div><b>◷ &nbsp; ម៉ោងធ្វើការ</b><span>រៀងរាល់ថ្ងៃ 8:00 ព្រឹក – 8:00 យប់</span></div></div>{user ? <form className="contact-form" onSubmit={sendMessage}><h2>ផ្ញើសារមកយើង</h2><p className="contact-reply-hint">យើងនឹងឆ្លើយតបនៅក្នុងទំព័រ <Link to="/account">គណនីរបស់អ្នក</Link>។</p>{sent && <div className="success-box" role="status">សាររបស់អ្នកត្រូវបានផ្ញើទៅកាន់ Admin ដោយជោគជ័យ។ យើងនឹងទាក់ទងទៅអ្នកវិញឆាប់ៗនេះ។</div>}{error && <div className="form-error" role="alert">{error}</div>}<label>ឈ្មោះ<input value={user.name} readOnly /></label><label>អ៊ីមែល<input value={user.email} readOnly /></label><label>សាររបស់អ្នក<textarea name="message" required maxLength="5000" rows="5" placeholder="តើអ្នកត្រូវការជំនួយអ្វី?" /></label><button className="button-primary" type="submit" disabled={submitting}>{submitting ? 'កំពុងផ្ញើ...' : 'ផ្ញើសារ →'}</button></form> : <section className="contact-form contact-login-prompt"><h2>ចូលគណនីដើម្បីផ្ញើសារ</h2><p>សូមចូលគណនី ឬបង្កើតគណនី ដើម្បីឲ្យយើងអាចឆ្លើយតបក្នុងទំព័រគណនីរបស់អ្នក។</p><div><Link className="button-primary" to="/login">ចូលគណនី →</Link><Link className="text-link" to="/register">បង្កើតគណនីថ្មី</Link></div></section>}</div></main></TranslateTree>;
}
