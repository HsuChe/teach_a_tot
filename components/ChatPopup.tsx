import React, { useState, useEffect, useRef } from 'react';
import { generateChatResponse } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { CloseIcon, SendIcon } from './icons';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatPopupProps {
  topicTitle: string;
  initialContext: string;
  onClose: () => void;
}

const ChatPopup: React.FC<ChatPopupProps> = ({ topicTitle, initialContext, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponse = await generateChatResponse(initialContext, newMessages, userInput);
      setMessages([...newMessages, { role: 'model', text: aiResponse }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([...newMessages, { role: 'model', text: 'Sorry, I ran into an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-[90vw] max-w-md h-[70vh] max-h-[600px] z-50 flex flex-col">
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col h-full animate-fade-in-fast">
            <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0 bg-slate-50 rounded-t-2xl">
                <h2 className="text-lg font-bold text-slate-800 truncate pr-2">{topicTitle}</h2>
                <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-200">
                    <CloseIcon />
                </button>
            </header>

            <main className="flex-grow p-4 overflow-y-auto bg-slate-100">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-slate-800 shadow-sm'}`}>
                                <MarkdownRenderer content={msg.text} />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl bg-white text-slate-800 shadow-sm">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            <footer className="p-2 border-t border-slate-200 flex-shrink-0 bg-white rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Ask a follow-up question..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-full focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !userInput.trim()}
                        className="bg-blue-500 text-white p-2.5 rounded-full hover:bg-blue-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                        aria-label="Send message"
                    >
                        <SendIcon />
                    </button>
                </form>
            </footer>
        </div>
    </div>
  );
};

export default ChatPopup;