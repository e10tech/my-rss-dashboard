'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSourceStyle } from '@/lib/utils';

// ▼▼▼ アイコン定義 (SVG) ▼▼▼
const IconStar = ({ filled, size = 18 }: { filled: boolean; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
const IconBookmark = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
  </svg>
);
const IconArrowUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
);
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

type Article = {
  id: string;
  title: string;
  url: string;
  summary: string;
  published_at: string;
  created_at: string;
  source: { name: string };
  gemini_insight: string;
  gemini_example: string;
  gemini_explanation: string[];
  is_favorite: boolean;
};

export default function Home() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [displayArticles, setDisplayArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 日付切り替え用 (0=Today, 1=Yesterday...)
  const [dayOffset, setDayOffset] = useState(0);
  
  // スクロールボタン表示用
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // ▼ 優先度ロジック
  const getPriority = (sourceName: string) => {
    const name = sourceName?.toLowerCase() || "";
    if (name.includes('google')) return 1;
    if (name.includes('openai')) return 2;
    if (name.includes('github')) return 3;
    if (name.includes('visual studio')) return 4;
    if (name === 'zenn trends') return 5;
    if (name === 'zenn (copilot)') return 6;
    if (name === 'qiita trends') return 7;
    if (name === 'qiita (copilot)') return 8;
    return 9;
  };

  // ▼ 日付判定ロジック
  const isTargetDayInJST = (utcTimestamp: string, offset: number): boolean => {
    const date = new Date(utcTimestamp);
    const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const now = new Date();
    const targetJstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    targetJstDate.setDate(targetJstDate.getDate() - offset);
    
    return (
      jstDate.getUTCFullYear() === targetJstDate.getUTCFullYear() &&
      jstDate.getUTCMonth() === targetJstDate.getUTCMonth() &&
      jstDate.getUTCDate() === targetJstDate.getUTCDate()
    );
  };

  // ▼ 日付表示文字列作成
  const getDateDisplay = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return `(${d.getMonth() + 1}/${d.getDate()})`;
  };

  // ▼ データ取得
  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`*, source:sources(name)`)
        .order('created_at', { ascending: false })
        .limit(300);

      if (!error && data) {
        const safeData = data.map(d => ({...d, is_favorite: d.is_favorite ?? false}));
        setAllArticles(safeData);
      }
      setLoading(false);
    };
    fetchArticles();
  }, []);

  // ▼ 表示データのフィルタリングとソート
  useEffect(() => {
    if (allArticles.length === 0) return;
    const filtered = allArticles.filter((article) => isTargetDayInJST(article.created_at, dayOffset));
    const sorted = filtered.sort((a, b) => {
      const priorityA = getPriority(a.source?.name);
      const priorityB = getPriority(b.source?.name);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
    setDisplayArticles(sorted);
  }, [dayOffset, allArticles]);

  // ▼ スクロール検知
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowScrollBtn(true);
      else setShowScrollBtn(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ▼ トップへ戻る
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ▼ ブックマーク切り替え
  const toggleBookmark = async (e: React.MouseEvent, article: Article) => {
    e.stopPropagation(); // モーダルを開くのを防ぐ
    const newStatus = !article.is_favorite;
    setAllArticles(current => current.map(a => a.id === article.id ? { ...a, is_favorite: newStatus } : a));
    if (selectedArticle && selectedArticle.id === article.id) {
      setSelectedArticle({ ...selectedArticle, is_favorite: newStatus });
    }
    await supabase.from('articles').update({ is_favorite: newStatus }).eq('id', article.id);
  };

  const closeModal = () => setSelectedArticle(null);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading articles...</div>;

  return (
    <div className="main-wrapper">
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ marginBottom: '10px' }}>Daily Tech Insights</h1>
        
        <div className="date-info" style={{ marginBottom: '20px' }}>
          {getDateDisplay(dayOffset)} | {displayArticles.length} Updates
        </div>

        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginTop: '10px'
        }}>
          {/* 日付切り替えタブ */}
          <div style={{ display: 'flex', background: '#e0e0e0', borderRadius: '8px', padding: '4px' }}>
            {[2, 1, 0].map((offset) => (
              <button
                key={offset}
                onClick={() => setDayOffset(offset)}
                style={{
                  border: 'none',
                  background: dayOffset === offset ? '#fff' : 'transparent',
                  color: dayOffset === offset ? '#1a73e8' : '#666',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.85em',
                  cursor: 'pointer',
                  boxShadow: dayOffset === offset ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {offset === 0 ? 'Today' : offset === 1 ? 'Yesterday' : '2 Days Ago'}
              </button>
            ))}
          </div>

          {/* Bookmarksページへのリンク */}
          <Link 
            href="/bookmarks" 
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              color: '#1a73e8',
              fontWeight: 'bold',
              fontSize: '0.9em',
              padding: '10px 16px',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #cce0ff',
              transition: 'background 0.2s',
              marginLeft: '5px'
            }}
          >
            <IconBookmark /> Bookmarks
          </Link>
        </div>
      </header>

      <div className="grid-container">
        {displayArticles.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999' }}>
            No updates for this day.
          </div>
        ) : (
          displayArticles.map((article) => {
            const style = getSourceStyle(article.source?.name);
            return (
              <div 
                key={article.id} 
                className="article-card"
                onClick={() => setSelectedArticle(article)}
                style={{ position: 'relative' }}
              >
                {/* ▼▼▼ カード右上のブックマークボタン (影付き) ▼▼▼ */}
                <button
                  onClick={(e) => toggleBookmark(e, article)}
                  title={article.is_favorite ? "ブックマーク解除" : "ブックマークに保存"}
                  style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '10px',
                    borderBottomLeftRadius: '12px',
                    cursor: 'pointer',
                    color: article.is_favorite ? '#fbc02d' : '#ccc',
                    transition: 'all 0.2s',
                    zIndex: 2,
                    boxShadow: '-2px 2px 5px rgba(0,0,0,0.05)' // ★これでお揃いになります！
                  }}
                  onMouseEnter={(e) => {
                    if(!article.is_favorite) e.currentTarget.style.color = '#999';
                  }}
                  onMouseLeave={(e) => {
                    if(!article.is_favorite) e.currentTarget.style.color = '#ccc';
                  }}
                >
                   <IconStar filled={true} size={20} />
                </button>
                {/* ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ */}

                <div className="card-header">
                  <div className="card-icon" style={{ background: style.background }}>{style.icon}</div>
                  <div className="card-meta">
                    <span className="source-name">{article.source?.name}</span>
                    <span>{new Date(article.published_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="card-title">{article.title}</div>
                <div className="card-summary">{article.summary}</div>
                <div className="read-more-btn">詳細を読む →</div>
              </div>
            );
          })
        )}
      </div>

      {/* トップへ戻るボタン (スマホのみ) */}
      <button
        onClick={scrollToTop}
        className={`scroll-to-top ${showScrollBtn ? 'visible' : ''}`}
        style={{
          position: 'fixed',
          bottom: '25px',
          right: '25px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'rgba(26, 115, 232, 0.9)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.3s, transform 0.3s',
          opacity: showScrollBtn ? 1 : 0,
          transform: showScrollBtn ? 'translateY(0)' : 'translateY(20px)',
          pointerEvents: showScrollBtn ? 'auto' : 'none',
        }}
      >
        <IconArrowUp />
      </button>

      <style jsx>{`
        @media (min-width: 768px) {
          .scroll-to-top {
            display: none !important;
          }
        }
      `}</style>

      {/* モーダル */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="close-btn"><IconClose /></button>
            <div className="modal-header">
              <div className="modal-icon" style={{ background: getSourceStyle(selectedArticle.source?.name).background }}>
                {getSourceStyle(selectedArticle.source?.name).icon}
              </div>
              <div className="modal-title">
                <h2>{selectedArticle.title}</h2>
                <div className="modal-meta">{selectedArticle.source?.name} | {new Date(selectedArticle.published_at).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ fontSize: '1.1em', lineHeight: '1.8', marginBottom: '20px', color: '#333' }}>
              {selectedArticle.summary}
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'right', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <button
                onClick={(e) => toggleBookmark(e, selectedArticle)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 20px',
                  borderRadius: '30px',
                  border: selectedArticle.is_favorite ? '1px solid #fbc02d' : '1px solid #e0e0e0',
                  background: selectedArticle.is_favorite ? '#fffde7' : '#f5f5f5',
                  color: selectedArticle.is_favorite ? '#f57f17' : '#555',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9em',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease'
                }}
              >
                <IconStar filled={selectedArticle.is_favorite} size={18} />
                {selectedArticle.is_favorite ? "保存済み" : "ブックマークに保存"}
              </button>
            </div>

            <div>
              <a href={selectedArticle.url} target="_blank" rel="noreferrer" className="original-link">
                原文記事を開く ({selectedArticle.source?.name}) ↗
              </a>
            </div>
            {selectedArticle.gemini_insight && (
              <div className="insight-section">
                <div className="insight-title">🧠 考察・ビジネスへの影響</div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{selectedArticle.gemini_insight}</div>
              </div>
            )}
            {selectedArticle.gemini_example && (
              <div className="example-section">
                <div className="example-title">💡 具体的な例・ユースケース</div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{selectedArticle.gemini_example}</div>
              </div>
            )}
            {selectedArticle.gemini_explanation && selectedArticle.gemini_explanation.length > 0 && (
              <div className="glossary-wrap">
                {selectedArticle.gemini_explanation.map((term, i) => (
                  <span key={i} className="glossary-chip">📘 {term.replace(/^[\s・\-\*]+/, '')}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}