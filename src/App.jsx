/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

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

const SAMPLE_IMAGES = [
  '/data/adidas_front.jpg',
  '/data/adidas_back.jpg',
  '/data/adidas_logo_detail.jpg',
  '/data/adidas_tag_1.jpg',
  '/data/adidas_tag_2.jpg'
];

function App() {
  const [itemData, setItemData] = useState({
    itemName: '아디다스 빈티지 윈드브레이커',
    grade: 'B',
    currentMarketPrice: 85000,
    images: SAMPLE_IMAGES
  });

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [displayGrade, setDisplayGrade] = useState('B');
  const [currentBid, setCurrentBid] = useState(52000);
  const [userBidAmt, setUserBidAmt] = useState('');
  const [logs, setLogs] = useState(['시스템: 경매지오 AI 엔진 정상 가동']);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized() && KAKAO_JS_KEY) {
      window.Kakao.init(KAKAO_JS_KEY);
    }
  }, []);

  const shareKakao = () => {
    if (!window.Kakao) return alert('카카오 SDK 로드 중...');
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '🎁 [경매지오] 대표님의 특별한 선물',
        description: 'AI가 실시간으로 감정하는 프리미엄 경매 플랫폼!',
        imageUrl: window.location.origin + itemData.images[0],
        link: { mobileWebUrl: DEPLOY_URL, webUrl: DEPLOY_URL },
      },
      buttons: [{ title: '앱으로 보기', link: { mobileWebUrl: DEPLOY_URL, webUrl: DEPLOY_URL } }],
    });
  };

  const handleBid = () => {
    const val = parseInt(userBidAmt.replace(/,/g, ''));
    if (!val || val <= currentBid) return alert('현재가보다 높은 금액을 입력해주세요.');
    setCurrentBid(val);
    setUserBidAmt('');
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] 입찰 성공: ${formatPrice(val)}`, ...prev]);
  };

  const runAnalysis = (file) => {
    if (!file) return;
    setIsAnalyzing(true);
    const url = URL.createObjectURL(file);
    setTimeout(() => {
      setItemData(prev => ({ ...prev, images: [url, ...prev.images], grade: 'A' }));
      setIsAnalyzing(false);
      alert('AI 정밀 감정 완료!');
    }, 2500);
  };

  return (
    <div className="app-container">
      <header className="glass header">
        <h1 className="logo-geo">경매지오</h1>
        <div className="status-badge">LIVE 경매중</div>
      </header>

      <main className="content">
        <section className="glass gallery-box">
          <div className="main-frame">
            <img src={itemData.images[activeImgIdx]} className="full-img" alt="item" />
            {isAnalyzing && <div className="scanning-bar" />}
          </div>
          <div className="thumb-row">
            {itemData.images.slice(0, 5).map((img, i) => (
              <div key={i} className={`thumb ${activeImgIdx === i ? 'on' : ''}`} onClick={() => setActiveImgIdx(i)}>
                <img src={img} alt="thumb" />
              </div>
            ))}
          </div>
        </section>

        <section className="product-meta">
          <div className="title-bar">
            <h2>{itemData.itemName}</h2>
            <span className={`grade g-${itemData.grade}`}>{itemData.grade}등급</span>
          </div>
          <div className="price-cards">
            <div className="glass card">
              <span className="cap">현재 최고가</span>
              <div className="val highlight">{formatPrice(currentBid)}</div>
            </div>
            <div className="glass card">
              <span className="cap">남은 시간</span>
              <div className="val">00:15:32</div>
            </div>
          </div>
        </section>

        <section className="glass bid-box">
          <input 
            className="bid-input" 
            placeholder="입찰 금액 입력" 
            value={userBidAmt} 
            onChange={(e) => setUserBidAmt(e.target.value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ","))} 
          />
          <button className="btn-bid" onClick={handleBid}>입찰하기</button>
        </section>

        <section className="glass ai-report">
          <div className="rep-head">
            <h3>AI 정밀 분석 리포트</h3>
            <button className="btn-upload" onClick={() => fileInputRef.current.click()}>사진 업로드</button>
            <input type="file" ref={fileInputRef} hidden onChange={(e) => runAnalysis(e.target.files[0])} />
          </div>
          <p className="rep-body">해당 제품은 AI 판독 결과 {GRADE_CONFIG[itemData.grade].label} 상태입니다. 전체적인 소매와 지퍼 상태가 매우 우수하며 정밀 검수 결과 정품으로 판명되었습니다.</p>
          <div className="rep-foot">
            <span>시장 평균 시세</span>
            <strong>{formatPrice(itemData.currentMarketPrice)}</strong>
          </div>
        </section>

        <button className="btn-kakao" onClick={shareKakao}>
          <span className="icon">💬</span> 카카오톡 공유하기
        </button>

        <div className="logs">
          {logs.map((L, i) => <div key={i} className="L">● {L}</div>)}
        </div>
      </main>
    </div>
  );
}

export default App;
