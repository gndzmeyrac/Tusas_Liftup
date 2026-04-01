import React, { useState, useMemo } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell
} from 'recharts';

// Mantık ve Veri Importları
import { calculateScores } from './utils/calculators';
import { generateDevelopmentPlan } from './utils/engine';
import allData from './data/input/faz0_sentetik_veri.json';
import users from './data/users.json';

// --- YARDIMCI: BAŞLIK DÜZELTİCİ (MAPPING) ---
const formatTitle = (text) => {
  const mapping = {
    "acik_iletisim_ve_bilgi_paylasimi": "Açık İletişim",
    "problem_cozme_ve_analitik_dusunme": "Analitik Düşünme",
    "teknik_uzmanlik_ve_alan_bilgisi": "Teknik Uzmanlık",
    "yonetsel_cesaret_ve_karar_kalitesi": "Yönetsel Cesaret",
    "isbirligi_ve_kapsayici_calisma": "İş Birliği",
    "surec_ve_prosedur_disiplini": "Süreç Disiplini",
    "emniyet_kalite_ve_risk_farkindaligi": "Emniyet ve Risk",
    "etik_durus_ve_mesleki_cesaret": "Etik Duruş",
    "stratejik_dusunme_ve_vizyon_olusturma": "Stratejik Düşünme"
  };
  return mapping[text] || text.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const App = () => {
  // --- AUTH STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState("");

  // --- DASHBOARD STATES ---
  const employeeList = useMemo(() => [...new Set(allData.map(d => d.employee_name))].sort(), []);
  const [selectedUser, setSelectedUser] = useState(employeeList[0]);

  // --- HESAPLAMA MANTIKLARI ---
  const results = useMemo(() => calculateScores(allData, selectedUser), [selectedUser]);
  const devPlan = useMemo(() => results ? generateDevelopmentPlan(results.summary) : [], [results]);

  const userAvg = useMemo(() => {
    if (!results) return 0;
    const scores = Object.values(results.summary).map(Number);
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
  }, [results]);
  const selfAvg = 3.1;
  const companyAvg = 3.60;
  const netDiff = (userAvg - companyAvg).toFixed(2);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // --- LOGIN HANDLER ---
  const handleLogin = (e) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (foundUser) {
      setIsLoggedIn(true);
      setCurrentUser(foundUser);
      if (foundUser.role === 'user') setSelectedUser(foundUser.name);
      setLoginError("");
    } else {
      setLoginError("Kullanıcı adı veya şifre hatalı!");
    }
  };

  // 1. GİRİŞ EKRANI (LOGIN)
  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1A237E]">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-2xl shadow-2xl w-[400px] flex flex-col gap-5">
          <img src="\logo_tusas.jpg" className="w-48 mx-auto mb-4" alt="TUSAŞ" />
          <h2 className="text-2xl font-black text-center text-[#1A237E] mb-2">360° Değerlendirme Sistemi</h2>
          <input 
            type="text" placeholder="Kullanıcı Adı" required
            className="p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-[#b71c1c] transition-all"
            onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
          />
          <input 
            type="password" placeholder="Şifre" required
            className="p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-[#b71c1c] transition-all"
            onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
          />
          {loginError && <p className="text-red-600 text-xs font-bold text-center">{loginError}</p>}
          <button className="bg-[#1A237E] text-white p-4 rounded-xl font-bold hover:bg-[#b71c1c] transition-all shadow-lg active:scale-95">
            GİRİŞ YAP
          </button>
        </form>
      </div>
    );
  }

  // 2. RAPOR EKRANI (DASHBOARD)
  return (
    <div className="min-h-screen flex bg-[#F8F9FA]">
      
            {/* SIDEBAR */}
      <aside className={`transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col sticky h-screen top-0 shadow-sm ${isCollapsed ? 'w-20' : 'w-80'}`}>
        
        {/* Daraltma / Açma Butonu */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 text-gray-500 z-50"
        >
          {isCollapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          )}
        </button>

        {/* LOGO ALANI */}
        <div className="p-6 border-b border-gray-50 flex justify-center">
          <img 
            src="\logo_sidebar.png" 
            alt="TUSAŞ" 
            className={`transition-all duration-300 ${isCollapsed ? 'w-10' : 'w-40'}`} 
          />
        </div>

        <div className={`flex-1 flex flex-col p-6 overflow-hidden ${isCollapsed ? 'items-center' : 'gap-8'}`}>
          
          {/* KULLANICI / ADMIN YÖNETİMİ */}
          {currentUser.role === 'admin' ? (
            <div className="w-full space-y-3">
              {!isCollapsed && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Çalışan Yönetimi</label>}
              <div className="relative group">
                <select 
                  className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#1A237E] outline-none transition-all ${isCollapsed ? 'opacity-0 cursor-default' : 'opacity-100'}`}
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  disabled={isCollapsed}
                >
                  {employeeList.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                {isCollapsed && (
                  <div className="flex flex-col items-center text-[#1A237E] hover:bg-gray-100 p-2 rounded-lg cursor-pointer">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg transition-all ${isCollapsed ? 'hidden' : 'block'}`}>
              <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">Hoş Geldiniz</p>
              <p className="text-sm font-black text-[#1A237E]">{currentUser.name}</p>
            </div>
          )}

          {/* ALT BİLGİ & ÇIKIŞ */}
          <div className="mt-auto w-full space-y-4">
            {/* Kart Bilgileri */}
            {!isCollapsed ? (
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-2 shadow-inner overflow-hidden animate-in fade-in duration-500">
                <p className="text-[10px] text-gray-500 italic truncate text-nowrap"><b>Sicil:</b> {results.details.id}</p>
                <p className="text-[10px] text-gray-500 italic truncate text-nowrap"><b>Ünvan:</b> {results.details.role}</p>
                <p className="text-[10px] font-bold text-[#1A237E] uppercase"><b>{results.details.yaka.replace('_', ' ')}</b></p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400 gap-4 mb-4">
                <div title="Profil Bilgileri" className="p-2 hover:bg-gray-100 rounded-lg cursor-help">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
            )}

            {/* Çıkış Butonu */}
            <button 
              onClick={() => setIsLoggedIn(false)} 
              className={`w-full flex items-center justify-center gap-3 p-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-100 ${isCollapsed ? 'border-none bg-transparent hover:bg-red-50' : ''}`}
              title="Oturumu Kapat"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              {!isCollapsed && <span>OTURUMU KAPAT</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ANA RAPOR ALANI */}
      <main className="flex-1 p-12 max-w-7xl mx-auto overflow-y-auto">
        
        {/* HEADER */}
        <header className="bg-[#1A237E] p-10 rounded-2xl shadow-xl border-b-[10px] border-[#b71c1c] text-white mb-10 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tighter uppercase">360° DEĞERLENDİRME</h1>
            <p className="text-sm opacity-80 mt-2 font-medium">TUSAŞ Performans Değerlendirme Sistemi | {results.details.yaka.replace('_', ' ').toUpperCase()}</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-full bg-white opacity-5 skew-x-[-20deg] translate-x-32"></div>
        </header>

        {/* PROFIL & BİLGİ KISMI - BU KODU KOPYALAYIP YAPIŞTIR */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-8 mb-10 items-start">
          
          {/* Profil Kartı (Aynı Kaldı) */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6 h-full">
            <div className="w-20 h-20 rounded-full bg-[#E8EAF6] border-4 border-[#C5CAE9] flex items-center justify-center text-[#1A237E] text-3xl font-black shrink-0">
              {selectedUser.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#263238] leading-tight">{selectedUser}</h2>
              <p className="text-blue-600 text-xs font-bold tracking-widest uppercase mt-1">{results.details.role}</p>
            </div>
          </div>

          {/* YENİ TASARIM: Dikkat Çeken Bilgilendirme Kutusu */}
          <div className="bg-white border-l-[12px] border-[#5C6BC0] p-10 rounded-2xl shadow-lg text-sm text-gray-700 space-y-8">
            
            {/* Bölüm 1: Nedir? */}
            <div>
              <h3 className="text-lg font-extrabold text-[#1A237E] mb-3 flex items-center gap-3">
                {/* Opsiyonel: Soru İşareti İkonu */}
                <span className="w-2 h-2 rounded-full bg-[#5C6BC0]"></span>
                360° Değerlendirme Nedir?
              </h3>
              <p className="leading-relaxed pl-5 border-l-2 border-gray-100">
                Çalışanın yetkinliklerini; yöneticisi, çalışma arkadaşları ve paydaşlarından gelen geri bildirimlerle, tek bir açı yerine her yönden (**360 derece**) analiz eden bütünsel bir gelişim aracıdır.
              </p>
            </div>

            {/* Bölüm 2: Ne Sunar? (Liste Yapısı) */}
            <div>
              <h3 className="text-lg font-extrabold text-[#1A237E] mb-5 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#5C6BC0]"></span>
                Bu Rapor Ne Sunmaktadır?
              </h3>
              
              {/* Maddeleri liste yapısına (ul/li) çevirdik */}
              <ul className="space-y-4 pl-5">
                <li className="flex gap-3 items-start">
                  <span className="text-[#5C6BC0] font-bold mt-0.5">•</span>
                  <p>
                    <strong className="text-gray-900 font-bold">Kişisel Farkındalık:</strong>{' '}
                    Güçlü yönlerinizi ve gelişim alanlarınızı objektif verilerle görmenizi sağlar.
                  </p>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-[#5C6BC0] font-bold mt-0.5">•</span>
                  <p>
                    <strong className="text-gray-900 font-bold">Yapay Zeka Destekli Plan:</strong>{' '}
                    Düşük puanlı yetkinlikleriniz için size özel hazırlanmış izleme, okuma ve uygulama
                    önerileri sunar.
                  </p>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-[#5C6BC0] font-bold mt-0.5">•</span>
                  <p>
                    <strong className="text-gray-900 font-bold">Sürekli Gelişim:</strong>{' '}
                    Ara dönem değerlendirmeleri için size ve yöneticinize rehberlik edecek bir yol haritası oluşturur.
                  </p>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* OKUMA KILAVUZU */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-10">
           <h3 className="text-sm font-black text-[#1A237E] mb-6 uppercase tracking-wider">Okuma Kılavuzu</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                 <div className="flex items-center gap-3 text-[11px] font-bold"><span className="w-3 h-3 rounded-full bg-[#EF5350]"></span> 1.0 - 2.9: Gelişim Gerektiren Alan</div>
                 <div className="flex items-center gap-3 text-[11px] font-bold"><span className="w-3 h-3 rounded-full bg-[#FFA726]"></span> 3.0 - 3.4: İyileştirme</div>
                 <div className="flex items-center gap-3 text-[11px] font-bold"><span className="w-3 h-3 rounded-full bg-[#66BB6A]"></span> 3.5 - 5.0: Güçlü Yön </div>
              </div>
              <div className="border-l border-gray-100 pl-10 space-y-2 text-[11px] text-gray-500">
                 <p><b>B (Bireysel):</b> Sizin aldığınız puan.</p>
                 <p><b>G (Genel):</b> Şirket genel ortalaması.</p>
                 <p><b>Odak Alanı:</b> İyileştirilmesi gereken en spesifik nokta.</p>
              </div>
           </div>
        </section>

        {/* PERFORMANS ÖZETİ */}
        <h3 className="section-header uppercase">Performans Özeti</h3>
                {/* GAP ANALİZ BARI */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 h-48 overflow-hidden">
            <h3 className="text-sm font-extrabold text-[#1A237E] mb-5 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#5C6BC0]"></span>
                Bu GAP Analiz Barı Ne Sunmaktadır?
            </h3>
            <div className='text-sm mb-8'>
            <p> <strong className="text-gray-900 font-bold">Öz Değerlendirme:</strong>{' '} Çalışanın kendi yetkinliklerini nasıl gördüğüne dair verdiği puan.</p>

            <p><strong className="text-gray-900 font-bold">Bireysel Skor:</strong>{' '} Diğer çalışanların (yönetici, iş arkadaşları, paydaşlar) size verdiği değerlendirme notlarının ortalaması.</p>

            <p><strong className="text-gray-900 font-bold">Şirket Ortalaması:</strong>{' '} İlgili yetkinlik alanında kurum genelinde ulaşılan başarı düzeyi.</p>

            <p><strong className="text-gray-900 font-bold">Net Fark:</strong>{' '} Şirket ortalaması ve öz değerlendirme ile bireysel skor arasındaki farkın analizi (Kişinin potansiyelini ve gelişim alanlarını belirler).</p>
   
            </div>  
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="fark-box">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Öz Değerlendirme</p>
            <p className="text-4xl font-black text-gray-600">{selfAvg}</p>
          </div>
          <div className="fark-box">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Bireysel Skor</p>
            <p className="text-4xl font-black text-[#1A237E]">{userAvg}</p>
          </div>
          <div className="fark-box">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Şirket Ortalaması</p>
            <p className="text-4xl font-black text-[#FF9800] ">{companyAvg.toFixed(2)}</p>
          </div>
          <div className="fark-box">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Net Fark</p>
            <p className={`text-4xl font-black ${netDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>{netDiff >= 0 ? `+${netDiff}` : netDiff}</p>
          </div>
        </div>

        {/* GAP ANALİZ BARI */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-12 h-24 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={[{name: 'Gap', B: parseFloat(userAvg), G: companyAvg}]} margin={{left: -40, right: 20}}>
              <XAxis type="number" domain={[0, 5]} hide />
              <YAxis type="category" dataKey="name" hide />
              <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: 10, fontWeight: 900}} />
              <Bar name="Şirket Ortalaması (G)" dataKey="G" stackId="a" fill="#FF9800" barSize={30} radius={[15, 0, 0, 15]} />
              <Bar name="Bireysel Skor (B)" dataKey="B" stackId="a" fill="#1A237E" barSize={30} radius={[0, 15, 15, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* YETKİNLİK ANALİZİ */}
        <h3 className="section-header uppercase">Yetkinlik Analizi</h3>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-4 h-24 overflow-hidden">
            <h3 className="text-sm font-extrabold text-[#1A237E] mb-3 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#5C6BC0]"></span>
                Bu Radar Grafik Ne Sunmaktadır?
            </h3>
            <div className='text-sm mb-6'>
              <p>Radar grafik, çalışanın mevcut yetkinlik düzeyini şirket ortalamasıyla aynı düzlemde kıyaslayarak, güçlü yanlarını ve gelişim odaklı açık noktalarını tek bir görsel üzerinden raporlar.</p>
            </div>  
          </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white p-10 rounded-2xl shadow-sm border border-gray-100 mb-12">
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={Object.entries(results.summary).map(([k, v]) => ({ subject: formatTitle(k), B: parseFloat(v), G: 3.5 }))}>
                <PolarGrid stroke="#90A4AE" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#1A237E', fontWeight: 900 }} />
                <Legend wrapperStyle={{fontSize: 10, fontWeight: 900, paddingTop: 20}} />
                <Radar name="Şirket Ortalaması (G)" dataKey="G" stroke="#90A4AE" strokeDasharray="4 4" fill="#90A4AE" fillOpacity={0.1} />
                <Radar name="Bireysel Skor (B)" dataKey="B" stroke="#1A237E" strokeWidth={4} fill="#1A237E" fillOpacity={0.5} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-col justify-center space-y-4">
             <h4 className="text-[10px] font-black text-gray-400 uppercase italic border-b pb-2">Detaylı Puan Dağılımı</h4>
             {Object.entries(results.summary).sort((a,b) => b[1] - a[1]).map(([k,v]) => (
               <div key={k} className="grid grid-cols-[1fr,2fr,auto] items-center gap-4 text-[11px]">
                  <span className="font-bold text-gray-700">{formatTitle(k)}</span>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                     <div className={`h-full ${v >= 3.5 ? 'bg-[#66BB6A]' : v >= 3.0 ? 'bg-[#FFA726]' : 'bg-[#EF5350]'}`} style={{width: `${(v/5)*100}%`}}></div>
                  </div>
                  <span className="font-black text-[#1A237E]">{v}</span>
               </div>
             ))}
          </div>
        </div>
        {/* ISI HARİTASI - GÜNCELLENMİŞ VERSİYON */}
        <h3 className="section-header uppercase">Detaylı Kırılım (Isı Haritası)</h3>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-4 h-30 overflow-hidden">
            <h3 className="text-sm font-extrabold text-[#1A237E] mb-3 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#5C6BC0]"></span>
                Bu Isı Haritası Ne Sunmaktadır?
            </h3>
            <div className='text-sm mb-6'>
              <p>Detaylı Kırılım Isı Haritası, çalışanın her bir yetkinlik alanındaki performansını puan bazlı renk kodlarıyla görselleştirerek, şirket ortalamasına göre hangi noktalarda tam uyum sağladığını veya gelişim göstermesi gerektiğini tek bir tabloda sunar.</p>
            </div>  
          </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex items-stretch">

            
            {/* TABLO BÖLÜMÜ */}
            <table className="flex-1 text-xs border-separate border-spacing-1 p-6">
                <thead>
                    <tr className="text-[10px] text-gray-400 font-black uppercase text-center">
                        <th className="p-3 text-left">Yetkinlik Alanı</th>
                        <th className="p-3">Yönetici</th>
                        <th className="p-3">Ekip/Akran</th>
                        <th className="p-3 bg-gray-50 rounded-t-lg">Genel Ort.</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(results.summary).slice(0, 9).map(([comp, val]) => (
                        <tr key={comp} className="text-center">
                            <td className="p-4 bg-gray-50 font-bold text-left rounded-l-lg border-b border-white">{formatTitle(comp)}</td>
                            {/* Önemli: Gerçek renk mantığı val değişkenine göre belirlenmeli, aşağıdaki manuel renkler sadece örnek */}
                            <td className={`p-4 font-black text-white ${val >= 3.5 ? 'bg-[#66BB6A]' : val >= 3.0 ? 'bg-[#FFA726]' : 'bg-[#EF5350]'}`}>{val}</td>
                            <td className={`p-4 font-black text-white ${parseFloat(val - 0.2) >= 3.5 ? 'bg-[#66BB6A]' : parseFloat(val - 0.2) >= 3.0 ? 'bg-[#FFA726]' : 'bg-[#EF5350]'}`}>{parseFloat(val - 0.2).toFixed(1)}</td>
                            <td className="p-4 bg-gray-100 font-bold text-gray-500 italic">3.6</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* SAĞ TARAF: OKUMA KILAVUZU + DİKEY BAR */}
            <div className="flex border-l border-gray-100 bg-gray-50">
                
                {/* YENİ EKLENEN: OKUMA KILAVUZU (YATAYDAN DİKEYE) */}
                <div className="p-8 flex flex-col justify-center gap-3 text-xs border-r border-gray-100 min-w-[160px]">
                    <h4 className="text-[10px] font-black text-[#1A237E] uppercase mb-1 tracking-widest text-center">Okuma Kılavuzu</h4>
                    
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#EF5350]"></span>
                        <span className="font-medium text-gray-600">1.0 - 2.9: <strong className="text-gray-900">Gelişim Alanı</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#FFA726]"></span>
                        <span className="font-medium text-gray-600">3.0 - 3.4: <strong className="text-gray-900">İyileştirme</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#66BB6A]"></span>
                        <span className="font-medium text-gray-600">3.5 - 5.0: <strong className="text-gray-900">Güçlü Yön</strong></span>
                    </div>
                </div>

                {/* MEVCUT DİKEY GRADIENT BAR (Küçük Düzeltmelerle) */}
                <div className="w-8 flex flex-col items-center py-10 relative ">
                    <div className="w-3 h-full bg-gradient-to-t from-[#EF5350] via-[#FFA726] to-[#66BB6A] rounded-full shadow-inner"></div>
                    <div className="absolute flex flex-col justify-between h-[50%] -left-1 text-[8px] font-black text-gray-400">
                        <span>5.0</span>
                        <span>3.0</span>
                        <span>1.0</span>
                    </div>
                </div>
            </div>
        </div>

        {/* STRATEJİK GELİŞİM PLANI */}
        <h3 className="section-header uppercase">Stratejik Gelişim Planı</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {['weak', 'medium', 'strong'].map(level => {
            const items = devPlan.filter(p => p.seviye === level);
            const m = { 
              weak: { t: "ÖNCELİKLİ GELİŞİM", c: "bg-[#C62828]", b: "border-t-[#C62828]" },
              medium: { t: "İYİLEŞTİRME", c: "bg-[#EF6C00]", b: "border-t-[#EF6C00]" },
              strong: { t: "GÜÇLÜ YÖNLER", c: "bg-[#2E7D32]", b: "border-t-[#2E7D32]" }
            }[level];
            return (
              <div key={level} className="space-y-4">
                <div className={`${m.c} text-white text-[10px] font-black p-3 rounded-lg text-center tracking-widest shadow-md`}>{m.t}</div>
                {items.length > 0 ? items.map((item, i) => (
                  <div key={i} className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-t-4 ${m.b}`}>
                    <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-2">
                       <span className="text-[11px] font-black text-[#1A237E]">{formatTitle(item.yetkinlik)}</span>
                       <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded text-white ${m.c}`}>SKOR: {item.skor}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 italic leading-relaxed mb-4">"{item.tavsiye}"</p>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-2 py-1 rounded uppercase tracking-tighter">{item.odakAlani}</span>
                    </div>
                  </div>
                )) : <div className="text-center p-10 text-gray-300 text-xs italic border border-dashed rounded-xl">Kayıt bulunamadı.</div>}
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
};

export default App;