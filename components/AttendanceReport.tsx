import React, { useEffect, useState } from 'react';
import { AttendanceRecord } from '../types';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const AttendanceReport: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHours: 0,
    lateCount: 0,
    overtimeHours: 0,
    leaveCount: 0,
  });
  const [weeklyData, setWeeklyData] = useState<{day: string, hours: number}[]>([]);
  const [deptData, setDeptData] = useState<{name: string, ratio: number}[]>([]);

  // Parse duration string "9h 18m" to minutes
  const parseDuration = (durationStr: string): number => {
    if (!durationStr || durationStr === '-') return 0;
    let minutes = 0;
    const hMatch = durationStr.match(/(\d+)h/);
    const mMatch = durationStr.match(/(\d+)m/);
    if (hMatch) minutes += parseInt(hMatch[1]) * 60;
    if (mMatch) minutes += parseInt(mMatch[1]);
    return minutes;
  };

  useEffect(() => {
      // Fetch records sorted by date descending
      const q = query(collection(db, 'attendance_records'), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AttendanceRecord[];
          setRecords(data);
          
          // Calculate Stats
          let totalMinutes = 0;
          let late = 0;
          let overtimeMins = 0;
          let leaves = 0;
          const deptCounts: Record<string, number> = {};
          const dayHours: Record<string, number> = { '월':0, '화':0, '수':0, '목':0, '금':0, '토':0, '일':0 };

          data.forEach(rec => {
             const mins = parseDuration(rec.totalHours);
             totalMinutes += mins;

             if (rec.status === 'Late') late++;
             if (rec.status === 'Leave') leaves++;
             // Assuming > 9h (540m) is overtime for calculation purposes, or explicit status
             if (rec.status === 'Overtime' || mins > 540) {
                 overtimeMins += Math.max(0, mins - 540);
             }

             // Dept Count
             if (rec.department) {
                 deptCounts[rec.department] = (deptCounts[rec.department] || 0) + 1;
             }

             // Weekly Data (Simple aggregation by day name)
             if (rec.date) {
                 const date = new Date(rec.date);
                 const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
                 if (dayHours[dayName] !== undefined) {
                     dayHours[dayName] += (mins / 60);
                 }
             }
          });

          setStats({
              totalHours: Math.floor(totalMinutes / 60),
              lateCount: late,
              overtimeHours: Math.floor(overtimeMins / 60),
              leaveCount: leaves
          });

          // Process Weekly Data
          const days = ['월', '화', '수', '목', '금', '토', '일'];
          const newWeeklyData = days.map(day => ({
              day,
              hours: Math.round(dayHours[day] || 0)
          }));
          setWeeklyData(newWeeklyData);

          // Process Dept Data
          const totalRecs = data.length || 1;
          const newDeptData = Object.keys(deptCounts).map(dept => ({
              name: dept,
              ratio: Math.round((deptCounts[dept] / totalRecs) * 100)
          }));
          if (newDeptData.length === 0) {
             newDeptData.push({ name: '데이터 없음', ratio: 0 });
          }
          setDeptData(newDeptData);

          setLoading(false);
      });
      return () => unsubscribe();
  }, []);

  if (loading) {
    return (
        <div className="flex h-full items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p>근태 리포트 생성 중...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
        <div>
           <h1 className="text-xl font-bold text-slate-900 dark:text-white">근태 보고서</h1>
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">실시간 근무 현황 분석</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
             <button className="px-3 py-1.5 rounded-md bg-white dark:bg-surface-dark shadow-sm text-xs font-semibold text-slate-900 dark:text-white">일간</button>
             <button className="px-3 py-1.5 rounded-md text-slate-500 dark:text-slate-400 text-xs font-medium hover:text-slate-900 dark:hover:text-white">주간</button>
             <button className="px-3 py-1.5 rounded-md text-slate-500 dark:text-slate-400 text-xs font-medium hover:text-slate-900 dark:hover:text-white">월간</button>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
             <span className="material-icons text-slate-500 text-[18px]">calendar_today</span>
             <span className="text-sm font-medium text-slate-700 dark:text-slate-300">2026.02</span>
             <span className="material-icons text-slate-400 text-[16px]">arrow_drop_down</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20">
            <span className="material-icons text-[18px]">download</span>
            <span>내보내기</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">총 근무 시간</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalHours}h</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <span className="material-icons text-blue-500">schedule</span>
                    </div>
                </div>
                <div className="flex items-center text-xs">
                    <span className="text-slate-400">누적 집계</span>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">지각 발생</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.lateCount}건</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <span className="material-icons text-orange-500">timer_off</span>
                    </div>
                </div>
                <div className="flex items-center text-xs">
                   <span className="text-slate-400">누적 집계</span>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">연장 근무</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.overtimeHours}h</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <span className="material-icons text-purple-500">more_time</span>
                    </div>
                </div>
                 <div className="flex items-center text-xs">
                    <span className="text-slate-400">9시간 초과분 합계</span>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">휴가 사용</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.leaveCount}일</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <span className="material-icons text-green-500">beach_access</span>
                    </div>
                </div>
                <div className="flex items-center text-xs">
                    <span className="text-slate-400">전체 직원 합계</span>
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Attendance Bar Chart (CSS-based) */}
            <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-6">요일별 총 근무 시간</h3>
                <div className="h-64 flex items-end justify-between gap-4">
                    {weeklyData.map((data) => {
                        // Normalize height for visualization (max 100 for example, assume max daily load is around 50h for visual scaling)
                        const maxVal = Math.max(...weeklyData.map(d => d.hours), 1);
                        const heightPercent = Math.min(100, (data.hours / maxVal) * 100);
                        
                        return (
                            <div key={data.day} className="flex flex-col items-center flex-1 group">
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg relative h-full flex items-end overflow-hidden">
                                     <div 
                                        style={{ height: `${heightPercent}%` }} 
                                        className="w-full bg-primary hover:bg-primary-hover transition-all duration-500 rounded-t-lg relative group-hover:opacity-90 min-h-[4px]"
                                     >
                                         <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                                             {data.hours}h
                                         </div>
                                     </div>
                                </div>
                                <span className="text-xs text-slate-500 mt-3">{data.day}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Department Breakdown */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                 <h3 className="font-bold text-slate-900 dark:text-white mb-6">부서별 근무 비중</h3>
                 <div className="flex-1 flex flex-col justify-center space-y-6">
                     {deptData.map((dept, index) => (
                         <div key={dept.name}>
                             <div className="flex justify-between text-sm mb-2">
                                 <span className="text-slate-600 dark:text-slate-300">{dept.name}</span>
                                 <span className="font-bold text-slate-900 dark:text-white">{dept.ratio}%</span>
                             </div>
                             <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                                 <div 
                                    className={`h-2.5 rounded-full ${index % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`} 
                                    style={{ width: `${dept.ratio}%` }}
                                 ></div>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex-1 min-h-[300px]">
             <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                 <h3 className="font-bold text-slate-900 dark:text-white">상세 근태 기록</h3>
                 <div className="flex gap-2">
                     <input type="text" placeholder="이름 검색" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary dark:text-white" />
                 </div>
             </div>
             <div className="overflow-x-auto">
                 {records.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <span className="material-icons text-3xl text-slate-400">assignment_off</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">근태 기록이 없습니다</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            아직 등록된 근태 데이터가 없습니다.
                        </p>
                    </div>
                 ) : (
                     <table className="w-full text-left text-sm">
                         <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs">
                             <tr>
                                 <th className="px-6 py-3 font-semibold">이름 / 부서</th>
                                 <th className="px-6 py-3 font-semibold">날짜</th>
                                 <th className="px-6 py-3 font-semibold">출근</th>
                                 <th className="px-6 py-3 font-semibold">퇴근</th>
                                 <th className="px-6 py-3 font-semibold">총 근무</th>
                                 <th className="px-6 py-3 font-semibold text-center">상태</th>
                                 <th className="px-6 py-3 font-semibold text-right">관리</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                             {records.map((record) => (
                                 <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                     <td className="px-6 py-4">
                                         <div className="font-medium text-slate-900 dark:text-white">{record.employeeName}</div>
                                         <div className="text-xs text-slate-500">{record.department}</div>
                                     </td>
                                     <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.date}</td>
                                     <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.checkIn}</td>
                                     <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.checkOut}</td>
                                     <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-200">{record.totalHours}</td>
                                     <td className="px-6 py-4 text-center">
                                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                             record.status === 'Normal' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' :
                                             record.status === 'Late' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800' :
                                             record.status === 'Overtime' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800' :
                                             'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                         }`}>
                                             {record.status === 'Normal' ? '정상' : record.status === 'Late' ? '지각' : record.status === 'Overtime' ? '연장' : '휴가'}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4 text-right">
                                         <button className="text-slate-400 hover:text-primary transition-colors">
                                             <span className="material-icons text-sm">edit</span>
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;