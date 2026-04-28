import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Plus, MoreVertical, Calendar, Target, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  createdBy: {
      name: string;
      email: string;
      role: string;
  };
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ title: '', description: '', status: 'PLANNING' });
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
         await api.put(`/projects/${editingId}`, formData);
         toast.success("Project updated successfully");
      } else {
         await api.post('/projects', formData);
         toast.success("Project created successfully");
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error('Error saving project', err);
      toast.error("Failed to save project");
    }
  };

  const openCreateModal = () => {
    setFormData({ title: '', description: '', status: 'PLANNING' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setActiveMenuId(null);
    setFormData({ title: p.title, description: p.description, status: p.status });
    setEditingId(p.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.info("Project deleted");
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project', err);
      toast.error("Failed to delete project");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ON_HOLD': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Projects Repository</h1>
          <p className="text-slate-500 mt-1">Manage and track your active research projects.</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary-600/20 active:scale-[0.98] cursor-pointer">
          <Plus size={18} strokeWidth={2.5} /> New Project
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
             <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-64 animate-pulse flex flex-col justify-between">
                <div>
                   <div className="h-6 bg-slate-200 rounded-md w-2/3 mb-4"></div>
                   <div className="h-4 bg-slate-100 rounded-md w-full mb-2"></div>
                   <div className="h-4 bg-slate-100 rounded-md w-5/6"></div>
                </div>
                <div className="h-4 bg-slate-200 rounded-md w-1/4"></div>
             </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 border-dashed py-20 flex flex-col items-center justify-center text-slate-500">
                <Target size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No projects found</h3>
                <p className="text-sm">Create your first research project to get started!</p>
            </div>
          ) : (
             projects.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200/60 p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-primary-200 transition-all duration-300 flex flex-col relative group">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${getStatusColor(p.status || 'PLANNING')}`}>
                    {(p.status || 'PLANNING').replace('_', ' ')}
                  </span>
                  
                  <div className="relative">
                    <button onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg"><MoreVertical size={16}/></button>
                    {activeMenuId === p.id && (
                        <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-slate-100 z-30 py-1">
                            <button onClick={() => openEditModal(p)} className="text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer w-full"><Edit2 size={14}/> Edit</button>
                            <button onClick={() => handleDelete(p.id)} className="text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer w-full"><Trash2 size={14}/> Delete</button>
                        </div>
                    )}
                  </div>
                </div>
                
                <Link to={`/projects/${p.id}`} className="block mt-2 mb-3">
                  <h3 className="font-extrabold text-slate-900 group-hover:text-primary-600 text-xl leading-tight tracking-tight transition-colors">{p.title}</h3>
                </Link>

                {p.createdBy && (
                    <div className="flex bg-slate-50 p-2.5 rounded-lg border border-slate-100 items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                           {p.createdBy.name?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-semibold text-slate-900 truncate">Submitted by: {p.createdBy.name || 'Unknown'}</p>
                           <p className="text-[10px] text-slate-500 font-medium truncate">{p.createdBy.email || ''}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${p.createdBy.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}`}>{p.createdBy.role?.replace('ROLE_', '') || 'USER'}</span>
                    </div>
                )}

                <p className="text-slate-500 text-sm mb-6 flex-1 xl:line-clamp-2 leading-relaxed break-words">{p.description}</p>
                
                <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex justify-center items-center text-indigo-700 text-xs font-bold z-20 shadow-sm relative hover:-translate-y-1 transition-transform">AB</div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex justify-center items-center text-slate-500 text-xs font-bold shadow-sm relative hover:-translate-y-1 transition-transform cursor-pointer"><Plus size={14}/></div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs bg-slate-50 px-2 py-1 rounded-md">
                    <Calendar size={14} className="text-slate-400" /> {new Date(p.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Project' : 'Create New Project'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20}/></button>
             </div>
             <form onSubmit={handleSave} className="p-6 space-y-5">
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Project Title</label>
                 <input autoFocus required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white" placeholder="E.g. Neural Link Interface"/>
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                 <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white" placeholder="Describe the research objective..."/>
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                 <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white cursor-pointer">
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                 </select>
               </div>
               <div className="pt-4 flex justify-end gap-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">Cancel</button>
                 <button type="submit" className="px-4 py-2 rounded-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors cursor-pointer shadow-sm shadow-primary-600/30">Save Project</button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
