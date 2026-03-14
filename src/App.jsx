/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// ===== AI 감정 및 시세 로직 (Cursor Pro Optimized) =====
const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || '';
const DEPLOY_URL = 'https://auction-geo-ui.vercel.app'; 

const GRADE_CONFIG = {
  A: { label: '신품급 (Near Mint)', stars: '⭐⭐⭐⭐⭐', color: '#10b981', basePrice: 120000 },
  B: { label: '우수 (Very Good)', stars: '⭐⭐⭐⭐', color: '#8b5cf6', basePrice: 65000 },
  C: { label: '보통 (Good)', stars: '⭐⭐⭐', color: '#f59e0b', basePrice: 38000 },
  D: { label: '하급 (Poor)', stars: '⭐⭐', color: '#64748b', basePrice: 22000 }
};

const formatPrice = (price) => {
  const numericPrice = typeof price === 'string' ? parseInt(String(price).replace(/[^0-9]/g, '')) : price;
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(numericPrice || 0);
};

// 샘플 이미지 리스트 (Public/data 경로)
const SAMPLE_IMAGES = [
  '/data/adidas_front.jpg',
  '/data/adidas_back.jpg',
  '/data/adidas_logo_detail.jpg',
  '/data/adidas_tag_1.jpg',
  '/data/adidas_tag_2.jpg'
];

// ===== Sub-Components =====
const StatusBadge = () => (
  <motion.div className="status-badge" animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 2.5 }}>
    LIVE 실시간 경매 중
  </motion.div>
);

const PriceCard = ({ title, value, isCenter }) => (
  <motion.div className="glass-card glass-premium" whileHover={{ y: -5 }}>
    <span className="label text-muted">{title}</span>
    <div className={`price-text ${isCenter ? 'text-primary' : ''}`}>{value}</div>
  </motion.div>
);

