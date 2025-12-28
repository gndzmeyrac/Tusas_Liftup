import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.figure_factory as ff
from PIL import Image, ImageOps, ImageDraw

# 1. SAYFA AYARLARI VE ESTETİK CSS DÜZENLEMESİ
st.set_page_config(page_title="TUSAŞ LiftUp | 360 Analiz", layout="centered")

st.markdown("""
    <style>
    /* Sayfanın en üstündeki boşluğu yok etme */
    .main .block-container {
        padding-top: 2rem !important; 
        max-width: 850px;
    }
    
    /* Başlık Kartı Düzenlemesi */
    .report-header { 
        background-color: #1A237E; 
        padding: 35px 20px; 
        border-radius: 8px; 
        color: white; 
        text-align: center; 
        margin-bottom: 50px; /* Başlık ile altındaki içerik (avatar) arasındaki boşluk */
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    
    /* Profil Alanı Düzenlemesi */
    .profile-section {
        margin-top: 20px;
        margin-bottom: 30px;
    }

    .section-header { 
        border-left: 8px solid #1A237E; padding: 10px 15px; margin-top: 40px; margin-bottom: 20px;
        color: #1A237E; font-size: 19px; font-weight: bold; background-color: #F0F2F6;
    }

    @media print {
        .main .block-container { padding-top: 0 !important; }
        @page { margin-top: 0.5cm; }
    }
    </style>
    """, unsafe_allow_html=True)

# 2. VERİ SETİ (İÇERİK AYNI TUTULDU)
competency_data = {
    'Yetkinlik': ['Analitik', 'Emniyet', 'Etik Duruş', 'Süreç', 'Teknik', 'İletişim', 'İşbirliği'],
    'Puan': [4.09, 2.53, 3.56, 4.02, 4.33, 3.36, 4.04],
    'Seviye': ['STRONG', 'WEAK', 'STRONG', 'STRONG', 'STRONG', 'MEDIUM', 'STRONG']
}
df = pd.DataFrame(competency_data)

survey_data = {
    'Davranış Göstergesi': ['Açık hedef ve sorumluluklar verir.', 'Hedeflerin gerçekleşmesini takip eder.', 'Teknik bilgi birikimine ve uzmanlığa sahiptir.', 'Teknik bilgilerini sürekli yeniler.', 'Problemlerde teknik bilgisini etkin kullanır.'],
    'Kendi': [4.0, 3.0, 4.0, 3.0, 4.0], 'Üst': [4.0, 5.0, 3.0, 4.0, 4.0], 'Eş': [2.0, 4.0, 4.0, 3.0, 5.0], 'Ast': [4.0, 4.0, 5.0, 4.0, 4.0], 'Dış Müşteri': [3.5, 3.5, 3.5, 4.0, 2.0], 'Genel Ort.': [3.4, 4.0, 3.8, 3.8, 3.4]
}
df_survey = pd.DataFrame(survey_data)

# 3. ÜST PANEL (BOŞLUKLAR DÜZENLENDİ)
st.markdown('<div class="report-header"><h1>360° Bireysel Geribildirim Raporu</h1></div>', unsafe_allow_html=True)

# Avatar ve İsim arasına güvenli bir mesafe eklendi
st.markdown('<div class="profile-section">', unsafe_allow_html=True)
col_p1, col_p2 = st.columns([1, 2.2])
with col_p1:
    try:
        # Yuvarlak Avatar Yapımı
        img = Image.open("merve.png")
        size = (300, 300)
        mask = Image.new('L', size, 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0) + size, fill=255)
        output = ImageOps.fit(img, size, centering=(0.5, 0.5))
        output.putalpha(mask)
        st.image(output, width=160)
    except:
        st.info("Profil Fotoğrafı")
with col_p2:
    st.markdown("<h2 style='margin-bottom:5px;'>Merve Karaca</h2>", unsafe_allow_html=True)
    st.markdown("<p style='font-size:18px; color:#555;'>Mühendis<br><b>Sicil No:</b> 0001 | <b>Tarih:</b> 27.12.2025</p>", unsafe_allow_html=True)
st.markdown('</div>', unsafe_allow_html=True)

# 4. FARK SKORU
st.markdown('<div class="section-header">📊 Yetkinlik Fark Analizi</div>', unsafe_allow_html=True)
fig_fark = go.Figure()
fig_fark.add_trace(go.Bar(x=[5], y=[""], orientation='h', marker=dict(color='#F2F4F4'), width=0.3, showlegend=False))
fig_fark.add_trace(go.Scatter(x=[3.4], y=[""], mode="markers+text", text=["G"], marker=dict(size=30, color="#F39C12")))
fig_fark.add_trace(go.Scatter(x=[3.5], y=[""], mode="markers+text", text=["K"], marker=dict(size=30, color="#1A237E")))
fig_fark.update_layout(xaxis=dict(range=[1, 5]), yaxis=dict(visible=False), height=140, width=700, margin=dict(t=10,b=10), plot_bgcolor="white")
st.plotly_chart(fig_fark, use_container_width=False)

col_f1, col_f2, col_f3 = st.columns(3)
with col_f1: st.markdown('<div class="fark-box"><div class="fark-label">Kendisi</div><div class="fark-val">3.5</div></div>', unsafe_allow_html=True)
with col_f2: st.markdown('<div class="fark-box"><div class="fark-label">Genel Ort.</div><div class="fark-val">3.4</div></div>', unsafe_allow_html=True)
with col_f3: st.markdown('<div class="fark-box"><div class="fark-label">Net Fark</div><div class="fark-val" style="color:#D32F2F;">-0.1</div></div>', unsafe_allow_html=True)

