import React, { useEffect } from 'react';

export function Toast({ message, type = 'error', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, []);

  const colors = {
    error:   { bg: 'rgba(127,29,29,0.9)',  border: 'rgba(239,68,68,0.4)',  text: '#fca5a5' },
    success: { bg: 'rgba(6,78,59,0.9)',    border: 'rgba(16,185,129,0.4)', text: '#6ee7b7' },
    info:    { bg: 'rgba(12,74,110,0.9)',  border: 'rgba(56,189,248,0.4)', text: '#7dd3fc' },
  };

  const c = colors[type];

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 200,
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
      color: c.text,
      maxWidth: 320,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(8px)',
    }}>
      {message}
    </div>
  );
}
