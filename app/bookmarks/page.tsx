'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSourceStyle } from '@/lib/utils';

// ▼▼▼ アイコン定義 ▼▼▼
const IconStar = ({ filled, size = 20 }: { filled: boolean; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
);
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

type Article = {
  id: string;
  title: string;
  url: string;
  summary: string;
  published_at: string;
  source: { name: string };
  gemini_insight: string;
  gemini_example: string;
  gemini_explanation: string[];
  is_favorite: boolean;
};

export default function Bookmarks() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`*, source:sources(name)`)
        .eq('is_favorite', true)
        .order('published_at', { ascending: false });

      if (!error && data) {
        setArticles(data);
      }
      setLoading(false);
    };
    fetchBookmarks();
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    
    // 1. リストから即座に削除
    setArticles(current => current.filter(a => a.id !== article.id));

    // 2. モーダルが開いていたら閉じる
    if (selectedArticle?.id === article.id) {
      setSelectedArticle(null);
    }
    
    // 3. 通知を表示
    showNotification("ブックマークを解除しました");

    // 4. Supabase更新
    await supabase
      .from('articles')
      .update({ is_favorite: false })
      .eq('id', article.id);
  };

  const closeModal = () => setSelectedArticle(null);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading bookmarks...</div>;

  return (
    <div className="main-wrapper">
      <header style={{ position: 'relative', paddingTop: '10px' }}>
        {/* ▼▼▼ Header左上のBackボタン ▼▼▼ */}
        <Link 
          href="/" 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            color: '#555',
            fontWeight: 'bold',
            fontSize: '0.9em',
            padding: '8px 12px',
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'all 0.2s',
            zIndex: 10
          }}
        >
          <IconArrowLeft /> <span style={{display: 'inline-block'}}>Back</span>
        </Link>
        {/* ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ */}

        <h1>Saved Articles</h1>
        <span className="date-info">
          {articles.length} Bookmarks
        </span>
      </header>

      {/* 通知ポップアップ */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#333',
          color: '#fff',
          padding: '10px 24px',
          borderRadius: '50px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 2000,
          fontSize: '0.9em',
          fontWeight: 'bold',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {notification}
        </div>
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      {articles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "3em", marginBottom: "20px" }}>🔖</div>
          <p style={{ fontWeight: "bold", color: "#555", marginBottom: "10px" }}>ブックマークはありません</p>
          <p style={{ color: "#888", fontSize: "0.9em" }}>Feed画面で気になる記事を保存しましょう。</p>
        </div>
      ) : (
        <div className="grid-container">
          {articles.map((article) => {
            const style = getSourceStyle(article.source?.name);
            return (
              <div 
                key={article.id} 
                className="article-card" 
                onClick={() => setSelectedArticle(article)}
                style={{ position: 'relative' }}
              >
                {/* 削除ボタン (カード右上) - 一覧から即消す用 */}
                <button
                  onClick={(e) => handleRemoveFavorite(e, article)}
                  title="ブックマーク解除"
                  style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '10px',
                    borderBottomLeftRadius: '12px',
                    cursor: 'pointer',
                    color: '#fbc02d',
                    boxShadow: '-2px 2px 5px rgba(0,0,0,0.05)',
                    zIndex: 2
                  }}
                >
                   <IconStar filled={true} size={20} />
                </button>

                <div className="card-header">
                  <div className="card-icon" style={{ background: style.background }}>{style.icon}</div>
                  <div className="card-meta">
                    <span className="source-name">{article.source?.name}</span>
                    <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="card-title">{article.title}</div>
                <div className="card-summary">{article.summary}</div>
                <div className="read-more-btn">詳細を読む →</div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* モーダル (Homeと共通) */}
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

             {/* ▼▼▼ 削除ボタン (モーダル内) ▼▼▼ */}
             <div style={{ marginBottom: '20px', textAlign: 'right', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <button
                onClick={(e) => handleRemoveFavorite(e, selectedArticle)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid #ffcdd2',
                  background: '#ffebee',
                  color: '#c62828',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9em',
                  transition: 'all 0.2s ease'
                }}
              >
                <IconStar filled={true} size={18} />
                保存済み（解除する）
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
                <div style={{ whiteSpace: 'pre-wrap' }}>{selectedArticle.gemini_insight}</div>
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