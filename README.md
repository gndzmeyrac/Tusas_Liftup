🚀 Projeyi Kendi Bilgisayarınızda ÇalıştırınBu proje React (Vite) ve Python (Veri İşleme/Analiz) kullanılarak geliştirilmiştir. Projeyi sorunsuz bir şekilde çalıştırmak için aşağıdaki adımları sırasıyla takip edin.1. Ön Gereksinimlerin KontrolüTerminalinizi (VS Code içinde Ctrl + J) açın ve sisteminizde gerekli araçların olup olmadığını kontrol edin:AraçKontrol KomutuGerekli Sürüm (Önerilen)Node.jsnode -vv18.0.0+npmnpm -vv9.0.0+Pythonpython --versionv3.10+Not: Eğer komutu yazdığınızda hata alıyorsanız o araç yüklü değildir.2. Eksik Araçların KurulumuEğer yukarıdaki araçlar yüklü değilse:Node.js: nodejs.org adresinden "LTS" sürümünü indirin.Python: python.org adresinden indirin. (Kurulumda "Add Python to PATH" kutucuğunu işaretlemeyi unutmayın!)3. Projeyi Kurma ve ÇalıştırmaAşağıdaki komutları sırasıyla terminale yapıştırın:A. Frontend (Arayüz) KurulumuBash# Gerekli paketleri yükleyin
npm install

# Projeyi lokal sunucuda başlatın
npm run dev
Terminalde çıkan http://localhost:5173 bağlantısına tıklayarak arayüzü görüntüleyebilirsiniz.B. Backend / Python Ortamı KurulumuPython dosyalarını çalıştırmadan önce temiz bir ortam oluşturun:Bash# Sanal ortam oluşturun (Klasör adı .venv olur)
python -m venv .venv

# Sanal ortamı aktif edin (Windows için)
.venv\Scripts\activate

# Gerekli kütüphaneleri yükleyin
pip install -r requirements.txt
🛠 Kullanılan TeknolojilerFrontend: React, Tailwind CSS, ViteVeri Görselleştirme: Plotly, RechartsBackend/Data: Python, Pandas💡 İpucu: VS Code EklentileriDaha iyi bir geliştirme deneyimi için şu eklentileri kurmanızı öneririm:ESLint (Kod standartları için)Tailwind CSS IntelliSense (Tasarım için)Python (Microsoft resmi eklentisi)