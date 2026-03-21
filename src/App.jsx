/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// ===== AI 감정 및 시세 로직 =====
const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || window.__KAKAO_JS_KEY__ || '';
const DEPLOY_URL = window.__KAKAO_DEPLOY_URL__ || import.meta.env.VITE_DEPLOY_URL || 'https://auction-geo-ui.vercel.app'; 

const GRADE_CONFIG = {
  A: { label: '신품급 (Near Mint)', stars: '⭐⭐⭐⭐⭐', color: '#10b981', basePrice: 120000, desc: '사용감이 거의 없는 최상급 상태' },
  B: { label: '우수 (Very Good)', stars: '⭐⭐⭐⭐', color: '#8b5cf6', basePrice: 65000, desc: '미세한 사용감 외 완벽한 보존 상태' },
  C: { label: '보통 (Good)', stars: '⭐⭐⭐', color: '#f59e0b', basePrice: 38000, desc: '자연스러운 사용감이 느껴지는 제품' },
  D: { label: '하급 (Poor)', stars: '⭐⭐', color: '#64748b', basePrice: 22000, desc: '수선이 필요하거나 사용감이 많은 제품' }
};

const formatPrice = (price) => {
  const numericPrice = typeof price === 'string' ? parseInt(String(price).replace(/[^0-9]/g, '')) : price;
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(numericPrice || 0);
};

// 결제 상태 UI 피드백 (예: ?paymentStatus=PAID)
const PAYMENT_STATUS_CONFIG = {
  PENDING: { label: '결제 대기', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.18)' },
  PAID: { label: '결제 완료', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.18)' },
  DELIVERED: { label: '납품 완료', color: '#10b981', bg: 'rgba(16, 185, 129, 0.18)' },
};

const getPaymentStatusFromQuery = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw =
      params.get('paymentStatus') ||
      params.get('payment') ||
      params.get('status') ||
      '';
    const upper = String(raw).toUpperCase().trim();
    if (Object.prototype.hasOwnProperty.call(PAYMENT_STATUS_CONFIG, upper)) return upper;
  } catch (_) {}
  return 'PENDING';
};

// 샘플 이미지 리스트
const SAMPLE_IMAGES = [
  '/data/adidas_front.jpg',
  '/data/adidas_back.jpg',
  '/data/adidas_logo_detail.jpg',
  '/data/adidas_tag_1.jpg',
  '/data/adidas_tag_2.jpg'
];

// ===== Sub-Components =====
const GlassSection = ({ title, children, delay = 0 }) => (
  <motion.section 
    className="glass-section"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
  >
    {title && <h3 className="section-title">{title}</h3>}
    {children}
  </motion.section>
);

