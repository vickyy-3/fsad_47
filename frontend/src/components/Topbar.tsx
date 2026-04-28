import { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, MessageSquare, Target, FileText } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api';
import { Link } from 'react-router-dom';

export default function Topbar() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    fetchNotifications();
    connectWebSocket();

    return () => {
        if (stompClientRef.current) stompClientRef.current.deactivate();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
    } catch (err) {
        console.error('Failed to load notifications');
    }
  };

  const connectWebSocket = () => {
    if (!currentUser.id) return;
    const socketUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/ws`;
    const client = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        reconnectDelay: 5000,
        onConnect: () => {
            client.subscribe(`/topic/notifications/${currentUser.id}`, (message) => {
                const received = JSON.parse(message.body);
                setNotifications(prev => [received, ...prev]);
            });
        }
    });
    client.activate();
    stompClientRef.current = client;
  };

  const markAsRead = async (id: number) => {
      try {
          await api.put(`/notifications/${id}/read`);
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      } catch (err) {
          console.error(err);
      }
  };

  const markAllAsRead = async () => {
      try {
          await api.put('/notifications/read-all');
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
          console.error(err);
      }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
      if (type === 'COMMENT') return <MessageSquare size={14} className="text-blue-500" />;
      if (type === 'MILESTONE') return <Target size={14} className="text-purple-500" />;
      if (type === 'DOCUMENT') return <FileText size={14} className="text-emerald-500" />;
      return <Bell size={14} className="text-slate-500" />;
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-8 ml-64 fixed top-0 left-0 right-0 z-20 w-[calc(100%-16rem)] shadow-sm">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-slate-400 hover:text-slate-600">
             <Menu size={20} />
        </button>
        <div className="flex items-center bg-slate-100/80 rounded-xl px-3 py-2 w-96 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 border border-transparent transition-all">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Search projects, documents, or members..." className="bg-transparent border-none outline-none ml-2 text-sm w-full text-slate-700 placeholder-slate-400" />
          <div className="hidden md:flex items-center gap-1">
             <kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-400">Ctrl</kbd>
             <kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-400">K</kbd>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 relative">
        <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full cursor-pointer"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
             <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white flex items-center justify-center rounded-full text-[9px] font-bold border-2 border-white">{unreadCount}</span>
          )}
        </button>

        {/* Dropdown */}
        {showDropdown && (
            <div className="absolute top-12 right-12 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs font-semibold text-primary-600 hover:text-primary-700">Mark all as read</button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No notifications yet.</div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 ${!n.read ? 'bg-primary-50/30' : ''}`}>
                                <div className="mt-0.5">
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm ${!n.read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{n.message}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[10px] text-slate-400 font-medium">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        {!n.read && (
                                            <button onClick={() => markAsRead(n.id)} className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 cursor-pointer">Mark read</button>
                                        )}
                                    </div>
                                    {n.actionUrl && (
                                        <Link to={n.actionUrl} onClick={() => { markAsRead(n.id); setShowDropdown(false); }} className="text-xs text-primary-600 hover:underline mt-1 inline-block">View Details</Link>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-200">
          <div className="w-8 h-8 bg-gradient-to-tr from-primary-600 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-inner uppercase">
            {currentUser.name ? currentUser.name.substring(0,2) : 'U'}
          </div>
          <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700 leading-none">{currentUser.name || 'User'}</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">{currentUser.role?.replace('ROLE_', '')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
