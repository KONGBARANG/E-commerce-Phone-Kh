import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useShop } from '../context/useShop';
import { createProduct as saveProduct, deleteProduct as removeProduct, setProduct, setUserRole } from '../services/api';

const sections = [
  { path: '/admin', label: 'ទិដ្ឋភាពទូទៅ', icon: '▦' },
  { path: '/admin/products', label: 'គ្រប់គ្រងផលិតផល', icon: '◇' },
  { path: '/admin/orders', label: 'គ្រប់គ្រងការកុម្ម៉ង់', icon: '▤' },
  { path: '/admin/users', label: 'គ្រប់គ្រងអ្នកប្រើប្រាស់', icon: '♙' },
  { path: '/admin/reports', label: 'របាយការណ៍', icon: '▥' },
];

function AdminPage() {
  const {
    products, refreshProducts, orders, user, adminUsers, adminSummary,
    refreshAdmin, setOrderStatus, setPaymentStatus, loading,
  } = useShop();
  const { pathname } = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notice, setNotice] = useState('');
  const [orderNotice, setOrderNotice] = useState('');
  const previousOrders = useRef(null);
  const active = sections.find((section) => section.path === pathname) || sections[0];
  const [error, setError] = useState('');
  const sales = adminSummary?.sales || 0;

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
            }
          }
        }
        previousOrders.current = currentOrders;
        if (notifications.length) setOrderNotice(notifications.join(' · '));
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    };
    previousOrders.current = null;
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
    const product = {
      name: String(form.get('name')).trim(),
      brand: String(form.get('brand')).trim(),
      category: String(form.get('category')),
      price: Number(form.get('price')),
      ...(form.get('oldPrice') ? { oldPrice: Number(form.get('oldPrice')) } : {}),
      image: String(form.get('image')).trim() || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85',
      description: String(form.get('description')).trim(),
      stock: Number(form.get('stock')),
      storage: String(form.get('storage')).trim(),
      ram: String(form.get('ram')).trim(),
      rating: 5,
    };
    try {
      if (editingProduct) await setProduct({ ...product, _id: editingProduct._id });
      else await saveProduct(product);
      await Promise.all([refreshProducts(), refreshAdmin()]);
      setShowForm(false);
      setEditingProduct(null);
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

  const changePaymentStatus = async (id, paymentStatus) => {
    try {
      await setPaymentStatus(id, paymentStatus);
      await refreshAdmin();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (loading) return <main className="admin-empty">កំពុងភ្ជាប់ Database...</main>;
  if (user?.role !== 'admin') {
    return <main className="empty-state admin-access"><span>🔒</span><h2>{user ? 'ត្រូវការសិទ្ធិអ្នកគ្រប់គ្រង' : 'ចូលគណនី Admin'}</h2><p>{user ? 'គណនីនេះមិនមានសិទ្ធិចូលប្រើផ្ទាំង Admin ទេ។' : 'សូមចូលដោយប្រើគណនី Admin ដែលបានកំណត់នៅក្នុង backend។'}</p><Link className="button-primary" to="/login?next=/admin">{user ? 'ត្រឡប់ទៅហាង' : 'ចូលគណនី →'}</Link></main>;
  };

  const renderOverview = () => <><div className="admin-stat-grid">
    {[['ប្រាក់ចំណូលសរុប', `$${sales.toLocaleString()}`, '↗', 'តែការកុម្ម៉ង់ដែលបានបញ្ជាក់ថាបង់ប្រាក់'], ['ការកុម្ម៉ង់', adminSummary?.orderCount || 0, '▤', 'ការកុម្ម៉ង់សរុប'], ['ផលិតផល', adminSummary?.productCount || 0, '◇', 'ក្នុង Database'], ['អ្នកប្រើប្រាស់', adminSummary?.userCount || 0, '♙', 'គណនីក្នុង Database']].map(([title, value, icon, note]) => <div className="admin-stat" key={title}><div><span>{title}</span><i>{icon}</i></div><strong>{value}</strong><small>{note}</small></div>)}
  </div><div className="admin-panels"><section className="admin-panel"><div className="panel-heading"><div><h2>ការកុម្ម៉ង់ថ្មីៗ</h2><p>មើលការកុម្ម៉ង់ថ្មីបំផុត</p></div><Link to="/admin/orders">មើលទាំងអស់ →</Link></div>{orders.length ? orders.slice(0, 5).map((order) => <div className="admin-recent-order" key={order._id}><div className="order-initial">{(order.user?.name || order.customer)?.charAt(0) || 'C'}</div><div><b>{order.user?.name || order.customer}</b><small>{order.user?.email || order.email || 'អតិថិជនភ្ញៀវ'} · {order.orderNumber} · {order.paymentStatus === 'Paid' ? 'បានបង់ប្រាក់' : 'មិនទាន់បង់'}</small></div><strong>${order.total}</strong></div>) : <div className="admin-empty">ការកុម្ម៉ង់ថ្មីនឹងបង្ហាញនៅទីនេះ។</div>}</section><section className="admin-panel quick-actions"><h2>សកម្មភាពរហ័ស</h2><p>តំណភ្ជាប់ទៅការគ្រប់គ្រងហាងរបស់អ្នក</p><Link to="/admin/products">＋ បន្ថែមផលិតផលថ្មី</Link><Link to="/admin/orders">▤ ពិនិត្យការកុម្ម៉ង់</Link><Link to="/admin/reports">▥ មើលរបាយការណ៍</Link></section></div></>;

  const removeProductFromStore = async (id) => {
    try {
      await removeProduct(id);
      await Promise.all([refreshProducts(), refreshAdmin()]);
      setNotice('ផលិតផលត្រូវបានលុបចេញពី Database។');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const renderProducts = () => <section className="admin-panel">
    <div className="panel-heading"><div><h2>បញ្ជីផលិតផល</h2><p>បន្ថែម និងគ្រប់គ្រងស្តុកផលិតផលនៅក្នុង Database</p></div><button className="button-primary" onClick={() => { setEditingProduct(null); setShowForm(!showForm); }}>{showForm ? 'បោះបង់' : '＋ បន្ថែមផលិតផល'}</button></div>
    {notice && <div className="success-box">{notice}</div>}
    {showForm && <form className="admin-product-form" onSubmit={createProduct}><label>ឈ្មោះផលិតផល<input name="name" required defaultValue={editingProduct?.name || ''} /></label><label>ម៉ាក<input name="brand" required defaultValue={editingProduct?.brand || ''} /></label><label>ប្រភេទ<select name="category" defaultValue={editingProduct?.category || 'Smartphone'}><option>Smartphone</option><option>Accessories</option></select></label><label>តម្លៃ ($)<input name="price" type="number" min="0" required defaultValue={editingProduct?.price || ''} /></label><label>តម្លៃដើម ($)<input name="oldPrice" type="number" min="0" defaultValue={editingProduct?.oldPrice || ''} /></label><label>ស្តុក<input name="stock" type="number" min="0" defaultValue={editingProduct?.stock ?? 1} required /></label><label>រូបភាព URL<input name="image" type="url" defaultValue={editingProduct?.image || ''} /></label><label>អង្គផ្ទុកទិន្នន័យ<input name="storage" defaultValue={editingProduct?.storage || ''} /></label><label>RAM<input name="ram" defaultValue={editingProduct?.ram || ''} /></label><label className="span-two">ការពិពណ៌នា<input name="description" defaultValue={editingProduct?.description || ''} /></label><button className="button-primary" type="submit">{editingProduct ? 'រក្សាទុកការកែប្រែ' : 'រក្សាទុកផលិតផល'}</button></form>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ផលិតផល</th><th>ប្រភេទ</th><th>តម្លៃ</th><th>ស្តុក</th><th>សកម្មភាព</th></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><div className="admin-product-name"><img src={product.image} alt="" /><span><b>{product.name}</b><small>{product.brand}</small></span></div></td><td>{product.category}</td><td>${product.price}</td><td><span className={product.stock < 5 ? 'stock-low' : 'stock-ok'}>{product.stock} គ្រឿង</span></td><td><button className="table-action" onClick={() => { setEditingProduct(product); setShowForm(true); }}>កែ</button> <button className="table-action" aria-label={`លុប ${product.name}`} onClick={() => removeProductFromStore(product._id)}>លុប</button></td></tr>)}</tbody></table></div>
  </section>;

  const renderOrders = () => <section className="admin-panel"><div className="panel-heading"><div><h2>ការកុម្ម៉ង់ទាំងអស់</h2><p>បញ្ជីនេះធ្វើបច្ចុប្បន្នភាពរៀងរាល់ 15 វិនាទី។ សូមផ្ទៀងផ្ទាត់ការបង់ប្រាក់ក្រៅប្រព័ន្ធ មុនសម្គាល់ថាបានបង់។</p></div></div>{orders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>លេខកុម្ម៉ង់</th><th>អតិថិជន</th><th>ទូរស័ព្ទ</th><th>សរុប</th><th>វិធីបង់/ស្ថានភាពបង់</th><th>ស្ថានភាពកុម្ម៉ង់</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td><b>{order.orderNumber}</b></td><td><b>{order.user?.name || order.customer}</b><small>{order.user?.email || order.email || 'អតិថិជនភ្ញៀវ'}</small></td><td>{order.phone}</td><td>${order.total}</td><td>{order.payment}<br /><select className="status-select" aria-label={`ស្ថានភាពទូទាត់ ${order.orderNumber}`} value={order.paymentStatus || 'Unpaid'} onChange={(event) => changePaymentStatus(order.orderNumber, event.target.value)}><option value="Unpaid">មិនទាន់បង់</option><option value="Paid">បានបង់ប្រាក់</option></select></td><td><select className="status-select" aria-label={`ស្ថានភាពការកុម្ម៉ង់ ${order.orderNumber}`} value={order.status} onChange={(event) => changeStatus(order.orderNumber, event.target.value)}><option>Pending</option><option>Processing</option><option>Completed</option><option>Cancelled</option></select></td></tr>)}</tbody></table></div> : <div className="admin-empty">មិនទាន់មានការកុម្ម៉ង់ទេ។ ការកុម្ម៉ង់ថ្មីនឹងបង្ហាញនៅទីនេះ។</div>}</section>;

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

  const renderReports = () => <div className="admin-panels"><section className="admin-panel"><h2>សង្ខេបរបាយការណ៍</h2><p>ទិន្នន័យដែលបានគណនាពី MongoDB</p><div className="report-total"><span>ប្រាក់ចំណូលពីការកុម្ម៉ង់</span><b>${sales.toLocaleString()}</b></div><div className="report-total"><span>ការកុម្ម៉ង់បានបញ្ចប់</span><b>{adminSummary?.completedCount || 0}</b></div><div className="report-total"><span>កំពុងដំណើរការ</span><b>{adminSummary?.processingCount || 0}</b></div></section><section className="admin-panel"><h2>ផលិតផលពេញនិយម</h2><p>តម្រៀបតាមចំនួនលក់ក្នុងការកុម្ម៉ង់</p>{products.slice(0, 5).map((product) => { const sold = orders.reduce((sum, order) => sum + (order.items || []).filter((item) => String(item.product) === product._id).reduce((n, item) => n + item.quantity, 0), 0); return <div className="report-product" key={product._id}><span>{product.name}</span><b>{sold} គ្រឿង</b></div>; })}</section></div>;

  const content = active.path === '/admin/products' ? renderProducts() : active.path === '/admin/orders' ? renderOrders() : active.path === '/admin/users' ? renderUsers() : active.path === '/admin/reports' ? renderReports() : renderOverview();

  return <main className="admin-shell"><aside className="admin-sidebar"><div className="admin-brand"><span className="brand-mark">P</span><div><b>PHONE KH</b><small>ADMIN PANEL</small></div></div><div className="admin-menu-label">MENU</div>{sections.map((section) => <Link className={`admin-nav-link ${active.path === section.path ? 'active' : ''}`} to={section.path} key={section.path}><span>{section.icon}</span>{section.label}{active.path === section.path && <i />}</Link>)}<div className="admin-sidebar-bottom"><div className="admin-user"><div className="account-avatar">{user?.name?.charAt(0) || 'A'}</div><span><b>{user?.name || 'អ្នកគ្រប់គ្រង'}</b><small>Admin</small></span></div><Link to="/">← ត្រឡប់ទៅហាង</Link></div></aside><section className="admin-main"><header className="admin-topbar"><div><small>PHONE KH / ADMIN</small><h1>{active.label}</h1></div><Link className="admin-view-store" to="/">មើលហាង ↗</Link></header><div className="admin-content">{orderNotice && <div className="admin-order-notice" role="status" aria-live="polite"><span>{orderNotice}</span><button type="button" onClick={() => setOrderNotice('')} aria-label="បិទការជូនដំណឹង">×</button></div>}{error && <div className="form-error">{error}</div>}{content}</div><p className="admin-demo-note">ការគ្រប់គ្រង និងទិន្នន័យត្រូវបានរក្សាទុកក្នុង MongoDB។</p></section></main>;
}

export default AdminPage;
