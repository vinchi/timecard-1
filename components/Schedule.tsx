import React, { useState } from 'react';

const Schedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // Feb 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(14);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Mock data generator for shifts - Synced with Dashboard
  const getShiftForDay = (day: number) => {
    // Dashboard Logic: Even days = Team A, Odd days = Team B
    const isTeamA = day % 2 === 0; 
    return {
      team: isTeamA ? 'A' : 'B',
      leader: isTeamA ? '전민수' : '김지민',
      role: '과장',
      members: [], // Single person per team as requested
      color: isTeamA ? 'primary' : 'purple-500',
      bgColor: isTeamA ? 'bg-primary/10' : 'bg-purple-500/10',
      borderColor: isTeamA ? 'border-primary' : 'border-purple-500',
      textColor: isTeamA ? 'text-primary' : 'text-purple-600 dark:text-purple-400',
    };
  };

  const selectedShift = selectedDay ? getShiftForDay(selectedDay) : null;

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          월간 근무 일정표
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
             <button 
                onClick={previousMonth}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all"
             >
                <span className="material-icons text-slate-500">chevron_left</span>
             </button>
             <button className="px-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
             </button>
             <button 
                onClick={nextMonth}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all"
             >
                <span className="material-icons text-slate-500">chevron_right</span>
             </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20">
            <span className="material-icons text-[18px]">edit_calendar</span>
            <span>근무표 수정</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors">
            <span className="material-icons text-[18px]">download</span>
            <span>다운로드</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col min-w-0 p-6 lg:p-8 overflow-y-auto">
          {/* Legend & Filters */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">A조 (전민수)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">B조 (김지민)</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">휴무/공휴일</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                 <select className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2">
                    <option>전체 부서</option>
                    <option>방제팀</option>
                    <option>시설관리팀</option>
                </select>
            </div>
          </div>

          {/* Calendar */}
          <div className="flex-1 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-[600px]">
             {/* Days Header */}
             <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <div
                  key={day}
                  className={`py-3 text-center text-sm font-semibold uppercase ${
                    i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6">
                 {/* Empty cells for previous month */}
                 {Array.from({ length: startDayOfWeek }).map((_, i) => (
                     <div key={`prev-${i}`} className="border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 p-2 min-h-[100px]"></div>
                 ))}
                 
                 {/* Current month days */}
                 {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                     const shift = getShiftForDay(day);
                     const isSelected = selectedDay === day;
                     const isToday = currentDate.getFullYear() === 2026 && currentDate.getMonth() === 1 && day === 14;

                     return (
                         <div 
                            key={day} 
                            onClick={() => setSelectedDay(day)}
                            className={`border-b border-r border-slate-100 dark:border-slate-800 p-2 min-h-[100px] relative transition-all cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40
                                ${isSelected ? 'ring-2 ring-inset ring-primary bg-primary/5 dark:bg-primary/5' : ''}
                                ${isToday ? 'bg-yellow-50/50 dark:bg-yellow-500/5' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {day}
                                </span>
                                {isToday && <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Today</span>}
                            </div>
                            
                            {/* Shift Badge */}
                            <div className={`mb-1 px-2 py-1.5 rounded-md border-l-4 ${shift.bgColor} ${shift.borderColor} ${shift.textColor}`}>
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-xs font-bold">{shift.team}조 근무</span>
                                    <span className="material-icons text-[14px] opacity-70">schedule</span>
                                </div>
                                <div className="text-[11px] opacity-90 truncate font-medium">
                                    {shift.leader} {shift.role}
                                </div>
                            </div>

                            {/* Hover Action */}
                            <button className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-surface-dark shadow-sm border border-slate-200 dark:border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="material-icons text-[16px]">more_horiz</span>
                            </button>
                         </div>
                     );
                 })}

                 {/* Empty cells for next month */}
                 {Array.from({ length: 42 - (daysInMonth + startDayOfWeek) }).map((_, i) => (
                      <div key={`next-${i}`} className="border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 p-2 min-h-[100px]"></div>
                 ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Details */}
        <aside className="w-80 bg-white dark:bg-surface-dark border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto hidden xl:block shadow-xl z-10">
            {selectedDay ? (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                             <span className="material-icons text-primary">calendar_today</span>
                             {currentDate.getMonth() + 1}월 {selectedDay}일 일정
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            근무 유형: <span className="font-medium text-slate-900 dark:text-slate-300">24시간 교대 근무</span>
                        </p>
                    </div>

                    <div className={`p-4 rounded-xl border ${selectedShift?.borderColor} ${selectedShift?.bgColor}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-lg font-bold ${selectedShift?.textColor}`}>{selectedShift?.team}조 근무</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold bg-white dark:bg-surface-dark ${selectedShift?.textColor} border border-current opacity-70`}>On-Duty</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <img src={`https://picsum.photos/100/100?random=${selectedDay}`} className="w-10 h-10 rounded-full border-2 border-white dark:border-surface-dark" alt="Leader" />
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedShift?.leader}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">근무자 ({selectedShift?.role})</p>
                                </div>
                            </div>
                            
                            {selectedShift?.members && selectedShift.members.length > 0 && (
                                <>
                                    <div className="h-px bg-current opacity-10"></div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">팀원</p>
                                        {selectedShift.members.map((member, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-black/10">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
                                                    {member.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{member}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">특이사항 및 메모</h3>
                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                            <p className="flex gap-2">
                                <span className="material-icons text-sm text-orange-500 mt-0.5">warning</span>
                                <span>오전 10시 시설 안전 점검 예정 (전체)</span>
                            </p>
                        </div>
                        <button className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-500 hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-1">
                            <span className="material-icons text-sm">add</span>
                            메모 추가
                        </button>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                         <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">연계 업무</h3>
                         <div className="space-y-2">
                             <button className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group">
                                 <span className="text-sm text-slate-600 dark:text-slate-400">일일 업무일지 작성</span>
                                 <span className="material-icons text-slate-400 group-hover:text-primary text-sm">arrow_forward</span>
                             </button>
                             <button className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group">
                                 <span className="text-sm text-slate-600 dark:text-slate-400">인수인계서 확인</span>
                                 <span className="material-icons text-slate-400 group-hover:text-primary text-sm">arrow_forward</span>
                             </button>
                         </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                    <span className="material-icons text-4xl mb-2 opacity-20">touch_app</span>
                    <p className="text-sm">날짜를 선택하여<br/>상세 일정을 확인하세요.</p>
                </div>
            )}
        </aside>
      </div>
    </div>
  );
};

export default Schedule;