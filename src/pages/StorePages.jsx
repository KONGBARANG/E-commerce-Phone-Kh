import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/useShop';
import { fetchOrder, validateCoupon } from '../services/api';

const money = (amount) => `$${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PageIntro({ eyebrow, title, description }) {
  return <header className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</header>;
}

export function ProductsPage({ search = false }) {
  const { products, addToCart, loading } = useShop();
  const [params, setParams] = useSearchParams();
  const keyword = params.get('q') || '';
  const brand = params.get('brand') || 'all';
  const category = params.get('category') || 'all';
  const sort = params.get('sort') || 'featured';
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [storage, setStorage] = useState('all');

  const filtered = useMemo(() => {
    const matches = products.filter((product) => {
      const queryMatches = !keyword || `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase().includes(keyword.toLowerCase());
      const brandMatches = brand === 'all' || product.brand === brand;
      const categoryMatches = category === 'all' || product.category === category;
      const priceMatches = (!minPrice || Number(product.price) >= Number(minPrice)) && (!maxPrice || Number(product.price) <= Number(maxPrice));
      const storageMatches = storage === 'all' || (product.storage || '').includes(storage);
      return queryMatches && brandMatches && categoryMatches && priceMatches && storageMatches;
    });
    if (sort === 'price-asc') matches.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price-desc') matches.sort((a, b) => Number(b.price) - Number(a.price));
    return matches;
  }, [products, keyword, brand, category, minPrice, maxPrice, storage, sort]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === 'all' || !value) next.delete(key);
    else next.set(key, value);
    setParams(next);
  };

  return (
    <main className="content-wrap listing-page">
      <PageIntro eyebrow={search ? 'លទ្ធផលស្វែងរក' : 'រុករកផលិតផល'} title={search ? `លទ្ធផលសម្រាប់ “${keyword}”` : 'ផលិតផលទាំងអស់'} description="ស្វែងរកទូរស័ព្ទ និងគ្រឿងបន្លាស់ដែលស័ក្តិសមនឹងអ្នក។" />
      <div className="listing-layout">
        <aside className="filter-panel">
          <div className="filter-title"><h3>តម្រងផលិតផល</h3><button onClick={() => { setParams({}); setMinPrice(''); setMaxPrice(''); setStorage('all'); }}>សម្អាត</button></div>
          <label>ម៉ាក
            <select value={brand} onChange={(event) => update('brand', event.target.value)}>
              <option value="all">ម៉ាកទាំងអស់</option><option>Apple</option><option>Samsung</option><option>Anker</option>
            </select>
          </label>
          <label>ប្រភេទ
            <select value={category} onChange={(event) => update('category', event.target.value)}>
              <option value="all">ប្រភេទទាំងអស់</option><option value="Smartphone">ស្មាតហ្វូន</option><option value="Accessories">គ្រឿងបន្លាស់</option>
            </select>
          </label>
          <div className="filter-label">តម្លៃ ($)</div>
          <div className="price-inputs"><input aria-label="តម្លៃទាបបំផុត" type="number" min="0" placeholder="ពី" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} /><span>—</span><input aria-label="តម្លៃខ្ពស់បំផុត" type="number" min="0" placeholder="ដល់" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} /></div>
          <label>អង្គផ្ទុកទិន្នន័យ
            <select value={storage} onChange={(event) => setStorage(event.target.value)}><option value="all">គ្រប់ទំហំ</option><option>128GB</option><option>256GB</option></select>
          </label>
          <div className="filter-note">ផលិតផលទាំងអស់មានការធានា និងការត្រួតពិនិត្យគុណភាព។</div>
        </aside>
        <section className="listing-results">
          <div className="listing-toolbar"><span>បង្ហាញ <b>{filtered.length}</b> ផលិតផល</span><label>តម្រៀបតាម
            <select value={sort} onChange={(event) => update('sort', event.target.value)}><option value="featured">ពេញនិយម</option><option value="price-asc">តម្លៃ៖ ទាបទៅខ្ពស់</option><option value="price-desc">តម្លៃ៖ ខ្ពស់ទៅទាប</option></select>
          </label></div>
          {loading ? <p className="loading-note">កំពុងទាញផលិតផលពី Database...</p> : filtered.length ? <div className="products-grid">{filtered.map((product) => <ProductCard key={product._id} product={product} addToCart={addToCart} />)}</div> : <div className="empty-state"><span>⌕</span><h2>មិនមានផលិតផលត្រូវនឹងការស្វែងរក</h2><p>សូមព្យាយាមប្ដូរពាក្យស្វែងរក ឬតម្រងរបស់អ្នក។</p><Link className="button-primary" to="/products">មើលផលិតផលទាំងអស់</Link></div>}
        </section>
      </div>
    </main>
  );
}

