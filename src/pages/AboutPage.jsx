import React from 'react';

function AboutPage() {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ color: '#00f2fe', textAlign: 'center', marginBottom: '20px' }}>
        អំពីហាង PHONE KH
      </h1>
      
      <div style={{ backgroundColor: '#1a2238', padding: '30px', borderRadius: '12px', lineHeight: '1.8' }}>
        <h3>👋 ស្វាគមន៍មកកាន់ PHONE KH</h3>
        <p>
          PHONE KH គឺជាហាងលក់ទូរស័ព្ទដៃឆ្លាតវៃ (Smartphones) និងគ្រឿងបន្លាស់អេឡិចត្រូនិចដែលមានគុណភាពខ្ពស់ 
          ព្រមទាំងមានការធានាត្រឹមត្រូវជូនអតិថិជនទាំងអស់។
        </p>

        <h4 style={{ color: '#00f2fe', marginTop: '20px' }}>🎯 បេសកកម្មរបស់យើង</h4>
        <p>
          ផ្តល់ជូននូវផលិតផលបច្ចេកវិទ្យាទំនើបៗ តម្លៃសមរម្យ និងសេវាកម្មអតិថិជនល្អបំផុត 
          ដើម្បីឱ្យការរស់នៅបែបឌីជីថលរបស់អ្នកកាន់តែងាយស្រួល។
        </p>

        <h4 style={{ color: '#00f2fe', marginTop: '20px' }}>📍 ព័ត៌មានទំនាក់ទំនង</h4>
        <ul>
          <li><strong>អាសយដ្ឋាន៖</strong> រាជធានីភ្នំពេញ, ព្រះរាជាណាចក្រកម្ពុជា</li>
          <li><strong>លេខទូរស័ព្ទ៖</strong> 012 345 678 / 098 765 432</li>
          <li><strong>អ៊ីមែល៖</strong> info@phonekh.com</li>
          <li><strong>ម៉ោងធ្វើការ៖</strong> រៀងរាល់ថ្ងៃ 8:00 AM - 8:00 PM</li>
        </ul>
      </div>
    </div>
  );
}

export default AboutPage;