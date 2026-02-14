import React, { useState } from 'react';
import { Employee } from '../types';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface EmployeeManagementProps {
  employees: Employee[];
  onAdd: (employee: Employee) => void;
  onUpdate: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

// Sub-components moved outside to prevent re-rendering issues
interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, error, type = 'text', required = false, placeholder = '' }) => (
  <div className="space-y-1">
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2.5 text-sm outline-none transition-all dark:text-white placeholder-slate-400
          ${error 
              ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary'
          }`} 
    />
    {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span className="material-icons text-[12px]">error</span>{error}</p>}
  </div>
);

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | { value: string; label: string })[];
}

const SelectField: React.FC<SelectFieldProps> = ({ label, value, onChange, options }) => (
  <div className="space-y-1">
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
      {label}
    </label>
    <div className="relative">
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none dark:text-white cursor-pointer"
        >
          {options.map((opt) => {
              const isObj = typeof opt === 'object';
              const val = isObj ? (opt as any).value : opt;
              const text = isObj ? (opt as any).label : opt;
              return <option key={val} value={val}>{text}</option>;
          })}
        </select>
        <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
    </div>
  </div>
);

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, onAdd, onUpdate, onDelete }) => {
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    role: '',
    team: 'A',
    shift: 'A',
    status: 'Off-Duty',
    department: '방제팀',
    email: '',
    phone: '',
    joinDate: '',
    avatarUrl: ''
  });

  const openModal = (employee?: Employee) => {
    setErrors({});
    if (employee) {
      setEditingEmployee(employee);
      setFormData(employee);
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        role: '',
        team: 'A',
        shift: 'A',
        status: 'Off-Duty',
        department: '방제팀',
        email: '',
        phone: '',
        joinDate: new Date().toISOString().split('T')[0],
        avatarUrl: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
        monthlyHours: 0,
        totalHours: 240,
        timeInfo: '-',
        timeLabel: '대기 중',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setErrors({});
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      try {
        const storageRef = ref(storage, `avatars/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        setFormData(prev => ({ ...prev, avatarUrl: downloadUrl }));
      } catch (error) {
        console.error("Error uploading image: ", error);
        alert("이미지 업로드에 실패했습니다.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleChange = (name: keyof Employee, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) newErrors.name = '이름은 필수 입력 항목입니다.';
    if (!formData.role?.trim()) newErrors.role = '직책은 필수 입력 항목입니다.';
    if (!formData.phone?.trim()) newErrors.phone = '연락처는 필수 입력 항목입니다.';
    else if (!/^\d{2,3}-\d{3,4}-\d{4}$/.test(formData.phone)) newErrors.phone = '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)';
    
    if (!formData.email?.trim()) {
        newErrors.email = '이메일은 필수 입력 항목입니다.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = '유효한 이메일 주소를 입력해주세요.';
    }

    if (!formData.joinDate) newErrors.joinDate = '입사일을 선택해주세요.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingEmployee) {
      onUpdate({ ...editingEmployee, ...formData } as Employee);
    } else {
      onAdd({ ...formData, id: Date.now().toString() } as Employee);
    }
    closeModal();
  };

  const filteredEmployees = filter === 'All' 
    ? employees 
    : employees.filter(emp => emp.team === filter || emp.department === filter || emp.shift + '조' === filter);

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
        <div>
           <h1 className="text-xl font-bold text-slate-900 dark:text-white">직원 관리</h1>
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">총 {employees.length}명의 직원이 등록되어 있습니다.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
             <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
             <input 
                type="text" 
                placeholder="이름, 부서 검색..." 
                className="pl-10 pr-4 py-2 w-64 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white placeholder-slate-400"
             />
          </div>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20"
          >
            <span className="material-icons text-[18px]">person_add</span>
            <span>직원 등록</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {['All', '방제팀', '시설관리팀', 'A', 'B'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${
                        filter === tab
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-sm'
                        : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    {tab === 'All' ? '전체 보기' : tab === 'A' || tab === 'B' ? `${tab}조` : tab}
                </button>
            ))}
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEmployees.map((emp) => (
                <div key={emp.id} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow group relative animate-fade-in">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                             <div className="relative">
                                <img src={emp.avatarUrl} alt={emp.name} className="w-14 h-14 rounded-full object-cover border border-slate-100 dark:border-slate-600" />
                                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-surface-dark rounded-full ${emp.status === 'On-Duty' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                             </div>
                             <div>
                                 <h3 className="font-bold text-slate-900 dark:text-white text-lg">{emp.name}</h3>
                                 <p className="text-sm text-slate-500 dark:text-slate-400">{emp.role}</p>
                             </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => openModal(emp)}
                             className="text-slate-400 hover:text-primary hover:bg-primary/10 rounded p-1.5 transition-colors"
                             title="수정"
                           >
                             <span className="material-icons text-[18px]">edit</span>
                           </button>
                           <button 
                             onClick={() => onDelete(emp.id)}
                             className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded p-1.5 transition-colors"
                             title="삭제"
                           >
                             <span className="material-icons text-[18px]">delete</span>
                           </button>
                        </div>
                    </div>
                    
                    <div className="space-y-3 mb-6 flex-1">
                        <div className="flex items-center justify-between text-sm py-1 border-b border-dashed border-slate-100 dark:border-slate-700/50">
                            <span className="text-slate-500 dark:text-slate-500">소속 부서</span>
                            <span className="font-medium text-slate-900 dark:text-slate-200">{emp.department} / <span className="text-primary">{emp.team}조</span></span>
                        </div>
                         <div className="flex items-center justify-between text-sm py-1 border-b border-dashed border-slate-100 dark:border-slate-700/50">
                            <span className="text-slate-500 dark:text-slate-500">연락처</span>
                            <span className="font-medium text-slate-900 dark:text-slate-200">{emp.phone}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-1 border-b border-dashed border-slate-100 dark:border-slate-700/50">
                            <span className="text-slate-500 dark:text-slate-500">이메일</span>
                            <span className="font-medium text-slate-900 dark:text-slate-200 truncate max-w-[150px]" title={emp.email}>{emp.email}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-1">
                            <span className="text-slate-500 dark:text-slate-500">입사일</span>
                            <span className="font-medium text-slate-900 dark:text-slate-200">{emp.joinDate}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            프로필
                        </button>
                        <button className="flex-1 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 text-sm font-medium hover:bg-primary/20 transition-colors">
                            메시지
                        </button>
                    </div>
                </div>
            ))}
             
             {/* Add New Card Placeholder */}
             <button 
                onClick={() => openModal()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all min-h-[280px] group bg-slate-50/50 dark:bg-slate-800/30"
             >
                <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all flex items-center justify-center mb-4">
                    <span className="material-icons text-3xl text-slate-300 group-hover:text-primary transition-colors">person_add</span>
                </div>
                <span className="font-semibold text-slate-500 group-hover:text-primary transition-colors">새 직원 등록</span>
                <p className="text-xs text-slate-400 mt-2">새로운 팀원을 시스템에 등록합니다.</p>
             </button>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur">
              <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-icons text-primary">{editingEmployee ? 'edit' : 'person_add'}</span>
                    {editingEmployee ? '직원 정보 수정' : '새 직원 등록'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {editingEmployee ? '등록된 직원의 정보를 수정합니다.' : '새로운 직원의 상세 정보를 입력해주세요.'}
                  </p>
              </div>
              <button 
                onClick={closeModal} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-icons text-xl">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 lg:p-8">
               <div className="space-y-8">
                   {/* Personal Info Section */}
                   <section>
                       <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">기본 정보</h4>
                       
                       {/* Avatar Upload */}
                       <div className="flex items-center gap-4 mb-6">
                         <div className="relative group">
                            <img 
                              src={formData.avatarUrl || `https://picsum.photos/200/200?random=${Math.random()}`} 
                              alt="Avatar" 
                              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="material-icons text-white">camera_alt</span>
                            </div>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">프로필 사진</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {uploading ? '업로드 중...' : '클릭하여 이미지를 변경하세요. (JPG, PNG)'}
                            </p>
                         </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <InputField 
                              label="이름" 
                              value={formData.name || ''} 
                              onChange={(val) => handleChange('name', val)} 
                              error={errors.name}
                              required 
                              placeholder="예: 홍길동" 
                           />
                           <InputField 
                              label="직책" 
                              value={formData.role || ''} 
                              onChange={(val) => handleChange('role', val)}
                              error={errors.role} 
                              required 
                              placeholder="예: 팀장, 과장" 
                           />
                           <InputField 
                              label="연락처" 
                              value={formData.phone || ''} 
                              onChange={(val) => handleChange('phone', val)}
                              error={errors.phone} 
                              required 
                              placeholder="010-0000-0000" 
                           />
                           <InputField 
                              label="이메일" 
                              type="email" 
                              value={formData.email || ''} 
                              onChange={(val) => handleChange('email', val)}
                              error={errors.email} 
                              required 
                              placeholder="example@company.com" 
                           />
                           <InputField 
                              label="입사일" 
                              type="date" 
                              value={formData.joinDate || ''} 
                              onChange={(val) => handleChange('joinDate', val)}
                              error={errors.joinDate} 
                              required 
                           />
                       </div>
                   </section>

                   {/* Work Info Section */}
                   <section>
                       <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">근무 정보</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <SelectField 
                               label="소속 부서" 
                               value={formData.department || '방제팀'}
                               onChange={(val) => handleChange('department', val)}
                               options={['방제팀', '시설관리팀', '경비팀', '미화팀']} 
                           />
                           <SelectField 
                               label="근무조" 
                               value={formData.team || 'A'}
                               onChange={(val) => handleChange('team', val)}
                               options={[
                                   {value: 'A', label: 'A조 (격일 근무)'}, 
                                   {value: 'B', label: 'B조 (격일 근무)'}
                               ]} 
                           />
                           <SelectField 
                               label="현재 상태" 
                               value={formData.status || 'Off-Duty'}
                               onChange={(val) => handleChange('status', val)}
                               options={[
                                   {value: 'On-Duty', label: 'On-Duty (근무중)'}, 
                                   {value: 'Off-Duty', label: 'Off-Duty (비번)'}
                               ]} 
                           />
                       </div>
                   </section>
               </div>
            </form>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur flex justify-end gap-3">
                 <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  취소
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={uploading}
                  className={`px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center gap-2 ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <span className="material-icons text-sm">check</span>
                  {editingEmployee ? '변경사항 저장' : '직원 등록 완료'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;