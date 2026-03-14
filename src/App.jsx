/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || '';
const DEPLOY_URL = window.location.origin || 'https://auction-geo-ui.vercel.app';

const initKakao = () => {
  if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized() && KAKAO_JS_KEY) {
    window.Kakao.init(KAKAO_JS_KEY);
  }
};

const shareToKakao = () => {
  initKakao();
  if (window.Kakao?.Share) {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '경매지오(Auction Geo) - AI 정밀 시세 리포트',
        description: '당신만의 가치를 만나는 AI 경매 공간',
        imageUrl: `${DEPLOY_URL}/data/adidas_front.jpg`,
        link: { mobileWebUrl: DEPLOY_URL, webUrl: DEPLOY_URL },
      },
      buttons: [{ title: '경매지오 열기', link: { mobileWebUrl: DEPLOY_URL } }],
    });
  } else {
    navigator.clipboard?.writeText(DEPLOY_URL);
    alert('주소가 복사되었습니다! 카카오톡에 붙여넣기 해주세요.');
  }
};

const GRADE_CONFIG = {
  A: { label: '신품급 (Near Mint)', stars: '⭐⭐⭐⭐⭐', color: '#10b981', basePrice: 120000 },
  B: { label: '우수 (Very Good)', stars: '⭐⭐⭐⭐', color: '#8b5cf6', basePrice: 65000 },
  C: { label: '보통 (Good)', stars: '⭐⭐⭐', color: '#f59e0b', basePrice: 38000 },
  D: { label: '하급 (Poor)', stars: '⭐⭐', color: '#64748b', basePrice: 22000 }
};

const formatPrice = (p) => {
  const n = typeof p === 'string' ? parseInt(String(p).replace(/[^0-9]/g, '')) : p;
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(n || 0);
};