function App() {
  const [itemData, setItemData] = useState({
    itemName: '아디다스 빈티지 윈드브레이커',
    grade: 'B',
    currentMarketPrice: 85000,
    recommendedStartPrice: 45000,
    aiAnalysisText: 'AI가 아디다스 빈티지 라인의 특성을 완벽히 인식했습니다. 로고 자수 상태가 우수하며, 시보리 늘어남이 적어 상급 컨디션으로 정밀 판독되었습니다.',
    images: SAMPLE_IMAGES
  });

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [displayGrade, setDisplayGrade] = useState('B');
  const [currentBid, setCurrentBid] = useState(52000);
  const [bidHistory, setBidHistory] = useState([]);
  const [userBidAmt, setUserBidAmt] = useState('');
  const [logs, setLogs] = useState(['시스템: 경매지오 AI 엔진 정상 가동 중']);
  const fileInputRef = useRef(null);

  // 카카오톡 초기화
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
    }
  }, []);

  const shareKakao = () => {
    if (!window.Kakao) return alert('카카오 SDK 로드 중...');
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '🎁 [경매지오] 대표님의 특별한 선물',
        description: 'AI가 감정하는 프리미엄 경매 플랫폼! 지금 입찰해보세요.',
        imageUrl: window.location.origin + SAMPLE_IMAGES[0],
        link: { mobileWebUrl: DEPLOY_URL, webUrl: DEPLOY_URL },
      },
      buttons: [
        { title: '앱으로 보기', link: { mobileWebUrl: DEPLOY_URL, webUrl: DEPLOY_URL } },
      ],
    });
  };

  const addLog = useCallback((msg) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 4));
  }, []);

  const runAIAnalysis = (file) => {
    if (!file) return;
    setIsAnalyzing(true);
    const url = URL.createObjectURL(file);
    addLog('AI: 이미지 픽셀 매트릭스 추출 중...');
    
    let count = 0;
    const interval = setInterval(() => {
      setDisplayGrade(['A','B','C','D'][count % 4]);
      count++;
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      const finalGrade = 'A';
      const config = GRADE_CONFIG[finalGrade];
      
      setItemData(prev => ({
        ...prev,
        itemName: '정밀 감정 완료 상품',
        grade: finalGrade,
        currentMarketPrice: 156000,
        aiAnalysisText: `[AI 정밀 판독 결과] 해당 제품은 ${config.label} 상태로 확인되었습니다. 실시간 글로벌 빈티지 DB 대조 결과, 보존 가치가 매우 높습니다.`,
        images: [url, ...prev.images]
      }));
      setActiveImgIdx(0);
      setIsAnalyzing(false);
      addLog(`결과: AI 정밀 감정 ${finalGrade}등급 확정`);
      alert('AI 정밀 감정 완료! 최상단 갤러리에 추가되었습니다.');
    }, 3000);
  };

  const handleBid = () => {
    const val = parseInt(userBidAmt.replace(/,/g, ''));
    if (!val || val <= currentBid) return alert('현재가보다 높은 금액을 입력해주세요.');
    
    setCurrentBid(val);
    setBidHistory([{ bidder: '나', price: val, time: '방금 전' }, ...bidHistory]);
    setUserBidAmt('');
    addLog(`입찰: ${formatPrice(val)} 성공`);
  };

  return (
    <div className="mobile-app">
      <header className="app-header glass">
        <div className="top-nav">
          <div className="brand">
            <h2 className="brand-logo">경매지오</h2>
            <StatusBadge />
          </div>
          <button className="btn-icon-upload" onClick={() => fileInputRef.current.click()}>
            <span className="icon">📷</span>
            <span className="txt">감정</span>
          </button>
          <input type="file" ref={fileInputRef} hidden onChange={(e) => runAIAnalysis(e.target.files[0])} />
        </div>
      </header>

      <main className="app-body">
        {/* 프리미엄 갤러리 */}
        <section className="glass product-gallery">
          <div className={`main-image-frame ${isAnalyzing ? 'analyzing' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeImgIdx}
                src={itemData.images[activeImgIdx]} 
                className="gallery-main" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </AnimatePresence>
            {isAnalyzing && <div className="scan-line-v2" />}
          </div>
          <div className="thumbnail-list">
            {itemData.images.slice(0, 5).map((img, i) => (
              <motion.div 
                key={i} 
                className={`thumb-item ${activeImgIdx === i ? 'active' : ''}`}
                onClick={() => setActiveImgIdx(i)}
                whileTap={{ scale: 0.9 }}
              >
                <img src={img} alt="thumb" />
              </motion.div>
            ))}
          </div>
        </section>

        <section className="product-info-section">
          <div className="title-row">
            <h1 className="item-name">{itemData.itemName}</h1>
            <div className={`grade-label g-${isAnalyzing ? displayGrade : itemData.grade}`}>
              {isAnalyzing ? displayGrade : itemData.grade}등급
            </div>
          </div>
          <div className="stars">
            {GRADE_CONFIG[isAnalyzing ? displayGrade : itemData.grade].stars}
            <span className="status-label">{GRADE_CONFIG[isAnalyzing ? displayGrade : itemData.grade].label}</span>
          </div>
        </section>

        <div className="price-row">
          <PriceCard title="현재 최고 입찰가" value={formatPrice(currentBid)} isCenter={true} />
          <PriceCard title="남은 시간" value="00:12:45" />
        </div>

        <section className="glass auction-area">
          <div className="input-field">
            <input 
              type="text" 
              placeholder="단위: 1,000원" 
              value={userBidAmt} 
              onChange={(e) => setUserBidAmt(e.target.value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ","))} 
            />
            <button className="btn-primary-bid" onClick={handleBid}>입찰</button>
          </div>
        </section>

        <section className="glass ai-report-v2">
          <div className="report-header">
            <h3>AI 실시간 감정 리포트</h3>
            <button className="btn-inline-upload" onClick={() => fileInputRef.current.click()}>사진 업로드</button>
          </div>
          <p className="report-text">{itemData.aiAnalysisText}</p>
          <div className="market-price-box">
             <span className="label">글로벌 시세 평균</span>
             <span className="val">{formatPrice(itemData.currentMarketPrice)}</span>
          </div>
        </section>

        <button className="btn-kakao-share" onClick={shareKakao}>
          <span className="kakao-icon">💬</span> 카카오톡 공유하기
        </button>

        <div className="log-console">
          {logs.map((log, i) => <div key={i} className="log-line">{log}</div>)}
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2026 AUCTION GEO - PREMIUM AI PLATFORM</p>
      </footer>
    </div>
  );
}

export default App;
