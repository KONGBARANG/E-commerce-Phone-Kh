import { Link } from 'react-router-dom';
import { TranslateTree } from '../context/LanguageProvider';

const serviceHighlights = [
  {
    number: '01',
    title: 'ជ្រើសរើសដោយយកចិត្តទុកដាក់',
    description: 'យើងផ្ដោតលើផលិតផលដែលមានប្រភពច្បាស់លាស់ និងព័ត៌មានលម្អិតងាយយល់។',
  },
  {
    number: '02',
    title: 'តម្លៃសមរម្យ និងច្បាស់លាស់',
    description: 'ស្វែងរកទូរស័ព្ទ និងគ្រឿងបន្លាស់តាមតម្រូវការ ដោយងាយស្រួលប្រៀបធៀប។',
  },
  {
    number: '03',
    title: 'ជួយអ្នកគ្រប់ដំណាក់កាល',
    description: 'ក្រុមការងាររបស់យើងត្រៀមឆ្លើយសំណួរ និងជួយអ្នកមុននិងក្រោយពេលទិញ។',
  },
];

function AboutPage() {
  return (
    <TranslateTree>
      <main className="about-page">
        <header className="about-hero">
          <div className="about-hero-content">
            <span className="about-hero-pill"><i /> អំពី PHONE KH</span>
            <h1>បច្ចេកវិទ្យា សម្រាប់មនុស្សគ្រប់គ្នា</h1>
            <p>ជួយឱ្យការស្វែងរកទូរស័ព្ទ និងគ្រឿងបន្លាស់ដែលសាកសមនឹងអ្នក កាន់តែងាយស្រួល និងមានទំនុកចិត្ត។</p>
            <Link className="about-hero-link" to="/products">រុករកផលិតផល</Link>
          </div>
          <div className="about-hero-decoration" aria-hidden="true">
            <span className="about-orbit about-orbit-one" />
            <span className="about-orbit about-orbit-two" />
            <div className="about-device-card"><span>PHONE</span><b>KH</b><i>TECH FOR EVERYONE</i></div>
          </div>
        </header>

        <section className="content-wrap about-content">
          <article className="about-story">
            <span className="eyebrow">រឿងរ៉ាវរបស់យើង</span>
            <h2>បច្ចេកវិទ្យាដែលអ្នកអាចទុកចិត្ត</h2>
            <p>PHONE KH ជាហាងលក់ទូរស័ព្ទ និងគ្រឿងបន្លាស់នៅកម្ពុជា។ យើងចង់ធ្វើឱ្យការជ្រើសរើសផលិតផលបច្ចេកវិទ្យាកាន់តែសាមញ្ញ ដោយផ្ដល់ព័ត៌មានច្បាស់លាស់ និងជម្រើសសមស្របតាមតម្រូវការរបស់អ្នក។</p>
            <p>មិនថាអ្នកកំពុងស្វែងរកទូរស័ព្ទថ្មី ឬគ្រឿងបន្លាស់ប្រើប្រាស់ប្រចាំថ្ងៃទេ យើងនៅទីនេះដើម្បីជួយអ្នកស្វែងរកជម្រើសដែលត្រូវចិត្ត។</p>
            <Link className="button-primary about-story-link" to="/products">រុករកផលិតផលទាំងអស់</Link>
          </article>

          <aside className="about-promise">
            <div className="about-promise-heading">
              <span className="about-promise-mark">P</span>
              <div><small>PHONE KH</small><h2>អ្វីដែលយើងយកចិត្តទុកដាក់</h2></div>
            </div>
            <div className="about-promise-list">
              <div><span>✓</span><p>ព័ត៌មានផលិតផលច្បាស់លាស់</p></div>
              <div><span>✓</span><p>ជម្រើសងាយស្រួលសម្រាប់អ្នក</p></div>
              <div><span>✓</span><p>សេវាកម្មដោយយកចិត្តទុកដាក់</p></div>
            </div>
          </aside>
        </section>

        <section className="content-wrap about-service-section">
          <div className="about-section-heading">
            <span className="eyebrow">បទពិសោធន៍ទិញទំនិញ</span>
            <h2>សេវាកម្មដែលគិតពីអ្នក</h2>
            <p>ពីការស្វែងរក រហូតដល់ពេលទទួលបានផលិតផល យើងចង់ឱ្យអ្នកមានបទពិសោធន៍ងាយស្រួល និងច្បាស់លាស់។</p>
          </div>
          <div className="about-cards">
            {serviceHighlights.map((highlight) => (
              <article className="about-service-card" key={highlight.number}>
                <span>{highlight.number}</span>
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-wrap about-cta">
          <div><span className="eyebrow">ចាប់ផ្ដើមស្វែងរក</span><h2>ផលិតផលដែលសាកសមនឹងអ្នក កំពុងរង់ចាំនៅទីនេះ</h2></div>
          <Link className="button-primary" to="/products">ទៅកាន់ហាង</Link>
        </section>
      </main>
    </TranslateTree>
  );
}

export default AboutPage;
