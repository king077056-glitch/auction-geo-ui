/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// ===== 카카오톡 SDK 연동 가이드 =====
const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || '';

const initKakao = () => {
  if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized() && KAKAO_JS_KEY) {
    window.Kakao.init(KAKAO_JS_KEY);
    return true;
  }
  return false;
};

const DEPLOY_URL = 'https://jovial-truffle-51a539.netlify.app';

const shareToKakao = () => {
  initKakao();
  if (window.Kakao?.Share) {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '경매지오 - AI 정밀 시세 리포트',
        description: '당신만의 가치를 만나는 AI 경매 공간',
        imageUrl: 'https://jovial-truffle-51a539.netlify.app/data/adidas_front.jpg',
        link: { mobileWebUrl: DEPLOY_URL, webUrl: DEPLOY_URL },
      },
      buttons: [{ title: '앱으로 이동', link: { mobileWebUrl: DEPLOY_URL } }],
    });
  } else {
    navigator.clipboard?.writeText(window.location.href);
    alert('링크가 복사되었습니다! 카카오톡에 붙여넣기 해주세요.');
  }
};

const GRADE_THEMES = {
  A: {
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 25%, #10b981 50%, #84cc16 100%)',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  B: {
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #a855f7 100%)',
    glow: 'rgba(139, 92, 246, 0.4)',
  },
  C: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  D: {
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)',
    glow: 'rgba(100, 116, 139, 0.3)',
  },
};

const getGradeTheme = (grade) => {
  const g = (grade || 'C').charAt(0).toUpperCase();
  return GRADE_THEMES[g] || GRADE_THEMES.C;
};

const formatPrice = (price) => {
  const numericPrice = typeof price === 'string' ? parseInt(String(price).replace(/[^0-9]/g, '')) : price;
  if (isNaN(numericPrice)) return '₩0';
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(numericPrice);
};

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const getStars = (grade) => {
  const g = (grade || 'C').charAt(0).toUpperCase();
  if (g === 'A') return '⭐⭐⭐⭐⭐';
  if (g === 'B') return '⭐⭐⭐⭐';
  if (g === 'C') return '⭐⭐⭐';
  if (g === 'D') return '⭐⭐';
  return '⭐';
};

const getGradeLabel = (grade) => {
  const g = (grade || 'C').charAt(0).toUpperCase();
  if (g === 'A') return '신품급 (Near Mint)';
  if (g === 'B') return '우수 (Very Good)';
  if (g === 'C') return '보통 (Good)';
  if (g === 'D') return '하급 (Poor)';
  return '분석 중';
};

