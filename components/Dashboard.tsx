import React, { useState, useEffect } from 'react';
import { Employee, ActivityLog, WorkSchedule } from '../types';
import { collection, onSnapshot, getDocs, writeBatch, doc, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface DashboardProps {
  employees: Employee[];
  onNavigateToHandover: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ employees, onNavigateToHandover }) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Emergency Call State
  const [emergencyTarget, setEmergencyTarget] = useState<Employee | null>(null);
  const [emergencyStep, setEmergencyStep] = useState<'confirm' | 'sending' | 'success'>('confirm');

  // Message State
  const [messageTarget, setMessageTarget] = useState<Employee | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [messageStatus, setMessageStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // Feb 2026
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);

  // Real-time Data States
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<Record<string, number>>({});

  // Fetch Schedules from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'work_schedules'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkSchedule));
      setSchedules(data);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Activity Logs from Firestore
  useEffect(() => {
    const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        let timeStr = data.time || '';
        
        // Format Timestamp if available
        if (data.timestamp && data.timestamp.toDate) {
            const date = data.timestamp.toDate();
            // Format example: 2월 14일 07:22 AM
            const month = date.getMonth() + 1;
            const day = date.getDate();
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            timeStr = `${month}월 ${day}일 ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
        }

        return {
          id: doc.id,
          ...data,
          time: timeStr
        } as ActivityLog;
      });
      setActivityLogs(logs);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Attendance Records for Monthly Stats
  useEffect(() => {
    const q = query(collection(db, 'attendance_records'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const stats: Record<string, number> = {};
        const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Filter by current month (assuming date format YYYY-MM-DD)
            if (data.date && data.date.startsWith(currentMonthStr)) {
                let minutes = 0;
                // Parse "9h 18m" string
                if (data.totalHours) {
                    const hMatch = data.totalHours.match(/(\d+)h/);
                    const mMatch = data.totalHours.match(/(\d+)m/);
                    if (hMatch) minutes += parseInt(hMatch[1]) * 60;
                    if (mMatch) minutes += parseInt(mMatch[1]);
                }
                
                // Aggregate by employee name
                const name = data.employeeName;
                if (name) {
                    stats[name] = (stats[name] || 0) + minutes;
                }
            }
        });
        
        // Convert to hours
        const statsHours: Record<string, number> = {};
        Object.keys(stats).forEach(name => {
            statsHours[name] = Math.round(stats[name] / 60);
        });
        setMonthlyStats(statsHours);
    });
    return () => unsubscribe();
  }, [currentDate]);

  // Seed Initial Data (Schedules & Activity Logs)
  useEffect(() => {
    const seedData = async () => {
       const batch = writeBatch(db);
       let commitNeeded = false;

       // Seed Work Schedules
       const schedColRef = collection(db, 'work_schedules');
       const schedSnapshot = await getDocs(schedColRef);
       
       if (schedSnapshot.empty) {
           console.log("Seeding work schedules...");
           const year = 2026;
           const month = 1; // Feb (0-indexed)
           const days = new Date(year, month + 1, 0).getDate();
           
           for(let d=1; d<=days; d++) {
              const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isTeamA = d % 2 === 0; 
              
              const schedule = {
                  date: dateStr,
                  team: isTeamA ? 'A' : 'B',
                  workerName: isTeamA ? '전민수' : '김지민',
                  status: d < 14 ? 'Completed' : (d === 14 ? 'InProgress' : 'Scheduled')
              };
              const newDoc = doc(schedColRef);
              batch.set(newDoc, schedule);
           }
           commitNeeded = true;
       }

       // Seed Activity Logs
       const activityColRef = collection(db, 'activity_logs');
       const activitySnapshot = await getDocs(activityColRef);

       if (activitySnapshot.empty) {
           console.log("Seeding activity logs...");
           const logs = [
               { user: '전민수', action: '출근', timestamp: Timestamp.fromDate(new Date(2026, 1, 14, 7, 22)), type: 'login' },
               { user: '김지민', action: '퇴근', timestamp: Timestamp.fromDate(new Date(2026, 1, 14, 7, 35)), type: 'logout' },
               { user: '관리자', action: '일정 수정', timestamp: Timestamp.fromDate(new Date(2026, 1, 13, 14, 30)), type: 'edit' },
               { user: '김지민', action: '출근', timestamp: Timestamp.fromDate(new Date(2026, 1, 12, 7, 25)), type: 'login' },
               { user: '전민수', action: '퇴근', timestamp: Timestamp.fromDate(new Date(2026, 1, 12, 7, 40)), type: 'logout' },
           ];
           logs.forEach(log => {
               const docRef = doc(activityColRef);
               batch.set(docRef, log);
           });
           commitNeeded = true;
       }

       if (commitNeeded) {
           await batch.commit();
       }
    };
    seedData();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const prevMonthLastDate = new Date(year, month, 0).getDate();

  // Calculate grid rows (5 or 6)
  const totalCellsNeeded = firstDayOfWeek + daysInMonth;
  const totalRows = totalCellsNeeded > 35 ? 6 : 5;
  const nextMonthDaysCount = (totalRows * 7) - totalCellsNeeded;

  const simulatedToday = new Date(2026, 1, 14);

  const openEmergencyModal = (emp: Employee) => {
    setEmergencyTarget(emp);
    setEmergencyStep('confirm');
  };

  const handleSendAlert = () => {
    setEmergencyStep('sending');
    // Simulate API call delay
    setTimeout(() => {
        setEmergencyStep('success');
        // Close modal after success message
        setTimeout(() => {
            setEmergencyTarget(null);
        }, 1500);
    }, 1500);
  };

  const openMessageModal = (emp: Employee) => {
    setMessageTarget(emp);
    setMessageContent('');
    setMessageStatus('idle');
  };

  const handleSendMessage = () => {
    if (!messageContent.trim()) return;
    setMessageStatus('sending');
    setTimeout(() => {
        setMessageStatus('success');
        setTimeout(() => {
            setMessageTarget(null);
        }, 1500);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark relative">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          직원 근태 및 출근부 관리
        </h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={onNavigateToHandover}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-slate-900/10 border border-slate-700 dark:border-slate-600"
          >
            <span className="material-icons text-[18px]">swap_horiz</span>
            <span>근무 교대</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20">
            <span className="material-icons text-[18px]">add</span>
            <span>근무 일정 추가</span>
          </button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-md">
            <span className="material-icons text-[18px] mr-2">today</span>
            <span>2026년 2월 14일 (토)</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
        {/* Status Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => {
            // Use calculated hours if available, otherwise 0
            const currentHours = monthlyStats[emp.name] || 0;
            return (
              <div
                key={emp.id}
                className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      emp.status === 'On-Duty'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        emp.status === 'On-Duty' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'
                      }`}
                    ></span>
                    {emp.status === 'On-Duty' ? '근무중 (On-Duty)' : '비번 (Off-Duty)'}
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      className={`w-16 h-16 rounded-lg object-cover ring-2 ${
                        emp.status === 'On-Duty' ? 'ring-primary/20' : 'ring-slate-500/20 grayscale opacity-80'
                      }`}
                      src={emp.avatarUrl}
                      alt={emp.name}
                    />
                    <span className="absolute -bottom-2 -right-2 w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-surface-dark">
                      {emp.team}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{emp.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{emp.role}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 dark:text-slate-500 text-xs mb-0.5">
                          이번 달 근무
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-slate-200 text-lg">
                          {currentHours} <span className="text-xs font-normal text-slate-500">시간</span>
                        </p>
                      </div>
                      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-500 text-xs mb-0.5">
                          {emp.timeLabel}
                        </p>
                        <p
                          className={`font-semibold ${
                            emp.status === 'On-Duty'
                              ? 'text-slate-900 dark:text-slate-200'
                              : 'text-primary'
                          }`}
                        >
                          {emp.timeInfo}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setSelectedEmployee(emp)}
                    className="w-full py-2 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors"
                  >
                    상세 기록
                  </button>
                  {emp.status === 'On-Duty' ? (
                    <button 
                      onClick={() => openEmergencyModal(emp)}
                      className="w-full py-2 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-sm font-medium transition-colors"
                    >
                      긴급 호출
                    </button>
                  ) : (
                    <button 
                      onClick={() => openMessageModal(emp)}
                      className="w-full py-2 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-sm font-medium transition-colors"
                    >
                      메시지 전송
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Calendar & Stats */}
        <section className="flex flex-col xl:flex-row gap-6 h-full min-h-[600px]">
          {/* Calendar */}
          <div className="flex-1 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {month + 1}월 근무 현황 ({year}년)
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <span className="material-icons text-slate-500 text-xl">chevron_left</span>
                </button>
                <span className="text-sm font-medium px-2 text-slate-700 dark:text-slate-300">
                  {year}년 {month + 1}월
                </span>
                <button 
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <span className="material-icons text-slate-500 text-xl">chevron_right</span>
                </button>
              </div>
            </div>
            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <div
                  key={day}
                  className={`py-3 text-center text-xs font-semibold uppercase ${
                    i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar Days */}
            <div className={`flex-1 grid grid-cols-7 ${totalRows === 6 ? 'grid-rows-6' : 'grid-rows-5'} text-sm`}>
              {/* Previous Month */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                const d = prevMonthLastDate - firstDayOfWeek + 1 + i;
                return (
                  <div
                    key={`prev-${d}`}
                    className="p-2 border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600"
                  >
                    <span className="block mb-2">{d}</span>
                  </div>
                );
              })}
              
              {/* Current Month */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const schedule = schedules.find(s => s.date === dateKey);

                const isToday = year === simulatedToday.getFullYear() && 
                                month === simulatedToday.getMonth() && 
                                d === simulatedToday.getDate();
                
                const isTeamA = schedule?.team === 'A';

                return (
                  <div
                    key={`curr-${d}`}
                    className={`p-2 border-b border-r dark:border-slate-800 relative group transition-colors ${
                      isToday
                        ? 'border-primary/30 dark:border-primary/50 bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <span
                      className={`block mb-1 font-medium ${
                        isToday ? 'font-bold text-primary' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {d}
                    </span>
                    {schedule ? (
                        <>
                            <div
                              className={`${
                                isTeamA
                                  ? 'bg-primary/20 border-l-2 border-primary text-primary-dark dark:text-primary'
                                  : 'bg-purple-500/20 border-l-2 border-purple-500 text-purple-700 dark:text-purple-300'
                              } ${
                                isToday ? (isTeamA ? 'bg-primary border-white text-white shadow-md' : '') : ''
                              } rounded-r px-1.5 py-1 text-xs mb-1 truncate`}
                            >
                              <span className="font-bold">{schedule.team}조</span> {schedule.workerName}
                              {isToday && (isTeamA ? ' (현)' : ' (예정)')}
                            </div>
                            {isToday && !isTeamA && (
                              <div className="bg-primary/10 border-l-2 border-primary/50 text-primary-dark/50 dark:text-primary/50 rounded-r px-1.5 py-1 text-xs mb-1 opacity-50">
                                 <span className="font-bold">A조</span> 전민수 (종료)
                              </div>
                            )}
                             {isToday && isTeamA && (
                              <div className="bg-purple-500/10 border-l-2 border-purple-500/50 text-purple-700 dark:text-purple-300/50 rounded-r px-1.5 py-1 text-xs mb-1 opacity-50">
                                 <span className="font-bold">B조</span> 김지민 (예정)
                              </div>
                            )}
                        </>
                    ) : (
                        <div className="h-4"></div> // Empty spacer
                    )}
                  </div>
                );
              })}
              
              {/* Next Month */}
              {Array.from({ length: nextMonthDaysCount }, (_, i) => i + 1).map((d) => (
                 <div
                  key={`next-${d}`}
                  className="p-2 border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600"
                >
                  <span className="block mb-2">{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full xl:w-80 flex flex-col gap-6">
            {/* Progress Bars */}
            <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                근무 통계 (월 누적)
              </h3>
              <div className="space-y-4">
                {employees.map((emp) => {
                  const currentHours = monthlyStats[emp.name] || 0;
                  return (
                    <div key={emp.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-900 dark:text-white">{emp.name}</span>
                        <span className="text-slate-500">
                          {currentHours}/{emp.totalHours}h
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            emp.team === 'A' ? 'bg-primary' : 'bg-purple-500'
                          }`}
                          style={{ width: `${Math.min(100, (currentHours / emp.totalHours) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Log */}
            <div className="flex-1 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">최근 활동 기록</h3>
                <button className="text-xs text-primary hover:text-primary-dark font-medium">
                  전체보기
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-0">
                {activityLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        <p>최근 활동 기록이 없습니다.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activityLogs.map((log) => (
                        <li
                          key={log.id}
                          className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  log.type === 'login'
                                    ? 'bg-green-500/10 text-green-500'
                                    : log.type === 'logout'
                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                    : 'bg-blue-500/10 text-blue-500'
                                }`}
                              >
                                <span className="material-icons text-sm">
                                  {log.type === 'login'
                                    ? 'login'
                                    : log.type === 'logout'
                                    ? 'logout'
                                    : 'edit_note'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {log.user} - {log.action}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {log.time}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                )}
              </div>
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                <button className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">
                  <span className="material-icons text-base">download</span>
                  월간 리포트 다운로드
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fade-in border border-slate-200 dark:border-slate-700 relative">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">직원 상세 기록</h3>
                <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <span className="material-icons">close</span>
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 space-y-6">
                 {/* Profile Header */}
                 <div className="flex items-center gap-4">
                    <img src={selectedEmployee.avatarUrl} className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-600 shadow-sm object-cover" alt={selectedEmployee.name} />
                    <div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">{selectedEmployee.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{selectedEmployee.role}</p>
                        <div className="flex gap-2 mt-2">
                             <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-600">
                                {selectedEmployee.team}조 (24시간)
                             </span>
                             <span className={`text-xs px-2 py-1 rounded font-medium border ${selectedEmployee.status === 'On-Duty' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                {selectedEmployee.status}
                             </span>
                        </div>
                    </div>
                 </div>

                 {/* Contact Info */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">연락처</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedEmployee.phone}</p>
                    </div>
                     <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">이메일</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{selectedEmployee.email}</p>
                    </div>
                 </div>

                 {/* Detailed Stats */}
                 <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="material-icons text-primary text-sm">history</span>
                        최근 3일 근무 이력
                    </h5>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors">
                            <span className="text-slate-600 dark:text-slate-400">2026.02.14 (토)</span>
                            <span className="font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">
                                {selectedEmployee.shift === 'A' ? '07:22 - (근무중)' : '비번 (Off)'}
                            </span>
                        </div>
                         <div className="flex justify-between items-center text-sm p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors">
                            <span className="text-slate-600 dark:text-slate-400">2026.02.12 (목)</span>
                            <span className="font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">
                                 {selectedEmployee.shift === 'A' ? '07:25 - 07:40 (24h)' : '비번 (Off)'}
                            </span>
                        </div>
                         <div className="flex justify-between items-center text-sm p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors">
                            <span className="text-slate-600 dark:text-slate-400">2026.02.10 (화)</span>
                            <span className="font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">
                                 {selectedEmployee.shift === 'A' ? '07:20 - 07:35 (24h)' : '비번 (Off)'}
                            </span>
                        </div>
                    </div>
                 </div>
              </div>
              
              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                 <button className="flex-1 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
                    전체 이력 보기
                 </button>
                 <button className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-white dark:hover:bg-slate-700 transition-colors">
                    메시지 보내기
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Emergency Call Modal */}
      {emergencyTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-red-900/20 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in border border-red-200 dark:border-red-900 relative">
                {/* Conditional Content based on step */}
                {emergencyStep === 'confirm' && (
                    <>
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <span className="material-icons text-3xl text-red-600 dark:text-red-500">notifications_active</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">긴급 호출 발송</h3>
                            <p className="text-slate-600 dark:text-slate-300 mb-6">
                                현재 근무 중인 <span className="font-bold text-slate-900 dark:text-white">{emergencyTarget.name}</span>님에게<br/>
                                긴급 알림을 전송하시겠습니까?
                            </p>
                            
                            <div className="text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-6 border border-slate-100 dark:border-slate-700">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">호출 사유 선택</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="reason" className="text-red-600 focus:ring-red-500" defaultChecked />
                                        <span className="text-sm text-slate-700 dark:text-slate-200">화재 및 시설 위험 감지</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="reason" className="text-red-600 focus:ring-red-500" />
                                        <span className="text-sm text-slate-700 dark:text-slate-200">외부인 무단 침입</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="reason" className="text-red-600 focus:ring-red-500" />
                                        <span className="text-sm text-slate-700 dark:text-slate-200">응급 환자 발생</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setEmergencyTarget(null)} className="flex-1 py-3 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    취소
                                </button>
                                <button onClick={handleSendAlert} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-500/30 transition-colors flex items-center justify-center gap-2">
                                    <span className="material-icons">send</span>
                                    호출하기
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {emergencyStep === 'sending' && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">알림 전송 중...</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">직원의 모바일 기기로 신호를 보내고 있습니다.</p>
                    </div>
                )}

                {emergencyStep === 'success' && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-icons text-3xl text-green-600 dark:text-green-500">check_circle</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">호출 완료</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">성공적으로 긴급 호출을 전송했습니다.</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Message Modal */}
      {messageTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in border border-slate-200 dark:border-slate-700 relative">
                {messageStatus === 'idle' && (
                    <>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">메시지 전송</h3>
                            <button onClick={() => setMessageTarget(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                <img src={messageTarget.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt={messageTarget.name} />
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">받는 사람</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{messageTarget.name}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">내용</label>
                                    <textarea 
                                        value={messageContent}
                                        onChange={(e) => setMessageContent(e.target.value)}
                                        className="w-full h-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none dark:text-white placeholder-slate-400"
                                        placeholder="전달할 내용을 입력하세요..."
                                    ></textarea>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="urgent" className="rounded text-primary focus:ring-primary" />
                                    <label htmlFor="urgent" className="text-sm text-slate-600 dark:text-slate-400">긴급 메시지로 표시</label>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                            <button onClick={() => setMessageTarget(null)} className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-white dark:hover:bg-slate-700 transition-colors">
                                취소
                            </button>
                            <button onClick={handleSendMessage} className={`flex-1 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 ${!messageContent.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <span className="material-icons text-sm">send</span>
                                전송
                            </button>
                        </div>
                    </>
                )}

                {messageStatus === 'sending' && (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">전송 중...</h3>
                    </div>
                )}

                {messageStatus === 'success' && (
                     <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <span className="material-icons text-3xl text-green-600 dark:text-green-500">mark_email_read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">전송 완료</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">메시지가 성공적으로 전달되었습니다.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;