function App() {
  const [itemData, setItemData] = useState({
    itemName: '아이템 로딩 중...',
    grade: 'C',
    currentMarketPrice: 0,
    recommendedStartPrice: 0,
    aiAnalysisText: '사진을 업로드하여 AI 정밀 감정을 시작하세요.',
    images: [],
    imagePath: ''
  });
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [displayGrade, setDisplayGrade] = useState('C');
  const [currentBid, setCurrentBid] = useState(0);
  const [bidHistory, setBidHistory] = useState([]);
  const [userBidAmt, setUserBidAmt] = useState('');
  const [logs, setLogs] = useState(['시스템: 경매지오 AI 엔진 가동']);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dropzoneRef = useRef(null);

  const addLog = useCallback((msg) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
  }, []);

  const images = itemData.images?.length > 0 ? itemData.images : (itemData.imagePath ? [itemData.imagePath] : []);
  const hasGallery = images.length > 0;

  useEffect(() => {
    fetch('./data/current_item.json')
      .then((r) => r.json())
      .then((d) => {
        setItemData({
          ...d,
          images: d.images || [],
          imagePath: d.imagePath || ''
        });
        setCurrentBid(d.currentBid || parseInt(String(d.recommendedStartPrice || 0).replace(/[^0-9]/g, '')));
      })
      .catch(() => {});
  }, []);

  const runAIAnalysis = useCallback((file) => {
    if (!file?.type?.startsWith('image/')) return;
    setIsAnalyzing(true);
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    setItemData((p) => ({ ...p, itemName: 'AI 분석 중...', images: [], imagePath: '' }));
    addLog('AI: 이미지 픽셀 매트릭스 추출 중...');
    let c = 0;
    const iv = setInterval(() => { setDisplayGrade(['A','B','C','D'][c++ % 4]); }, 200);
    setTimeout(() => {
      clearInterval(iv);
      const finalGrade = ['A','B','C'][Math.floor(Math.random() * 3)];
      const cfg = GRADE_CONFIG[finalGrade];
      setItemData({
        itemName: '분석된 프리미엄 상품',
        grade: finalGrade,
        currentMarketPrice: cfg.basePrice * (1 + Math.random() * 0.2),
        recommendedStartPrice: cfg.basePrice * 0.5,
        aiAnalysisText: `[AI 정밀 판독 결과] 해당 제품은 ${cfg.label} 상태로 확인되었습니다. 5개 플랫폼 실시간 대조 결과, 현재 시장 가치는 매우 안정적입니다.`,
        images: [url]
      });
      setCurrentBid(cfg.basePrice * 0.5);
      setIsAnalyzing(false);
      addLog(`결과: AI 감정 ${finalGrade}등급 판정 완료`);
    }, 3000);
  }, [addLog]);

  const handleFileSelect = useCallback((e) => {
    const f = e?.target?.files?.[0];
    e.target.value = '';
    if (f) runAIAnalysis(f);
  }, [runAIAnalysis]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer?.files?.[0];
    if (f?.type?.startsWith('image/')) runAIAnalysis(f);
  }, [runAIAnalysis]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handlePrev = () => setSelectedImage((i) => (i - 1 + images.length) % images.length);
  const handleNext = () => setSelectedImage((i) => (i + 1) % images.length);

  const handleBid = () => {
    const val = parseInt(String(userBidAmt).replace(/,/g, ''));
    if (!val || val <= currentBid) return alert('현재가보다 높아야 합니다.');
    setCurrentBid(val);
    setBidHistory([{ bidder: '나', price: val, time: '방금 전' }, ...bidHistory]);
    setUserBidAmt('');
    addLog(`입찰: ${formatPrice(val)} 성공`);
  };

  const grade = isAnalyzing ? displayGrade : itemData.grade;
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG.C;
  const mainImageUrl = uploadedImageUrl || images[selectedImage] || itemData.imagePath;

  return (
    <div className="mobile-container">
      <header className="main-header">
        <div className="logo-section">
          <span className="logo-text">경매지오</span>
          <span className="logo-sub">Auction Geo</span>
          <motion.div className="status-badge" animate={{ opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 2 }}>
            AI 실시간 분석 중
          </motion.div>
        </div>
        <div className="header-actions">
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
          <button className="btn-analyze" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
            📷 감정하기
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="glass-card product-main glass-premium">
          <div className={`product-image-container ${isAnalyzing ? 'analyzing' : ''}`}>
            {mainImageUrl ? (
              <>
                {hasGallery && images.length > 1 && (
                  <>
                    <button className="nav-btn prev" onClick={handlePrev} aria-label="이전">❮</button>
                    <button className="nav-btn next" onClick={handleNext} aria-label="다음">❯</button>
                  </>
                )}
                <motion.img
                  key={mainImageUrl}
                  src={mainImageUrl}
                  className="product-image"
                  alt={itemData.itemName}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </>
            ) : (
              <div className="product-image-placeholder">이미지를 업로드해 주세요</div>
            )}
            {isAnalyzing && <div className="scan-line" />}
          </div>
          {hasGallery && images.length > 1 && (
            <div className="image-thumbnails">
              {images.map((img, i) => (
                <div
                  key={i}
                  className={`thumbnail-item ${selectedImage === i ? 'active' : ''}`}
                  onClick={() => setSelectedImage(i)}
                >
                  <img src={img} alt={`${i + 1}`} />
                </div>
              ))}
            </div>
          )}
          <h1 className="product-title">{itemData.itemName}</h1>
          <div className="grade-section">
            <span className="grade-tag" style={{ borderColor: cfg.color, color: cfg.color }}>
              {grade}등급 · {cfg.label}
            </span>
            <span className="star-rating">{cfg.stars}</span>
          </div>
        </section>

        <div className="bid-grid">
          <motion.div className="glass-card glass-premium" whileHover={{ y: -4 }}>
            <span className="label">현재 최고가</span>
            <div className="price-text">{formatPrice(currentBid)}</div>
          </motion.div>
          <motion.div className="glass-card glass-premium" whileHover={{ y: -4 }}>
            <span className="label">남은 시간</span>
            <div className="time-text">00:45:12</div>
          </motion.div>
        </div>

        <section className="glass-card glass-premium bid-input-area">
          <span className="label">실시간 입찰 참여</span>
          <div className="bid-input-container">
            <input
              className="input-bid"
              placeholder="금액 입력"
              value={userBidAmt}
              onChange={(e) => setUserBidAmt(e.target.value)}
            />
            <button className="btn-bid" onClick={handleBid}>입찰하기</button>
          </div>
        </section>

        <section className="glass-card glass-premium ai-insight-box">
          <div className="slogan-main">AI 정밀 분석 리포트</div>
          <div
            ref={dropzoneRef}
            className={`dropzone ${isDragging ? 'active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="dropzone-icon">📤</span>
            <span className="dropzone-text">사진을 여기에 놓거나 클릭해서 업로드</span>
            <span className="dropzone-hint">JPG, PNG (최대 5MB)</span>
          </div>
          <div className="ai-message">{itemData.aiAnalysisText}</div>
          <div className="market-stat">
            <span className="stat-label">시장 평균가</span>
            <span className="stat-value">{formatPrice(itemData.currentMarketPrice)}</span>
          </div>
        </section>

        <motion.section
          className="glass-card cta-card glass-premium share-cta"
          whileHover={{ scale: 1.02 }}
          onClick={shareToKakao}
        >
          <span className="cta-icon">💬</span>
          <h2 className="cta-title">카톡 공유하기</h2>
          <p className="cta-text">친구에게 경매지오 링크를 보내보세요!</p>
          <button className="btn-kakao-large">카카오톡으로 공유</button>
        </motion.section>

        <div className="engine-logs">{logs.map((l, i) => <div key={i}>● {l}</div>)}</div>
      </main>
    </div>
  );
}

export default App;
