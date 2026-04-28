import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Folder, Users, FileText, CheckCircle, ArrowUpRight, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ projects: 0, docs: 0, pending: 0, users: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
     try {
         const res = await api.get('/dashboard/stats');
         setStats({
            projects: res.data.projects || 0,
            docs: res.data.documents || 0,
            pending: res.data.pending || 0,
            users: res.data.users || 0
         });
         setChartData(res.data.chartData || []);
         setRecentActivity(res.data.recentActivity || []);
     } catch (err) {
         console.error(err);
         setStats({ projects: 0, docs: 0, pending: 0, users: 0 });
         setChartData([]);
         setRecentActivity([]);
     }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-500 mt-1">Monitor your team's research activity and milestones.</p>
        </div>
        <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-slate-900/20 active:scale-[0.98] flex items-center gap-2 cursor-pointer">
          <Activity size={16} /> Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { title: 'Total Projects', value: stats.projects, trend: 'Active', icon: Folder, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', iconBg: 'bg-indigo-100', route: '/projects' },
          { title: 'Team Members', value: stats.users, trend: 'Collaborators', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', iconBg: 'bg-blue-100', route: '/projects' },
          { title: 'Documents', value: stats.docs, trend: 'Uploaded', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100', route: '/documents' },
          { title: 'Pending Milestones', value: stats.pending, trend: 'Due Soon', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100', route: '/projects' },
        ].map((stat, i) => (
          <div key={i} onClick={() => navigate(stat.route)} className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between ${stat.bg} transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 cursor-pointer group`}>
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl ${stat.iconBg} ${stat.color} shadow-inner group-hover:scale-110 transition-transform`}>
                <stat.icon size={22} strokeWidth={2.5} />
              </div>
              <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-white/60 ${stat.color}`}>
                 {stat.trend} <ArrowUpRight size={14} className="ml-1" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-600 mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 bg-white p-7 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Activity size={20} className="text-primary-500" /> Activity Metrics
            </h3>
            <div className="h-80 w-full">
              {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} allowDecimals={false} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="projects" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="documents" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400">
                      No activity data found.
                  </div>
              )}
            </div>
          </div>

          <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
              <div className="flex-1 overflow-y-auto">
                  <div className="space-y-6">
                      {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                          <div key={i} className="flex gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                                  {item.user}
                              </div>
                              <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-800">{item.action}</p>
                                  <p className="text-sm font-semibold text-primary-600 truncate">{item.target}</p>
                                  <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                              </div>
                          </div>
                      )) : (
                          <div className="text-center text-slate-400 text-sm mt-10">
                              No recent activity.
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
