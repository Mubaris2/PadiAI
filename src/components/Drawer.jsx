import React from 'react'

export default function Drawer({ isOpen, onClose }) {
  const items = [
    { title: 'Two Sum', diff: 'Easy' },
    { title: 'Graph Paths', diff: 'Medium' },
    { title: 'String Queries', diff: 'Hard' },
  ]

  return (
    <>
      {isOpen && <div className="drawer-overlay" onClick={onClose} />}
      <aside className={isOpen ? 'drawer open' : 'drawer'}>
        <div className="header">Recent Problems</div>
        <div className="list">
          {items.map((it, idx) => (
            <div className="item" key={idx}>
              <div>{it.title}</div>
              <div style={{color:'var(--muted)'}}>{it.diff}</div>
            </div>
          ))}
        </div>
        <div className="footer">
          <button className="icon-btn" onClick={() => console.log('Change User')}>Change User</button>
          <button className="icon-btn" onClick={() => console.log('Change Working Directory')}>Change Working Directory</button>
          <button className="icon-btn" onClick={() => console.log('Change API Key')}>Change API Key</button>
        </div>
      </aside>
    </>
  )
}
