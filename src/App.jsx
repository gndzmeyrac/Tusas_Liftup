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

  const companyAvg = 3.60;
  const netDiff = (userAvg - companyAvg).toFixed(2);

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
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/86/TUSA%C5%9E_logo.png" className="w-48 mx-auto mb-4" alt="TUSAŞ" />
          <h2 className="text-2xl font-black text-center text-[#1A237E] mb-2">360 Analiz Sistemi</h2>
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
      <aside className="w-80 bg-white border-r border-gray-200 p-8 flex flex-col gap-8 sticky h-screen top-0 shadow-sm">
        <img src="https://upload.wikimedia.org/wikipedia/commons/8/86/TUSA%C5%9E_logo.png" alt="TUSAŞ" className="w-44 mx-auto" />
        
        {currentUser.role === 'admin' ? (
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Çalışan Yönetimi</label>
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#1A237E] outline-none"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {employeeList.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        ) : (
          <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
            <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">Hoş Geldiniz</p>
            <p className="text-sm font-black text-[#1A237E]">{currentUser.name}</p>
          </div>
        )}

        <div className="mt-auto space-y-4">
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-2 shadow-inner">
            <p className="text-[10px] text-gray-500 italic"><b>Sicil:</b> {results.details.id}</p>
            <p className="text-[10px] text-gray-500 italic"><b>Ünvan:</b> {results.details.role}</p>
            <p className="text-[10px] font-bold text-[#1A237E] uppercase"><b>{results.details.yaka.replace('_', ' ')}</b></p>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)} 
            className="w-full p-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
          >
            OTURUMU KAPAT
          </button>
        </div>
      </aside>

      {/* ANA RAPOR ALANI */}
      <main className="flex-1 p-12 max-w-7xl mx-auto overflow-y-auto">
        
        {/* HEADER */}
        <header className="bg-[#1A237E] p-10 rounded-2xl shadow-xl border-b-[10px] border-[#b71c1c] text-white mb-10 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tighter uppercase">BİREYSEL GERİBİLDİRİM RAPORU</h1>
            <p className="text-sm opacity-80 mt-2 font-medium">TUSAŞ Performans Değerlendirme Sistemi | {results.details.yaka.replace('_', ' ').toUpperCase()}</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-full bg-white opacity-5 skew-x-[-20deg] translate-x-32"></div>
        </header>

        {/* PROFIL & BİLGİ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-8 mb-10">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#E8EAF6] border-4 border-[#C5CAE9] flex items-center justify-center text-[#1A237E] text-3xl font-black">
              {selectedUser.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#263238]">{selectedUser}</h2>
              <p className="text-blue-600 text-xs font-bold tracking-widest uppercase">{results.details.role}</p>
            </div>
          </div>
          <div className="bg-white border-l-8 border-[#5C6BC0] p-8 rounded-2xl shadow-sm text-xs leading-relaxed text-gray-600">
            <p><strong>360° Değerlendirme Nedir?</strong> Performance gelişimini bütünsel (holistik) bir bakış açısıyla ele alan, kör noktalarınızı fark etmenizi sağlayan kurumsal gelişim aracıdır.</p>
          </div>
        </div>

        {/* OKUMA KILAVUZU */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-10">
           <h3 className="text-sm font-black text-[#1A237E] mb-6 uppercase tracking-wider">Okuma Kılavuzu</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                 <div className="flex items-center gap-3 text-[11px] font-bold"><span className="w-3 h-3 rounded-full bg-[#EF5350]"></span> 1.0 - 2.9: Gelişim Gerektiren Alan</div>
                 <div className="flex items-center gap-3 text-[11px] font-bold"><span className="w-3 h-3 rounded-full bg-[#FFA726]"></span> 3.0 - 3.4: Beklenen Performans</div>
                 <div className="flex items-center gap-3 text-[11px] font-bold"><span className="w-3 h-3 rounded-full bg-[#66BB6A]"></span> 3.5 - 5.0: Güçlü Yön / Rol Model</div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="fark-box">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Bireysel Skor</p>
            <p className="text-4xl font-black text-[#1A237E]">{userAvg}</p>
          </div>
          <div className="fark-box">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Şirket Ortalaması</p>
            <p className="text-4xl font-black text-gray-600">{companyAvg.toFixed(2)}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white p-10 rounded-2xl shadow-sm border border-gray-100 mb-12">
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={Object.entries(results.summary).map(([k, v]) => ({ subject: formatTitle(k), B: parseFloat(v), G: 3.5 }))}>
                <PolarGrid stroke="#e2e8f0" />
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

        {/* ISI HARİTASI */}
        <h3 className="section-header uppercase">Detaylı Kırılım (Isı Haritası)</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex">
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
                 {Object.entries(results.summary).slice(0, 6).map(([comp, val]) => (
                    <tr key={comp} className="text-center">
                       <td className="p-4 bg-gray-50 font-bold text-left rounded-l-lg border-b border-white">{formatTitle(comp)}</td>
                       <td className={`p-4 font-black text-white ${val >= 3.5 ? 'bg-[#66BB6A]' : 'bg-[#EF5350]'}`}>{val}</td>
                       <td className={`p-4 font-black text-white ${val >= 3.0 ? 'bg-[#66BB6A]' : 'bg-[#FFA726]'}`}>{parseFloat(val - 0.2).toFixed(1)}</td>
                       <td className="p-4 bg-gray-100 font-bold text-gray-500 italic">3.6</td>
                    </tr>
                 ))}
              </tbody>
           </table>
           {/* DİKEY GRADIENT BAR */}
           <div className="w-12 bg-gray-50 border-l border-gray-100 flex flex-col items-center py-10 relative">
              <div className="w-3 h-full bg-gradient-to-t from-[#EF5350] via-[#FFA726] to-[#66BB6A] rounded-full shadow-inner"></div>
              <div className="absolute flex flex-col justify-between h-[80%] right-1 text-[8px] font-black text-gray-400">
                 <span>5.0</span><span>3.0</span><span>1.0</span>
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