export function ProductDetailsPage() {
  const { id } = useParams();
  const { products, addToCart } = useShop();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const product = products.find((item) => item._id === id);
  if (!product) return <div className="empty-state"><h2>រកមិនឃើញផលិតផល</h2><Link className="button-primary" to="/products">ត្រឡប់ទៅផលិតផល</Link></div>;

  return (
    <main className="content-wrap details-page">
      <div className="breadcrumbs"><Link to="/">ទំព័រដើម</Link><span>/</span><Link to="/products">ផលិតផល</Link><span>/</span>{product.name}</div>
      <div className="product-details">
        <div className="detail-image"><span className="product-badge">{product.badge || 'មានក្នុងស្តុក'}</span><img src={product.image} alt={product.name} /></div>
        <div className="detail-copy"><span className="eyebrow">{product.brand} · {product.category}</span><h1>{product.name}</h1><div className="detail-rating">★★★★★ <span>{product.rating || 4.8} · មានការវាយតម្លៃពីអតិថិជន</span></div>
          <div className="detail-price">{money(product.price)} {product.oldPrice && <del>{money(product.oldPrice)}</del>}</div>
          <p className="detail-description">{product.description || 'ផលិតផលគុណភាពខ្ពស់ មានការធានាពេញលេញ និងរួចរាល់សម្រាប់ដឹកជញ្ជូន។'}</p>
          <div className="spec-grid"><div><small>អង្គផ្ទុកទិន្នន័យ</small><b>{product.storage || '—'}</b></div><div><small>RAM</small><b>{product.ram || '—'}</b></div><div><small>ស្តុក</small><b>{product.stock > 0 ? `${product.stock} គ្រឿង` : 'ទាក់ទងមកយើង'}</b></div></div>
          <div className="detail-buy"><div className="quantity-picker"><button aria-label="បន្ថយចំនួន" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><span>{quantity}</span><button aria-label="បង្កើនចំនួន" onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}>＋</button></div><button className="button-primary" onClick={() => addToCart(product, quantity)}>បន្ថែមទៅកន្ត្រក</button></div>
          <button className="button-outline full-button" onClick={async () => { const updated = await addToCart(product, quantity); if (updated) navigate('/checkout'); }}>ទិញឥឡូវនេះ →</button>
          <div className="delivery-note">✓ ដឹកជញ្ជូនឥតគិតថ្លៃលើការកុម្ម៉ង់ $300 ឡើងទៅ<br />✓ ធានាផលិតផល 12 ខែ · អាចប្ដូរបានក្នុង 7 ថ្ងៃ</div>
        </div>
      </div>
    </main>
  );
}

