import { Link } from 'react-router-dom';

function AboutPage() {
  return <main className="about-page">
    <header className="about-hero"><span className="eyebrow">អំពី PHONE KH</span><h1>បច្ចេកវិទ្យា សម្រាប់មនុស្សគ្រប់គ្នា</h1><p>យើងជឿថាបច្ចេកវិទ្យាល្អគួរតែមានគុណភាព តម្លៃសមរម្យ និងងាយស្រួលសម្រាប់មនុស្សគ្រប់គ្នា។</p></header>
    <section className="content-wrap about-content"><div><span className="eyebrow">រឿងរ៉ាវរបស់យើង</span><h2>ជម្រើសបច្ចេកវិទ្យាដែលអ្នកទុកចិត្ត</h2><p>PHONE KH ជាហាងលក់ទូរស័ព្ទ និងគ្រឿងបន្លាស់បច្ចេកវិទ្យានៅកម្ពុជា។ យើងជ្រើសរើសផលិតផលដោយយកចិត្តទុកដាក់ ដើម្បីផ្ដល់ជូនអតិថិជននូវទំនិញមានប្រភពច្បាស់លាស់ ការធានាត្រឹមត្រូវ និងសេវាកម្មដែលគិតពីតម្រូវការរបស់អ្នក។</p><p>ក្រុមការងាររបស់យើងត្រៀមផ្ដល់ជំនួយមុន និងក្រោយពេលទិញ ដើម្បីឱ្យអ្នកប្រើប្រាស់ផលិតផលថ្មីដោយទំនុកចិត្ត។</p><Link className="button-primary" to="/products">ស្វែងរកផលិតផល →</Link></div><div className="about-cards"><div><b>2,500+</b><small>អតិថិជនពេញចិត្ត</small></div><div><b>100%</b><small>ផលិតផលមានគុណភាព</small></div><div><b>12 ខែ</b><small>ការធានាផលិតផល</small></div><div><b>7 ថ្ងៃ</b><small>សេវាកម្មអតិថិជន</small></div></div></section>
  </main>;
}

export default AboutPage;
