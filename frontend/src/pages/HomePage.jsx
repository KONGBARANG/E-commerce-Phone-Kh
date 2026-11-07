import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/useShop';
import { getProductImageUrl } from '../utils/productImage';
import { TranslateTree } from '../context/LanguageProvider';

function HomePage() {
  const { products, addToCart, apiError, loading } = useShop();
  const phones = products.filter((product) => product.category?.toLowerCase() === 'smartphone');
  const featured = [...phones].sort((first, second) => Number(second.price) - Number(first.price)).slice(0, 4);
  const chargers = products.filter((product) => product.category?.toLowerCase() === 'chargers');
  const [featuredPhoneIndex, setFeaturedPhoneIndex] = useState(0);
  const featuredPhone = phones.length ? phones[featuredPhoneIndex % phones.length] : null;

  useEffect(() => {
    if (phones.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const intervalId = window.setInterval(() => {
      setFeaturedPhoneIndex((index) => (index + 1) % phones.length);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [phones.length]);

  return (
    <TranslateTree><main>
      <section className="hero-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span /> សូមស្វាគមន៍មកកាន់ PHONE KH</div>
          <h1>បច្ចេកវិទ្យា<br />ដែលអ្នក <em>ស្រឡាញ់</em></h1>
          <p>ស្វែងរកទូរស័ព្ទ និងឧបករណ៍បច្ចេកវិទ្យាថ្មីៗ តម្លៃល្អបំផុត និងសេវាកម្មដែលអ្នកទុកចិត្តបាន។</p>
          <div className="hero-buttons"><Link className="button-primary" to="/phones">ទិញទំនិញឥឡូវនេះ</Link><Link className="text-link" to="/about">ស្វែងយល់បន្ថែម</Link></div>
          <div className="hero-stats"><div><strong>2,500<span>+</span></strong><small>អតិថិជនពេញចិត្ត</small></div><div><strong>100<span>%</span></strong><small>ផលិតផលមានគុណភាព</small></div><div><strong>1<span> ឆ្នាំ</span></strong><small>ការធានាផលិតផល</small></div></div>
        </div>
        <div className="hero-art">
          <div className="hero-orbit" />
          {featuredPhone && <div className="hero-product-frame" key={featuredPhone._id}>
            <img src={getProductImageUrl(featuredPhone.image, 1400)} alt={featuredPhone.name} />
          </div>}
          {featuredPhone && <div className="hero-product-caption">
            <span>{featuredPhone.brand || 'ស្មាតហ្វូន'}</span>
            <b>{featuredPhone.name}</b>
            <small>{[featuredPhone.storage, featuredPhone.ram && `RAM ${featuredPhone.ram}`].filter(Boolean).join(' · ')}</small>
            <strong>${Number(featuredPhone.price || 0).toLocaleString()}</strong>
          </div>}
        </div>
      </section>
      {apiError && !products.length && <div className="content-wrap demo-data-note">មិនអាចទាញទិន្នន័យពី Database បានទេ។ សូមពិនិត្យ backend និងការតភ្ជាប់ MongoDB។</div>}

      <section className="benefits-row content-wrap">
        <div><span>◇</span><p><b>ផលិតផលមានការធានា</b><small>ទំនិញថ្មី 100% មានប្រភពច្បាស់លាស់</small></p></div>
        <div><span>↗</span><p><b>ដឹកជញ្ជូនរហ័ស</b><small>ដឹកជញ្ជូនគ្រប់ទីកន្លែងក្នុងកម្ពុជា</small></p></div>
        <div><span>▣</span><p><b>ទូទាត់ងាយស្រួល</b><small>KHQR, ABA និងបង់ប្រាក់ពេលទទួល</small></p></div>
        <div><span>♡</span><p><b>ជំនួយ 7 ថ្ងៃ</b><small>ក្រុមការងាររបស់យើងត្រៀមជួយអ្នក</small></p></div>
      </section>

      <section className="category-section content-wrap">
        <div className="section-heading"><div><span className="eyebrow">ម៉ូដែលទូរស័ព្ទដែលមាន</span><h2>ស្វែងរកទូរស័ព្ទតាមម៉ូដែល</h2><p>រុករកទូរស័ព្ទដែលមានក្នុងហាង ឆ្លងតាមម៉ូដែល ម៉ាក និងទំហំផ្ទុក។</p></div><Link className="text-link" to="/phones">មើលទាំងអស់ →</Link></div>
        {loading ? <p className="loading-note">កំពុងទាញបញ្ជីទូរស័ព្ទ...</p> : phones.length ? <div className="phone-carousel" aria-label="បញ្ជីម៉ូដែលទូរស័ព្ទ">
          <div className="phone-carousel-track">
            {[false, true].map((duplicate) => <div className="phone-carousel-group" aria-hidden={duplicate || undefined} key={duplicate ? 'duplicate' : 'products'}>
              {phones.map((product) => <Link className="phone-carousel-card" to={`/products/${product._id}`} tabIndex={duplicate ? -1 : undefined} key={`${duplicate ? 'duplicate-' : ''}${product._id}`}>
                <div className="phone-carousel-image"><img src={getProductImageUrl(product.image, 700)} alt={duplicate ? '' : product.name} loading="lazy" /></div>
                <div className="phone-carousel-info"><span>{product.brand || 'ទូរស័ព្ទ'}</span><h3>{product.name}</h3><p>{[product.storage, product.ram && `RAM ${product.ram}`].filter(Boolean).join(' · ') || 'មើលលម្អិត'}</p><strong>${Number(product.price || 0).toLocaleString()}</strong></div>
              </Link>)}
            </div>)}
          </div>
        </div> : <p className="loading-note">មិនទាន់មានទូរស័ព្ទក្នុងបញ្ជីផលិតផលទេ។</p>}
      </section>

      <section className="charger-section content-wrap">
        <div className="section-heading"><div><span className="eyebrow">សាកថ្មបានងាយស្រួល</span><h2>ឆ្នាំងសាក និងអាដាប់ទ័រ</h2><p>ជ្រើសរើសឆ្នាំងសាកតាមកម្លាំងសាក និងប្រភេទការតភ្ជាប់។</p></div><Link className="text-link" to="/products?category=Chargers">មើលឆ្នាំងសាក →</Link></div>
        {loading ? <p className="loading-note">កំពុងទាញបញ្ជីឆ្នាំងសាក...</p> : chargers.length ? <div className="products-grid">{chargers.slice(0, 4).map((product) => <ProductCard key={product._id} product={product} addToCart={addToCart} />)}</div> : <div className="charger-empty"><span aria-hidden="true">ϟ</span><p>ឆ្នាំងសាកថ្មីៗនឹងបង្ហាញនៅទីនេះ។</p></div>}
      </section>

      <section className="featured-section content-wrap">
        <div className="section-heading"><div><span className="eyebrow">ស្មាតហ្វូនតម្លៃខ្ពស់</span><h2>ទូរស័ព្ទពេញនិយមតម្លៃខ្ពស់</h2><p>បង្ហាញតែទូរស័ព្ទដែលមានតម្លៃខ្ពស់ជាងគេក្នុងហាង។</p></div><Link className="text-link" to="/phones">មើលទូរស័ព្ទទាំងអស់ →</Link></div>
        {loading ? <p className="loading-note">កំពុងទាញផលិតផលពី Database...</p> : featured.length ? <div className="products-grid">{featured.map((product) => <ProductCard key={product._id} product={product} addToCart={addToCart} />)}</div> : <p className="loading-note">មិនមានផលិតផលក្នុង Database នៅឡើយទេ។</p>}
      </section>

      <section className="promo-banner content-wrap"><div><span>PHONE KH MEMBER</span><h2>ទទួលបានបទពិសោធន៍<br />ទិញទំនិញកាន់តែប្រសើរ</h2><p>ចូលរួមជាមួយយើង ដើម្បីទទួលបានព័ត៌មានថ្មីៗ និងការផ្ដល់ជូនពិសេស។</p><Link className="button-light" to="/register">បង្កើតគណនីឥឡូវនេះ</Link></div><div className="promo-art">PHONE<br /><strong>KH</strong></div></section>
    </main></TranslateTree>
  );
}

export default HomePage;