export function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, loading } = useShop();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const shipping = cartTotal * (1 - discount) >= 300 || cartTotal === 0 ? 0 : 3;
  const applyCoupon = async () => {
    try {
      const validCoupon = await validateCoupon(coupon);
      setDiscount(validCoupon.discountPercent / 100);
      setDiscountCode(validCoupon.code);
      setCouponMessage(`កូដ ${validCoupon.code} ត្រូវបានអនុវត្តដោយជោគជ័យ។`);
    } catch (error) {
      setDiscount(0);
      setDiscountCode('');
      setCouponMessage(error.message);
    }
  };

  return (
    <main className="content-wrap cart-page"><PageIntro eyebrow="ទំនិញដែលអ្នកជ្រើសរើស" title="កន្ត្រកទំនិញ" description={`${cart.length} ប្រភេទផលិតផលក្នុងកន្ត្រករបស់អ្នក`} />
      {loading ? <p className="loading-note">កំពុងទាញកន្ត្រកពី Database...</p> : cart.length === 0 ? <div className="empty-state"><span>♧</span><h2>កន្ត្រករបស់អ្នកនៅទទេ</h2><p>ស្វែងរកផលិតផលដែលអ្នកចូលចិត្ត ហើយបន្ថែមចូលកន្ត្រក។</p><Link className="button-primary" to="/products">ចាប់ផ្ដើមទិញទំនិញ →</Link></div> :
        <div className="cart-layout"><section className="cart-table"><div className="cart-table-head"><span>ផលិតផល</span><span>តម្លៃ</span><span>ចំនួន</span><span>សរុប</span></div>
          {cart.map((item) => <div className="cart-row" key={item._id}><div className="cart-product"><Link to={`/products/${item._id}`}><img src={item.image} alt={item.name} /></Link><div><Link to={`/products/${item._id}`}><b>{item.name}</b></Link><small>{item.brand} · {item.storage || 'ផលិតផលមានគុណភាព'}</small><button className="remove-link" onClick={() => removeFromCart(item._id)}>ដកចេញ</button></div></div><span>{money(item.price)}</span><div className="quantity-picker"><button onClick={() => updateQuantity(item._id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item._id, item.quantity + 1)}>＋</button></div><b>{money(item.price * item.quantity)}</b></div>)}
          <Link className="continue-link" to="/products">← បន្តការទិញទំនិញ</Link>
        </section>
        <aside className="order-summary"><h2>សរុបការកុម្ម៉ង់</h2><div className="coupon-box"><label htmlFor="coupon">លេខកូដបញ្ចុះតម្លៃ</label><div><input id="coupon" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="បញ្ចូលកូដ" /><button type="button" onClick={applyCoupon}>អនុវត្ត</button></div>{couponMessage && <small className={discount ? 'success-text' : 'error-text'}>{couponMessage}</small>}</div><div className="summary-line"><span>សរុបរង</span><b>{money(cartTotal)}</b></div>{discount > 0 && <div className="summary-line discount-line"><span>បញ្ចុះតម្លៃ ({discount * 100}%)</span><b>−{money(cartTotal * discount)}</b></div>}<div className="summary-line"><span>ដឹកជញ្ជូន</span><b>{shipping ? money(shipping) : 'ឥតគិតថ្លៃ'}</b></div><div className="summary-total"><span>សរុប</span><b>{money(cartTotal * (1 - discount) + shipping)}</b></div><Link className="button-primary full-button" to={`/checkout${discountCode ? `?coupon=${encodeURIComponent(discountCode)}` : ''}`}>បន្តទៅការទូទាត់ →</Link><p className="secure-note">🔒 ការទូទាត់ប្រកបដោយសុវត្ថិភាព</p></aside></div>}
    </main>
  );
}

