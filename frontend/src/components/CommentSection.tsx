import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api';
import { Send, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';

interface Comment {
    id: number;
    content: string;
    author: {
        id: number;
        name: string;
        email: string;
    };
    createdAt: string;
}

interface CommentSectionProps {
    targetType: 'PROJECT' | 'DOCUMENT';
    targetId: number;
}

export default function CommentSection({ targetType, targetId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);
    const stompClientRef = useRef<Client | null>(null);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchComments();
        connectWebSocket();

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [targetType, targetId]);

    const fetchComments = async () => {
        try {
            const res = await api.get(`/comments/${targetType}/${targetId}`);
            setComments(res.data);
            scrollToBottom();
        } catch (err) {
            console.error('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    const connectWebSocket = () => {
        // Use standard base URL (assuming backend is running on 8080)
        const socketUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/ws`;
        
        const client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Connected to WebSocket');
                client.subscribe(`/topic/comments/${targetType}/${targetId}`, (message) => {
                    const receivedComment = JSON.parse(message.body);
                    setComments((prev) => {
                        // Prevent duplicates if we already added it locally
                        if (prev.find(c => c.id === receivedComment.id)) return prev;
                        return [...prev, receivedComment];
                    });
                    scrollToBottom();
                });
            },
            onStompError: (frame) => {
                console.error('STOMP Error', frame);
            }
        });
        
        client.activate();
        stompClientRef.current = client;
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            // We post to REST API, backend broadcasts via STOMP
            await api.post(`/comments/${targetType}/${targetId}`, { content: newComment });
            setNewComment('');
        } catch (err) {
            toast.error('Failed to post comment');
        }
    };

    // Helper to format mentions: @Username
    const formatContent = (text: string) => {
        const mentionRegex = /@(\w+)/g;
        const parts = text.split(mentionRegex);
        
        if (parts.length === 1) return text;

        return text.split(/(?=@\w+)/g).map((part, i) => {
            if (part.startsWith('@')) {
                const match = part.match(/@(\w+)/);
                if (match) {
                    const rest = part.substring(match[0].length);
                    return (
                        <span key={i}>
                            <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-bold shadow-sm">{match[0]}</span>
                            {rest}
                        </span>
                    );
                }
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className="flex flex-col h-[500px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-2 shadow-sm z-10">
                <MessageSquare size={18} className="text-primary-600" />
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">Live Discussion</h3>
                <span className="ml-auto text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Live
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center text-slate-400 text-sm mt-10">Loading discussion...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm mt-10 flex flex-col items-center">
                        <MessageSquare size={32} className="text-slate-300 mb-2" />
                        <p>No comments yet. Start the conversation!</p>
                    </div>
                ) : (
                    comments.map(c => {
                        const isMe = c.author.id === currentUser.id;
                        return (
                            <div key={c.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-3 ${isMe ? 'bg-primary-600 text-white rounded-br-none shadow-md' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                                    {!isMe && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{c.author.name}</p>}
                                    <div className={`text-sm ${isMe ? 'text-primary-50' : 'text-slate-700'} whitespace-pre-wrap leading-relaxed`}>
                                        {formatContent(c.content)}
                                    </div>
                                    <p className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-primary-300' : 'text-slate-400'}`}>
                                        {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="bg-white border-t border-slate-200 p-3 flex gap-2">
                <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type a message... use @ to mention"
                    className="flex-1 bg-slate-100 border border-transparent focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 rounded-lg px-4 py-2.5 text-sm transition-all outline-none"
                />
                <button 
                    type="submit" 
                    disabled={!newComment.trim()}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg px-4 flex items-center justify-center transition-colors shadow-sm"
                >
                    <Send size={18} className={newComment.trim() ? "translate-x-0" : "-translate-x-1"} style={{ transition: 'transform 0.2s' }} />
                </button>
            </form>
        </div>
    );
}