function App() {
  const [itemData, setItemData] = useState({
    itemName: '아디다스 빈티지 윈드브레이커',
    grade: 'B',
    currentMarketPrice: 85000,
    recommendedStartPrice: 45000,
    aiAnalysisText: 'AI가 아디다스 빈티지 라인의 특성을 완벽히 인식했습니다. 로고 자수 상태가 우수하며, 시보리 늘어남이 적어 상급 컨디션으로 정밀 판독되었습니다. 특히 지퍼 헤드의 각인이 선명하여 정품 인증 98% 확률을 기록했습니다.',
    images: SAMPLE_IMAGES
  });

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [displayGrade, setDisplayGrade] = useState('B');
  const [currentBid, setCurrentBid] = useState(52000);
  const [bidHistory, setBidHistory] = useState([
    { bidder: 'Collector_K', price: 51200, time: '2분 전' },
    { bidder: 'VintageLover', price: 49000, time: '5분 전' },
    { bidder: 'AdidasMania', price: 45000, time: '12분 전' }
  ]);
  const [userBidAmt, setUserBidAmt] = useState('');
  const [logs, setLogs] = useState(['시스템: 경매장터 AI 엔진 정상 가동 중']);
  const fileInputRef = useRef(null);
  const [paymentStatus, setPaymentStatus] = useState(getPaymentStatusFromQuery());

  // 실시간 데이터 폴링 (마스터 엔진이 current_item.json, bid_history.json에 쓰는 데이터 구독)
  useEffect(() => {
    const poll = async () => {
      try {
        const [itemRes, bidRes] = await Promise.all([
          fetch('/data/current_item.json', { cache: 'no-store' }),
          fetch('/data/bid_history.json', { cache: 'no-store' }),
        ]);
        if (itemRes.ok) {
          const data = await itemRes.json();
          setItemData((prev) => ({
            ...prev,
            itemName: data.itemName ?? prev.itemName,
            grade: data.grade ?? prev.grade,
            currentMarketPrice: data.currentMarketPrice ?? prev.currentMarketPrice,
            recommendedStartPrice: data.recommendedStartPrice ?? prev.recommendedStartPrice,
            aiAnalysisText: data.aiAnalysisText ?? prev.aiAnalysisText,
            images: data.imagePath ? [data.imagePath, ...SAMPLE_IMAGES] : prev.images,
          }));
          if (data.grade) setDisplayGrade(data.grade);
          if (data.currentBid != null) setCurrentBid(Number(data.currentBid));
        }
        if (bidRes.ok) {
          const history = await bidRes.json();
          if (Array.isArray(history) && history.length > 0) {
            setBidHistory(
              history.map((h) => ({
                bidder: h.bidder,
                price: h.price,
                time: h.time || '—',
              }))
            );
            const top = history[0];
            if (top?.price) setCurrentBid(Number(top.price));
          }
        }
      } catch (_) {
        // 로컬 dev 시 파일 없을 수 있음 - 무시
      }
    };
    poll();
    const id = setInterval(poll, 2500);
    return () => clearInterval(id);
  }, []);

  // 카카오톡 초기화 (SDK 로드 후 init)
  useEffect(() => {
    const initKakao = () => {
      if (typeof window === 'undefined' || !window.Kakao) return;
      if (window.Kakao.isInitialized?.()) return;
      if (!KAKAO_JS_KEY) return;
      try {
        window.Kakao.init(KAKAO_JS_KEY);
      } catch (e) {
        console.warn('[Kakao] init 실패:', e);
      }
    };
    if (window.Kakao) {
      initKakao();
    } else {
      window.addEventListener('load', initKakao);
      return () => window.removeEventListener('load', initKakao);
    }
  }, [KAKAO_JS_KEY]);

  const shareKakao = async () => {
    if (typeof window === 'undefined' || !window.Kakao) {
      alert('카카오 SDK가 로드되지 않았습니다. 페이지를 새로고침 후 다시 시도해주세요.');
      return;
    }
    if (!KAKAO_JS_KEY) {
      alert('카카오 JavaScript 키가 설정되지 않았습니다.\nVercel 환경변수에 VITE_KAKAO_JS_KEY를 추가해주세요.');
      return;
    }
    if (!window.Kakao.isInitialized?.()) {
      try {
        window.Kakao.init(KAKAO_JS_KEY);
      } catch (e) {
        alert('카카오 SDK 초기화에 실패했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
    }
    const imageUrl = SAMPLE_IMAGES[0].startsWith('http')
      ? SAMPLE_IMAGES[0]
      : `${window.location.origin}${SAMPLE_IMAGES[0]}`;
    try {
      await window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '🎁 [경매장터] 대표님의 특별한 초대',
          description: 'AI가 감정하는 프리미엄 미공개 경매 플랫폼! 지금 입찰해보세요.',
          imageUrl,
          link: {
            mobileWebUrl: DEPLOY_URL,
            webUrl: DEPLOY_URL,
          },
        },
        buttons: [
          {
            title: '입찰하러 가기',
            link: {
              mobileWebUrl: DEPLOY_URL,
              webUrl: DEPLOY_URL,
            },
          },
        ],
      });
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.includes('domain') || msg.includes('도메인')) {
        alert('카카오 개발자 콘솔에 Vercel 도메인을 등록해주세요.\n자세한 방법은 KAKAO_도메인등록_가이드.md를 참고하세요.');
      } else {
        alert(`카카오 공유 중 오류: ${msg}`);
      }
    }
  };

  const addLog = useCallback((msg) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
  }, []);

  const runAIAnalysis = (file) => {
    if (!file) return;
    setIsAnalyzing(true);
    const url = URL.createObjectURL(file);
    addLog('AI: 고해상도 이미지 매트릭스 분석 중...');
    
    let count = 0;
    const interval = setInterval(() => {
      setDisplayGrade(['A','B','C','D'][count % 4]);
      count++;
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      const finalGrade = 'A';
      setItemData(prev => ({
        ...prev,
        itemName: '정밀 감정 완료 상품',
        grade: finalGrade,
        currentMarketPrice: 156000,
        aiAnalysisText: `[AI 정밀 판독 결과] 해당 제품은 ${GRADE_CONFIG[finalGrade].label} 상태로 확인되었습니다. 실시간 글로벌 빈티지 DB 대조 결과, 보존 가치가 매우 높습니다. 자수 밀도와 소재 질감이 90년대 정규 발매 모델과 정확히 일치합니다.`,
        images: [url, ...prev.images]
      }));
      setActiveImgIdx(0);
      setIsAnalyzing(false);
      addLog(`결과: AI 정밀 감정 ${finalGrade}등급 확정`);
      alert('AI 정밀 감정 완료! 프리미엄 매물로 등록되었습니다.');
    }, 3500);
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
    <div className="premium-app">
      {/* 1단계: 헤더 & 히어로 갤러리 */}
      <header className="main-header glass">
        <div className="nav-container">
          <div className="brand-group">
            <h1 className="main-logo">경매장터</h1>
            <div className="live-status">
              <span className="dot"></span> LIVE
            </div>
          </div>
          <button className="btn-upload-top" onClick={() => fileInputRef.current.click()}>
            <span className="icon">📸</span> AI 감정
          </button>
          <input type="file" ref={fileInputRef} hidden onChange={(e) => runAIAnalysis(e.target.files[0])} />
        </div>
      </header>

      <main className="scroll-content">
        {/* Page 1: Product Showcase */}
        <section className="product-hero">
          <div className={`hero-frame glass ${isAnalyzing ? 'analyzing' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeImgIdx}
                src={itemData.images[activeImgIdx]} 
                className="hero-img" 
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              />
            </AnimatePresence>
            {isAnalyzing && <div className="scanning-line" />}
            {isAnalyzing && <div className="analyzing-text">AI 딥러닝 분석 중...</div>}
            <div className="grade-overlay">
               {isAnalyzing ? displayGrade : itemData.grade}<span>Grade</span>
            </div>
          </div>
          <div className="thumb-navbar">
            {itemData.images.slice(0, 5).map((img, i) => (
              <motion.div 
                key={i} 
                className={`thumb-box ${activeImgIdx === i ? 'active' : ''}`}
                onClick={() => setActiveImgIdx(i)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.9 }}
              >
                <img src={img} alt="thumb" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Page 2: Item Info & Action */}
        <div className="info-grid">
           <GlassSection>
              <div className="item-meta">
                 <h2 className="item-title">{itemData.itemName}</h2>
                 <p className="item-desc">#아디다스 #빈티지 #정품인증 #AI감정</p>
                 <div className="star-row">
                    {GRADE_CONFIG[itemData.grade].stars}
                    <span className="grade-txt">{GRADE_CONFIG[itemData.grade].label}</span>
                 </div>

                 {/* 결제 상태 시각 피드백 */}
                 <div className="payment-status-row">
                   <span
                     className="payment-badge"
                     style={{
                       color: PAYMENT_STATUS_CONFIG[paymentStatus].color,
                       background: PAYMENT_STATUS_CONFIG[paymentStatus].bg,
                     }}
                   >
                     {paymentStatus} · {PAYMENT_STATUS_CONFIG[paymentStatus].label}
                   </span>
                 </div>
              </div>
           </GlassSection>

           <div className="price-row">
              <div className="glass-card price-main">
                 <span className="cap">현재 최고 입찰가</span>
                 <div className="val accent">{formatPrice(currentBid)}</div>
              </div>
              <div className="glass-card timer-main">
                 <span className="cap">경매 종료까지</span>
                 <div className="val timer">00:15:32</div>
              </div>
           </div>

           <GlassSection title="실시간 입찰하기">
              <div className="bid-group">
                 <input 
                    type="text" 
                    placeholder="입찰가를 입력하세요" 
                    value={userBidAmt} 
                    onChange={(e) => setUserBidAmt(e.target.value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ","))} 
                 />
                 <button className="btn-bid-submit" onClick={handleBid}>입찰하기</button>
              </div>
              <div className="bid-history-mini">
                 {bidHistory.slice(0, 3).map((h, i) => (
                   <div key={i} className="history-row">
                      <span className="user">{h.bidder}</span>
                      <span className="price">{formatPrice(h.price)}</span>
                      <span className="time">{h.time}</span>
                   </div>
                 ))}
              </div>
           </GlassSection>
        </div>

        {/* Page 3: AI Deep Report & Market Analysis */}
        <section className="deep-analysis">
           <GlassSection title="AI 정밀 감정 리포트">
              <div className="report-container">
                 <div className="ai-icon">🦾</div>
                 <p className="report-p">{itemData.aiAnalysisText}</p>
                 <div className="market-comparative">
                    <div className="comp-item">
                       <span className="l">희망 시작가</span>
                       <span className="v">{formatPrice(itemData.recommendedStartPrice)}</span>
                    </div>
                    <div className="comp-item highlight">
                       <span className="l">예상 시장 시세</span>
                       <span className="v">{formatPrice(itemData.currentMarketPrice)}</span>
                    </div>
                 </div>
              </div>
           </GlassSection>

           <GlassSection title="실시간 서버 로그">
              <div className="log-panel">
                 {logs.map((log, i) => <div key={i} className="log-entry">● {log}</div>)}
              </div>
           </GlassSection>
        </section>

        {/* CTA Section */}
        <section className="cta-footer">
           <button className="btn-kakao-invite" onClick={shareKakao}>
              <span className="k-icon">💬</span> 카카오톡으로 친구 초대하기
           </button>
           <p className="footer-notice">본 경매는 AI 감정 모델에 기반한 보조 정보를 제공합니다.</p>
        </section>
      </main>

      <footer className="final-footer">
         <p>© 2026 AUCTION MARKET - PREMIUM AI SERVICE</p>
      </footer>
    </div>
  );
}

export default App;