# 5. YETENEK HARİTASI
st.markdown('<div class="section-header">🔍 Yetenek Haritası</div>', unsafe_allow_html=True)
fig_radar = go.Figure()
fig_radar.add_trace(go.Scatterpolar(r=[3.8, 3.2, 3.7, 3.9, 4.1, 3.5, 3.8, 3.8], theta=df['Yetkinlik'].tolist() + [df['Yetkinlik'].iloc[0]], fill='toself', name='Genel'))
fig_radar.add_trace(go.Scatterpolar(r=df['Puan'].tolist() + [df['Puan'].iloc[0]], theta=df['Yetkinlik'].tolist() + [df['Yetkinlik'].iloc[0]], fill='toself', name='Bireysel', line=dict(color="#1A237E", width=3)))
fig_radar.update_layout(polar=dict(radialaxis=dict(visible=True, range=[0, 5])), height=400, width=700, margin=dict(t=50, b=50))
st.plotly_chart(fig_radar, use_container_width=False)

# 6. ANKET SONUÇLARI
st.markdown('<div class="section-header">📋 Detaylı Anket Analizi</div>', unsafe_allow_html=True)

z_values = df_survey.drop('Davranış Göstergesi', axis=1).values
x_labels = df_survey.columns[1:].tolist()
y_labels = df_survey['Davranış Göstergesi'].tolist()
orange_blue_scale = [[0.0, "#E9E087"],   # 1-2 Puan: Çok Açık Sarı (Neredeyse Beyaz)
    [0.2, "#FFF59D"],   # 2-3 Puan: Belirgin Açık Sarı
    [0.5, "#F39C12"],   # 3-4 Puan: Canlı Turuncu
    [0.8, "#FF7E38"],   # 4-4.5 Puan: Koyu Yanık Turuncu
    [1.0, "#E74C3C"]# Koyu Mavi
]
# Isı haritasını oluştur (xgap ve ygap kenar çizgilerini sağlar)
fig_table = ff.create_annotated_heatmap(
    z=z_values, 
    x=x_labels, 
    y=y_labels, 
    colorscale=orange_blue_scale, 
    showscale=False,
    xgap=2, # Kutucuklar arası yatay boşluk (Çizgi görünümü)
    ygap=2  # Kutucuklar arası dikey boşluk
)

# OKUNAKLILIK DÜZENLEMESİ: Renk tonuna göre yazı rengini belirleme
for i in range(len(fig_table.layout.annotations)):
    val = float(fig_table.layout.annotations[i].text)
    # Puan 4.2'den büyükse (Koyu Mavi) beyaz, değilse siyah font
    if val > 4.2:
        fig_table.layout.annotations[i].font.color = 'white'
    else:
        fig_table.layout.annotations[i].font.color = 'black'
    fig_table.layout.annotations[i].font.size = 12

fig_table.update_layout(
    height=400, 
    width=850, 
    margin=dict(l=300, r=20, t=50, b=20), 
    font=dict(size=12),
    plot_bgcolor='#E0E0E0' # Kenar çizgilerinin rengini (gri) belirler
)

st.plotly_chart(fig_table, use_container_width=False)

# 7. DEĞERLENDİRİCİ DAĞILIM
st.markdown('<div class="section-header">🎯 Değerlendirici Dağılım Analizi (K-Ü-E)</div>', unsafe_allow_html=True)
dist_data = {'Analitik': [3.5, 4.2, 4.0], 'Emniyet': [3.0, 2.0, 2.6], 'Etik Duruş': [3.8, 4.0, 3.4], 'Süreç': [4.2, 4.0, 3.8], 'Teknik': [3.7, 4.0, 4.2], 'İletişim': [3.1, 3.5, 3.4], 'İşbirliği': [4.0, 4.2, 3.9]}
fig_dist = go.Figure()
for group, color in zip(['K', 'Ü', 'E'], ['#1A237E', '#E74C3C', '#3498DB']):
    scores = [dist_data[y][['K','Ü','E'].index(group)] for y in df['Yetkinlik']]
    fig_dist.add_trace(go.Scatter(x=scores, y=df['Yetkinlik'], mode='markers+text', name=group, text=[group for _ in scores], marker=dict(size=22, color=color)))
fig_dist.update_layout(xaxis=dict(range=[1, 5]), height=380, width=700, margin=dict(l=100, r=20), plot_bgcolor='white')
st.plotly_chart(fig_dist, use_container_width=False)

# 8. ÖNERİLER
st.markdown('<div class="section-header">💡 Gelişim Tavsiyeleri</div>', unsafe_allow_html=True)
c1, c2 = st.columns(2)
with c1:
    st.error("**🔴 Kritik Gelişim:** SOP ve talimat uyumu artırılmalı.")
    st.warning("**🟡 İletişim:** Görüşler daha net ifade edilmeli.")
with c2:
    st.success("**🟢 Analitik:** Ekibe mentörlük yapılmalı.")
    st.success("**🟢 Teknik:** Sertifika programları takip edilmeli.")

st.caption("TUSAŞ Akademisi - 2025")