import React, { useState, useEffect } from 'react';
import { WorkLogEntry } from '../types';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, Timestamp, updateDoc } from 'firebase/firestore';

interface DailyLogProps {
  initialTab?: 'log' | 'handover';
}

const DailyLog: React.FC<DailyLogProps> = ({ initialTab = 'log' }) => {
  const [activeTab, setActiveTab] = useState<'log' | 'handover'>(initialTab);
  const [logs, setLogs] = useState<WorkLogEntry[]>([]);
  
  // Update active tab when prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Form State
  const [formData, setFormData] = useState({
    taskType: 'Pest',
    time: new Date().toTimeString().slice(0, 5), // Default to current time
    location: '',
    category: '정기 점검',
    priority: 'Normal',
    details: '',
  });

  const [handoverNote, setHandoverNote] = useState('');
  const [selectedHandoverItems, setSelectedHandoverItems] = useState<string[]>([]);
  const [isHandoverSent, setIsHandoverSent] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Logs from Firestore
  useEffect(() => {
    const q = query(collection(db, 'work_logs'), orderBy('time', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WorkLogEntry[];
      setLogs(fetchedLogs);
    });

    return () => unsubscribe();
  }, []);

  // Generate location options from B6 to 20F
  const locationOptions = [
    ...Array.from({ length: 6 }, (_, i) => `지하 ${6 - i}층 (B${6 - i})`),
    ...Array.from({ length: 20 }, (_, i) => `지상 ${i + 1}층 (${i + 1}F)`),
  ];

  // Stats Calculation
  const totalCount = logs.length;
  const pendingCount = logs.filter(l => l.status === 'Pending').length;
  const completedCount = logs.filter(l => l.status === 'Completed').length;
  const urgentCount = logs.filter(l => l.priority === 'Urgent').length;

  const stats = [
    { label: '오늘 전체 업무', count: totalCount, color: 'text-slate-900 dark:text-white', icon: 'list_alt', iconColor: 'text-blue-500', iconBg: 'bg-blue-500/10' },
    { label: '처리 대기', count: pendingCount, color: 'text-orange-500', icon: 'hourglass_empty', iconColor: 'text-orange-500', iconBg: 'bg-orange-500/10' },
    { label: '처리 완료', count: completedCount, color: 'text-green-500', icon: 'check_circle', iconColor: 'text-green-500', iconBg: 'bg-green-500/10' },
    { label: '긴급/중요', count: urgentCount, color: 'text-red-500', icon: 'warning', iconColor: 'text-red-500', iconBg: 'bg-red-500/10' },
  ];

  const pendingLogs = logs.filter(log => log.status !== 'Completed' || log.priority === 'Urgent');

  const toggleHandoverItem = (id: string) => {
    if (selectedHandoverItems.includes(id)) {
      setSelectedHandoverItems(selectedHandoverItems.filter(itemId => itemId !== id));
    } else {
      setSelectedHandoverItems([...selectedHandoverItems, id]);
    }
  };

  const handleHandoverSubmit = () => {
      if (selectedHandoverItems.length === 0 && !handoverNote) {
          alert("전송할 항목이나 내용을 입력해주세요.");
          return;
      }
      setIsHandoverSent(true);
      // Simulate API call
      setTimeout(() => {
          alert('인수인계서가 B조(김지민 과장)에게 전송되었습니다.');
      }, 500);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      try {
        const storageRef = ref(storage, `work_logs/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setPhotoUrl(url);
      } catch (error) {
        console.error("Upload failed", error);
        alert("사진 업로드 실패");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.details || !formData.location) {
          alert("위치와 상세 내용을 입력해주세요.");
          return;
      }
      
      setSubmitting(true);
      try {
          const newLog: Omit<WorkLogEntry, 'id'> = {
              time: formData.time,
              type: formData.taskType as 'Pest' | 'Facility',
              category: formData.category,
              details: formData.details,
              location: formData.location,
              priority: formData.priority as 'Normal' | 'Important' | 'Urgent',
              status: 'Pending', // Default status for new logs
              hasPhoto: !!photoUrl,
              photoUrl: photoUrl || undefined,
              date: '2026-02-14' // Using simulated date for consistency with dashboard
          };

          await addDoc(collection(db, 'work_logs'), newLog);

          // Reset Form
          setFormData({
            taskType: 'Pest',
            time: new Date().toTimeString().slice(0, 5),
            location: '',
            category: '정기 점검',
            priority: 'Normal',
            details: '',
          });
          setPhotoUrl('');
      } catch (error) {
          console.error("Error adding log: ", error);
          alert("업무 일지 저장 중 오류가 발생했습니다.");
      } finally {
          setSubmitting(false);
      }
  };

  const handleStatusChange = async (id: string, newStatus: 'Completed' | 'Pending' | 'In Progress') => {
      try {
          await updateDoc(doc(db, 'work_logs', id), { status: newStatus });
      } catch (error) {
          console.error("Error updating status: ", error);
          alert("상태 변경 중 오류가 발생했습니다.");
      }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("이 업무 기록을 삭제하시겠습니까?")) {
          try {
              await deleteDoc(doc(db, 'work_logs', id));
          } catch (error) {
              console.error("Error deleting log: ", error);
              alert("삭제 중 오류가 발생했습니다.");
          }
      }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-surface-darker border-b border-gray-200 dark:border-border-dark px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <span className="material-icons text-primary">assignment</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">일일 방제 및 관리 업무일지</h1>
            <p className="text-xs text-text-secondary">통합 시설 관리 시스템 v2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 bg-background-light dark:bg-background-dark px-4 py-2 rounded-lg border border-gray-200 dark:border-border-dark">
            <div className="flex items-center gap-2">
              <span className="material-icons text-text-secondary text-sm">calendar_today</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">2026-02-14 (토)</span>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-border-dark"></div>
            <div className="flex items-center gap-2">
              <span className="material-icons text-text-secondary text-sm">schedule</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">A조 (07:30 - 익일 07:30)</span>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-border-dark"></div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-sm text-text-secondary">방제:</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">전민수</span>
              </div>
            </div>
          </div>
           <button className="p-2 text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors">
            <span className="material-icons">settings</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold cursor-pointer hover:bg-primary-hover transition-colors text-xs">
            ADMIN
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-4 bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-border-dark flex gap-1">
        <button 
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-t border-x ${
            activeTab === 'log' 
            ? 'bg-white dark:bg-surface-darker text-primary border-gray-200 dark:border-border-dark border-b-transparent relative top-px' 
            : 'text-text-secondary border-transparent hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-icons text-sm">edit_note</span>
            일일 업무일지
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('handover')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-t border-x ${
            activeTab === 'handover' 
            ? 'bg-white dark:bg-surface-darker text-primary border-gray-200 dark:border-border-dark border-b-transparent relative top-px' 
            : 'text-text-secondary border-transparent hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
             <span className="material-icons text-sm">swap_horiz</span>
             근무 교대/인수인계
             {pendingLogs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px]">
                    {pendingLogs.length}
                </span>
             )}
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'log' ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Sidebar: Form */}
            <aside className="w-full lg:w-[400px] xl:w-[450px] bg-white dark:bg-surface-darker border-r border-gray-200 dark:border-border-dark flex flex-col overflow-y-auto z-10 shadow-lg lg:shadow-none">
            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                    <span className="material-icons text-primary text-xl">edit_note</span>
                    새 업무 기록
                </h2>
                <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500 font-medium border border-green-500/20">작성 중</span>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Task Type */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">업무 구분 (Task Type)</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-background-light dark:bg-background-dark rounded-lg border border-gray-200 dark:border-border-dark">
                    <label className="cursor-pointer">
                        <input type="radio" name="taskType" className="peer sr-only" checked={formData.taskType === 'Pest'} onChange={() => setFormData({...formData, taskType: 'Pest'})} />
                        <div className="flex items-center justify-center gap-2 py-2.5 rounded text-sm font-medium text-text-secondary transition-all peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-sm">
                        <span className="material-icons text-sm">pest_control</span>
                        방제 (Pest)
                        </div>
                    </label>
                    <label className="cursor-pointer">
                        <input type="radio" name="taskType" className="peer sr-only" checked={formData.taskType === 'Facility'} onChange={() => setFormData({...formData, taskType: 'Facility'})} />
                        <div className="flex items-center justify-center gap-2 py-2.5 rounded text-sm font-medium text-text-secondary transition-all peer-checked:bg-teal-600 peer-checked:text-white peer-checked:shadow-sm">
                        <span className="material-icons text-sm">build</span>
                        관리 (Facility)
                        </div>
                    </label>
                    </div>
                </div>

                {/* Time & Location */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">시간 (Time)</label>
                    <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-background-light dark:bg-background-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white" />
                    </div>
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">위치 (Location)</label>
                    <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-background-light dark:bg-background-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white">
                        <option value="">위치 선택</option>
                        {locationOptions.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                    </div>
                </div>

                {/* Category & Priority */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">카테고리 (Category)</label>
                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-background-light dark:bg-background-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white">
                        <option>정기 점검</option>
                        <option>긴급 방제</option>
                        <option>시설 보수</option>
                        <option>고객 요청</option>
                    </select>
                    </div>
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">우선순위 (Priority)</label>
                    <div className="flex gap-2">
                        {['Normal', 'Important', 'Urgent'].map(p => (
                        <label key={p} className="flex-1 cursor-pointer">
                            <input type="radio" name="priority" className="peer sr-only" checked={formData.priority === p} onChange={() => setFormData({...formData, priority: p})} />
                            <span className={`block w-full text-center py-2.5 rounded-lg border border-gray-200 dark:border-border-dark text-xs font-medium text-text-secondary hover:bg-background-light dark:hover:bg-surface-hover transition-all peer-checked:border-opacity-50
                            ${p === 'Normal' ? 'peer-checked:bg-green-500/20 peer-checked:text-green-500 peer-checked:border-green-500' : ''}
                            ${p === 'Important' ? 'peer-checked:bg-orange-500/20 peer-checked:text-orange-500 peer-checked:border-orange-500' : ''}
                            ${p === 'Urgent' ? 'peer-checked:bg-red-500/20 peer-checked:text-red-500 peer-checked:border-red-500' : ''}
                            `}>{p === 'Normal' ? '보통' : p === 'Important' ? '중요' : '긴급'}</span>
                        </label>
                        ))}
                    </div>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">상세 내용 (Details)</label>
                    <textarea 
                    value={formData.details} 
                    onChange={(e) => setFormData({...formData, details: e.target.value})} 
                    className="w-full bg-background-light dark:bg-background-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none dark:text-white"
                    placeholder="작업 내용을 상세히 입력하세요..."
                    rows={4}
                    />
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">사진 첨부 (Photo)</label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-border-dark rounded-lg p-6 text-center hover:bg-background-light dark:hover:bg-surface-hover transition-colors cursor-pointer group relative">
                        <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handlePhotoUpload}
                            accept="image/*"
                        />
                        {uploading ? (
                             <div className="flex flex-col items-center">
                                 <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                                 <p className="text-xs text-text-secondary">업로드 중...</p>
                             </div>
                        ) : photoUrl ? (
                            <div className="flex flex-col items-center">
                                <img src={photoUrl} alt="Uploaded" className="h-20 w-auto rounded mb-2 object-cover" />
                                <p className="text-xs text-green-500 font-medium">업로드 완료 (변경하려면 다시 클릭)</p>
                            </div>
                        ) : (
                            <>
                                <span className="material-icons text-gray-400 group-hover:text-primary transition-colors mb-2">add_a_photo</span>
                                <p className="text-xs text-text-secondary group-hover:text-primary transition-colors">클릭하거나 이미지를 드래그하세요</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex gap-3">
                    <button type="button" className="flex-1 py-3 px-4 rounded-lg bg-background-light dark:bg-surface-hover hover:bg-gray-200 dark:hover:bg-border-dark text-sm font-medium transition-colors text-text-secondary">초기화</button>
                    <button 
                        type="submit" 
                        disabled={uploading || submitting}
                        className={`flex-[2] py-3 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                    <span className="material-icons text-sm">save</span>
                    {submitting ? '저장 중...' : '기록 저장'}
                    </button>
                </div>
                </form>
            </div>
            </aside>

            {/* Right Content */}
            <section className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                {stats.map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-surface-darker p-4 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm flex items-center justify-between">
                    <div>
                    <p className="text-xs text-text-secondary font-medium">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.count}<span className="text-sm font-normal text-text-secondary ml-1">건</span></p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                    <span className={`material-icons ${stat.iconColor}`}>{stat.icon}</span>
                    </div>
                </div>
                ))}
            </div>

            {/* List View */}
            <div className="flex-1 px-6 pb-6 min-h-0 flex flex-col">
                <div className="bg-white dark:bg-surface-darker rounded-xl border border-gray-200 dark:border-border-dark shadow-sm flex flex-col h-full overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 dark:border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg mr-2 text-slate-900 dark:text-white">업무 현황 리스트</h3>
                    <div className="flex bg-background-light dark:bg-background-dark rounded-lg p-1 border border-gray-200 dark:border-border-dark">
                        <button className="px-3 py-1 rounded text-xs font-medium bg-white dark:bg-surface-darker shadow-sm text-primary">전체</button>
                        <button className="px-3 py-1 rounded text-xs font-medium text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors">방제</button>
                        <button className="px-3 py-1 rounded text-xs font-medium text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors">관리</button>
                    </div>
                    </div>
                    <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm">search</span>
                        <input type="text" placeholder="검색어 입력..." className="pl-8 pr-4 py-1.5 bg-background-light dark:bg-background-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none w-48 dark:text-white placeholder:text-text-secondary" />
                    </div>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-border-dark hover:bg-background-light dark:hover:bg-surface-hover transition-colors text-sm text-text-secondary">
                        <span className="material-icons text-sm">filter_list</span>
                        필터
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-border-dark hover:bg-background-light dark:hover:bg-surface-hover transition-colors text-sm text-text-secondary">
                        <span className="material-icons text-sm">download</span>
                        엑셀
                    </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                            <span className="material-icons text-4xl mb-2 opacity-30">assignment_late</span>
                            <p>등록된 업무 일지가 없습니다.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                        <thead className="bg-background-light dark:bg-background-dark sticky top-0 z-10">
                            <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap w-24">시간</th>
                            <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap w-24">구분</th>
                            <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap w-32">카테고리</th>
                            <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider min-w-[400px]">상세 내용</th>
                            <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap w-32">위치</th>
                            <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap w-24 text-center">우선순위</th>
                            <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap w-24 text-center">상태</th>
                            <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap w-20 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-border-dark text-sm">
                            {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-background-light dark:hover:bg-surface-hover transition-colors group">
                                <td className="px-4 py-3 font-mono text-text-secondary whitespace-nowrap">{log.time}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                                    log.type === 'Pest' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                                }`}>
                                    {log.type === 'Pest' ? '방제' : '관리'}
                                </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{log.category}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex-1 font-medium text-slate-800 dark:text-white text-sm whitespace-pre-wrap leading-relaxed break-all">
                                            {log.details}
                                        </span>
                                        {log.hasPhoto && (
                                            <div
                                                onClick={() => log.photoUrl && window.open(log.photoUrl, '_blank')}
                                                className="group flex flex-col items-center justify-center w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all relative overflow-hidden shrink-0"
                                                title="사진 보기"
                                            >
                                                {log.photoUrl ? (
                                                    <img src={log.photoUrl} alt="현장 사진" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-icons text-slate-400 group-hover:text-primary text-lg">image</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{log.location}</td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                <span className={`inline-block w-2 h-2 rounded-full ${
                                    log.priority === 'Normal' ? 'bg-green-500' :
                                    log.priority === 'Important' ? 'bg-orange-500 animate-pulse' : 'bg-red-500 animate-pulse'
                                }`}></span>
                                <span className="sr-only">{log.priority}</span>
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    log.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                                    log.status === 'Pending' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                    {log.status === 'Completed' ? '완료' : log.status === 'Pending' ? '대기' : '진행중'}
                                </span>
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {log.status !== 'Completed' && (
                                        <button 
                                            onClick={() => handleStatusChange(log.id, 'Completed')}
                                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-text-secondary hover:text-green-500 transition-colors"
                                            title="완료 처리"
                                        >
                                            <span className="material-icons text-base">check_circle_outline</span>
                                        </button>
                                    )}
                                    <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors" title="수정">
                                        <span className="material-icons text-base">edit</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(log.id)}
                                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-text-secondary hover:text-red-500 transition-colors"
                                        title="삭제"
                                    >
                                        <span className="material-icons text-base">delete</span>
                                    </button>
                                </div>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    )}
                </div>
                
                {/* Pagination (Simplified) */}
                <div className="p-4 border-t border-gray-200 dark:border-border-dark flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Total Records: <span className="font-medium text-slate-900 dark:text-white">{logs.length}</span></span>
                </div>

                </div>
            </div>
            </section>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden p-6 lg:p-8 gap-8">
            {/* Handover Left Panel: Issues to Report */}
            <div className="flex-1 flex flex-col min-w-0 gap-6">
                <div className="bg-white dark:bg-surface-darker rounded-xl border border-gray-200 dark:border-border-dark shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-icons text-orange-500">priority_high</span>
                        인수인계 필요 항목 (미처리 업무)
                    </h2>
                    <p className="text-sm text-text-secondary mb-4">
                        오늘 기록된 업무 중 상태가 '대기'이거나 '긴급'인 항목입니다. 인수인계서에 포함할 항목을 선택하세요.
                    </p>
                    <div className="space-y-3">
                        {pendingLogs.map(log => (
                            <div 
                                key={log.id} 
                                onClick={() => toggleHandoverItem(log.id)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                                    selectedHandoverItems.includes(log.id)
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-primary ring-1 ring-primary'
                                    : 'bg-background-light dark:bg-background-dark border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-surface-hover'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded flex items-center justify-center border mt-0.5 ${
                                    selectedHandoverItems.includes(log.id)
                                    ? 'bg-primary border-primary text-white'
                                    : 'bg-white dark:bg-surface-dark border-gray-300 dark:border-gray-600'
                                }`}>
                                    {selectedHandoverItems.includes(log.id) && <span className="material-icons text-sm">check</span>}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                            log.priority === 'Urgent' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                        }`}>{log.priority === 'Urgent' ? '긴급' : '중요'}</span>
                                        <span className="text-xs text-text-secondary font-mono">{log.time}</span>
                                    </div>
                                    <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">{log.details}</h4>
                                    <p className="text-xs text-text-secondary">{log.location} • {log.category}</p>
                                </div>
                            </div>
                        ))}
                        {pendingLogs.length === 0 && (
                             <div className="text-center py-8 text-text-secondary text-sm bg-background-light dark:bg-background-dark rounded-lg border border-dashed border-gray-300 dark:border-border-dark">
                                특이사항이나 미처리된 업무가 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-darker rounded-xl border border-gray-200 dark:border-border-dark shadow-sm p-6 flex-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">금일 업무 요약</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-background-light dark:bg-background-dark rounded-lg border border-gray-200 dark:border-border-dark">
                            <p className="text-xs text-text-secondary">총 업무 처리</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{completedCount}<span className="text-sm font-normal text-text-secondary ml-1">/ {totalCount}건</span></p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-3">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: totalCount > 0 ? `${(completedCount/totalCount)*100}%` : '0%' }}></div>
                            </div>
                        </div>
                         <div className="p-4 bg-background-light dark:bg-background-dark rounded-lg border border-gray-200 dark:border-border-dark">
                            <p className="text-xs text-text-secondary">긴급/중요 건수</p>
                            <p className="text-2xl font-bold text-red-500 mt-1">{urgentCount}<span className="text-sm font-normal text-text-secondary ml-1">건</span></p>
                             <p className="text-xs text-text-secondary mt-2">화재 감지기, 공조기 소음 등</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Handover Right Panel: Form */}
            <div className="w-full lg:w-[450px] bg-white dark:bg-surface-darker rounded-xl border border-gray-200 dark:border-border-dark shadow-lg flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                         <span className="material-icons text-primary">assignment_ind</span>
                         인수인계서 작성
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">다음 근무조에게 전달할 내용을 작성하세요.</p>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {isHandoverSent ? (
                        <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                <span className="material-icons text-3xl text-green-600 dark:text-green-500">check_circle</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">전송 완료</h3>
                            <p className="text-text-secondary mb-6">
                                <strong>B조 (김지민 과장)</strong>에게<br/>인수인계서가 성공적으로 전송되었습니다.
                            </p>
                            <button 
                                onClick={() => setIsHandoverSent(false)}
                                className="px-6 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                수정 후 다시 보내기
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2">보내는 사람 (현 근무자)</label>
                                    <div className="flex items-center gap-3 p-3 bg-background-light dark:bg-background-dark rounded-lg border border-gray-200 dark:border-border-dark">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">A</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">전민수</p>
                                            <p className="text-xs text-text-secondary">A조 / 방제팀</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2">받는 사람 (다음 근무자)</label>
                                    <div className="flex items-center gap-3 p-3 bg-background-light dark:bg-background-dark rounded-lg border border-gray-200 dark:border-border-dark">
                                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">B</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">김지민</p>
                                            <p className="text-xs text-text-secondary">B조 / 방제팀</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">전달 선택 항목 ({selectedHandoverItems.length}건)</label>
                                <div className="p-3 bg-background-light dark:bg-background-dark rounded-lg border border-gray-200 dark:border-border-dark min-h-[80px] text-sm text-text-secondary">
                                    {selectedHandoverItems.length > 0 ? (
                                        <ul className="list-disc pl-4 space-y-1">
                                            {selectedHandoverItems.map(id => {
                                                const item = logs.find(l => l.id === id);
                                                return <li key={id} className="text-slate-700 dark:text-slate-300">{item?.details}</li>
                                            })}
                                        </ul>
                                    ) : (
                                        <span className="text-gray-400 italic">왼쪽 목록에서 인수인계할 항목을 선택하세요.</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">특이사항 및 전달 메모</label>
                                <textarea 
                                    value={handoverNote}
                                    onChange={(e) => setHandoverNote(e.target.value)}
                                    className="w-full h-32 bg-background-light dark:bg-background-dark border border-gray-200 dark:border-border-dark rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none dark:text-white"
                                    placeholder="다음 근무자에게 전달할 구두 전달 사항이나 특이사항을 입력하세요..."
                                ></textarea>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg flex gap-3 items-start border border-orange-100 dark:border-orange-900/30">
                                <span className="material-icons text-orange-500 text-sm mt-0.5">info</span>
                                <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                                    인수인계서를 전송하면 다음 근무자의 앱에 알림이 전송되며, 관리자 대시보드에도 기록이 남습니다.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {!isHandoverSent && (
                    <div className="p-6 border-t border-gray-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex gap-3">
                        <button className="flex-1 py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 font-medium hover:bg-white dark:hover:bg-surface-dark transition-colors">
                            임시 저장
                        </button>
                        <button 
                            onClick={handleHandoverSubmit}
                            className="flex-[2] py-3 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-icons">send</span>
                            인수인계 전송
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default DailyLog;