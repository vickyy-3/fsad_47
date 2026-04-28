import { Link, useLocation } from 'react-router-dom';
import { Home, Folder, FileText, User, LogOut } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-screen fixed top-0 left-0 border-r border-slate-800 shadow-2xl z-30">
      <div>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
            <span className="text-white font-bold text-sm">RP</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">ResearchPlatform</h2>
        </div>
        <nav className="mt-4 flex flex-col gap-1 px-4">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 cursor-default">Menu</p>
          {[
              { path: '/', icon: Home, label: 'Dashboard' },
              { path: '/projects', icon: Folder, label: 'Projects' },
              { path: '/documents', icon: FileText, label: 'Documents' },
              { path: '/profile', icon: User, label: 'Profile' },
          ].map((item) => (
             <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive(item.path) ? 'bg-primary-600/10 text-primary-400 font-semibold shadow-inner' : 'hover:bg-slate-800/50 hover:text-slate-100'}`}>
               <item.icon size={18} strokeWidth={isActive(item.path) ? 2.5 : 2} /> {item.label}
             </Link>
          ))}
        </nav>
      </div>
      <div className="p-4">
        <div className="bg-slate-800/50 rounded-2xl p-4 mb-4 border border-slate-700">
           <h4 className="text-sm font-semibold text-white">Need help?</h4>
           <p className="text-xs text-slate-400 mt-1 line-clamp-2">Check our documentation for guides and API usage.</p>
           <button className="mt-3 text-xs bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg w-full transition-colors font-medium cursor-pointer">View Docs</button>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href='/login'; }} className="flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-slate-500 font-medium transition-colors cursor-pointer group">
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Logout
        </button>
      </div>
    </div>
  );
}
