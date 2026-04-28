import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Shield, Calendar, Camera, FileText, CheckCircle, Clock, X, Phone, Activity } from 'lucide-react';
import api from '../api';
import { toast } from 'react-toastify';

export default function Profile() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/users/profile/stats');
      setStats(res.data);
      const user = res.data.user;
      setFormData({ name: user.name, phone: user.phone || '', email: user.email || '' });
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSave = async () => {
    if (formData.email && !/^[A-Za-z0-9+_.-]+@gmail\.com$/.test(formData.email)) {
      toast.error('Only valid @gmail.com email addresses are allowed.');
      return;
    }
    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
      toast.error('Invalid phone number format. Must be E.164 (e.g., +1234567890).');
      return;
    }
    try {
      await api.put('/users/profile', formData);
      toast.success("Profile updated successfully!");
      setEditing(false);
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileData = new FormData();
    fileData.append('file', file);

    setUploadingImage(true);
    try {
      await api.post('/users/profile/image', fileData);
      toast.success('Profile picture updated!');
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { user, totalProjects, totalDocuments, recentActivity } = stats;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Banner & Profile Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="h-48 bg-gradient-to-r from-primary-600 via-indigo-500 to-purple-600 relative overflow-hidden">
           <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 gap-6 relative z-10">
          
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full p-1.5 shadow-xl transition-transform duration-300 group-hover:scale-105">
              {user.profileImageUrl ? (
                <img src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${user.profileImageUrl}`} alt="Profile" className="w-full h-full object-cover rounded-full bg-slate-100" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 rounded-full flex items-center justify-center font-extrabold text-4xl shadow-inner">
                  {getInitials(user.name)}
                </div>
              )}
              {uploadingImage && (
                <div className="absolute inset-1.5 rounded-full bg-white/80 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div className="absolute bottom-2 right-2 bg-slate-900 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-800">
               <Camera size={18} />
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} onClick={(e) => { e.currentTarget.value = ''; }} accept="image/*" className="hidden" />
          </div>

          <div className="text-center md:text-left flex-1 mb-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{user.name}</h1>
            <p className="text-primary-600 font-semibold flex items-center justify-center md:justify-start gap-1.5 mt-1 capitalize">
              <Shield size={16} /> {user.role?.replace('ROLE_', '').toLowerCase()}
            </p>
          </div>

          <div className="mb-4">
            <button onClick={() => setEditing(true)} className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-slate-50 transition-all shadow-sm hover:shadow active:scale-95">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account Overview & Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-primary-500"/> Account Overview
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <FileText size={24} className="text-blue-500 mb-2"/>
                <span className="text-2xl font-black text-slate-800">{totalProjects}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <FileText size={24} className="text-indigo-500 mb-2"/>
                <span className="text-2xl font-black text-slate-800">{totalDocuments}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Documents</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500"/> Account Status</span>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Mail size={16} className="text-blue-500"/> Email Verified</span>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{user.isVerified ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: User Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-primary-500"/> Personal Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1.5"><Mail size={14}/> Email Address</label>
                <p className="text-slate-800 font-semibold text-lg">{user.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1.5"><Phone size={14}/> Phone Number</label>
                <p className="text-slate-800 font-semibold text-lg">
                  {user.phone ? user.phone : (
                    <button onClick={() => setEditing(true)} className="text-primary-600 text-sm hover:underline font-bold">Add Phone Number</button>
                  )}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1.5"><Calendar size={14}/> Member Since</label>
                <p className="text-slate-800 font-semibold text-lg">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1.5"><Clock size={14}/> Last Login</label>
                <p className="text-slate-800 font-semibold text-lg">{formatDate(user.lastLogin)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Clock size={20} className="text-primary-500"/> Recent Activity
            </h3>
            
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 text-primary-500">
                      {activity.type === 'login' ? <User size={18} /> : activity.type === 'document_upload' ? <FileText size={18} /> : <Activity size={18} />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{activity.title}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{new Date(activity.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 font-medium">No recent activity found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
              <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1234567890" className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm" />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditing(false)} className="px-5 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 rounded-lg font-semibold bg-primary-600 text-white hover:bg-primary-700 shadow-md transition-all active:scale-95 cursor-pointer">Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
