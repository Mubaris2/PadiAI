import React, { useState, useEffect } from 'react'
import useAppStore from '../../store/useAppStore'
import './ApiKeyModal.css'

export default function ApiKeyModal({ isOpen, onClose }) {
  const apiKeys = useAppStore(s => s.apiKeys)
  const setGrokApiKey = useAppStore(s => s.setGrokApiKey)
  const [grokKey, setGrokKey] = useState('')

  useEffect(() => {
    if (isOpen) {
      setGrokKey(apiKeys?.grok || '')
    }
  }, [isOpen, apiKeys])

  const handleSave = async () => {
    if (setGrokApiKey) {
      await setGrokApiKey(grokKey)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="api-key-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>API Keys Settings</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="input-group">
            <label>Grok API Key</label>
            <input
              type="password"
              placeholder="xai-..."
              value={grokKey}
              onChange={e => setGrokKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <p style={{fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0'}}>
              Required for PadiAI agent features (problem parsing, hints, etc.)
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
