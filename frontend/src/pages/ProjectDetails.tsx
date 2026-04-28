import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import { ArrowLeft, Users, FileText, Target, Calendar, Plus, Trash2, Shield, CheckCircle, Edit2, X, MessageSquare } from 'lucide-react';
import CommentSection from '../components/CommentSection';

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  
  const [activeTab, setActiveTab] = useState('MILESTONES');
  const [loading, setLoading] = useState(true);

  // Milestone Modal State
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', dueDate: '', status: 'PENDING' });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, membersRes, mileRes, docRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/members`),
        api.get(`/milestones/project/${id}`),
        api.get(`/documents/project/${id}`)
      ]);
      setProject(projRes.data);
      setMembers(membersRes.data);
      setMilestones(mileRes.data);
      setDocuments(docRes.data);

      if (isAdmin) {
          const userRes = await api.get('/users');
          setAllUsers(userRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
      if (milestones.length === 0) return 0;
      const completed = milestones.filter(m => m.status === 'COMPLETED' || m.status === 'VERIFIED').length;
      return Math.round((completed / milestones.length) * 100);
  };

  const openCreateMilestoneModal = () => {
      setMilestoneForm({ title: '', description: '', dueDate: '', status: 'PENDING' });
      setEditingMilestoneId(null);
      setIsMilestoneModalOpen(true);
  };

  const openEditMilestoneModal = (m: any) => {
      setMilestoneForm({ 
          title: m.title, 
          description: m.description, 
          dueDate: m.dueDate ? m.dueDate : '', 
          status: m.status 
      });
      setEditingMilestoneId(m.id);
      setIsMilestoneModalOpen(true);
  };

  const handleSaveMilestone = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (editingMilestoneId) {
              await api.put(`/milestones/${editingMilestoneId}`, milestoneForm);
              toast.success("Milestone updated successfully");
          } else {
              await api.post(`/milestones/project/${id}`, milestoneForm);
              toast.success("Milestone created successfully");
          }
          setIsMilestoneModalOpen(false);
          fetchData();
      } catch (err) {
          toast.error("Failed to save milestone");
      }
  };

  const handleDeleteMilestone = async (mId: number) => {
      if (!window.confirm("Are you sure you want to delete this milestone?")) return;
      try {
          await api.delete(`/milestones/${mId}`);
          toast.info("Milestone deleted");
          fetchData();
      } catch (err) {
          toast.error("Failed to delete milestone");
      }
  };

  const handleCompleteMilestone = async (mId: number) => {
      try {
          await api.post(`/milestones/${mId}/complete`);
          toast.success('Milestone marked as complete');
          fetchData();
      } catch (err) {
          toast.error('Failed to update milestone');
      }
  };

  const handleVerifyMilestone = async (mId: number) => {
      try {
          await api.post(`/milestones/${mId}/verify`);
          toast.success('Milestone verified successfully');
          fetchData();
      } catch (err) {
          toast.error('Failed to verify milestone');
      }
  };

  const handleAddMember = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUser) return;
      try {
          await api.post(`/projects/${id}/members`, { userId: selectedUser });
          toast.success('Member added successfully');
          setSelectedUser('');
          fetchData();
      } catch (err) {
          toast.error('Failed to add member');
      }
  };

  const handleRemoveMember = async (userId: number) => {
      if(!window.confirm('Remove this member?')) return;
      try {
          await api.delete(`/projects/${id}/members/${userId}`);
          toast.info('Member removed');
          fetchData();
      } catch (err) {
          toast.error('Failed to remove member');
      }
  };

  if (loading) return <div className="p-10 animate-pulse text-slate-500">Loading project data...</div>;
  if (!project) return <div className="p-10 text-red-500">Project not found</div>;

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} /> Back to Projects
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
         <div className="flex justify-between items-start">
             <div className="flex-1">
                 <span className={`px-3 py-1 rounded-md text-xs font-bold border tracking-wider ${project.status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-primary-200 bg-primary-50 text-primary-700'}`}>
                     {project.status.replace('_', ' ')}
                 </span>
                 <h1 className="text-3xl font-bold text-slate-900 mt-4 tracking-tight">{project.title}</h1>
                 <p className="text-slate-500 mt-2 max-w-3xl leading-relaxed">{project.description}</p>
                 
                 {project.createdBy && (
                     <div className="mt-6 flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {project.createdBy.name.substring(0, 2).toUpperCase()}
                         </div>
                         <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Owner</p>
                            <p className="text-sm font-bold text-slate-900">{project.createdBy.name} <span className="text-xs font-medium text-slate-500 font-normal">({project.createdBy.email})</span></p>
                         </div>
                     </div>
                 )}
             </div>
             
             {/* Progress Box */}
             <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 w-64 shrink-0 text-center shadow-sm">
                 <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">Overall Progress</p>
                 <div className="flex justify-center items-end gap-1 mb-3">
                     <span className="text-4xl font-extrabold text-slate-900">{progress}</span>
                     <span className="text-lg font-bold text-slate-500 mb-1">%</span>
                 </div>
                 <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                     <div className={`h-2.5 rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-primary-500'}`} style={{ width: `${progress}%` }}></div>
                 </div>
                 <p className="text-xs font-medium text-slate-500 mt-3">{milestones.filter(m => m.status === 'COMPLETED' || m.status === 'VERIFIED').length} of {milestones.length} milestones complete</p>
             </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="flex border-b border-slate-100 bg-slate-50/50">
             <button onClick={()=>setActiveTab('MILESTONES')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'MILESTONES' ? 'text-primary-700 border-b-2 border-primary-600 bg-white' : 'text-slate-500 hover:bg-slate-50'}`}><Target size={18}/> Milestones <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{milestones.length}</span></button>
             <button onClick={()=>setActiveTab('TEAM')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'TEAM' ? 'text-primary-700 border-b-2 border-primary-600 bg-white' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={18}/> Team Members <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{members.length}</span></button>
             <button onClick={()=>setActiveTab('DOCS')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'DOCS' ? 'text-primary-700 border-b-2 border-primary-600 bg-white' : 'text-slate-500 hover:bg-slate-50'}`}><FileText size={18}/> Documents <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{documents.length}</span></button>
             <button onClick={()=>setActiveTab('DISCUSSIONS')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'DISCUSSIONS' ? 'text-primary-700 border-b-2 border-primary-600 bg-white' : 'text-slate-500 hover:bg-slate-50'}`}><MessageSquare size={18}/> Discussions</button>
         </div>

         <div className="p-6">
            {activeTab === 'MILESTONES' && (
                 <div className="space-y-4 animate-in fade-in">
                      <div className="flex justify-end mb-4">
                          <button onClick={openCreateMilestoneModal} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 flex items-center gap-2 shadow-sm transition-colors cursor-pointer"><Plus size={16}/> Create Milestone</button>
                      </div>

                      {milestones.length === 0 ? (
                          <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <Target size={40} className="mx-auto text-slate-300 mb-3" />
                              <h3 className="text-slate-700 font-semibold mb-1">No milestones yet</h3>
                              <p className="text-slate-500 text-sm">Create the first milestone to track progress.</p>
                          </div>
                      ) : (
                          milestones.map(mile => (
                              <div key={mile.id} className={`p-5 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${mile.status === 'COMPLETED' || mile.status === 'VERIFIED' ? 'bg-slate-50/50 border-slate-200' : 'bg-white border-slate-200 shadow-sm hover:border-primary-200 hover:shadow-md'}`}>
                                  <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-1">
                                          <h4 className={`font-bold text-lg ${mile.status === 'COMPLETED' || mile.status === 'VERIFIED' ? 'text-slate-600 line-through decoration-slate-300' : 'text-slate-800'}`}>{mile.title}</h4>
                                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${mile.status === 'VERIFIED' ? 'bg-purple-100 text-purple-700' : mile.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : mile.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{mile.status.replace('_', ' ')}</span>
                                      </div>
                                      <p className="text-sm text-slate-500 mb-3">{mile.description}</p>
                                      
                                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                                          {mile.dueDate && (
                                              <span className={`flex items-center gap-1 ${new Date(mile.dueDate) < new Date() && mile.status !== 'COMPLETED' && mile.status !== 'VERIFIED' ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                                  <Calendar size={14}/> Due: {new Date(mile.dueDate).toLocaleDateString()}
                                              </span>
                                          )}
                                          {mile.completedBy && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={14}/> Completed by: {mile.completedBy.name}</span>}
                                          {mile.verifiedBy && <span className="text-purple-600 flex items-center gap-1"><Shield size={14}/> Verified by: {mile.verifiedBy.name}</span>}
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 shrink-0">
                                      {(mile.status === 'PENDING' || mile.status === 'IN_PROGRESS') && (
                                          <button onClick={() => handleCompleteMilestone(mile.id)} className="bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"><CheckCircle size={16}/> Complete</button>
                                      )}
                                      {mile.status === 'COMPLETED' && isAdmin && (
                                          <button onClick={() => handleVerifyMilestone(mile.id)} className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer flex items-center gap-2"><Shield size={16}/> Verify</button>
                                      )}
                                      
                                      <div className="flex items-center ml-2 border-l border-slate-200 pl-2 gap-1">
                                          <button onClick={() => openEditMilestoneModal(mile)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Edit"><Edit2 size={16}/></button>
                                          <button onClick={() => handleDeleteMilestone(mile.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                 </div>
            )}

            {activeTab === 'TEAM' && (
                <div className="space-y-6 animate-in fade-in">
                    {isAdmin && (
                        <form onSubmit={handleAddMember} className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Assign User</label>
                                <select value={selectedUser} onChange={e=>setSelectedUser(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                                    <option value="" disabled>Select user...</option>
                                    {allUsers.filter(u => !members.find(m => m.user.id === u.id)).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email || u.phone})</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 flex items-center gap-2 shadow-sm"><Plus size={16}/> Add Member</button>
                        </form>
                    )}

                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="pb-3 pl-2">User</th>
                                <th className="pb-3">Contact</th>
                                <th className="pb-3">Role</th>
                                <th className="pb-3">Joined</th>
                                {isAdmin && <th className="pb-3 text-right pr-2">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {members.map(m => (
                                <tr key={m.user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 pl-2 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">{m.user.name.substring(0, 2).toUpperCase()}</div>
                                        <span className="font-semibold text-slate-800">{m.user.name}</span>
                                    </td>
                                    <td className="py-4 text-sm text-slate-600">{m.user.email || m.user.phone}</td>
                                    <td className="py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${m.user.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                            <Shield size={12}/> {m.user.role.replace('ROLE_', '')}
                                        </span>
                                    </td>
                                    <td className="py-4 text-sm text-slate-500 flex items-center gap-2">
                                        <Calendar size={14}/> {new Date(m.joinedAt).toLocaleDateString()}
                                    </td>
                                    {isAdmin && (
                                        <td className="py-4 text-right pr-2">
                                            <button onClick={()=>handleRemoveMember(m.user.id)} className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"><Trash2 size={16}/></button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {members.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No members assigned yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'DOCS' && (
                 <div className="space-y-4 animate-in fade-in">
                      {documents.length === 0 ? <p className="text-slate-500 text-center py-8">No documents mapped.</p> : (
                          documents.map(doc => (
                              <div key={doc.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                      <FileText className="text-indigo-500"/>
                                      <div>
                                          <h4 className="font-bold text-slate-800">{doc.fileName}</h4>
                                          <p className="text-xs text-slate-500">Uploaded by {doc.uploadedBy?.name}</p>
                                      </div>
                                  </div>
                                  <span className="text-sm font-semibold text-slate-600">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                              </div>
                          ))
                      )}
                 </div>
            )}

            {activeTab === 'DISCUSSIONS' && (
                <div className="animate-in fade-in">
                    <CommentSection targetType="PROJECT" targetId={Number(id)} />
                </div>
            )}
         </div>
      </div>

      {/* Milestone Form Modal */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800">{editingMilestoneId ? 'Edit Milestone' : 'Create Milestone'}</h2>
                <button onClick={() => setIsMilestoneModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20}/></button>
             </div>
             <form onSubmit={handleSaveMilestone} className="p-6 space-y-5">
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                 <input autoFocus required type="text" value={milestoneForm.title} onChange={e => setMilestoneForm({...milestoneForm, title: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white" placeholder="E.g. Phase 1 Data Collection"/>
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                 <textarea required rows={3} value={milestoneForm.description} onChange={e => setMilestoneForm({...milestoneForm, description: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white" placeholder="Describe the milestone goals..."/>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                     <select value={milestoneForm.status} onChange={e => setMilestoneForm({...milestoneForm, status: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer">
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        {isAdmin && <option value="VERIFIED">Verified</option>}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                     <input type="date" value={milestoneForm.dueDate} onChange={e => setMilestoneForm({...milestoneForm, dueDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"/>
                   </div>
               </div>
               
               <div className="pt-4 flex justify-end gap-3">
                 <button type="button" onClick={() => setIsMilestoneModalOpen(false)} className="px-4 py-2 rounded-lg font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">Cancel</button>
                 <button type="submit" className="px-4 py-2 rounded-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors cursor-pointer shadow-sm">Save Milestone</button>
               </div>
             </form>
           </div>
        </div>
      )}

    </div>
  );
}
