import { useState, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

interface ClothingItem {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  color: string;
  imageUrl?: string;
}

export default function Home() {
  const [activeView, setActiveView] = useState('home');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [humanImage, setHumanImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // In pages/index.tsx

const clothingItems: ClothingItem[] = [
  { 
    id: 1, 
    name: '클래식 셔츠', 
    price: '39,900원', 
    category: 'shirts', 
    image: '👔', 
    color: '화이트', 
    imageUrl: 'https://huggingface.co/spaces/MUKHAMMED19/virtual-try-on-app/resolve/main/example/cloth/cloth02.jpg' 
  },
  { 
    id: 2, 
    name: '슬림핏 청바지', 
    price: '54,900원', 
    category: 'pants', 
    image: '👖', 
    color: '네이비',
    // ADD THIS (check filename)
    imageUrl: 'https://huggingface.co/spaces/MUKHAMMED19/virtual-try-on-app/resolve/main/example/cloth/cloth02.jpg' 
  },
  { 
    id: 3, 
    name: '여름 원피스', 
    price: '42,900원', 
    category: 'dresses', 
    image: '👗', 
    color: '핑크',
    // ADD THIS (check filename)
    imageUrl: 'https://huggingface.co/spaces/MUKHAMMED19/virtual-try-on-app/resolve/main/example/cloth/cloth02.jpg'
  },
  { 
    id: 4, 
    name: '스포츠 재킷', 
    price: '79,900원', 
    category: 'jackets', 
    image: '🧥', 
    color: '블랙',
    // ADD THIS (check filename)
    imageUrl: 'https://huggingface.co/spaces/MUKHAMMED19/virtual-try-on-app/resolve/main/example/cloth/cloth02.jpg'
  },
  { 
    id: 5, 
    name: '이브닝 드레스', 
    price: '129,900원', 
    category: 'dresses', 
    image: '👗', 
    color: '레드',
    // ADD THIS (check filename)
    imageUrl: 'https://huggingface.co/spaces/MUKHAMMED19/virtual-try-on-app/resolve/main/example/cloth/cloth02.jpg'
  },
  { 
    id: 6, 
    name: '운동화', 
    price: '69,900원', 
    category: 'shoes', 
    image: '👟', 
    color: '화이트',
    // ADD THIS (check filename)
    imageUrl: 'https://huggingface.co/spaces/MUKHAMMED19/virtual-try-on-app/resolve/main/example/cloth/cloth02.jpg'
  },
];

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      alert('카메라 액세스가 거부되었거나 사용할 수 없습니다');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        setHumanImage(imageData);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const processVirtualTryOn = async () => {
    if (!humanImage || !selectedItem) {
      alert('사진과 의류를 선택해주세요');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          humanImage: humanImage,
          garmentImage: selectedItem.imageUrl || selectedItem.image
        })
      });

      const result = await response.json();
      
      if (result.data && result.data[0]) {
        setResultImage(result.data[0]);
        setActiveView('result');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('처리 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const getFilteredItems = () => {
    let filtered = clothingItems;
    
    if (currentCategory !== 'all') {
      filtered = filtered.filter(item => item.category === currentCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.color.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  return (
    <>
      <Head>
        <title>가상 피팅룸</title>
        <meta name="description" content="가상 피팅룸으로 옷을 입어보세요" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        {/* Home View */}
        {activeView === 'home' && (
          <div className={styles.view}>
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.headerTitle}>
                  <h1>가상</h1>
                  <h2>피팅룸</h2>
                </div>
                <button className={styles.userBtn} onClick={() => setActiveView('profile')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </button>
              </div>
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="옷 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </header>

            <div className={styles.categories}>
              {['all', 'shirts', 'dresses', 'shoes'].map(cat => (
                <button
                  key={cat}
                  className={`${styles.categoryBtn} ${currentCategory === cat ? styles.active : ''}`}
                  onClick={() => setCurrentCategory(cat)}
                >
                  {cat === 'all' ? '전체' : cat === 'shirts' ? '셔츠' : cat === 'dresses' ? '원피스' : '신발'}
                </button>
              ))}
            </div>

            <div className={styles.productsContainer}>
              <div className={styles.productsGrid}>
                {getFilteredItems().map(item => (
                  <div
                    key={item.id}
                    className={styles.productCard}
                    onClick={() => {
                      setSelectedItem(item);
                      setActiveView('detail');
                    }}
                  >
                    <div className={styles.productImage}>
                      <div className={styles.productEmoji}>{item.image}</div>
                      <button
                        className={styles.favoriteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                      >
                        ❤️
                      </button>
                    </div>
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>{item.name}</div>
                      <div className={styles.productPrice}>{item.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Camera View */}
        {activeView === 'camera' && (
          <div className={styles.cameraView}>
            <div className={styles.cameraHeader}>
              <button onClick={() => setActiveView('home')}>뒤로</button>
              <h1>피팅하기</h1>
            </div>
            <div className={styles.cameraPreview}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {humanImage && (
                <img src={humanImage} alt="Captured" style={{ width: '100%' }} />
              )}
            </div>
            <div className={styles.cameraControls}>
              {!stream && !humanImage && (
                <button onClick={startCamera} className={styles.captureBtn}>
                  카메라 시작
                </button>
              )}
              {stream && !humanImage && (
                <button onClick={capturePhoto} className={styles.captureBtn}>
                  사진 촬영
                </button>
              )}
              {humanImage && (
                <>
                  <button onClick={() => setHumanImage(null)} className={styles.captureBtn}>
                    다시 찍기
                  </button>
                  <button onClick={processVirtualTryOn} className={styles.tryOnBtn} disabled={isProcessing}>
                    {isProcessing ? '처리 중...' : '피팅 시작'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Detail View */}
        {activeView === 'detail' && selectedItem && (
          <div className={styles.detailView}>
            <div className={styles.detailHeader}>
              <button onClick={() => setActiveView('home')}>뒤로</button>
              <h1>상품 상세</h1>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailImage}>
                <div className={styles.detailEmoji}>{selectedItem.image}</div>
              </div>
              <div className={styles.detailInfo}>
                <h2>{selectedItem.name}</h2>
                <p className={styles.price}>{selectedItem.price}</p>
                <p className={styles.color}>색상: {selectedItem.color}</p>
              </div>
              <button
                className={styles.tryOnBtn}
                onClick={() => setActiveView('camera')}
              >
                피팅하기
              </button>
            </div>
          </div>
        )}

        {/* Result View */}
        {activeView === 'result' && resultImage && (
          <div className={styles.resultView}>
            <div className={styles.detailHeader}>
              <button onClick={() => setActiveView('home')}>홈으로</button>
              <h1>피팅 결과</h1>
            </div>
            <div className={styles.resultContent}>
              <img src={resultImage} alt="Result" className={styles.resultImage} />
              <button onClick={() => setActiveView('order')} className={styles.orderBtn}>
                주문하기
              </button>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className={styles.bottomNav}>
          <button onClick={() => setActiveView('home')}>
            <span>카탈로그</span>
          </button>
          <button onClick={() => setActiveView('camera')} className={styles.cameraFab}>
            <span>피팅</span>
          </button>
          <button onClick={() => setActiveView('favorites')}>
            <span>찜</span>
          </button>
        </nav>
      </div>
    </>
  );
}