export function CheckoutPage() {
  const { cart, cartTotal, user, placeOrder, loading } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState('KHQR');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const couponCode = searchParams.get('coupon') || '';
  const [validatedCoupon, setValidatedCoupon] = useState(null);
  useEffect(() => {
    if (!couponCode) return;
    validateCoupon(couponCode)
      .then(setValidatedCoupon)
      .catch((requestError) => setError(requestError.message));
  }, [couponCode]);
  const coupon = validatedCoupon?.code === couponCode ? validatedCoupon : null;
  const discount = coupon ? Math.round(cartTotal * coupon.discountPercent) / 100 : 0;
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
        payment,
        couponCode,
      });
      navigate(`/order-complete/${order.orderNumber}`, { state: { order } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) return <main className="empty-state checkout-empty"><p className="loading-note">កំពុងទាញព័ត៌មានពី Database...</p></main>;
  if (!cart.length) return <main className="empty-state checkout-empty"><span>▣</span><h2>កន្ត្រកទំនិញនៅទទេ</h2><Link className="button-primary" to="/products">ស្វែងរកផលិតផល</Link></main>;

  return <main className="content-wrap checkout-page"><PageIntro eyebrow="បញ្ជាក់ព័ត៌មាន" title="ទូទាត់ និងបញ្ជាទិញ" description="បំពេញព័ត៌មានដឹកជញ្ជូន និងជ្រើសរើសវិធីទូទាត់ដែលអ្នកពេញចិត្ត។" />
    <form className="checkout-layout" onSubmit={submit}><div className="checkout-form">
      {error && <div className="form-error">{error}</div>}
      <section className="form-section"><div className="form-section-heading"><span>01</span><div><h2>ព័ត៌មានដឹកជញ្ជូន</h2><p>សូមបញ្ចូលព័ត៌មានរបស់អ្នកឱ្យបានត្រឹមត្រូវ</p></div></div>
        <div className="form-grid"><label>ឈ្មោះពេញ<input required name="name" defaultValue={user?.name || ''} placeholder="ឧ. សុខា សុវណ្ណ" /></label><label>លេខទូរស័ព្ទ<input required name="phone" type="tel" defaultValue={user?.phone || ''} placeholder="+855 12 345 678" /></label><label className="span-two">អាសយដ្ឋាន<input required name="address" placeholder="ផ្ទះលេខ, ផ្លូវ, សង្កាត់/ឃុំ" /></label><label>ខេត្ត/រាជធានី<input required name="city" placeholder="ភ្នំពេញ" /></label><label>កំណត់ចំណាំ (ស្រេចចិត្ត)<input name="note" placeholder="ព័ត៌មានបន្ថែមសម្រាប់អ្នកដឹកជញ្ជូន" /></label></div>
      </section>
      <section className="form-section"><div className="form-section-heading"><span>02</span><div><h2>វិធីទូទាត់</h2><p>ជ្រើសរើសវិធីទូទាត់ដែលងាយស្រួលសម្រាប់អ្នក</p></div></div>
        <div className="payment-options">{[['KHQR', '▦', 'ABA KHQR', 'ស្កេនកូដ KHQR ពេលបញ្ជាក់ការកុម្ម៉ង់'], ['COD', '៛', 'បង់ប្រាក់ពេលទទួល', 'ទូទាត់ជាសាច់ប្រាក់ជាមួយអ្នកដឹកជញ្ជូន']].map(([value, icon, title, desc]) => <label className={`payment-option ${payment === value ? 'selected' : ''}`} key={value}><input type="radio" name="payment" value={value} checked={payment === value} onChange={() => setPayment(value)} /><span className="payment-icon">{icon}</span><span><b>{title}</b><small>{desc}</small></span><i>{payment === value ? '●' : '○'}</i></label>)}</div>
      </section>
      <button className="button-primary full-button place-order" type="submit" disabled={submitting}>{submitting ? 'កំពុងរក្សាទុក...' : 'បញ្ជាក់ការកុម្ម៉ង់ →'}</button><p className="secure-note">🔒 ព័ត៌មានរបស់អ្នកត្រូវបានការពារដោយសុវត្ថិភាព</p>
    </div><aside className="order-summary checkout-summary"><h2>ការកុម្ម៉ង់របស់អ្នក</h2>{cart.map((item) => <div className="checkout-item" key={item._id}><img src={item.image} alt={item.name} /><div><b>{item.name}</b><small>ចំនួន {item.quantity}</small></div><b>{money(item.price * item.quantity)}</b></div>)}<div className="summary-line"><span>សរុបរង</span><b>{money(cartTotal)}</b></div>{coupon && <div className="summary-line discount-line"><span>កូដ {coupon.code} ({coupon.discountPercent}%)</span><b>−{money(discount)}</b></div>}<div className="summary-line"><span>ដឹកជញ្ជូន</span><b>{shipping ? money(shipping) : 'ឥតគិតថ្លៃ'}</b></div><div className="summary-total"><span>សរុបត្រូវបង់</span><b>{money(cartTotal - discount + shipping)}</b></div><p className="secure-note">បង់ប្រាក់មានសុវត្ថិភាព · ទំនិញមានការធានា</p></aside></form>
  </main>;
}

