/* ============================================
   Fluxora — Internationalization (i18n) v2
   Full-site translation: EN / ZH / FR / ES / JA / KO
   ============================================ */

(function () {
  'use strict';

  var SUPPORTED = ['en', 'zh', 'fr', 'es', 'ja', 'ko'];
  var LABELS = { en: 'English', zh: '中文', fr: 'Français', es: 'Español', ja: '日本語', ko: '한국어' };

  var dict = {

    // ── NAV ──
    'nav.freecount':  { en:'Free Uses', zh:'免费次数', fr:'Gratuits', es:'Usos Gratis', ja:'無料回数', ko:'무료 횟수' },
    'nav.license':    { en:'My License', zh:'我的权益', fr:'Ma Licence', es:'Mi Licencia', ja:'マイライセンス', ko:'내 라이선스' },

    // ── HERO ──
    'hero.badge':     { en:'Try free — no signup needed', zh:'免费试用 — 无需注册', fr:'Essai gratuit — sans inscription', es:'Prueba gratis — sin registro', ja:'無料トライアル — 登録不要', ko:'무료 체험 — 가입 불필요' },
    'hero.title1':    { en:'Convert any file,', zh:'转换任何文件，', fr:'Convertissez tout fichier,', es:'Convierte cualquier archivo,', ja:'あらゆるファイルを変換、', ko:'모든 파일을 변환,' },
    'hero.title2':    { en:'right in your browser', zh:'就在你的浏览器中', fr:'directement dans votre navigateur', es:'directamente en tu navegador', ja:'ブラウザ上で直接', ko:'브라우저에서 바로' },
    'hero.subtitle':  { en:'100% private. Your files never leave your device. Convert images, PDFs, audio, and video — all processed locally.', zh:'100% 私密。文件不会离开你的设备。转换图片、PDF、音频和视频——全部本地处理。', fr:'100% privé. Vos fichiers ne quittent jamais votre appareil. Convertissez images, PDF, audio et vidéo — tout est traité localement.', es:'100% privado. Tus archivos nunca salen de tu dispositivo. Convierte imágenes, PDF, audio y video — todo procesado localmente.', ja:'100%プライベート。ファイルが端末から出ることはありません。画像、PDF、音声、動画をすべてローカル処理。', ko:'100% 비공개. 파일이 기기를 떠나지 않습니다. 이미지, PDF, 오디오, 비디오를 모두 로컬에서 처리합니다.' },
    'hero.cta1':      { en:'Start Converting', zh:'开始转换', fr:'Commencer', es:'Comenzar', ja:'変換を始める', ko:'변환 시작' },
    'hero.cta2':      { en:'View Pricing', zh:'查看定价', fr:'Voir les prix', es:'Ver Precios', ja:'料金を見る', ko:'가격 보기' },
    'hero.stat1':     { en:'Tool Categories', zh:'工具类别', fr:'Catégories', es:'Categorías', ja:'ツールカテゴリ', ko:'도구 카테고리' },
    'hero.stat2':     { en:'Uploads Required', zh:'需要上传', fr:'Téléchargements', es:'Subidas', ja:'アップロード', ko:'업로드 필요' },
    'hero.stat3':     { en:'Lifetime Access', zh:'终身使用', fr:'Accès à vie', es:'Acceso Vitalicio', ja:'生涯アクセス', ko:'평생 이용' },

    // ── TOOL CARDS ──
    'tool.image':     { en:'Image Studio', zh:'图片工坊', fr:'Studio Image', es:'Estudio de Imagen', ja:'画像スタジオ', ko:'이미지 스튜디오' },
    'tool.imageDesc': { en:'Convert between JPG, PNG, WebP, AVIF, SVG. Resize and optimize.', zh:'支持 JPG、PNG、WebP 等多种格式互转，智能压缩优化。', fr:'Convertissez entre JPG, PNG, WebP, AVIF, SVG. Redimensionnez et optimisez.', es:'Convierte entre JPG, PNG, WebP, AVIF, SVG. Redimensiona y optimiza.', ja:'JPG、PNG、WebP、AVIF、SVG間で変換。リサイズと最適化。', ko:'JPG, PNG, WebP, AVIF, SVG 간 변환. 크기 조정 및 최적화.' },
    'tool.pdf':       { en:'PDF Master', zh:'PDF 助手', fr:'Maître PDF', es:'Maestro PDF', ja:'PDFマスター', ko:'PDF 마스터' },
    'tool.pdfDesc':   { en:'Merge, split, and convert PDF files. Document processing made efficient.', zh:'PDF 合并、拆分、转换，文档处理更高效。', fr:'Fusionnez, divisez et convertissez des PDF. Traitement efficace.', es:'Une, divide y convierte archivos PDF. Procesamiento eficiente.', ja:'PDFの結合、分割、変換。効率的な文書処理。', ko:'PDF 병합, 분할, 변환. 효율적인 문서 처리.' },
    'tool.audio':     { en:'Audio Lab', zh:'音频实验室', fr:'Lab Audio', es:'Laboratorio de Audio', ja:'オーディオラボ', ko:'오디오 랩' },
    'tool.audioDesc': { en:'Convert between MP3, WAV, OGG, AAC, FLAC, M4A. Lossless quality.', zh:'MP3、WAV、OGG、AAC、FLAC、M4A 等音频格式转换，音质无损。', fr:'Convertissez entre MP3, WAV, OGG, AAC, FLAC, M4A. Qualité sans perte.', es:'Convierte entre MP3, WAV, OGG, AAC, FLAC, M4A. Calidad sin pérdida.', ja:'MP3、WAV、OGG、AAC、FLAC、M4A間で変換。ロスレス品質。', ko:'MP3, WAV, OGG, AAC, FLAC, M4A 간 변환. 무손실 품질.' },
    'tool.video':     { en:'Video Factory', zh:'视频工厂', fr:'Usine Vidéo', es:'Fábrica de Video', ja:'ビデオファクトリー', ko:'비디오 팩토리' },
    'tool.videoDesc': { en:'Convert video to GIF. Compress without quality loss.', zh:'视频转 GIF、压缩、格式转换，轻松处理视频文件。', fr:'Convertissez vidéo en GIF. Compressez sans perte.', es:'Convierte video a GIF. Comprime sin perder calidad.', ja:'動画をGIFに変換。品質を損なわずに圧縮。', ko:'비디오를 GIF로 변환. 품질 손실 없이 압축.' },
    'tool.tier':      { en:'From', zh:'起', fr:'À partir de', es:'Desde', ja:'から', ko:'부터' },

    // ── TOOL CARD FEATURES ──
    'feat.jpg2png':   { en:'JPG to PNG', zh:'JPG 转 PNG', fr:'JPG vers PNG', es:'JPG a PNG', ja:'JPG → PNG', ko:'JPG → PNG' },
    'feat.png2jpg':   { en:'PNG to JPG', zh:'PNG 转 JPG', fr:'PNG vers JPG', es:'PNG a JPG', ja:'PNG → JPG', ko:'PNG → JPG' },
    'feat.imgCompress':{ en:'Image Compression', zh:'图片压缩', fr:'Compression d\'image', es:'Compresión de imagen', ja:'画像圧縮', ko:'이미지 압축' },
    'feat.pdfMerge':  { en:'PDF Merge', zh:'PDF 合并', fr:'Fusion PDF', es:'Unir PDF', ja:'PDF結合', ko:'PDF 병합' },
    'feat.pdfSplit':  { en:'PDF Split', zh:'PDF 拆分', fr:'Division PDF', es:'Dividir PDF', ja:'PDF分割', ko:'PDF 분할' },
    'feat.docConv':   { en:'Document Conversion', zh:'文档转换', fr:'Conversion de document', es:'Conversión de documento', ja:'文書変換', ko:'문서 변환' },
    'feat.mp32wav':   { en:'MP3 to WAV', zh:'MP3 转 WAV', fr:'MP3 vers WAV', es:'MP3 a WAV', ja:'MP3 → WAV', ko:'MP3 → WAV' },
    'feat.wav2mp3':   { en:'WAV to MP3', zh:'WAV 转 MP3', fr:'WAV vers MP3', es:'WAV a MP3', ja:'WAV → MP3', ko:'WAV → MP3' },
    'feat.audioCompress':{ en:'Audio Compression', zh:'音频压缩', fr:'Compression audio', es:'Compresión de audio', ja:'音声圧縮', ko:'오디오 압축' },
    'feat.video2gif': { en:'Video to GIF', zh:'视频转 GIF', fr:'Vidéo en GIF', es:'Video a GIF', ja:'動画→GIF', ko:'비디오→GIF' },
    'feat.videoCompress':{ en:'Video Compression', zh:'视频压缩', fr:'Compression vidéo', es:'Compresión de video', ja:'動画圧縮', ko:'비디오 압축' },
    'feat.formatConv':{ en:'Format Conversion', zh:'格式转换', fr:'Conversion de format', es:'Conversión de formato', ja:'形式変換', ko:'형식 변환' },

    // ── HOW IT WORKS ──
    'section.how':    { en:'How It Works', zh:'如何使用', fr:'Comment ça marche', es:'Cómo Funciona', ja:'使い方', ko:'사용 방법' },
    'section.howSub': { en:'Three steps, all in your browser. No account required.', zh:'三步完成，全在浏览器中，无需账号。', fr:'Trois étapes, tout dans votre navigateur.', es:'Tres pasos, todo en tu navegador.', ja:'3ステップ、すべてブラウザ内。', ko:'세 단계, 모두 브라우저에서.' },
    'step1.title':    { en:'Choose a File', zh:'选择文件', fr:'Choisir un fichier', es:'Elegir Archivo', ja:'ファイルを選ぶ', ko:'파일 선택' },
    'step1.desc':     { en:'Select any supported file from your device. Nothing leaves your computer.', zh:'从设备中选择任意支持的文件，不会离开你的电脑。', fr:'Sélectionnez un fichier depuis votre appareil.', es:'Selecciona cualquier archivo compatible.', ja:'端末から対応ファイルを選択。', ko:'기기에서 지원 파일 선택.' },
    'step2.title':    { en:'Convert Instantly', zh:'即时转换', fr:'Conversion instantanée', es:'Convertir al Instante', ja:'即座に変換', ko:'즉시 변환' },
    'step2.desc':     { en:'Your browser does the work. Web Workers keep everything smooth and fast.', zh:'浏览器完成所有工作，Web Worker 保持流畅高速。', fr:'Votre navigateur fait tout le travail.', es:'Tu navegador hace el trabajo.', ja:'ブラウザが処理。Web Workerで高速。', ko:'브라우저가 처리. 웹 워커로 빠르게.' },
    'step3.title':    { en:'Download Result', zh:'下载结果', fr:'Télécharger le résultat', es:'Descargar Resultado', ja:'結果をダウンロード', ko:'결과 다운로드' },
    'step3.desc':     { en:'Get your converted file instantly. High quality with no watermarks.', zh:'立即获取转换后的文件，高清无水印。', fr:'Obtenez votre fichier instantanément.', es:'Obtén tu archivo al instante.', ja:'変換ファイルをすぐに取得。', ko:'변환 파일을 즉시 획득.' },

    // ── PRICING ──
    'section.pricing':    { en:'Simple, One-Time Pricing', zh:'灵活定价方案', fr:'Tarification unique', es:'Precios Simples', ja:'シンプルな料金', ko:'간단한 가격' },
    'section.pricingSub': { en:'Pay once, use forever. No subscriptions. All plans include lifetime access.', zh:'一次性付费，终身使用。所有方案均含终身访问权限。', fr:'Payez une fois, utilisez à vie.', es:'Paga una vez, para siempre.', ja:'一度の支払いで生涯利用。', ko:'한 번 지불, 평생 사용.' },
    'price.image':   { en:'Image Plan', zh:'图片套餐', fr:'Forfait Image', es:'Plan Imagen', ja:'画像プラン', ko:'이미지 플랜' },
    'price.pdf':     { en:'PDF Plan', zh:'PDF 套餐', fr:'Forfait PDF', es:'Plan PDF', ja:'PDFプラン', ko:'PDF 플랜' },
    'price.audio':   { en:'Audio Plan', zh:'音频套餐', fr:'Forfait Audio', es:'Plan Audio', ja:'オーディオプラン', ko:'오디오 플랜' },
    'price.all':     { en:'All Access', zh:'全能套餐', fr:'Accès Complet', es:'Acceso Total', ja:'オールアクセス', ko:'올 액세스' },
    'price.free':    { en:'Free', zh:'免费', fr:'Gratuit', es:'Gratis', ja:'無料', ko:'무료' },
    'price.freeDesc':{ en:'1 trial conversion at standard quality', zh:'1次免费标清试用', fr:'1 essai en qualité standard', es:'1 prueba en calidad estándar', ja:'標準品質で1回試用', ko:'표준 품질 1회 체험' },
    'price.popular': { en:'Popular', zh:'热门', fr:'Populaire', es:'Popular', ja:'人気', ko:'인기' },
    'price.buy':     { en:'Buy Now', zh:'立即购买', fr:'Acheter', es:'Comprar Ahora', ja:'今すぐ購入', ko:'지금 구매' },
    'price.current': { en:'Current Plan', zh:'当前方案', fr:'Forfait actuel', es:'Plan Actual', ja:'現在のプラン', ko:'현재 플랜' },
    'price.fAllImg':   { en:'All image conversion tools', zh:'所有图片转换工具', fr:'Tous les outils image', es:'Todas las herramientas de imagen', ja:'すべての画像変換ツール', ko:'모든 이미지 변환 도구' },
    'price.fHD':       { en:'HD quality output', zh:'高清无水印输出', fr:'Sortie qualité HD', es:'Salida calidad HD', ja:'HD品質出力', ko:'HD 품질 출력' },
    'price.fNoPDF':    { en:'PDF tools', zh:'PDF 工具', fr:'Outils PDF', es:'Herramientas PDF', ja:'PDFツール', ko:'PDF 도구' },
    'price.fNoAudio':  { en:'Audio tools', zh:'音频工具', fr:'Outils audio', es:'Herramientas de audio', ja:'オーディオツール', ko:'오디오 도구' },
    'price.fNoVideo':  { en:'Video tools', zh:'视频工具', fr:'Outils vidéo', es:'Herramientas de video', ja:'ビデオツール', ko:'비디오 도구' },
    'price.fImgPDF':   { en:'Image + PDF tools', zh:'图片 + PDF 工具', fr:'Outils Image + PDF', es:'Herramientas Imagen + PDF', ja:'画像+PDFツール', ko:'이미지+PDF 도구' },
    'price.fMerge':    { en:'PDF merge & split', zh:'PDF 合并拆分', fr:'Fusion et division PDF', es:'Unir y dividir PDF', ja:'PDF結合・分割', ko:'PDF 병합 분할' },
    'price.fAll3':     { en:'Image + PDF + Audio tools', zh:'图片 + PDF + 音频工具', fr:'Outils Image+PDF+Audio', es:'Herramientas Imagen+PDF+Audio', ja:'画像+PDF+音声ツール', ko:'이미지+PDF+오디오 도구' },
    'price.fAudioConv':{ en:'Audio format conversion', zh:'音频格式转换', fr:'Conversion audio', es:'Conversión de audio', ja:'音声形式変換', ko:'오디오 형식 변환' },
    'price.fAudioComp':{ en:'Audio compression', zh:'音频压缩', fr:'Compression audio', es:'Compresión de audio', ja:'音声圧縮', ko:'오디오 압축' },
    'price.fAll':      { en:'All tools unlocked', zh:'所有工具解锁', fr:'Tous les outils débloqués', es:'Todas las herramientas', ja:'全ツール解放', ko:'모든 도구 잠금 해제' },
    'price.fGIF':      { en:'Video to GIF', zh:'视频转 GIF', fr:'Vidéo en GIF', es:'Video a GIF', ja:'動画→GIF', ko:'비디오→GIF' },
    'price.fVideoComp':{ en:'Video compression', zh:'视频压缩', fr:'Compression vidéo', es:'Compresión de video', ja:'動画圧縮', ko:'비디오 압축' },
    'price.fAllFeat':  { en:'All premium features', zh:'全部高级功能', fr:'Toutes les fonctions premium', es:'Todas las funciones premium', ja:'全プレミアム機能', ko:'모든 프리미엄 기능' },
    'price.fFewerAds': { en:'Fewer ads', zh:'减少广告', fr:'Moins de publicités', es:'Menos anuncios', ja:'広告減少', ko:'광고 감소' },
    'price.fNoAds':    { en:'Ads displayed', zh:'展示广告', fr:'Annonces affichées', es:'Anuncios mostrados', ja:'広告表示', ko:'광고 표시' },
    'price.fTools':    { en:'All tools available', zh:'所有工具可用', fr:'Tous les outils disponibles', es:'Todas las herramientas disponibles', ja:'すべてのツール利用可能', ko:'모든 도구 사용 가능' },
    'price.fSD':       { en:'Standard quality output', zh:'标清输出', fr:'Qualité standard', es:'Calidad estándar', ja:'標準品質出力', ko:'표준 품질 출력' },
    'price.fNoWatermark':{ en:'No watermarks', zh:'无水印', fr:'Sans filigrane', es:'Sin marcas de agua', ja:'透かしなし', ko:'워터마크 없음' },
    'price.fLifetime': { en:'Lifetime access', zh:'终身使用', fr:'Accès à vie', es:'Acceso vitalicio', ja:'生涯アクセス', ko:'평생 이용' },

    // ── SHARE ──
    'share.title':    { en:'Share for More Free Uses', zh:'分享获得更多使用次数', fr:'Partagez pour plus d\'utilisations', es:'Comparte para Más Usos', ja:'共有して無料利用回数を増やす', ko:'공유로 더 많은 무료 이용' },
    'share.desc':     { en:'Get up to 3 free HD conversions every day', zh:'每天最多可获得 3 次免费高清使用机会', fr:'Jusqu\'à 3 conversions HD gratuites par jour', es:'Hasta 3 conversiones HD gratis al día', ja:'毎日最大3回の無料HD変換', ko:'매일 최대 3회 무료 HD 변환' },
    'share.hook':     { en:'Share with friends who need this too!', zh:'快分享给你正在为这些事情烦恼的朋友们吧！', fr:'Partagez avec vos amis qui en ont besoin !', es:'¡Comparte con amigos que también lo necesiten!', ja:'困っている友達にも教えてあげよう！', ko:'이런 고민 하는 친구들에게 공유하세요!' },
    'share.btn':      { en:'Share Now', zh:'立即分享获取', fr:'Partager', es:'Compartir Ahora', ja:'今すぐ共有', ko:'지금 공유하기' },
    'share.limit':    { en:'Daily share limit reached (3/3)', zh:'今日分享次数已用完 (3/3)', fr:'Limite quotidienne atteinte (3/3)', es:'Límite diario alcanzado (3/3)', ja:'本日の共有上限に達しました (3/3)', ko:'오늘 공유 한도 도달 (3/3)' },
    'share.limitBtn': { en:'Daily limit reached', zh:'今日分享已达上限', fr:'Limite quotidienne atteinte', es:'Límite diario alcanzado', ja:'本日の上限に達しました', ko:'오늘 한도 도달' },
    'share.earned':   { en:'Earned 1 free HD conversion!', zh:'获得 1 次免费高清机会！', fr:'+1 conversion HD gratuite !', es:'+1 conversión HD gratis!', ja:'無料HD変換+1！', ko:'무료 HD 변환 +1!' },
    'share.remain':   { en:'remaining', zh:'剩余', fr:'restant', es:'restante', ja:'残り', ko:'남음' },

    // ── FORMAT SELECTOR ──
    'format.label':   { en:'Select Output Format', zh:'选择输出格式', fr:'Sélectionner le format', es:'Seleccionar formato', ja:'出力形式を選択', ko:'출력 형식 선택' },
    'format.detected':{ en:'Input', zh:'输入', fr:'Entrée', es:'Entrada', ja:'入力', ko:'입력' },

    // ── UPLOAD ──
    'upload.drop':    { en:'Click or drag files here', zh:'点击或拖拽文件至此', fr:'Cliquez ou glissez les fichiers', es:'Clic o arrastra archivos', ja:'クリックまたはドラッグ', ko:'클릭 또는 드래그' },
    'upload.select':  { en:'Select File', zh:'选择文件', fr:'Sélectionner', es:'Seleccionar', ja:'ファイル選択', ko:'파일 선택' },
    'upload.supported':{ en:'Supports multiple formats', zh:'支持多种格式', fr:'Formats multiples supportés', es:'Múltiples formatos', ja:'複数形式対応', ko:'여러 형식 지원' },
    'upload.processing':{ en:'Processing...', zh:'正在处理中...', fr:'Traitement...', es:'Procesando...', ja:'処理中...', ko:'처리 중...' },
    'upload.complete':{ en:'Conversion Complete', zh:'转换完成', fr:'Conversion terminée', es:'Conversión Completa', ja:'変換完了', ko:'변환 완료' },
    'upload.start':   { en:'Start Conversion', zh:'开始转换', fr:'Démarrer', es:'Iniciar', ja:'変換開始', ko:'변환 시작' },
    'upload.sdDl':    { en:'SD Download (1 credit)', zh:'标清下载（消耗 1 次）', fr:'Téléchargement SD (1 crédit)', es:'Descarga SD (1 crédito)', ja:'SDダウンロード(1P)', ko:'SD 다운로드(1크레딧)' },
    'upload.hdDl':    { en:'HD Download (Premium)', zh:'高清下载（仅限付费）', fr:'Téléchargement HD (Premium)', es:'Descarga HD (Premium)', ja:'HDダウンロード(プレミアム)', ko:'HD 다운로드(프리미엄)' },
    'upload.hdDlAll': { en:'Download All Files', zh:'下载全部文件', fr:'Tout télécharger', es:'Descargar todo', ja:'すべてDL', ko:'전체 다운로드' },

    // ── GUIDES ──
    'section.guides':    { en:'Guides & Tutorials', zh:'指南与教程', fr:'Guides & Tutoriels', es:'Guías y Tutoriales', ja:'ガイド＆チュートリアル', ko:'가이드 및 튜토리얼' },
    'section.guidesSub': { en:'Learn how to get the most out of your file conversions', zh:'了解如何充分发挥文件转换的潜力', fr:'Apprenez à tirer le meilleur parti de vos conversions', es:'Aprende a sacar el máximo provecho', ja:'ファイル変換を最大限に活用', ko:'파일 변환을 최대한 활용하세요' },
    'guide.pngvwebp':    { en:'PNG vs WebP: Which Format Should You Use?', zh:'PNG vs WebP：该用哪种格式？', fr:'PNG vs WebP : Quel format ?', es:'PNG vs WebP: ¿Qué formato?', ja:'PNG vs WebP：どちら？', ko:'PNG vs WebP: 어떤 형식?' },
    'guide.pdftojpg':    { en:'How to Convert PDF to JPG: Complete Guide', zh:'PDF转JPG完整指南', fr:'Comment convertir PDF en JPG', es:'Cómo convertir PDF a JPG', ja:'PDF→JPG完全ガイド', ko:'PDF→JPG 완전 가이드' },
    'guide.audio':       { en:'MP3 vs WAV vs FLAC vs AAC: Ultimate Guide', zh:'MP3 vs WAV vs FLAC vs AAC 终极指南', fr:'MP3 vs WAV vs FLAC vs AAC', es:'MP3 vs WAV vs FLAC vs AAC', ja:'MP3 vs WAV vs FLAC vs AAC', ko:'MP3 vs WAV vs FLAC vs AAC' },
    'guide.videotogif':  { en:'How to Convert Video to GIF: Complete Guide', zh:'视频转GIF完整指南', fr:'Comment convertir vidéo en GIF', es:'Cómo convertir video a GIF', ja:'動画→GIF完全ガイド', ko:'비디오→GIF 완전 가이드' },
    'guide.compress':    { en:'Complete Guide to Image Compression', zh:'图片压缩完整指南', fr:'Guide compression d\'image', es:'Guía de compresión de imagen', ja:'画像圧縮完全ガイド', ko:'이미지 압축 완전 가이드' },
    'guide.imgguide':    { en:'Image Guide', zh:'图片指南', fr:'Guide Image', es:'Guía de Imagen', ja:'画像ガイド', ko:'이미지 가이드' },
    'guide.pdftutorial': { en:'PDF Tutorial', zh:'PDF 教程', fr:'Tutoriel PDF', es:'Tutorial PDF', ja:'PDFチュートリアル', ko:'PDF 튜토리얼' },
    'guide.audioguide':  { en:'Audio Guide', zh:'音频指南', fr:'Guide Audio', es:'Guía de Audio', ja:'オーディオガイド', ko:'오디오 가이드' },
    'guide.videotutorial':{ en:'Video Tutorial', zh:'视频教程', fr:'Tutoriel Vidéo', es:'Tutorial de Video', ja:'ビデオチュートリアル', ko:'비디오 튜토리얼' },
    'guide.optimization':{ en:'Optimization', zh:'优化', fr:'Optimisation', es:'Optimización', ja:'最適化', ko:'최적화' },
    'guide.privacyTag': { en:'Privacy & Security', zh:'隐私与安全', fr:'Confidentialité', es:'Privacidad', ja:'プライバシー', ko:'개인정보 보안' },
    'guide.privacy':    { en:'Why Browser-Based File Conversion Protects Your Privacy', zh:'为什么浏览器端文件转换更能保护你的隐私', fr:'Pourquoi la conversion locale protège votre vie privée', es:'Por qué la conversión local protege tu privacidad', ja:'ブラウザ変換がプライバシーを守る理由', ko:'브라우저 파일 변환이 개인정보를 보호하는 이유' },

    // ── FOOTER ──
    'footer.privacy': { en:'Privacy Policy', zh:'隐私政策', fr:'Confidentialité', es:'Privacidad', ja:'プライバシー', ko:'개인정보' },
    'footer.cookie':  { en:'Cookie Policy', zh:'Cookie 政策', fr:'Cookies', es:'Cookies', ja:'クッキー', ko:'쿠키' },
    'footer.terms':   { en:'Terms of Use', zh:'使用条款', fr:'Conditions', es:'Términos', ja:'利用規約', ko:'이용약관' },
    'footer.contact': { en:'Contact', zh:'联系方式', fr:'Contact', es:'Contacto', ja:'お問合せ', ko:'문의' },

    // ── TOAST ──
    'toast.shareOk':    { en:'You earned 1 free HD conversion!', zh:'获得 1 次免费高清机会！', fr:'+1 conversion HD gratuite !', es:'+1 conversión HD gratis!', ja:'無料HD変換+1！', ko:'무료 HD 변환 +1!' },
    'toast.choose':     { en:'Choose successful', zh:'选择成功', fr:'Sélection réussie', es:'Selección exitosa', ja:'選択成功', ko:'선택 성공' },
    'toast.done':       { en:'Conversion complete!', zh:'转换完成！', fr:'Conversion terminée !', es:'¡Conversión completa!', ja:'変換完了！', ko:'변환 완료!' },
    'toast.output':     { en:'Output', zh:'输出', fr:'Sortie', es:'Salida', ja:'出力', ko:'출력' },

    // ── TOOL PAGE TITLES ──
    'toolpage.image':   { en:'Image Converter', zh:'图片转换工具', fr:'Convertisseur d\'images', es:'Conversor de Imagen', ja:'画像変換ツール', ko:'이미지 변환 도구' },
    'toolpage.pdf':     { en:'PDF Converter', zh:'PDF 转换工具', fr:'Convertisseur PDF', es:'Conversor PDF', ja:'PDF変換ツール', ko:'PDF 변환 도구' },
    'toolpage.audio':   { en:'Audio Converter', zh:'音频转换工具', fr:'Convertisseur Audio', es:'Conversor de Audio', ja:'音声変換ツール', ko:'오디오 변환 도구' },
    'toolpage.video':   { en:'Video Converter', zh:'视频转换工具', fr:'Convertisseur Vidéo', es:'Conversor de Video', ja:'動画変換ツール', ko:'비디오 변환 도구' },
    'toolpage.compress':{ en:'Compression Tool', zh:'压缩工具', fr:'Compression', es:'Compresión', ja:'圧縮ツール', ko:'압축 도구' },
    'toolpage.pdfmerge':{ en:'PDF Merge', zh:'PDF 合并', fr:'Fusion PDF', es:'Unir PDF', ja:'PDF結合', ko:'PDF 병합' },
    'toolpage.pdfsplit':{ en:'PDF Split', zh:'PDF 拆分', fr:'Division PDF', es:'Dividir PDF', ja:'PDF分割', ko:'PDF 분할' },
    'upload.compressDrop':{ en:'Select file to compress', zh:'选择要压缩的文件', fr:'Sélectionner le fichier', es:'Seleccionar archivo', ja:'圧縮するファイル', ko:'압축할 파일' },
    'upload.mergeDrop':{ en:'Select multiple PDF files', zh:'选择多个 PDF 文件', fr:'Sélectionner plusieurs PDF', es:'Seleccionar múltiples PDF', ja:'複数PDFを選択', ko:'여러 PDF 선택' },
    'upload.splitDrop':{ en:'Select PDF file', zh:'选择 PDF 文件', fr:'Sélectionner un PDF', es:'Seleccionar PDF', ja:'PDFを選択', ko:'PDF 선택' },
    'upload.mergeHint':{ en:'Merge multiple PDFs into one, in selection order', zh:'按选择顺序合并多个 PDF 为单个文件', fr:'Fusionner PDF dans l\'ordre', es:'Unir PDF en orden', ja:'選択順にPDFを結合', ko:'선택 순서대로 PDF 병합' },
    'upload.splitHint':{ en:'Split PDF into individual page files', zh:'将 PDF 拆分为多个单独页面文件', fr:'Diviser PDF en pages', es:'Dividir PDF en páginas', ja:'PDFをページごとに分割', ko:'PDF를 개별 페이지로 분할' },
    'upload.supportedImg':{ en:'Supports JPG, PNG, WebP and more', zh:'支持 JPG、PNG、WebP 等多种格式', fr:'JPG, PNG, WebP et plus', es:'JPG, PNG, WebP y más', ja:'JPG、PNG、WebP等対応', ko:'JPG, PNG, WebP 등 지원' },
    'upload.supportedPDF':{ en:'Supports PDF, DOCX, PPT and more', zh:'支持 PDF、DOCX、PPT 等多种格式', fr:'PDF, DOCX, PPT et plus', es:'PDF, DOCX, PPT y más', ja:'PDF、DOCX、PPT等対応', ko:'PDF, DOCX, PPT 등 지원' },
    'upload.supportedAudio':{ en:'Supports MP3, WAV, AAC, FLAC, M4A and more', zh:'支持 MP3、WAV、AAC、FLAC、M4A 等多种格式', fr:'MP3, WAV, AAC, FLAC, M4A et plus', es:'MP3, WAV, AAC, FLAC, M4A y más', ja:'MP3、WAV、AAC、FLAC、M4A等対応', ko:'MP3, WAV, AAC, FLAC, M4A 등 지원' },
    'upload.supportedVideo':{ en:'Supports MP4, MOV, AVI and more', zh:'支持 MP4、MOV、AVI 等多种格式', fr:'MP4, MOV, AVI et plus', es:'MP4, MOV, AVI y más', ja:'MP4、MOV、AVI等対応', ko:'MP4, MOV, AVI 등 지원' },
    'upload.supportedCompress':{ en:'Supports images (JPG/PNG/WebP) and video (MP4/MOV)', zh:'支持图片 (JPG/PNG/WebP) 和视频 (MP4/MOV)', fr:'Images et vidéos', es:'Imágenes y video', ja:'画像と動画対応', ko:'이미지 및 비디오' },
    'processing.compress':{ en:'Compressing...', zh:'正在压缩中...', fr:'Compression...', es:'Comprimiendo...', ja:'圧縮中...', ko:'압축 중...' },
    'processing.merge':{ en:'Merging...', zh:'正在合并中...', fr:'Fusion en cours...', es:'Uniendo...', ja:'結合中...', ko:'병합 중...' },
    'processing.split':{ en:'Splitting...', zh:'正在拆分中...', fr:'Division en cours...', es:'Dividiendo...', ja:'分割中...', ko:'분할 중...' },
    'result.compressed':{ en:'Compression Complete', zh:'压缩完成', fr:'Compression terminée', es:'Compresión completa', ja:'圧縮完了', ko:'압축 완료' },
    'result.merged':   { en:'Merge Complete', zh:'合并完成', fr:'Fusion terminée', es:'Unión completa', ja:'結合完了', ko:'병합 완료' },
    'result.split':    { en:'Split Complete', zh:'拆分完成', fr:'Division terminée', es:'División completa', ja:'分割完了', ko:'분할 완료' },
    'result.sizeReduction':{ en:'Size reduction', zh:'大小减少', fr:'Réduction', es:'Reducción', ja:'サイズ削減', ko:'크기 감소' },
    'result.pages':    { en:'pages', zh:'页', fr:'pages', es:'páginas', ja:'ページ', ko:'페이지' },
    'result.files':    { en:'files', zh:'个文件', fr:'fichiers', es:'archivos', ja:'ファイル', ko:'파일' },
    'btn.startCompress':{ en:'Start Compression', zh:'开始压缩', fr:'Compresser', es:'Comprimir', ja:'圧縮開始', ko:'압축 시작' },
    'btn.startMerge':  { en:'Start Merge', zh:'开始合并', fr:'Fusionner', es:'Unir', ja:'結合開始', ko:'병합 시작' },
    'btn.startSplit':  { en:'Start Split', zh:'开始拆分', fr:'Diviser', es:'Dividir', ja:'分割開始', ko:'분할 시작' },
    'btn.downloadMerged':{ en:'Download Merged File', zh:'下载合并文件', fr:'Télécharger', es:'Descargar', ja:'結合ファイルDL', ko:'병합 파일 다운로드' },
    'btn.downloadSplit':{ en:'Download Split Files', zh:'下载拆分文件', fr:'Télécharger', es:'Descargar', ja:'分割ファイルDL', ko:'분할 파일 다운로드' },

    // ── FILE QUEUE ──
    'queue.title':   { en:'Selected Files', zh:'已选文件', fr:'Fichiers sélectionnés', es:'Archivos seleccionados', ja:'選択ファイル', ko:'선택한 파일' },
    'queue.clear':   { en:'Clear All', zh:'清空', fr:'Tout effacer', es:'Limpiar todo', ja:'すべてクリア', ko:'모두 지우기' },
    'queue.empty':   { en:'No files selected', zh:'未选择文件', fr:'Aucun fichier', es:'Sin archivos', ja:'ファイル未選択', ko:'파일 없음' },
    'queue.added':   { en:'files added to queue', zh:'个文件已添加到队列', fr:'fichiers ajoutés', es:'archivos añadidos', ja:'ファイルを追加', ko:'파일 추가됨' },

    // ── WELCOME POPUP ──
    'welcome.title':  { en:'Welcome to Fluxora!', zh:'感谢您选择Fluxora', fr:'Bienvenue sur Fluxora !', es:'¡Gracias por elegir Fluxora!', ja:'Fluxoraへようこそ！', ko:'Fluxora를 선택해 주셔서 감사합니다!' },
    'welcome.subtitle':{ en:'Start converting your files — 100% private.', zh:'赶快使用起来吧！', fr:'Commencez à convertir vos fichiers.', es:'¡Empieza a convertir tus archivos!', ja:'さっそくファイルを変換してみましょう！', ko:'지금 바로 파일 변환을 시작하세요!' },
    'welcome.btn':    { en:'Get Started', zh:'开始使用', fr:'Commencer', es:'Comenzar', ja:'はじめる', ko:'시작하기' },

    // ── UPGRADE PROMPT ──
    'upgrade.title':  { en:'Unlock HD Quality', zh:'解锁高清画质', fr:'Débloquer la qualité HD', es:'Desbloquear calidad HD', ja:'HD画質を解除', ko:'HD 화질 잠금 해제' },
    'upgrade.btn':    { en:'View Plans', zh:'查看套餐', fr:'Voir les offres', es:'Ver planes', ja:'プランを見る', ko:'요금제 보기' },

    // ── PDF MODE TOGGLE ──
    'pdf.modePdf2img': { en:'PDF → Image', zh:'PDF → 图片', fr:'PDF → Image', es:'PDF → Imagen', ja:'PDF → 画像', ko:'PDF → 이미지' },
    'pdf.modeImg2pdf': { en:'Image → PDF', zh:'图片 → PDF', fr:'Image → PDF', es:'Imagen → PDF', ja:'画像 → PDF', ko:'이미지 → PDF' },
    'pdf.hintPdf2img': { en:'Upload a PDF file to convert each page into JPG or PNG images', zh:'上传 PDF 文件，转换为 JPG 或 PNG 图片', fr:'Téléchargez un PDF pour convertir chaque page en JPG ou PNG', es:'Sube un PDF para convertir cada página en JPG o PNG', ja:'PDFをアップロードして各ページをJPG/PNGに変換', ko:'PDF를 업로드하여 각 페이지를 JPG/PNG로 변환' },
    'pdf.hintImg2pdf': { en:'Upload images to merge into a single PDF file', zh:'上传任意格式图片，合并转换为单个 PDF 文件', fr:'Téléchargez des images à fusionner en un seul PDF', es:'Sube imágenes para combinarlas en un solo PDF', ja:'画像をアップロードして1つのPDFに結合', ko:'이미지를 업로드하여 하나의 PDF로 병합' }
  };

  /* ---- Core Engine ---- */
  var STORAGE_KEY = 'wtb_lang_v2';
  var current = localStorage.getItem(STORAGE_KEY) || 'en';
  if (SUPPORTED.indexOf(current) === -1) current = 'en';

  function t(key) {
    var entry = dict[key];
    if (!entry) return key;
    return entry[current] || entry['en'] || key;
  }

  /** Set text preserving child elements */
  function setTextPreserve(el, text) {
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 3) { el.childNodes[i].textContent = text; return; }
    }
    el.insertBefore(document.createTextNode(text), el.firstChild);
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    localStorage.setItem(STORAGE_KEY, lang);
    current = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var text = t(key);
      if (!text) return;
      if (el.children.length > 0) setTextPreserve(el, text);
      else el.textContent = text;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key) || '');
    });

    var langBtn = document.getElementById('lang-current-label');
    if (langBtn) langBtn.textContent = LABELS[lang] || lang;

    // Update detected format tags
    document.querySelectorAll('.detected-tag').forEach(function (tag) {
      var fmt = tag.getAttribute('data-format');
      if (fmt) tag.textContent = t('format.detected') + ': ' + fmt;
    });

    // Update hero badge
    var badge = document.querySelector('.hero-badge');
    if (badge) {
      var icon = badge.querySelector('i');
      badge.innerHTML = ''; if (icon) badge.appendChild(icon.cloneNode(true));
      badge.appendChild(document.createTextNode(' ' + t('hero.badge')));
    }

    window.dispatchEvent(new CustomEvent('langChange', { detail: { lang: lang } }));
  }

  function getLang() { return current; }

  window.I18n = { t: t, setLang: setLang, getLang: getLang, SUPPORTED: SUPPORTED, LABELS: LABELS };

  document.addEventListener('DOMContentLoaded', function () {
    var langBtn = document.getElementById('lang-current-label');
    if (langBtn) langBtn.textContent = LABELS[current] || current;
    setLang(current);

    var toggle = document.getElementById('lang-toggle');
    var dropdown = document.getElementById('lang-dropdown');
    if (toggle && dropdown) {
      toggle.addEventListener('click', function (e) { e.stopPropagation(); dropdown.classList.toggle('open'); toggle.classList.toggle('open'); });
      document.addEventListener('click', function () { dropdown.classList.remove('open'); toggle.classList.remove('open'); });
      dropdown.addEventListener('click', function (e) {
        var opt = e.target.closest('.lang-option');
        if (!opt) return;
        var lang = opt.getAttribute('data-lang');
        if (lang) { setLang(lang); dropdown.classList.remove('open'); toggle.classList.remove('open'); }
      });
    }
  });

})();
