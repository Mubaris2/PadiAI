import React from 'react'

export default function ChatbotPanel() {
  return (
    <>
      <div className="chat-history">
        <div className="msg">Hello! Open a problem and I'll help you solve it step by step.</div>
      </div>
      <div className="chat-input">
        <input placeholder="Ask me anything..." />
        <button disabled>Send</button>
      </div>
    </>
  )
}
