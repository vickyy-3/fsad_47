import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Upload, File, Download, Trash2, Search, X, Eye, Clock, ArrowUpCircle, Users } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Documents() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  
  // State for Upload Modal
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null); // For new version
  
  // State for Preview/History
  const [activeDocument, setActiveDocument] = useState<any>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, []);

  const fetchDocuments = async () => {
    try {
      // Assuming GET /api/documents currently returns all documents. 
      // In a real scenario, this would be filtered by project, but for now we fetch all and let the backend return the latest if we mapped it,
      // but wait, we need to make sure we show the latest versions.
      // Wait, DocumentController.getAllDocuments() returns findAll(). We should ideally group them or just let the table handle it.
      // We will just use the API.
      const res = await api.get('/documents');
      
      // Let's manually filter to show only latest version of each groupId if backend returns all
      const latestDocsMap = new Map();
      res.data.forEach((doc: any) => {
          if (!doc.documentGroupId) {
              latestDocsMap.set(doc.id, doc);
          } else {
              if (!latestDocsMap.has(doc.documentGroupId) || latestDocsMap.get(doc.documentGroupId).version < doc.version) {
                  latestDocsMap.set(doc.documentGroupId, doc);
              }
          }
      });
      setDocuments(Array.from(latestDocsMap.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openUploadModal = (projectId: string = '', groupId: string | null = null) => {
      setSelectedProjectId(projectId);
      setSelectedGroupId(groupId);
      setIsUploadModalOpen(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0] || !selectedProjectId) return;

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', selectedProjectId);
    if (selectedGroupId) {
        formData.append('documentGroupId', selectedGroupId);
    }

    setUploading(true);
    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsUploadModalOpen(false);
      setIsHistoryModalOpen(false);
      toast.success(selectedGroupId ? "New version uploaded" : "Document uploaded successfully");
      fetchDocuments();
    } catch (err) {
      console.error('Failed to upload', err);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: any) => {
    try {
        const res = await api.get(`/documents/download/${doc.id}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', doc.fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.info("Download started");
    } catch(err) {
        console.error('Download failed', err);
        toast.error("Failed to download document");
    }
  };

  const handleDelete = async (id: number) => {
      if(!window.confirm('Are you sure you want to delete this document and all its versions?')) return;
      try {
          await api.delete(`/documents/${id}`);
          toast.info("Document deleted");
          fetchDocuments();
      } catch (err) {
          console.error(err);
          toast.error("Failed to delete document");
      }
  };

  const openPreview = (doc: any) => {
      setActiveDocument(doc);
      setIsPreviewModalOpen(true);
  };

  const openHistory = async (doc: any) => {
      if (!doc.documentGroupId) {
          toast.warning("This document doesn't have a version history yet.");
          return;
      }
      setActiveDocument(doc);
      try {
          const res = await api.get(`/documents/history/${doc.documentGroupId}`);
          setVersionHistory(res.data);
          setIsHistoryModalOpen(true);
      } catch (err) {
          toast.error("Could not load version history");
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Documents</h1>
          <p className="text-slate-500 mt-1">Manage all research papers and datasets securely.</p>
        </div>
        <button onClick={() => openUploadModal()} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.98] cursor-pointer">
          <Upload size={18} /> Upload Document
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search documents..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        
        {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading documents...</div>
        ) : (
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider bg-white">
                <th className="px-6 py-4">Name & Version</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Uploaded</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><File size={20} /></div>
                        <div>
                            <span className="font-semibold text-slate-900 block">{doc.fileName}</span>
                            {doc.version && (
                                <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    v{doc.version}
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{doc.uploadedBy?.name?.charAt(0) || 'U'}</div>
                        <span className="text-sm font-medium text-slate-700">{doc.uploadedBy?.name || 'User'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openPreview(doc)} title="Preview" className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"><Eye size={18} /></button>
                        <button onClick={() => openHistory(doc)} title="Version History" className="text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"><Clock size={18} /></button>
                        <button onClick={() => handleDownload(doc)} title="Download" className="text-slate-400 hover:text-primary-600 transition-colors cursor-pointer"><Download size={18} /></button>
                        <button onClick={() => handleDelete(doc.id)} title="Delete" className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"><Trash2 size={18} /></button>
                    </div>
                    </td>
                </tr>
                ))}
                {documents.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No documents found. Start by uploading one!</td>
                    </tr>
                )}
            </tbody>
            </table>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800">
                    {selectedGroupId ? "Upload New Version" : "Upload Document"}
                </h2>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20}/></button>
             </div>
             <form onSubmit={handleUpload} className="p-6 space-y-5">
               {!selectedGroupId && (
                   <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1">Select Project Link</label>
                     <select required value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white">
                         <option value="" disabled>Select a project...</option>
                         {projects.map(p => (
                             <option key={p.id} value={p.id}>{p.title}</option>
                         ))}
                     </select>
                   </div>
               )}
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Select File</label>
                 <input type="file" required ref={fileInputRef} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"/>
               </div>
               
               <div className="pt-4 flex justify-end gap-3">
                 <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 rounded-lg font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">Cancel</button>
                 <button type="submit" disabled={uploading} className="px-4 py-2 rounded-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors cursor-pointer shadow-sm disabled:opacity-75">
                    {uploading ? 'Uploading...' : 'Upload'}
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && activeDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-800">{activeDocument.fileName}</h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        v{activeDocument.version || 1}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleDownload(activeDocument)} className="text-primary-600 font-semibold text-sm flex items-center gap-1 hover:text-primary-700 cursor-pointer"><Download size={16}/> Download</button>
                    <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer bg-slate-200 p-1 rounded-full"><X size={20}/></button>
                </div>
             </div>
             <div className="flex-1 bg-slate-100 p-4 overflow-hidden relative">
                 {/* Provide auth token if necessary, or let browser handle session cookie. 
                     Since we use JWT in headers, standard iframe won't send it unless passed in URL.
                     For real production, we'd fetch as Blob and create object URL for preview. */}
                 <iframe 
                    src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/documents/preview/${activeDocument.id}?token=${localStorage.getItem('token')}`} 
                    className="w-full h-full rounded border bg-white"
                    title="Document Preview"
                 />
             </div>
           </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && activeDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800">Version History</h2>
                <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20}/></button>
             </div>
             <div className="p-6">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="font-semibold text-slate-900">{activeDocument.fileName}</h3>
                        <p className="text-sm text-slate-500">Document Group: {activeDocument.documentGroupId}</p>
                    </div>
                    <button onClick={() => openUploadModal(activeDocument.project.id, activeDocument.documentGroupId)} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                        <ArrowUpCircle size={18} /> Upload New Version
                    </button>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {versionHistory.map((vdoc) => (
                        <div key={vdoc.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-primary-300 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
                                    v{vdoc.version}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{vdoc.fileName}</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><Clock size={12}/> {new Date(vdoc.uploadedAt).toLocaleString()}</span>
                                        <span className="flex items-center gap-1"><Users size={12}/> {vdoc.uploadedBy?.name}</span>
                                        <span>{(vdoc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openPreview(vdoc)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Preview"><Eye size={18}/></button>
                                <button onClick={() => handleDownload(vdoc)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-primary-600 rounded-lg transition-colors cursor-pointer" title="Download"><Download size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