export function OrderCompletePage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (order) return;
    fetchOrder(id).then(setOrder).catch((requestError) => setError(requestError.message));
  }, [id, order]);
  return <main className="empty-state order-complete"><span className="complete-check">✓</span><span className="eyebrow">ការកុម្ម៉ង់ជោគជ័យ</span><h1>សូមអរគុណសម្រាប់ការកុម្ម៉ង់!</h1><p>យើងបានទទួលការកុម្ម៉ង់របស់អ្នក ហើយកំពុងរៀបចំទំនិញ។</p><div className="order-number">លេខកុម្ម៉ង់ <b>{id}</b>{order && <><span>សរុប</span><b>{money(order.total)}</b><span>ស្ថានភាព</span><b>{order.status}</b></>}</div>{error && <p className="error-text">{error}</p>}<Link className="button-primary" to={order?.user ? '/account' : '/products'}>{order?.user ? 'មើលស្ថានភាពការកុម្ម៉ង់' : 'បន្តទិញទំនិញ'}</Link></main>;
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
  return <main className="auth-page"><div className="auth-art"><span className="eyebrow">PHONE KH MEMBERS</span><h2>ពិភពបច្ចេកវិទ្យា<br />ចាប់ផ្ដើមពីទីនេះ</h2><p>ចូលរួមជាមួយ PHONE KH និងទទួលបានបទពិសោធន៍ទិញទំនិញកាន់តែងាយស្រួល។</p><div className="auth-art-mark">P<span>K</span></div></div><form className="auth-form" onSubmit={submit}><span className="eyebrow">{register ? 'បង្កើតគណនីថ្មី' : 'សូមស្វាគមន៍ត្រឡប់មកវិញ'}</span><h1>{register ? 'ចូលរួមជាមួយយើង' : 'ចូលគណនីរបស់អ្នក'}</h1><p>បញ្ចូលព័ត៌មានរបស់អ្នកដើម្បីបន្ត</p>{error && <div className="form-error">{error}</div>}
    {register && <label>ឈ្មោះពេញ<input required name="name" placeholder="ឈ្មោះរបស់អ្នក" /></label>}<label>អ៊ីមែល<input required name="email" type="email" placeholder="you@example.com" /></label>{register && <label>លេខទូរស័ព្ទ<input name="phone" type="tel" placeholder="+855 12 345 678" /></label>}<label>ពាក្យសម្ងាត់<input required name="password" type="password" minLength="6" placeholder="យ៉ាងតិច 6 តួអក្សរ" /></label><button className="button-primary full-button" type="submit" disabled={submitting}>{submitting ? 'កំពុងរក្សាទុក...' : register ? 'បង្កើតគណនី →' : 'ចូលគណនី →'}</button><div className="auth-switch">{register ? 'មានគណនីរួចហើយ?' : 'មិនទាន់មានគណនី?'} <Link to={register ? '/login' : '/register'}>{register ? 'ចូលគណនី' : 'ចុះឈ្មោះឥឡូវនេះ'}</Link></div><small className="demo-notice">គណនី និងពាក្យសម្ងាត់ត្រូវបានផ្ទៀងផ្ទាត់ និងរក្សាទុកដោយ backend។</small></form></main>;
}

