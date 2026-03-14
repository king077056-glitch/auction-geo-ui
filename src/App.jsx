/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// ===== AI 감정 및 시세 로직 (Cursor Pro Optimized) =====
const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || '';
const DEPLOY_URL = 'https://unicorn-auction.vercel.app'; // 최종 목표 주소

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

// ===== Sub-Components (Modular Design) =====
const StatusBadge = () => (
  <motion.div className="status-badge" animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 2.5 }}>
    AI 실시간 분석 중
  </motion.div>
);

const PriceCard = ({ title, value, isCenter }) => (
  <motion.div className="glass-card glass-premium" whileHover={{ y: -5, boxShadow: '0 15px 30px rgba(0,0,0,0.1)' }}>
    <span className="label">{title}</span>
    <div className={`price-text ${isCenter ? 'text-primary' : ''}`}>{value}</div>
  </motion.div>
);

function App() {
  const [itemData, setItemData] = useState({
    itemName: '아이템 스캔 대기...',
    grade: 'C',
    currentMarketPrice: 0,
    recommendedStartPrice: 0,
    aiAnalysisText: '사진을 업로드하여 AI 정밀 감정을 시작하세요.',
    images: []
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [displayGrade, setDisplayGrade] = useState('C');
  const [currentBid, setCurrentBid] = useState(0);
  const [bidHistory, setBidHistory] = useState([]);
  const [userBidAmt, setUserBidAmt] = useState('');
  const [logs, setLogs] = useState(['시스템: 유니콘 AI 마스터 엔진 가동']);
  const fileInputRef = useRef(null);

  const addLog = useCallback((msg) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 4));
  }, []);

  // AI 분석 엔진 (Cursor Pro 리팩토링)
  const runAIAnalysis = (file) => {
    setIsAnalyzing(true);
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    
    addLog('AI: 이미지 픽셀 매트릭스 추출 중...');
    
    // 분석 시뮬레이션
    let count = 0;
    const interval = setInterval(() => {
      setDisplayGrade(['A','B','C','D'][count % 4]);
      count++;
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      const grades = ['A', 'B', 'C']; // 샘플 데이터는 C 이상으로
      const finalGrade = grades[Math.floor(Math.random() * grades.length)];
      const config = GRADE_CONFIG[finalGrade];
      
      setItemData({
        itemName: '분석된 프리미엄 상품',
        grade: finalGrade,
        currentMarketPrice: config.basePrice * (1 + Math.random() * 0.2),
        recommendedStartPrice: config.basePrice * 0.5,
        aiAnalysisText: `[AI 정밀 판독 결과] 해당 제품은 ${config.label} 상태로 확인되었습니다. 5개 플랫폼 실시간 대조 결과, 현재 시장 가치는 매우 안정적입니다.`,
        images: [url]
      });
      setCurrentBid(config.basePrice * 0.5);
      setIsAnalyzing(false);
      addLog(`결과: AI 감정 ${finalGrade}등급 판정 완료`);
    }, 3000);
  };

  const handleBid = () => {
    const val = parseInt(userBidAmt.replace(/,/g, ''));
    if (!val || val <= currentBid) return alert('현재가보다 높아야 합니다.');
    
    setCurrentBid(val);
    setBidHistory([{ bidder: '나', price: val, time: '방금 전' }, ...bidHistory]);
    setUserBidAmt('');
    addLog(`입찰: ${formatPrice(val)} 성공`);
  };

  return (
    <div className="mobile-container">
      <header className="main-header">
        <div className="logo-section">
          <span className="logo-text">UNICORN</span>
          <StatusBadge />
        </div>
        <div className="header-actions">
          <button className="btn-analyze" onClick={() => fileInputRef.current.click()}>📷 감정하기</button>
          <input type="file" ref={fileInputRef} hidden onChange={(e) => runAIAnalysis(e.target.files[0])} />
        </div>
      </header>

      <main className="main-content">
        <section className="glass-card product-main glass-premium">
          <div className={`product-image-container ${isAnalyzing ? 'analyzing' : ''}`}>
            {uploadedImageUrl ? (
                <img src={uploadedImageUrl} className="product-image" alt="item" />
            ) : (
                <div className="product-image-placeholder">이미지를 업로드 해주세요</div>
            )}
            {isAnalyzing && <div className="scan-line" />}
          </div>
          <h1 className="product-title">{itemData.itemName}</h1>
          <div className="grade-section">
            <span className="grade-tag" style={{ border: `1px solid ${GRADE_CONFIG[isAnalyzing ? displayGrade : itemData.grade].color}`, color: GRADE_CONFIG[isAnalyzing ? displayGrade : itemData.grade].color }}>
              {isAnalyzing ? displayGrade : itemData.grade}등급 · {GRADE_CONFIG[isAnalyzing ? displayGrade : itemData.grade].label}
            </span>
            <span className="star-rating">{GRADE_CONFIG[isAnalyzing ? displayGrade : itemData.grade].stars}</span>
          </div>
        </section>

        <div className="bid-grid">
          <PriceCard title="현재 최고가" value={formatPrice(currentBid)} />
          <PriceCard title="남은 시간" value="00:45:12" />
        </div>

        <section className="glass-card glass-premium bid-input-area">
          <span className="label">실시간 입찰 참여</span>
          <div className="bid-input-container">
            <input className="input-bid" placeholder="금액 입력" value={userBidAmt} onChange={(e) => setUserBidAmt(e.target.value)} />
            <button className="btn-bid" onClick={handleBid}>입찰하기</button>
          </div>
        </section>

        <section className="glass-card glass-premium ai-insight-box">
          <div className="slogan-main">AI 정밀 분석 리포트</div>
          <div className="ai-message">{itemData.aiAnalysisText}</div>
          <div className="market-stat">
            <span className="stat-label">시장 평균가</span>
            <span className="stat-value">{formatPrice(itemData.currentMarketPrice)}</span>
          </div>
        </section>

        <div className="engine-logs">
          {logs.map((log, i) => <div key={i}>● {log}</div>)}
        </div>
      </main>
    </div>
  );
}

export default App;
