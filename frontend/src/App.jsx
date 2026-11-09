import { useEffect, useRef, useState } from 'react';
import { ShopProvider } from './context/ShopContext';
import Navbar from './components/Navbar';
import AppRoutes from './routes/AppRoutes';
import { Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useShop } from './context/useShop';
import { LanguageProvider, TranslateTree } from './context/LanguageProvider';
import { fetchMyContactMessages, replyToMyContactMessage, submitContactMessage } from './services/api';
import './App.css';

function SupportChatWidget({ user, theme }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState('');
  const [unreadReplies, setUnreadReplies] = useState(0);
  const messagesEndRef = useRef(null);
  const widgetRef = useRef(null);
  const isOpenRef = useRef(false);
  const lastNotifiedReplyRef = useRef('');
  const userIdentity = user?.id || user?._id || user?.email;
  const seenStorageKey = userIdentity ? `phonekh-admin-chat-seen:${userIdentity}` : '';
  const conversation = messages.flatMap((message) => [
    { id: `${message._id}-initial`, authorRole: 'customer', body: message.message, createdAt: message.createdAt },
    ...(message.replies || []).map((reply, index) => ({ ...reply, id: `${message._id}-${reply.createdAt || index}` })),
  ]).sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
  const latestActivity = conversation.at(-1)?.createdAt;

  useEffect(() => {
    if (!user || !seenStorageKey) return undefined;
    let active = true;
    const sessionStartedAt = Date.now();
    const refreshMessages = async () => {
      try {
        const result = await fetchMyContactMessages();
        if (!active) return;
        setMessages(result);
        setError('');
        const adminReplies = result.flatMap((message) => (message.replies || []).map((reply, index) => ({
          ...reply,
          id: `${message._id}-${reply.createdAt || index}`,
        }))).filter((reply) => reply.authorRole === 'admin')
          .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
        const storedSeenAt = localStorage.getItem(seenStorageKey);
        const seenAt = storedSeenAt ? Number(storedSeenAt) : sessionStartedAt;
        if (!storedSeenAt) localStorage.setItem(seenStorageKey, String(seenAt));
        const unseenReplies = adminReplies.filter((reply) => new Date(reply.createdAt).getTime() > seenAt);
        setUnreadReplies(unseenReplies.length);
        if (unseenReplies.length && isOpenRef.current) {
          const latestReply = unseenReplies[unseenReplies.length - 1];
          localStorage.setItem(seenStorageKey, String(Math.max(Date.now(), new Date(latestReply.createdAt).getTime())));
          setUnreadReplies(0);
          setNotification('');
          lastNotifiedReplyRef.current = '';
        } else if (unseenReplies.length) {
          const latestReply = unseenReplies[unseenReplies.length - 1];
          if (lastNotifiedReplyRef.current !== latestReply.id) {
            lastNotifiedReplyRef.current = latestReply.id;
            setNotification(latestReply.body);
          }
        } else {
          setNotification('');
          lastNotifiedReplyRef.current = '';
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    };
    refreshMessages();
    const intervalId = window.setInterval(refreshMessages, 15000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user, seenStorageKey]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [isOpen, latestActivity]);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || typeof widget.showPopover !== 'function') return undefined;
    widget.showPopover();
    return () => {
      if (widget.matches(':popover-open')) widget.hidePopover();
    };
  }, []);

  const sendMessage = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      const latestThread = messages[0];
      if (latestThread) await replyToMyContactMessage(latestThread._id, body);
      else await submitContactMessage({ message: body });
      setDraft('');
      setMessages(await fetchMyContactMessages());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  const openChat = () => {
    isOpenRef.current = true;
    if (seenStorageKey) localStorage.setItem(seenStorageKey, String(Date.now()));
    setUnreadReplies(0);
    setNotification('');
    lastNotifiedReplyRef.current = '';
    setIsOpen(true);
  };

  const closeChat = () => {
    isOpenRef.current = false;
    setIsOpen(false);
  };

  return createPortal(
    <div ref={widgetRef} className="support-chat-widget" data-theme={theme} popover="manual">
      {notification && !isOpen && <aside className="support-chat-notification" role="status" aria-live="polite">
        <div><b>Admin បានឆ្លើយតប</b><p>{notification}</p></div>
        <button type="button" className="support-chat-notification-open" onClick={openChat}>មើល</button>
        <button type="button" className="support-chat-notification-close" aria-label="បិទការជូនដំណឹង" onClick={() => setNotification('')}>×</button>
      </aside>}
      {isOpen && <section className="support-chat-panel" role="dialog" aria-modal="false" aria-labelledby="support-chat-title">
        <header><div><h2 id="support-chat-title">ជំនួយ PHONE KH</h2><p>ផ្ញើសារទៅកាន់ Admin</p></div><button type="button" aria-label="បិទ chat" onClick={closeChat}>×</button></header>
        {!user ? <div className="support-chat-login"><p>សូមចូលគណនី ដើម្បីផ្ញើសារ និងទទួលចម្លើយពី Admin។</p><Link className="button-primary" to="/login?next=/account">ចូលគណនី</Link></div> : <>
          <div className="support-chat-messages" aria-live="polite">
            {error && <p className="form-error" role="alert">{error}</p>}
            {conversation.length ? conversation.map((message) => <article className={`support-chat-bubble ${message.authorRole === 'admin' ? 'admin' : 'customer'}`} key={message.id}>
              <b>{message.authorRole === 'admin' ? 'PHONE KH · Admin' : 'អ្នក'}</b><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time><p>{message.body}</p>
            </article>) : <p className="support-chat-empty">សួស្តី! តើអ្នកត្រូវការជំនួយអ្វី?</p>}
            <div ref={messagesEndRef} />
          </div>
          <form className="support-chat-reply" onSubmit={sendMessage}>
            <textarea aria-label="សរសេរសារទៅ Admin" value={draft} maxLength="5000" rows="2" required placeholder="សរសេរសាររបស់អ្នក..." onChange={(event) => setDraft(event.target.value)} />
            <button className="button-primary" type="submit" disabled={sending || !draft.trim()}>{sending ? 'កំពុងផ្ញើ...' : 'ផ្ញើសារ'}</button>
          </form>
        </>}
      </section>}
      <button className="support-chat-launcher" type="button" aria-label={isOpen ? 'បិទ chat' : unreadReplies ? `Admin បានឆ្លើយតប ${unreadReplies} សារ` : 'ទាក់ទង Admin'} aria-expanded={isOpen} onClick={isOpen ? closeChat : openChat}>
        {isOpen ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6a7.5 7.5 0 1 1 17-3.5Z" /><path d="M8 11h8M8 14h5" /></svg>}
        {!isOpen && unreadReplies > 0 && <span className="support-chat-unread">{unreadReplies > 9 ? '9+' : unreadReplies}</span>}
      </button>
    </div>,
    document.body,
  );
}

function AppLayout() {
  const { apiError, setApiError, user } = useShop();
  const { pathname } = useLocation();
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem('phonekh-theme');
    return ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'system';
  });
  const [systemTheme, setSystemTheme] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const theme = themeMode === 'system' ? systemTheme : themeMode;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('phonekh-theme', themeMode);
    if (themeMode !== 'system') return undefined;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = (event) => setSystemTheme(event.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', updateSystemTheme);
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, [themeMode]);

  if (pathname.startsWith('/admin')) {
    return <div className="app-container" data-theme={theme}><AppRoutes /></div>;
  }

  return (
    <div className="app-container" data-theme={theme}>
      <Navbar theme={theme} themeMode={themeMode} setThemeMode={setThemeMode} />
      {apiError && <TranslateTree><div className="api-alert" role="alert"><span>{apiError}</span><button onClick={() => setApiError('')} aria-label="បិទសារកំហុស">×</button></div></TranslateTree>}
      <AppRoutes />
      <TranslateTree><SupportChatWidget key={user?.id || user?._id || user?.email || 'guest'} user={user} theme={theme} /></TranslateTree>
      <TranslateTree><footer className="footer">
        <div className="footer-main">
          <div className="footer-brand"><strong>PHONE<span>KH</span></strong><p>បច្ចេកវិទ្យាទំនើប សម្រាប់ជីវិតប្រចាំថ្ងៃរបស់អ្នក។</p></div>
          <div><b>សេវាកម្មអតិថិជន</b><Link to="/about">អំពី PHONE KH</Link><Link to="/contact">ទាក់ទងមកយើង</Link></div>
          <div><b>ការទិញទំនិញ</b><Link to="/products">ផលិតផលទាំងអស់</Link><Link to="/account">ប្រវត្តិការកុម្ម៉ង់</Link></div>
          <div><b>ទំនាក់ទំនង</b><span>ភ្នំពេញ, កម្ពុជា</span><span>+855 69 601 345</span><span>barangloso@gmail.com</span></div>
        </div>
        <div className="footer-bottom">© 2026 PHONE KH. រក្សាសិទ្ធិគ្រប់យ៉ាង។ <span>ការទូទាត់មានសុវត្ថិភាព · KHQR · COD</span></div>
      </footer></TranslateTree>
    </div>
  );
}

function App() {
  return <ShopProvider><LanguageProvider><AppLayout /></LanguageProvider></ShopProvider>;
}

export default App;