export function AccountPage() {
  const { user, signOut, orders, loading } = useShop();
  const navigate = useNavigate();
  if (loading) return <main className="empty-state"><p className="loading-note">កំពុងទាញព័ត៌មានគណនីពី Database...</p></main>;
  if (!user) return <main className="empty-state"><span>♙</span><h2>សូមចូលគណនីរបស់អ្នក</h2><p>ចូលគណនីដើម្បីមើលព័ត៌មាន និងប្រវត្តិការកុម្ម៉ង់។</p><Link className="button-primary" to="/login">ចូលគណនី →</Link></main>;
  return <main className="content-wrap account-page"><PageIntro eyebrow="គណនីរបស់អ្នក" title={`សួស្តី ${user.name}`} description="គ្រប់គ្រងព័ត៌មានគណនី និងតាមដានការកុម្ម៉ង់របស់អ្នក។" /><div className="account-layout"><aside className="account-card"><div className="account-avatar">{String(user.name).charAt(0).toUpperCase()}</div><h2>{user.name}</h2><p>{user.email}</p><div className="account-menu"><span className="active">♙ ទិដ្ឋភាពគណនី</span><a href="#orders">▤ ប្រវត្តិការកុម្ម៉ង់</a><button onClick={async () => { await signOut(); navigate('/'); }}>↪ ចាកចេញ</button></div></aside><section className="account-orders" id="orders"><div className="section-heading"><div><h2>ការកុម្ម៉ង់របស់ខ្ញុំ</h2><p>តាមដាន និងមើលប្រវត្តិការទិញរបស់អ្នក</p></div><Link className="text-link" to="/products">ទិញទំនិញ →</Link></div>{orders.length ? orders.map((order) => <div className="account-order" key={order._id}><div><small>លេខកុម្ម៉ង់</small><b>{order.orderNumber}</b></div><div><small>កាលបរិច្ឆេទ</small><b>{new Date(order.createdAt).toLocaleDateString()}</b></div><div><small>សរុប</small><b>{money(order.total)}</b></div><span className="status-pill">{order.status}</span></div>) : <div className="empty-orders"><p>អ្នកមិនទាន់មានការកុម្ម៉ង់នៅឡើយទេ។</p><Link to="/products">ចាប់ផ្ដើមទិញទំនិញ →</Link></div>}</section></div></main>;
}

export function ContactPage() {
  const [sent, setSent] = useState(false);
  return <main className="content-wrap contact-page"><PageIntro eyebrow="យើងនៅទីនេះដើម្បីជួយអ្នក" title="ទាក់ទងមកយើង" description="មានសំណួរ ឬត្រូវការជំនួយ? ផ្ញើសារមកកាន់ក្រុមការងាររបស់យើង។" /><div className="contact-layout"><div className="contact-info"><h2>យើងរីករាយក្នុងការជួយអ្នក</h2><p>ទាក់ទងមកក្រុមការងារ PHONE KH តាមរយៈវិធីណាមួយខាងក្រោម។</p><div><b>⌖ &nbsp; អាសយដ្ឋាន</b><span>រាជធានីភ្នំពេញ, កម្ពុជា</span></div><div><b>☎ &nbsp; ទូរស័ព្ទ</b><span>+855 12 345 678</span></div><div><b>✉ &nbsp; អ៊ីមែល</b><span>hello@phonekh.com</span></div><div><b>◷ &nbsp; ម៉ោងធ្វើការ</b><span>រៀងរាល់ថ្ងៃ 8:00 ព្រឹក – 8:00 យប់</span></div></div><form className="contact-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><h2>ផ្ញើសារមកយើង</h2>{sent && <div className="success-box">សាររបស់អ្នកត្រូវបានទទួល។ យើងនឹងទាក់ទងទៅអ្នកវិញឆាប់ៗនេះ។</div>}<label>ឈ្មោះ<input required placeholder="ឈ្មោះរបស់អ្នក" /></label><label>អ៊ីមែល<input required type="email" placeholder="you@example.com" /></label><label>សាររបស់អ្នក<textarea required rows="5" placeholder="តើអ្នកត្រូវការជំនួយអ្វី?" /></label><button className="button-primary" type="submit">ផ្ញើសារ →</button></form></div></main>;
}
