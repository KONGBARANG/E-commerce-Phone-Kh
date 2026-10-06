import { ShopProvider } from './context/ShopContext';
import Navbar from './components/Navbar';
import AppRoutes from './routes/AppRoutes';
import { Link } from 'react-router-dom';
import { useShop } from './context/useShop';
import './App.css';

function AppLayout() {
  const { apiError, setApiError } = useShop();
  return (
    <div className="app-container">
      <Navbar />
      {apiError && <div className="api-alert" role="alert"><span>{apiError}</span><button onClick={() => setApiError('')} aria-label="បិទសារកំហុស">×</button></div>}
      <AppRoutes />
      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand"><strong>PHONE<span>KH</span></strong><p>បច្ចេកវិទ្យាទំនើប សម្រាប់ជីវិតប្រចាំថ្ងៃរបស់អ្នក។</p></div>
          <div><b>សេវាកម្មអតិថិជន</b><Link to="/about">អំពី PHONE KH</Link><Link to="/contact">ទាក់ទងមកយើង</Link></div>
          <div><b>ការទិញទំនិញ</b><Link to="/products">ផលិតផលទាំងអស់</Link><Link to="/account">ប្រវត្តិការកុម្ម៉ង់</Link></div>
          <div><b>ទំនាក់ទំនង</b><span>ភ្នំពេញ, កម្ពុជា</span><span>+855 12 345 678</span><span>hello@phonekh.com</span></div>
        </div>
        <div className="footer-bottom">© 2026 PHONE KH. រក្សាសិទ្ធិគ្រប់យ៉ាង។ <span>ការទូទាត់មានសុវត្ថិភាព · KHQR · COD</span></div>
      </footer>
    </div>
  );
}

function App() {
  return <ShopProvider><AppLayout /></ShopProvider>;
}

export default App;
