import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/useShop';

function HomePage() {
  const { products, addToCart, apiError, loading } = useShop();
  const featured = products.slice(0, 4);

  return (
    <main>
      <section className="hero-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span /> សូមស្វាគមន៍មកកាន់ PHONE KH</div>
          <h1>បច្ចេកវិទ្យា<br />ដែលអ្នក <em>ស្រឡាញ់</em></h1>
          <p>ស្វែងរកទូរស័ព្ទ និងឧបករណ៍បច្ចេកវិទ្យាថ្មីៗ តម្លៃល្អបំផុត និងសេវាកម្មដែលអ្នកទុកចិត្តបាន។</p>
          <div className="hero-buttons"><Link className="button-primary" to="/products">ទិញទំនិញឥឡូវនេះ <span>→</span></Link><Link className="text-link" to="/about">ស្វែងយល់បន្ថែម</Link></div>
          <div className="hero-stats"><div><strong>2,500<span>+</span></strong><small>អតិថិជនពេញចិត្ត</small></div><div><strong>100<span>%</span></strong><small>ផលិតផលមានគុណភាព</small></div><div><strong>1<span> ឆ្នាំ</span></strong><small>ការធានាផលិតផល</small></div></div>
        </div>
        <div className="hero-art">
          <div className="hero-orbit" />
          <img src={products[0]?.image} alt="ស្មាតហ្វូនថ្មី" />
          <div className="hero-float-card"><span className="float-stars">★★★★★</span><b>គុណភាពដែលទុកចិត្តបាន</b><small>សេវាកម្មល្អបំផុតនៅកម្ពុជា</small></div>
          <div className="hero-sale"><small>សន្សំបាន</small><strong>30%</strong><small>សប្ដាហ៍នេះ</small></div>
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
        <div className="section-heading"><div><span className="eyebrow">ស្វែងរកតាមប្រភេទ</span><h2>ទិញតាមប្រភេទផលិតផល</h2></div><Link className="text-link" to="/products">មើលទាំងអស់ →</Link></div>
        <div className="category-cards">
          <Link to="/products?brand=Apple" className="category-card category-apple"><span>01 / PREMIUM</span><h3>Apple</h3><p>iPhone, iPad និងគ្រឿងបន្លាស់</p><b>ស្វែងរកផលិតផល →</b><div></div></Link>
          <Link to="/products?brand=Samsung" className="category-card category-samsung"><span>02 / INNOVATION</span><h3>Samsung</h3><p>Galaxy សម្រាប់ការងារ និងកម្សាន្ត</p><b>ស្វែងរកផលិតផល →</b><div>S</div></Link>
          <Link to="/products?category=Accessories" className="category-card category-accessories"><span>03 / YOUR DAILY TECH</span><h3>គ្រឿងបន្លាស់</h3><p>បំពេញបទពិសោធន៍បច្ចេកវិទ្យារបស់អ្នក</p><b>ស្វែងរកផលិតផល →</b><div>⌁</div></Link>
        </div>
      </section>

      <section className="featured-section content-wrap">
        <div className="section-heading"><div><span className="eyebrow">ជម្រើសរបស់អតិថិជន</span><h2>ផលិតផលពេញនិយម</h2><p>ផលិតផលល្អៗ ដែលអតិថិជនរបស់យើងចូលចិត្តជាងគេ។</p></div><Link className="text-link" to="/products">ផលិតផលទាំងអស់ →</Link></div>
        {loading ? <p className="loading-note">កំពុងទាញផលិតផលពី Database...</p> : featured.length ? <div className="products-grid">{featured.map((product) => <ProductCard key={product._id} product={product} addToCart={addToCart} />)}</div> : <p className="loading-note">មិនមានផលិតផលក្នុង Database នៅឡើយទេ។</p>}
      </section>

      <section className="promo-banner content-wrap"><div><span>PHONE KH MEMBER</span><h2>ទទួលបានបទពិសោធន៍<br />ទិញទំនិញកាន់តែប្រសើរ</h2><p>ចូលរួមជាមួយយើង ដើម្បីទទួលបានព័ត៌មានថ្មីៗ និងការផ្ដល់ជូនពិសេស។</p><Link className="button-light" to="/register">បង្កើតគណនីឥឡូវនេះ →</Link></div><div className="promo-art">PHONE<br /><strong>KH</strong></div></section>
    </main>
  );
}

export default HomePage;