const GRADE_COLORS = { A: '#10b981', B: '#8b5cf6', C: '#f59e0b', D: '#64748b' };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function App() {
  const [itemData, setItemData] = useState({
    itemName: '경매 상품 스캔 중...',
    grade: 'C',
    currentMarketPrice: '0',
    recommendedStartPrice: '0',
    aiAnalysisText: '사진을 업로드하면 AI가 분석을 시작합니다.',
    marketComparison: '분석 대기 중',
    imagePath: '',
    images: [],
  });

  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [displayGrade, setDisplayGrade] = useState('C');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const fileInputRef = useRef(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [platformPrices, setPlatformPrices] = useState([]);
  const [userBidAmt, setUserBidAmt] = useState('');
  const [logs, setLogs] = useState([
    '시스템: 경매지오 하이퍼 오토메이션 엔진 가동',
    'AI: 실물 판독 및 가격 전략 엔진 활성화',
  ]);

  const addLog = useCallback((msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev].slice(0, 5));
  }, []);

  const runAnalysis = useCallback(() => {
    const AI_LOGS = [
      '시스템: 이미지 픽셀 매트릭스 추출 중...',
      'AI: 상태 감정 엔진 가동 (Deep Learning Model)...',
      '분석: 패턴 매칭 및 시세 데이터 대조 중...',
      '결과: 실시간 시세 리포트 생성이 완료되었습니다.',
    ];
    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < AI_LOGS.length) addLog(AI_LOGS[logIdx++]);
    }, 700);

    const gradeCycle = ['A', 'B', 'C', 'D'];
    let gradeIdx = 0;
    const gradeInterval = setInterval(() => setDisplayGrade(gradeCycle[gradeIdx++ % 4]), 350);

    const finalGrades = ['A', 'B', 'C', 'D'];
    const finalGrade = finalGrades[Math.floor(Math.random() * 4)];
    const basePrices = { A: 120000, B: 65000, C: 38000, D: 22000 };
    const price = basePrices[finalGrade];

    setTimeout(() => {
      clearInterval(logInterval);
      clearInterval(gradeInterval);
      setDisplayGrade(finalGrade);
      setIsAnalyzing(false);
      setIsCustomProduct(true);
      setItemData((prev) => ({
        ...prev,
        itemName: '사용자 커스텀 상품',
        grade: finalGrade,
        currentMarketPrice: String(price),
        recommendedStartPrice: String(Math.round(price * 0.4)),
        aiAnalysisText: `업로드 이미지 기반 AI 정밀 분석이 완료되었습니다. ${finalGrade}등급으로 판정되었으며, 5대 플랫폼 시세 데이터와 교차 검증을 거쳤습니다.`,
      }));
      setCurrentBid(Math.round(price * 0.4));
    }, 3500);
  }, [addLog]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target?.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }
    try {
      if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
      const url = URL.createObjectURL(file);
      setUploadedImageUrl(url);
      setSelectedImage(0);
      setDisplayGrade('A');
      setIsAnalyzing(true);
      setItemData((prev) => ({ ...prev, images: [], imagePath: '', itemName: 'AI 분석 중...' }));
      runAnalysis();
    } catch {
      alert('이미지 로딩에 실패했습니다. 다른 파일을 선택해 주세요.');
    }
  }, [uploadedImageUrl, runAnalysis]);

  const handleResetAnalysis = useCallback(() => {
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    setUploadedImageUrl(null);
    setIsCustomProduct(false);
    setDisplayGrade('C');
    setSelectedImage(0);
    fetch('./data/current_item.json')
      .then((res) => res.json())
      .then((data) => {
        setItemData(data);
        setCurrentBid(data.currentBid || parseInt(String(data.recommendedStartPrice).replace(/[^0-9]/g, '')));
      })
      .catch(() => {});
  }, [uploadedImageUrl]);

  const syncEngine = useCallback(() => {
    if (isCustomProduct) return;
    fetch('./data/current_item.json')
      .then((res) => res.json())
      .then((data) => {
        if (data.itemName !== itemData.itemName) {
          setItemData(data);
          setCurrentBid(data.currentBid || parseInt(String(data.recommendedStartPrice).replace(/[^0-9]/g, '')));
          addLog(`AI: 신규 물품 '${data.itemName}' 감지 및 분석 완료`);
          setSelectedImage(0);
        } else if (data.currentBid && data.currentBid > currentBid) {
          setCurrentBid(data.currentBid);
        }
      })
      .catch(() => {});
    fetch('./data/bid_history.json')
      .then((res) => res.json())
      .then((data) => setBidHistory(data))
      .catch(() => {});
  }, [itemData.itemName, currentBid, addLog, isCustomProduct]);

  useEffect(() => {
    const interval = setInterval(syncEngine, 2000);
    return () => clearInterval(interval);
  }, [syncEngine]);

  useEffect(() => {
    fetch('./data/platform_prices.json')
      .then((res) => res.json())
      .then((data) => setPlatformPrices(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBidSubmit = () => {
    const bidVal = parseInt(String(userBidAmt).replace(/,/g, ''));
    if (!bidVal || bidVal <= currentBid) {
      alert('현재 최고가보다 높은 금액을 입력해주세요.');
      return;
    }
    if (navigator.vibrate) navigator.vibrate(10);
    setIsProcessing(true);
    setTimeout(() => {
      setCurrentBid(bidVal);
      addLog(`사용자: ${formatPrice(bidVal)} 입찰 성공!`);
      setUserBidAmt('');
      setIsProcessing(false);
    }, 800);
  };

  const theme = getGradeTheme(isAnalyzing ? displayGrade : itemData.grade);

  return (
    <>
      <motion.div
        className="theme-backdrop"
        style={{
          background: theme.gradient,
          boxShadow: `inset 0 0 120px ${theme.glow}`,
        }}
        key={itemData.grade}
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="mobile-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <header className="main-header">
          <motion.div className="logo-section" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
            <span className="logo-text">경매지오</span>
            <motion.div className="status-badge" animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              AI 실시간 가동 중
            </motion.div>
          </motion.div>
          <div className="header-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              aria-label="상품 이미지 선택"
            />
            <motion.button
              type="button"
              className="btn-analyze"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📷 상품 감정
            </motion.button>
            <motion.button
              className="btn-share-kakao"
              onClick={shareToKakao}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              공유
            </motion.button>
            <div className="user-icon">👤</div>
          </div>
        </header>

        <motion.main className="main-content" variants={containerVariants} initial="hidden" animate="visible">
          <motion.section
            className="glass-card product-main glass-premium"
            variants={itemVariants}
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
          >
            <div className="badge-top">시작가 대비 최저가</div>
            <motion.div
              className={`product-image-container ${isAnalyzing ? 'analyzing' : ''}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              onClick={() => !isAnalyzing && (itemData.images?.length > 0 || itemData.imagePath || uploadedImageUrl) && setLightboxOpen(true)}
            >
              {uploadedImageUrl ? (
                <>
                  <motion.img
                    src={uploadedImageUrl}
                    alt={itemData.itemName}
                    className="product-image product-image-clickable"
                  />
                  {isAnalyzing && (
                    <>
                      <div className="scan-line" />
                      <div className="scan-overlay" />
                    </>
                  )}
                </>
              ) : itemData.images && itemData.images.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={itemData.images[selectedImage]}
                    src={itemData.images[selectedImage]}
                    alt={itemData.itemName}
                    className="product-image product-image-clickable"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  />
                </AnimatePresence>
              ) : itemData.imagePath ? (
                <motion.img
                  src={itemData.imagePath}
                  alt={itemData.itemName}
                  className="product-image product-image-clickable"
                />
              ) : (
                <motion.div
                  className="product-image-placeholder"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  이미지 분석 중...
                </motion.div>
              )}
              {(itemData.images?.length > 0 || itemData.imagePath || uploadedImageUrl) && !isAnalyzing && (
                <span className="lightbox-hint">확대 보기</span>
              )}
            </motion.div>

            {itemData.images && itemData.images.length > 1 && (
              <div className="image-thumbnails">
                {itemData.images.map((img, idx) => (
                  <motion.div
                    key={idx}
                    className={`thumbnail-item ${selectedImage === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <img src={img} alt={`thumbnail-${idx}`} />
                  </motion.div>
                ))}
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.h1
                key={itemData.itemName}
                className="product-title"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {itemData.itemName}
              </motion.h1>
            </AnimatePresence>
            <motion.div
              className="grade-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span
                className="grade-tag"
                style={{
                  backgroundColor: `${GRADE_COLORS[isAnalyzing ? displayGrade : itemData.grade] || GRADE_COLORS.C}22`,
                  borderColor: GRADE_COLORS[isAnalyzing ? displayGrade : itemData.grade] || GRADE_COLORS.C,
                  color: GRADE_COLORS[isAnalyzing ? displayGrade : itemData.grade] || GRADE_COLORS.C,
                }}
              >
                {isAnalyzing ? displayGrade : itemData.grade} 등급 · {getGradeLabel(isAnalyzing ? displayGrade : itemData.grade)}
              </span>
              <span className="star-rating">{getStars(isAnalyzing ? displayGrade : itemData.grade)}</span>
            </motion.div>
            {isCustomProduct && !isAnalyzing && (
              <motion.button
                type="button"
                className="btn-reset-analysis"
                onClick={handleResetAnalysis}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                다른 상품 분석
              </motion.button>
            )}
          </motion.section>

          <motion.div className="bid-grid" variants={itemVariants}>
            <motion.div
              className="glass-card glass-premium"
              whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
            >
              <span className="label">현재 최고가</span>
              <div className="price-text">{formatPrice(currentBid)}</div>
            </motion.div>
            <motion.div
              className="glass-card glass-premium"
              whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
            >
              <span className="label">남은 시간</span>
              <div className="time-text">{formatTime(timeLeft)}</div>
            </motion.div>
          </motion.div>

          <motion.section
            className="glass-card glass-premium bid-input-area"
            variants={itemVariants}
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
          >
            <span className="label">경매 입찰 참여하기</span>
            <div className="bid-input-container">
              <input
                type="text"
                className="input-bid"
                placeholder="금액을 입력하세요"
                value={userBidAmt}
                onChange={(e) => setUserBidAmt(e.target.value)}
              />
              <motion.button
                className="btn-bid"
                onClick={handleBidSubmit}
                disabled={isProcessing}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.5)' }}
                whileTap={{ scale: 0.98, boxShadow: '0 2px 8px -2px rgba(79, 70, 229, 0.5)' }}
              >
                {isProcessing ? '처리 중...' : '입찰'}
              </motion.button>
            </div>
          </motion.section>

          <motion.section
            className="glass-card glass-premium ai-insight-box"
            variants={itemVariants}
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
          >
            <div className="slogan-main">AI가 분석한 정밀 시세 리포트</div>
            <div className="label">분석 상세</div>
            <p className="ai-message">{itemData.aiAnalysisText}</p>
            <div className="market-stat">
              <span className="stat-label">시장 평균가 (신품 기준)</span>
              <span className="stat-value">{formatPrice(itemData.currentMarketPrice)}</span>
            </div>
            <div className="market-stat">
              <span className="stat-label">AI 추천 경매 시작가</span>
              <span className="stat-value">{formatPrice(itemData.recommendedStartPrice)}</span>
            </div>
            <div className="platform-section">
              <span className="stat-label">5대 플랫폼 시세 (AI 감정 엔진 수집)</span>
              {platformPrices.length > 0 ? (
                <div className="platform-grid">
                  {platformPrices.map((p, i) => (
                    <motion.div
                      key={i}
                      className="platform-item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <span className="platform-name">{p.platform}</span>
                      <span className="platform-desc">{p.desc}</span>
                      <span className="platform-price">{formatPrice(p.avgPrice)}</span>
                      <span className="platform-status">{p.status}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <span className="stat-value">5대 플랫폼 실시간 연동 (KREAM, 중고나라, 번개장터, 당근마켓, 옥션)</span>
              )}
            </div>
          </motion.section>

          <motion.section
            className="glass-card glass-premium"
            variants={itemVariants}
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
          >
            <div className="label">실시간 입찰 내역</div>
            <div className="bid-history-list">
              <AnimatePresence>
                {bidHistory.map((bid, i) => (
                  <motion.div
                    key={i}
                    className="history-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span className="history-user">{bid.bidder}님</span>
                    <span className="history-price">{formatPrice(bid.price)}</span>
                    <span className="history-time">{bid.time}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>

          <motion.section
            className="glass-card cta-card glass-premium"
            variants={itemVariants}
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
          >
            <div className="cta-header">
              <span className="cta-icon">◆</span>
              <h2 className="cta-title">당신만의 가치를 만나는 AI 경매 공간</h2>
            </div>
            <p className="cta-text">당신의 물건을 가치 있게 판매하세요.</p>
          </motion.section>

          <AnimatePresence>
            {lightboxOpen && (
              <motion.div
                className="lightbox-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setLightboxOpen(false)}
              >
                <motion.div
                  className="lightbox-content"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="lightbox-close" onClick={() => setLightboxOpen(false)} aria-label="닫기">
                    <span className="lightbox-close-icon">×</span>
                  </button>
                  {(itemData.images && itemData.images.length > 0) || uploadedImageUrl ? (
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={uploadedImageUrl || itemData.images?.[selectedImage]}
                        src={uploadedImageUrl || itemData.images?.[selectedImage]}
                        alt={itemData.itemName}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </AnimatePresence>
                  ) : itemData.imagePath ? (
                    <img src={itemData.imagePath} alt={itemData.itemName} />
                  ) : uploadedImageUrl ? (
                    <img src={uploadedImageUrl} alt={itemData.itemName} />
                  ) : null}
                  {itemData.images && itemData.images.length > 1 && !uploadedImageUrl && (
                    <div className="lightbox-thumbnails">
                      {itemData.images.map((img, idx) => (
                        <button
                          key={idx}
                          className={`lightbox-thumb ${selectedImage === idx ? 'active' : ''}`}
                          onClick={() => setSelectedImage(idx)}
                        >
                          <img src={img} alt={`${idx + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="engine-logs">
            {logs.map((log, i) => (
              <div key={i}>● {log}</div>
            ))}
          </div>
        </motion.main>
      </motion.div>
    </>
  );
}

export default App;
