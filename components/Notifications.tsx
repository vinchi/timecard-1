import React, { useState } from 'react';
import { NotificationItem } from '../types';

const Notifications: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: '긴급 시설 점검 요청',
      message: '지하 2층 기계실 침수 경보가 발생했습니다. 즉시 확인 바랍니다.',
      time: '방금 전',
      type: 'alert',
      isRead: false,
      category: '긴급'
    },
    {
      id: '2',
      title: '근무 일정 변경 승인',
      message: '박지훈님의 11월 15일 근무 일정 변경 요청이 승인되었습니다.',
      time: '30분 전',
      type: 'success',
      isRead: false,
      category: '일정'
    },
    {
      id: '3',
      title: '새로운 업무 할당',
      message: '본관 1층 로비 방역 작업이 할당되었습니다. (담당자: 김철수)',
      time: '2시간 전',
      type: 'info',
      isRead: true,
      category: '업무'
    },
    {
      id: '4',
      title: '시스템 정기 점검 안내',
      message: '금일 밤 12시부터 2시간 동안 시스템 서버 점검이 예정되어 있습니다.',
      time: '5시간 전',
      type: 'warning',
      isRead: true,
      category: '시스템'
    },
    {
      id: '5',
      title: '주간 업무 리포트 생성',
      message: '11월 2주차 주간 업무 리포트가 생성되었습니다. 확인해 주세요.',
      time: '1일 전',
      type: 'info',
      isRead: true,
      category: '리포트'
    }
  ]);

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return 'error';
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      default: return 'notifications';
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'alert': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'success': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'warning': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
        <div>
           <h1 className="text-xl font-bold text-slate-900 dark:text-white">알림 센터</h1>
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">최근 30일간의 알림 내역입니다.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={markAllAsRead}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1"
            >
                <span className="material-icons text-[18px]">done_all</span>
                모두 읽음 처리
            </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full p-6 lg:p-8">
        
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
            <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all' 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
                전체 알림
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-800 text-xs">
                    {notifications.length}
                </span>
            </button>
            <button 
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'unread' 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
                안 읽음
                {notifications.some(n => !n.isRead) && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">
                        {notifications.filter(n => !n.isRead).length}
                    </span>
                )}
            </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => markAsRead(item.id)}
                        className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                            item.isRead 
                            ? 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100' 
                            : 'bg-white dark:bg-surface-dark border-primary/30 shadow-sm shadow-primary/5 ring-1 ring-primary/5'
                        }`}
                    >
                        {!item.isRead && (
                            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        )}
                        
                        <div className="flex gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${getColorClass(item.type)}`}>
                                <span className="material-icons text-[20px]">{getIcon(item.type)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                            {item.category}
                                        </span>
                                        <span className="text-xs text-slate-400 dark:text-slate-500">{item.time}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteNotification(item.id); }}
                                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                    >
                                        <span className="material-icons text-[18px]">close</span>
                                    </button>
                                </div>
                                <h3 className={`text-base font-bold mb-1 ${item.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                    {item.title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {item.message}
                                </p>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <span className="material-icons text-3xl text-slate-400">notifications_off</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">알림이 없습니다</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {filter === 'unread' ? '모든 알림을 확인하셨습니다.' : '새로운 소식이 도착하면 알려드릴게요.'}
                    </p>
                </div>
            )}
            
            {filteredNotifications.length > 0 && (
                <div className="pt-4 text-center">
                    <button className="text-sm text-slate-500 hover:text-primary font-medium transition-colors">
                        이전 알림 더 보기
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;