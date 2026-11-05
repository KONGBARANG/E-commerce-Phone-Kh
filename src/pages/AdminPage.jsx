import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useShop } from '../context/useShop';
import CartIcon from '../components/CartIcon';
import { TranslateTree } from '../context/LanguageProvider';
import { useLanguage } from '../context/useLanguage';
import { createProduct as saveProduct, deleteProduct as removeProduct, fetchAdminPaymentReceipt, fetchAdminRefundQr, setProduct, setUserRole } from '../services/api';

const defaultProductImage = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85';
const parseList = (value) => String(value || '').split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
const colorOptions = ['ខ្មៅ', 'ស', 'ប្រាក់', 'ប្រផេះ', 'ខៀវ', 'មាស', 'បៃតង', 'ស្វាយ', 'ក្រហម', 'ផ្កាឈូក'];
const customStorageOption = '__custom__';
const storageOptions = ['18W', '20W', '25W', '30W', '45W', '65W', '100W', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB', 'USB-C', 'USB-A', 'Lightning', 'Bluetooth', '46mm', '20000mAh'];
const ramOptions = ['3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB'];
const formatMoney = (amount) => `$${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (date) => {
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? '—' : parsedDate.toLocaleString();
};

const sections = [
  { path: '/admin', label: 'ទិដ្ឋភាពទូទៅ', icon: 'overview' },
  { path: '/admin/products', label: 'គ្រប់គ្រងផលិតផល', icon: 'products' },
  { path: '/admin/orders', label: 'គ្រប់គ្រងការកុម្ម៉ង់', icon: 'cart' },
  { path: '/admin/users', label: 'គ្រប់គ្រងអ្នកប្រើប្រាស់', icon: 'user' },
  { path: '/admin/messages', label: 'សារអតិថិជន', icon: '✉' },
  { path: '/admin/reports', label: 'របាយការណ៍', icon: 'reports' },
];

function AdminPage() {
  const { language, setLanguage } = useLanguage();
  const {
    products, refreshProducts, orders, user, adminUsers, adminSummary, adminContactMessages,
    refreshAdmin, markContactMessageRead, replyToContactMessage, deleteContactMessage, setOrderStatus, setPaymentStatus, deleteOrder, markRefundSent, loading,
  } = useShop();
  const { pathname } = useLocation();
  const [productParams, setProductParams] = useSearchParams();
  const productCategory = ['Smartphone', 'Chargers', 'Accessories'].includes(productParams.get('category'))
    ? productParams.get('category')
    : 'Smartphone';
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [storageSelection, setStorageSelection] = useState('');
  const [customStorage, setCustomStorage] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [imagePreview, setImagePreview] = useState(defaultProductImage);
  const [galleryPreview, setGalleryPreview] = useState([]);
  const [imageFitPreview, setImageFitPreview] = useState('contain');
  const [imageBackgroundPreview, setImageBackgroundPreview] = useState('light');
  const [notice, setNotice] = useState('');
  const [orderNotice, setOrderNotice] = useState('');
  const [printRequest, setPrintRequest] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [refundPreview, setRefundPreview] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState('');
  const [loadingRefundQr, setLoadingRefundQr] = useState('');
  const [contactReplyDrafts, setContactReplyDrafts] = useState({});
  const [replyingToMessage, setReplyingToMessage] = useState('');
  const previousOrders = useRef(null);
  const previousContactMessages = useRef(null);
  const unreadContactMessages = adminContactMessages.filter((message) => message.status === 'New').length;
  const active = sections.find((section) => section.path === pathname) || sections[0];
  const [error, setError] = useState('');
  const sales = adminSummary?.sales || 0;

  useEffect(() => {
    if (!printRequest) return undefined;
    const handleAfterPrint = () => setPrintRequest(null);
    const timeout = window.setTimeout(() => window.print(), 150);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printRequest]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    let active = true;
    const poll = async () => {
      try {
        const [result] = await Promise.all([refreshAdmin(), refreshProducts()]);
        if (!active) return;
        const currentOrders = new Map(result.orders.map((order) => [order._id, order]));
        const notifications = [];
        if (previousOrders.current) {
          for (const order of result.orders) {
            const previous = previousOrders.current.get(order._id);
            if (!previous) {
              notifications.push(`ការកុម្ម៉ង់ថ្មីពី ${order.user?.name || order.customer} (${order.orderNumber})`);
            } else if ((previous.paymentStatus || 'Unpaid') !== 'Paid' && order.paymentStatus === 'Paid') {
              notifications.push(`បានបញ្ជាក់ការទូទាត់ពី ${order.user?.name || order.customer} (${order.orderNumber})`);
            } else if (previous.status !== 'Received' && order.status === 'Received') {
              notifications.push(`អតិថិជនបានបញ្ជាក់ទទួលទំនិញ (${order.orderNumber})`);
            }
          }
        }
        const currentContactMessages = new Map(result.contactMessages.map((message) => [message._id, message]));
        if (previousContactMessages.current) {
          for (const message of result.contactMessages) {
            const previousMessage = previousContactMessages.current.get(message._id);
            if (!previousMessage) {
              notifications.push(`សារថ្មីពី ${message.name} (${message.email})`);
            } else if (
              (message.replies || []).length > (previousMessage.replies || []).length &&
              message.replies?.at(-1)?.authorRole === 'customer'
            ) {
              notifications.push(`អតិថិជន ${message.name} បានឆ្លើយតបសារ`);
            }
          }
        }
        previousOrders.current = currentOrders;
        previousContactMessages.current = currentContactMessages;
        if (notifications.length) setOrderNotice(notifications.join(' · '));
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    };
    previousOrders.current = null;
    previousContactMessages.current = null;
    poll();
    const interval = window.setInterval(poll, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user, refreshAdmin, refreshProducts]);

  const createProduct = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const image = String(form.get('image')).trim() || defaultProductImage;
    const images = [...new Set(parseList(form.get('images')).filter((url) => url !== image))];
    const colors = [...new Set(form.getAll('colors').map(String))];
    if (images.length > 3) {
      setError('អាចបន្ថែមរូបភាពបន្ថែមបានអតិបរមា 3 រូប (សរុប 4 រូប)។');
      return;
    }
    if (colors.length > 3) {
      setError('អាចជ្រើសរើសពណ៌បានអតិបរមា 3 ពណ៌។');
      return;
    }
    if (images.some((url) => {
      try {
        return !['http:', 'https:'].includes(new URL(url).protocol);
      } catch {
        return true;
      }
    })) {
      setError('តំណរូបភាពបន្ថែមត្រូវតែជា URL ដែលចាប់ផ្ដើមដោយ http:// ឬ https://។');
      return;
    }
    setError('');
    const product = {
      name: String(form.get('name')).trim(),
      brand: String(form.get('brand')).trim(),
      category: String(form.get('category')),
      ...(String(form.get('sku') || '').trim() ? { sku: String(form.get('sku')).trim() } : {}),
      price: Number(form.get('price')),
      ...(form.get('oldPrice') ? { oldPrice: Number(form.get('oldPrice')) } : {}),
      image,
      images,
      colors,
      imageFit: String(form.get('imageFit')),
      imageBackground: String(form.get('imageBackground')),
      description: String(form.get('description')).trim(),
      stock: Number(form.get('stock')),
      storage: storageSelection === customStorageOption ? customStorage.trim() : storageSelection,
      ram: String(form.get('ram')).trim(),
      rating: 5,
    };
    try {
      if (editingProduct) await setProduct({ ...product, _id: editingProduct._id });
      else await saveProduct(product);
      await Promise.all([refreshProducts(), refreshAdmin()]);
      setShowForm(false);
      setEditingProduct(null);
      setSelectedColors([]);
      setNotice(editingProduct ? 'ផលិតផលត្រូវបានធ្វើបច្ចុប្បន្នភាពក្នុង Database។' : 'ផលិតផលថ្មីត្រូវបានរក្សាទុកក្នុង Database។');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await setOrderStatus(id, status);
      await refreshAdmin();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const viewPaymentReceipt = async (orderNumber) => {
    setLoadingReceipt(orderNumber);
    setError('');
    try {
      setReceiptPreview(await fetchAdminPaymentReceipt(orderNumber));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingReceipt('');
    }
  };

  const viewRefundQr = async (orderNumber) => {
    setLoadingRefundQr(orderNumber);
    setError('');
    try {
      setRefundPreview(await fetchAdminRefundQr(orderNumber));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingRefundQr('');
    }
  };

  const confirmRefund = async (orderNumber) => {
    try {
      await markRefundSent(orderNumber);
      await refreshAdmin();
      setRefundPreview(null);
      setOrderNotice(`បានកត់ត្រាថា Admin បានបាញ់ប្រាក់សងសម្រាប់ការកុម្ម៉ង់ ${orderNumber}។`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const removeOrder = async (orderNumber) => {
    if (!window.confirm(`តើអ្នកប្រាកដថាចង់លុបការកុម្ម៉ង់ COD ${orderNumber} មែនទេ?`)) return;
    try {
      await deleteOrder(orderNumber);
      await refreshAdmin();
      setOrderNotice(`ការកុម្ម៉ង់ ${orderNumber} ត្រូវបានលុប។`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const changePaymentStatus = async (id, paymentStatus) => {
    try {
      await setPaymentStatus(id, paymentStatus);
      await refreshAdmin();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (loading) return <TranslateTree><main className="admin-empty">កំពុងភ្ជាប់ Database...</main></TranslateTree>;
  if (user?.role !== 'admin') {
    return <TranslateTree><main className="empty-state admin-access"><span>🔒</span><h2>{user ? 'ត្រូវការសិទ្ធិអ្នកគ្រប់គ្រង' : 'ចូលគណនី Admin'}</h2><p>{user ? 'គណនីនេះមិនមានសិទ្ធិចូលប្រើផ្ទាំង Admin ទេ។' : 'សូមចូលដោយប្រើគណនី Admin ដែលបានកំណត់នៅក្នុង backend។'}</p><Link className="button-primary" to="/login?next=/admin">{user ? 'ត្រឡប់ទៅហាង' : 'ចូលគណនី →'}</Link></main></TranslateTree>;
  };

  const renderOverview = () => <><div className="admin-stat-grid">
    {[
      ['ប្រាក់ចំណូលសរុប', `$${sales.toLocaleString()}`, 'sales', 'តែការកុម្ម៉ង់ដែលបានបញ្ជាក់ថាបង់ប្រាក់'],
      ['ការកុម្ម៉ង់', adminSummary?.orderCount || 0, 'orders', 'ការកុម្ម៉ង់សរុប'],
      ['ផលិតផល', adminSummary?.productCount || 0, 'products', 'ក្នុង Database'],
      ['អ្នកប្រើប្រាស់', adminSummary?.userCount || 0, 'users', 'គណនីក្នុង Database'],
    ].map(([title, value, icon, note]) => <div className="admin-stat" key={title}>
      <div><span>{title}</span><i>
        {icon === 'sales' && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17 10 11l4 4 6-8" /><path d="M14 7h6v6" /></svg>}
        {icon === 'orders' && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l3 3v15H4V3h3Z" /><path d="M8 11h8M8 15h8M8 7h5" /></svg>}
        {icon === 'products' && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></svg>}
        {icon === 'users' && <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1H3ZM16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.6v1h-3" /></svg>}
      </i></div>
      <strong>{value}</strong><small>{note}</small>
    </div>)}
  </div><div className="admin-panels"><section className="admin-panel"><div className="panel-heading"><div><h2>ការកុម្ម៉ង់ថ្មីៗ</h2><p>មើលការកុម្ម៉ង់ថ្មីបំផុត</p></div><Link to="/admin/orders">មើលទាំងអស់ →</Link></div>{orders.length ? orders.slice(0, 5).map((order) => <div className="admin-recent-order" key={order._id}><div className="order-initial">{(order.user?.name || order.customer)?.charAt(0) || 'C'}</div><div><b>{order.user?.name || order.customer}</b><small>{order.user?.email || order.email || 'អតិថិជនភ្ញៀវ'} · {order.orderNumber} · {order.paymentStatus === 'Paid' ? 'បានបង់ប្រាក់' : 'មិនទាន់បង់'}</small></div><strong>${order.total}</strong></div>) : <div className="admin-empty">ការកុម្ម៉ង់ថ្មីនឹងបង្ហាញនៅទីនេះ។</div>}</section><section className="admin-panel quick-actions"><h2>សកម្មភាពរហ័ស</h2><p>តំណភ្ជាប់ទៅការគ្រប់គ្រងហាងរបស់អ្នក</p><Link to="/admin/products">＋ បន្ថែមផលិតផលថ្មី</Link>    <Link to="/admin/orders">▤ ពិនិត្យការកុម្ម៉ង់</Link><Link to="/admin/reports">▥ មើលរបាយការណ៍</Link></section></div></>;

  const removeProductFromStore = async (id) => {
    try {
      await removeProduct(id);
      await Promise.all([refreshProducts(), refreshAdmin()]);
      setNotice('ផលិតផលត្រូវបានលុបចេញពី Database។');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const toggleProductForm = () => {
    if (showForm) {
      setShowForm(false);
      setEditingProduct(null);
      setStorageSelection('');
      setCustomStorage('');
      setSelectedColors([]);
      return;
    }
    setEditingProduct(null);
    setStorageSelection('');
    setCustomStorage('');
    setSelectedColors([]);
    setImagePreview(defaultProductImage);
    setGalleryPreview([]);
    setImageFitPreview('contain');
    setImageBackgroundPreview('light');
    setShowForm(true);
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    if (storageOptions.includes(product.storage)) {
      setStorageSelection(product.storage);
      setCustomStorage('');
    } else if (product.storage) {
      setStorageSelection(customStorageOption);
      setCustomStorage(product.storage);
    } else {
      setStorageSelection('');
      setCustomStorage('');
    }
    setSelectedColors(product.colors || []);
    setImagePreview(product.image || defaultProductImage);
    setGalleryPreview(product.images || []);
    setImageFitPreview(product.imageFit || 'contain');
    setImageBackgroundPreview(product.imageBackground || 'light');
    setShowForm(true);
  };

  const renderProducts = () => <section className="admin-panel">
    <div className="panel-heading"><div><h2>គ្រប់គ្រងផលិតផល</h2><p>បែងចែកទូរស័ព្ទ ឆ្នាំងសាក និងគ្រឿងបន្លាស់ ដើម្បីគ្រប់គ្រងបានងាយ។</p></div><button className="button-primary" onClick={toggleProductForm}>{showForm ? 'បោះបង់' : `＋ បន្ថែម${productCategory === 'Smartphone' ? 'ទូរស័ព្ទ' : productCategory === 'Chargers' ? 'ឆ្នាំងសាក' : 'គ្រឿងបន្លាស់'}`}</button></div>
    <nav className="admin-product-tabs" aria-label="ប្រភេទផលិតផលក្នុង Admin">
      {[['Smartphone', 'ទូរស័ព្ទ'], ['Chargers', 'ឆ្នាំងសាក'], ['Accessories', 'គ្រឿងបន្លាស់']].map(([value, label]) => (
        <button className={productCategory === value ? 'active' : ''} type="button" aria-pressed={productCategory === value} onClick={() => {
          setShowForm(false);
          setEditingProduct(null);
          setSelectedColors([]);
          setProductParams({ category: value });
        }} key={value}>{label}<span>{products.filter((product) => product.category === value).length}</span></button>
      ))}
    </nav>
    {notice && <div className="success-box">{notice}</div>}
    {showForm && <form key={editingProduct?._id || 'new-product'} className="admin-product-form" onSubmit={createProduct}>
      <label>ឈ្មោះផលិតផល<input name="name" required defaultValue={editingProduct?.name || ''} /></label>
      <label>ម៉ាក<input name="brand" required defaultValue={editingProduct?.brand || ''} /></label>
      <label>លេខសម្គាល់ SKU<input name="sku" defaultValue={editingProduct?.sku || ''} placeholder="ឧ. APP-IP16-256-BLK" /><small>ប្រើលេខខុសគ្នាសម្រាប់កំណែផលិតផលនីមួយៗ។</small></label>
      <label>ប្រភេទ<select name="category" defaultValue={editingProduct?.category || productCategory}><option value="Smartphone">ស្មាតហ្វូន</option><option value="Accessories">គ្រឿងបន្លាស់</option><option value="Chargers">ឆ្នាំងសាក</option></select></label>
      <label>តម្លៃ ($)<input name="price" type="number" min="0" required defaultValue={editingProduct?.price || ''} /></label>
      <label>តម្លៃដើម ($)<input name="oldPrice" type="number" min="0" defaultValue={editingProduct?.oldPrice || ''} /></label>
      <label>ស្តុក<input name="stock" type="number" min="0" defaultValue={editingProduct?.stock ?? 1} required /></label>
      <fieldset className="admin-color-picker span-two">
        <legend>ពណ៌ដែលមាន <span>{selectedColors.length}/3</span></legend>
        <div>{[...new Set([...colorOptions, ...(editingProduct?.colors || [])])].map((color) => (
          <label className="admin-color-option" key={color}>
            <input
              type="checkbox"
              name="colors"
              value={color}
              checked={selectedColors.includes(color)}
              onChange={(event) => {
                const { checked } = event.target;
                if (checked && selectedColors.length >= 3) {
                  setError('អាចជ្រើសរើសពណ៌បានអតិបរមា 3 ពណ៌។');
                  return;
                }
                setError('');
                setSelectedColors((current) => checked
                  ? [...current, color]
                  : current.filter((selected) => selected !== color));
              }}
            />
            <span>{color}</span>
          </label>
        ))}</div>
        <small>ចុចជ្រើសរើសបានរហូតដល់ 3 ពណ៌។</small>
      </fieldset>
      <label className="span-two">រូបភាពចម្បង (URL)<input name="image" type="url" defaultValue={editingProduct?.image || defaultProductImage} onChange={(event) => setImagePreview(event.target.value || defaultProductImage)} /></label>
      <label className="span-two">រូបភាពបន្ថែម (URL មួយក្នុងមួយបន្ទាត់)
        <textarea name="images" rows="3" maxLength="3000" defaultValue={editingProduct?.images?.join('\n') || ''} placeholder={'https://example.com/phone-front.jpg\nhttps://example.com/phone-back.jpg'} onChange={(event) => setGalleryPreview(parseList(event.target.value).slice(0, 3))} />
        <small>បន្ថែមបាន 3 រូបទៀត — សរុបអតិបរមា 4 រូប។</small>
      </label>
      <label>របៀបបង្ហាញរូបភាព<select name="imageFit" value={imageFitPreview} onChange={(event) => setImageFitPreview(event.target.value)}><option value="contain">បង្ហាញរូបទាំងមូល</option><option value="cover">ពង្រីកបំពេញផ្ទៃ</option></select></label>
      <label>ផ្ទៃខាងក្រោយ<select name="imageBackground" value={imageBackgroundPreview} onChange={(event) => setImageBackgroundPreview(event.target.value)}><option value="light">ភ្លឺ</option><option value="dark">ងងឹត</option></select></label>
      <div className="admin-image-preview span-two">
        <div className="admin-image-preview-gallery">
          {[imagePreview || defaultProductImage, ...galleryPreview].slice(0, 4).map((image, index) => <div className="admin-image-preview-frame" data-image-fit={imageFitPreview} data-image-background={imageBackgroundPreview} key={`${image}-${index}`}><img src={image} alt={`រូបភាពផលិតផល ${index + 1}`} /></div>)}
        </div>
        <div><b>មើលរូបភាពជាមុន</b><small>អតិថិជនអាចចុចលើរូបតូចៗ ដើម្បីមើលរូបនីមួយៗ។</small></div>
      </div>
      <label>ទំហំ / លក្ខណៈ / កម្លាំងសាក
        <select name="storage" value={storageSelection} onChange={(event) => setStorageSelection(event.target.value)}>
          <option value="">ជ្រើសរើសលក្ខណៈ</option>
          {storageOptions.map((option) => <option key={option}>{option}</option>)}
          <option value={customStorageOption}>បញ្ចូលតម្លៃផ្សេងដោយដៃ...</option>
        </select>
      </label>
      {storageSelection === customStorageOption && <label>បញ្ចូលកម្លាំងសាក / លក្ខណៈដោយដៃ<input name="customStorage" value={customStorage} onChange={(event) => setCustomStorage(event.target.value)} maxLength="40" placeholder="ឧ. 33W ឬ 120W" required /></label>}
      <label>RAM
        <select name="ram" defaultValue={editingProduct?.ram || ''}>
          <option value="">ជ្រើសរើស RAM</option>
          {[...new Set([...ramOptions, ...(editingProduct?.ram ? [editingProduct.ram] : [])])].map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label className="span-two">ការពិពណ៌នា<input name="description" defaultValue={editingProduct?.description || ''} /></label>
      <button className="button-primary" type="submit">{editingProduct ? 'រក្សាទុកការកែប្រែ' : 'រក្សាទុកផលិតផល'}</button>
    </form>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ផលិតផល</th><th>លេខ SKU / លក្ខណៈ</th><th>ប្រភេទ</th><th>តម្លៃ</th><th>ស្តុក</th><th>សកម្មភាព</th></tr></thead><tbody>{products.filter((product) => product.category === productCategory).map((product) => <tr key={product._id}><td><div className="admin-product-name"><img src={product.image} alt="" /><span><b>{product.name}</b><small>{product.brand}</small></span></div></td><td>{product.sku && <small>SKU: {product.sku}</small>}<small>{[product.storage, product.ram && `RAM ${product.ram}`].filter(Boolean).join(' · ') || '—'}</small></td><td>{product.category === 'Smartphone' ? 'ស្មាតហ្វូន' : product.category === 'Chargers' ? 'ឆ្នាំងសាក' : 'គ្រឿងបន្លាស់'}</td><td>${product.price}</td><td><span className={product.stock < 5 ? 'stock-low' : 'stock-ok'}>{product.stock} គ្រឿង</span></td><td><button className="table-action" onClick={() => editProduct(product)}>កែ</button> <button className="table-action" aria-label={`លុប ${product.name}`} onClick={() => removeProductFromStore(product._id)}>លុប</button></td></tr>)}</tbody></table>{products.filter((product) => product.category === productCategory).length === 0 && <div className="admin-empty">មិនទាន់មានផលិតផលក្នុងប្រភេទនេះទេ។ ចុច “បន្ថែម” ដើម្បីបញ្ចូលផលិតផលថ្មី។</div>}</div>
  </section>;

  const renderOrders = () => (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <h2>ការកុម្ម៉ង់ទាំងអស់</h2>
          <p>ផ្ទៀងផ្ទាត់បង្កាន់ដៃ KHQR មុនទទួលការទូទាត់ និងរៀបចំទំនិញ។ សងប្រាក់ត្រូវរង់ចាំ User បញ្ជាក់ការទទួល។</p>
        </div>
      </div>
      {orders.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>លេខកុម្ម៉ង់</th><th>អតិថិជន</th><th>ទូរស័ព្ទ</th><th>សរុប</th><th>វិធីបង់/បង្កាន់ដៃ</th><th>ស្ថានភាពកុម្ម៉ង់</th><th>សកម្មភាព</th></tr></thead>
            <tbody>{orders.map((order) => (
              <tr key={order._id}>
                <td><b>{order.orderNumber}</b></td>
                <td><b>{order.user?.name || order.customer}</b><small>{order.user?.email || order.email || 'អតិថិជនភ្ញៀវ'}</small><small>{(order.items || []).map((item) => `${item.name}${item.color ? ` · ពណ៌ ${item.color}` : ''} × ${item.quantity}`).join(', ')}</small></td>
                <td>{order.phone}</td>
                <td>${order.total}</td>
                <td>
                  {order.payment === 'COD' ? 'បង់ពេលទទួល (COD)' : `${order.paymentProvider || 'KHQR'} · KHQR`}
                  <br />
                  {order.payment === 'KHQR' && order.paymentReceiptUploaded && <button className="table-action receipt-view-button" type="button" disabled={loadingReceipt === order.orderNumber} onClick={() => viewPaymentReceipt(order.orderNumber)}>{loadingReceipt === order.orderNumber ? 'កំពុងបើក...' : 'មើលបង្កាន់ដៃ'}</button>}
                  {order.refundStatus === 'Requested' && <div className="refund-admin-actions"><button className="table-action" type="button" disabled={loadingRefundQr === order.orderNumber} onClick={() => viewRefundQr(order.orderNumber)}>{loadingRefundQr === order.orderNumber ? 'កំពុងបើក...' : 'មើល QR សងប្រាក់'}</button></div>}
                  {['Sent', 'Completed'].includes(order.refundStatus) && <small className="refund-status">បានបាញ់ប្រាក់ · រង់ចាំ User បញ្ជាក់</small>}
                  {order.refundStatus === 'Received' && <small className="refund-status complete">User បានបញ្ជាក់ទទួលប្រាក់</small>}
                  <select className="status-select" aria-label={`ស្ថានភាពទូទាត់ ${order.orderNumber}`} value={order.paymentStatus || 'Unpaid'} disabled={order.status === 'Cancelled' || (order.payment === 'KHQR' && !order.paymentReceiptUploaded)} onChange={(event) => changePaymentStatus(order.orderNumber, event.target.value)}>
                    <option value="Unpaid">មិនទាន់បង់</option><option value="Paid">បានបង់ប្រាក់</option>
                  </select>
                  {order.payment === 'KHQR' && !order.paymentReceiptUploaded && <small className="payment-verification-note">ត្រូវការបង្កាន់ដៃ KHQR មុនផ្ទៀងផ្ទាត់</small>}
                </td>
                <td>
                  <select className="status-select" aria-label={`ស្ថានភាពការកុម្ម៉ង់ ${order.orderNumber}`} value={order.status} disabled={['Cancelled', 'Completed', 'Received'].includes(order.status)} onChange={(event) => changeStatus(order.orderNumber, event.target.value)}>
                    <option disabled={order.status !== 'Pending'}>Pending</option>
                    <option disabled={order.status !== 'Pending' || (order.payment === 'KHQR' && order.paymentStatus !== 'Paid')}>Processing</option>
                    <option disabled={order.status !== 'Processing'}>Completed</option>
                    {order.status === 'Received' && <option>Received</option>}
                    {order.status === 'Cancelled' && <option>Cancelled</option>}
                  </select>
                  {order.status === 'Completed' && <small className="payment-verification-note">ដល់ទីតាំងហើយ · រង់ចាំ User បញ្ជាក់ទទួល</small>}
                  {order.status === 'Received' && <small className="refund-status complete">User បានបញ្ជាក់ទទួលទំនិញ</small>}
                </td>
                <td><div className="admin-order-actions"><button className="table-action admin-print-button" type="button" onClick={() => setPrintRequest({ type: 'receipt', order })}>🖨 វិក្កយបត្រ</button>{order.payment === 'COD' && <button className="table-action" type="button" onClick={() => removeOrder(order.orderNumber)}>លុប COD</button>}</div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <div className="admin-empty">មិនទាន់មានការកុម្ម៉ង់ទេ។ ការកុម្ម៉ង់ថ្មីនឹងបង្ហាញនៅទីនេះ។</div>}
    </section>
  );

  const changeUserRole = async (id, role) => {
    try {
      await setUserRole(id, role);
      await refreshAdmin();
      setNotice('តួនាទីអ្នកប្រើប្រាស់ត្រូវបានធ្វើបច្ចុប្បន្នភាព។');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const renderUsers = () => <section className="admin-panel"><div className="panel-heading"><div><h2>អ្នកប្រើប្រាស់</h2><p>គណនី និងតួនាទីដែលបានរក្សាទុកក្នុង Database</p></div></div>{adminUsers.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ឈ្មោះ</th><th>អ៊ីមែល</th><th>ទូរស័ព្ទ</th><th>តួនាទី</th></tr></thead><tbody>{adminUsers.map((account) => <tr key={account.id}><td><b>{account.name}</b></td><td>{account.email}</td><td>{account.phone || '—'}</td><td><select className="status-select" value={account.role} disabled={account.id === user.id} onChange={(event) => changeUserRole(account.id, event.target.value)}><option value="customer">Customer</option><option value="admin">Admin</option></select></td></tr>)}</tbody></table></div> : <div className="admin-empty">មិនទាន់មានគណនីអ្នកប្រើប្រាស់ទេ។</div>}</section>;

  const handleContactMessageRead = async (id) => {
    try {
      await markContactMessageRead(id);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleContactMessageDelete = async (message) => {
    if (!window.confirm('តើអ្នកប្រាកដថាចង់លុបសារនេះមែនទេ?')) return;
    try {
      await deleteContactMessage(message._id);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleContactMessageReply = async (event, message) => {
    event.preventDefault();
    const body = String(contactReplyDrafts[message._id] || '').trim();
    if (!body) return;
    setReplyingToMessage(message._id);
    setError('');
    try {
      await replyToContactMessage(message._id, body);
      setContactReplyDrafts((current) => ({ ...current, [message._id]: '' }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setReplyingToMessage('');
    }
  };

  const renderContactMessages = () => (
    <section className="admin-panel">
      <div className="panel-heading">
        <div><h2>សំណើ និងសារពីអតិថិជន</h2><p>សារដែលបានផ្ញើតាមទំព័រទំនាក់ទំនង · មិនទាន់អាន {unreadContactMessages}</p></div>
      </div>
      {adminContactMessages.length ? <div className="contact-message-list">{adminContactMessages.map((message) => (
        <article className={`contact-message-card ${message.status === 'New' ? 'unread' : ''}`} key={message._id}>
          <header><div><h3>{message.name}</h3><a href={`mailto:${message.email}`}>{message.email}</a></div><div className="contact-message-meta"><span className={`contact-message-status ${message.status === 'New' ? 'new' : ''}`}>{message.status === 'New' ? 'ថ្មី · មិនទាន់អាន' : message.status === 'Replied' ? 'បានឆ្លើយតប' : 'បានអាន'}</span><time dateTime={message.createdAt}>{formatDate(message.createdAt)}</time></div></header>
          <div className="contact-conversation"><div className="contact-conversation-entry"><b>សាររបស់ User</b><p>{message.message}</p></div>{message.replies?.map((reply, index) => <div className={`contact-conversation-entry ${reply.authorRole === 'admin' ? 'admin-reply' : 'customer-reply'}`} key={`${message._id}-${reply.createdAt || index}`}><b>{reply.authorRole === 'admin' ? 'ចម្លើយពី Admin' : 'សារឆ្លើយតបពី User'} · {formatDate(reply.createdAt)}</b><p>{reply.body}</p></div>)}</div>
          <footer>{message.status === 'New' && <button className="table-action" type="button" onClick={() => handleContactMessageRead(message._id)}>សម្គាល់ថាបានអាន</button>}<button className="table-action danger" type="button" onClick={() => handleContactMessageDelete(message)}>លុបសារ</button></footer>
          {message.user ? <form className="contact-reply-form" onSubmit={(event) => handleContactMessageReply(event, message)}><label htmlFor={`reply-${message._id}`}>ឆ្លើយតបក្នុងគណនី User</label><textarea id={`reply-${message._id}`} value={contactReplyDrafts[message._id] || ''} maxLength="5000" rows="3" required placeholder="សរសេរចម្លើយរបស់អ្នក..." onChange={(event) => setContactReplyDrafts((current) => ({ ...current, [message._id]: event.target.value }))} /><button className="button-primary" type="submit" disabled={replyingToMessage === message._id || !contactReplyDrafts[message._id]?.trim()}>{replyingToMessage === message._id ? 'កំពុងផ្ញើ...' : 'ផ្ញើចម្លើយទៅ User'}</button></form> : <p className="contact-reply-hint">សារនេះមិនមានគណនី User ភ្ជាប់ទេ ដូច្នេះមិនអាចឆ្លើយតបក្នុងគណនីបានទេ។</p>}
        </article>
      ))}</div> : <div className="admin-empty">មិនទាន់មានសារពីអតិថិជនទេ។</div>}
    </section>
  );

  const paidOrders = orders.filter((order) => order.status !== 'Cancelled' && order.paymentStatus === 'Paid');
  const unpaidOrders = orders.filter((order) => order.status !== 'Cancelled' && order.paymentStatus !== 'Paid');
  const renderReports = () => <div className="admin-report-page"><div className="panel-heading admin-report-heading"><div><h2>របាយការណ៍ហាង</h2><p>សរុបចំណូលពីការទូទាត់ដែលបានបញ្ជាក់ មិនរាប់បញ្ចូលការកុម្ម៉ង់ដែលបានបោះបង់។</p></div><button className="button-primary" type="button" onClick={() => setPrintRequest({ type: 'report', generatedAt: new Date() })}>🖨 បោះពុម្ពរបាយការណ៍</button></div><div className="admin-panels"><section className="admin-panel"><h2>សង្ខេបរបាយការណ៍</h2><p>ទិន្នន័យដែលបានគណនាពី MongoDB</p><div className="report-total"><span>ប្រាក់ចំណូលដែលបានទទួល</span><b>${sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></div><div className="report-total"><span>ការទូទាត់បានបញ្ជាក់</span><b>{paidOrders.length}</b></div><div className="report-total"><span>ការកុម្ម៉ង់មិនទាន់ទូទាត់</span><b>{unpaidOrders.length}</b></div><div className="report-total"><span>ការកុម្ម៉ង់បានបញ្ចប់</span><b>{adminSummary?.completedCount || 0}</b></div><div className="report-total"><span>កំពុងដំណើរការ</span><b>{adminSummary?.processingCount || 0}</b></div></section><section className="admin-panel"><h2>ផលិតផលពេញនិយម</h2><p>តម្រៀបតាមចំនួនលក់ក្នុងការកុម្ម៉ង់</p>{products.slice(0, 5).map((product) => { const sold = orders.reduce((sum, order) => sum + (order.items || []).filter((item) => String(item.product) === product._id).reduce((n, item) => n + item.quantity, 0), 0); return <div className="report-product" key={product._id}><span>{product.name}</span><b>{sold} គ្រឿង</b></div>; })}</section></div></div>;

  const content = active.path === '/admin/products' ? renderProducts() : active.path === '/admin/orders' ? renderOrders() : active.path === '/admin/users' ? renderUsers() : active.path === '/admin/messages' ? renderContactMessages() : active.path === '/admin/reports' ? renderReports() : renderOverview();
  const printOrder = printRequest?.type === 'receipt' ? printRequest.order : null;
  const printDocument = printOrder ? <article className="admin-print-document">
    <header className="print-header"><div><strong>PHONE KH</strong><span>ហាងលក់ទូរស័ព្ទ និងគ្រឿងបន្លាស់</span></div><div className="print-document-title"><h1>វិក្កយបត្រ / បង្កាន់ដៃ</h1><b>{printOrder.orderNumber}</b></div></header>
    <div className="print-meta-grid"><div><span>អតិថិជន</span><b>{printOrder.user?.name || printOrder.customer}</b></div><div><span>ទូរស័ព្ទ</span><b>{printOrder.phone}</b></div><div><span>អ៊ីមែល</span><b>{printOrder.user?.email || printOrder.email || '—'}</b></div><div><span>កាលបរិច្ឆេទ</span><b>{formatDate(printOrder.createdAt)}</b></div><div className="print-address"><span>អាសយដ្ឋានដឹកជញ្ជូន</span><b>{printOrder.address}</b></div><div><span>ការទូទាត់</span><b>{printOrder.payment === 'COD' ? 'បង់ប្រាក់ពេលទទួល (COD)' : `${printOrder.paymentProvider || 'KHQR'} · KHQR`} · {printOrder.paymentStatus === 'Paid' ? 'បានបង់ប្រាក់' : 'មិនទាន់បង់'}</b></div></div>
    <table className="print-table"><thead><tr><th>ផលិតផល</th><th>ចំនួន</th><th>តម្លៃរាយ</th><th>សរុប</th></tr></thead><tbody>{(printOrder.items || []).map((item, index) => <tr key={`${item.product || item.name}-${index}`}><td>{item.name}{[item.storage, item.color].filter(Boolean).length ? <small>{[item.storage, item.color].filter(Boolean).join(' · ')}</small> : null}</td><td>{item.quantity}</td><td>{formatMoney(item.price)}</td><td>{formatMoney(item.price * item.quantity)}</td></tr>)}</tbody></table>
    <div className="print-totals"><div><span>តម្លៃទំនិញ</span><b>{formatMoney(printOrder.subtotal)}</b></div>{printOrder.discount > 0 && <div><span>បញ្ចុះតម្លៃ{printOrder.discountCode ? ` (${printOrder.discountCode})` : ''}</span><b>-{formatMoney(printOrder.discount)}</b></div>}<div><span>ថ្លៃដឹកជញ្ជូន</span><b>{formatMoney(printOrder.shipping)}</b></div><div className="print-grand-total"><span>សរុបត្រូវបង់</span><b>{formatMoney(printOrder.total)}</b></div></div>
    {printOrder.note && <p className="print-note"><b>ចំណាំ:</b> {printOrder.note}</p>}<footer className="print-footer">សូមអរគុណដែលបានគាំទ្រ PHONE KH</footer>
  </article> : printRequest?.type === 'report' ? <article className="admin-print-document">
    <header className="print-header"><div><strong>PHONE KH</strong><span>របាយការណ៍ហាងលក់ទូរស័ព្ទ និងគ្រឿងបន្លាស់</span></div><div className="print-document-title"><h1>របាយការណ៍ប្រាក់ចំណូល</h1><b>បោះពុម្ព៖ {formatDate(printRequest.generatedAt)}</b></div></header>
    <p className="print-report-description">ប្រាក់ចំណូលគិតពីការទូទាត់ដែលបានបញ្ជាក់ និងមិនរាប់បញ្ចូលការកុម្ម៉ង់ដែលបានបោះបង់។</p>
    <div className="print-report-stats"><div><span>ប្រាក់ចំណូលដែលបានទទួល</span><b>{formatMoney(sales)}</b></div><div><span>ការទូទាត់បានបញ្ជាក់</span><b>{paidOrders.length}</b></div><div><span>មិនទាន់ទូទាត់</span><b>{unpaidOrders.length}</b></div><div><span>បានបញ្ចប់</span><b>{adminSummary?.completedCount || 0}</b></div><div><span>កំពុងដំណើរការ</span><b>{adminSummary?.processingCount || 0}</b></div></div>
    <h2 className="print-section-title">ប្រតិបត្តិការដែលបានទូទាត់</h2>{paidOrders.length ? <table className="print-table"><thead><tr><th>លេខកុម្ម៉ង់</th><th>អតិថិជន</th><th>កាលបរិច្ឆេទ</th><th>សរុប</th></tr></thead><tbody>{paidOrders.map((order) => <tr key={order._id}><td>{order.orderNumber}</td><td>{order.user?.name || order.customer}</td><td>{formatDate(order.createdAt)}</td><td>{formatMoney(order.total)}</td></tr>)}</tbody></table> : <p className="print-empty">មិនទាន់មានប្រតិបត្តិការបានទូទាត់ទេ។</p>}
  </article> : null;

  return <TranslateTree><main className="admin-shell"><aside className="admin-sidebar"><div className="admin-brand"><span className="brand-mark">P</span><div><b>PHONE KH</b><small>ADMIN PANEL</small></div></div><div className="admin-menu-label">MENU</div><nav className="admin-nav-links" aria-label="រុករកផ្ទាំងគ្រប់គ្រង">{sections.map((section) => <Link className={`admin-nav-link ${active.path === section.path ? 'active' : ''}`} to={section.path} key={section.path}><span>{section.icon === 'cart' ? <CartIcon /> : section.icon === 'user' ? <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg> : section.icon === 'overview' ? <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="5" rx="1" /><rect x="13" y="10" width="8" height="11" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /></svg> : section.icon === 'products' ? <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg> : section.icon === 'reports' ? <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20V10m5 10V4m5 16v-7m5 7V7M2 20h20" /></svg> : section.icon}</span>{section.label}{section.path === '/admin/messages' && unreadContactMessages > 0 && <b className="admin-unread-badge">{unreadContactMessages}</b>}{active.path === section.path && <i />}</Link>)}</nav><div className="admin-sidebar-bottom"><div className="admin-user"><div className="account-avatar">{user?.profileImage ? <img src={user.profileImage} alt="" /> : user?.name?.charAt(0) || 'A'}</div><span><b>{user?.name || 'អ្នកគ្រប់គ្រង'}</b><small>Admin</small></span></div><Link to="/">← ត្រឡប់ទៅហាង</Link></div></aside><section className="admin-main"><header className="admin-topbar"><div><small>PHONE KH / ADMIN</small><h1>{active.label}</h1></div><div className="admin-topbar-actions"><details className="theme-picker language-picker"><summary aria-label="Language" title="Language"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg></summary><div className="theme-menu language-menu" role="group" aria-label="Select language"><button type="button" className={language === 'km' ? 'active' : ''} aria-pressed={language === 'km'} onClick={(event) => { setLanguage('km'); event.currentTarget.closest('details')?.removeAttribute('open'); }}><span>Khmer</span>{language === 'km' && <b aria-hidden="true">&#10003;</b>}</button><button type="button" className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} onClick={(event) => { setLanguage('en'); event.currentTarget.closest('details')?.removeAttribute('open'); }}><span>English</span>{language === 'en' && <b aria-hidden="true">&#10003;</b>}</button></div></details><Link className="admin-view-store" to="/">មើលហាង</Link></div></header><div className="admin-content">{orderNotice && <div className="admin-order-notice" role="status" aria-live="polite"><span>{orderNotice}</span><button type="button" onClick={() => setOrderNotice('')} aria-label="បិទការជូនដំណឹង">×</button></div>}{error && <div className="form-error">{error}</div>}{content}</div><p className="admin-demo-note">ការគ្រប់គ្រង និងទិន្នន័យត្រូវបានរក្សាទុកក្នុង MongoDB។</p></section>{receiptPreview && <div className="receipt-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setReceiptPreview(null); }}><section className="receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title"><header><div><h2 id="receipt-modal-title">បង្កាន់ដៃទូទាត់ · {receiptPreview.orderNumber}</h2><p>សូមផ្ទៀងផ្ទាត់ប្រតិបត្តិការធនាគារ មុនសម្គាល់ថាបានបង់។</p></div><button type="button" onClick={() => setReceiptPreview(null)} aria-label="បិទបង្កាន់ដៃ">×</button></header><img src={receiptPreview.paymentReceipt} alt={`បង្កាន់ដៃទូទាត់ ${receiptPreview.orderNumber}`} /></section></div>}{refundPreview && <div className="receipt-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setRefundPreview(null); }}><section className="receipt-modal" role="dialog" aria-modal="true" aria-labelledby="refund-qr-title"><header><div><h2 id="refund-qr-title">QR ទទួលប្រាក់ត្រឡប់ · {refundPreview.orderNumber}</h2><p>ផ្ទេរប្រាក់ទៅ QR នេះ រួចចុចបញ្ជាក់ថា Admin បានបាញ់ប្រាក់។ User នឹងបញ្ជាក់ការទទួលបន្ទាប់ពីពិនិត្យគណនី។</p></div><button type="button" onClick={() => setRefundPreview(null)} aria-label="បិទ QR">×</button></header><img src={refundPreview.refundQr} alt={`QR ទទួលប្រាក់ត្រឡប់ ${refundPreview.orderNumber}`} /><button className="button-primary cancel-submit-button" type="button" onClick={() => confirmRefund(refundPreview.orderNumber)}>បានបាញ់ប្រាក់រួច · ជូនដំណឹង User</button></section></div>}{printDocument}</main></TranslateTree>;
}

export default AdminPage;
