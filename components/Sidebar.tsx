import React from 'react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
      active
        ? 'bg-primary/10 text-primary font-medium'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
    }`;

  return (
    <aside className="w-64 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 z-20">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
            <span className="material-icons text-xl">shield</span>
          </div>
          <span className="font-bold text-lg tracking-tight">26센터 출근/업무</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <div
          className={navItemClass(currentView === 'dashboard')}
          onClick={() => onViewChange('dashboard')}
        >
          <span className="material-icons text-[20px]">dashboard</span>
          <span>대시보드</span>
        </div>
        <div
          className={navItemClass(currentView === 'dailylog')}
          onClick={() => onViewChange('dailylog')}
        >
          <span className="material-icons text-[20px]">assignment</span>
          <span>업무 일지</span>
        </div>
        <div
          className={navItemClass(currentView === 'schedule')}
          onClick={() => onViewChange('schedule')}
        >
          <span className="material-icons text-[20px]">calendar_month</span>
          <span>근무 일정표</span>
        </div>
        <div
          className={navItemClass(currentView === 'employees')}
          onClick={() => onViewChange('employees')}
        >
          <span className="material-icons text-[20px]">people</span>
          <span>직원 관리</span>
        </div>
        <div
          className={navItemClass(currentView === 'reports')}
          onClick={() => onViewChange('reports')}
        >
          <span className="material-icons text-[20px]">assessment</span>
          <span>근태 보고서</span>
        </div>

        <div className="pt-6 pb-2 px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          설정
        </div>
        <div
          className={navItemClass(currentView === 'settings')}
          onClick={() => onViewChange('settings')}
        >
          <span className="material-icons text-[20px]">settings</span>
          <span>시스템 설정</span>
        </div>
        <div
          className={navItemClass(currentView === 'notifications')}
          onClick={() => onViewChange('notifications')}
        >
          <span className="material-icons text-[20px]">notifications</span>
          <span>알림</span>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <img
            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            src="https://picsum.photos/100/100?random=admin"
            alt="Admin user"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              관리자 김철수
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              시설관리 팀장
            </p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <span className="material-icons text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;