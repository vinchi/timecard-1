import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weeklyReport: false,
    shiftAlert: true
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { id: 'general', label: '일반 설정', icon: 'tune' },
    { id: 'notifications', label: '알림 설정', icon: 'notifications' },
    { id: 'security', label: '보안 및 계정', icon: 'security' },
    { id: 'system', label: '시스템 관리', icon: 'dns' },
  ];

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
        <div>
           <h1 className="text-xl font-bold text-slate-900 dark:text-white">시스템 설정</h1>
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">애플리케이션 환경 설정 및 관리</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Settings Sidebar */}
        <aside className="w-64 bg-white dark:bg-surface-dark/50 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 overflow-y-auto hidden md:block">
           <nav className="p-4 space-y-1">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                   activeTab === tab.id
                     ? 'bg-primary text-white shadow-md shadow-primary/20'
                     : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                 }`}
               >
                 <span className="material-icons text-[20px]">{tab.icon}</span>
                 {tab.label}
               </button>
             ))}
           </nav>
        </aside>

        {/* Settings Panel */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-fade-in">
                <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">테마 및 디스플레이</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">다크 모드</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">어두운 환경에서 눈의 피로를 줄입니다.</p>
                      </div>
                      <button 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-slate-700/50"></div>
                     <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">언어 설정 (Language)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">시스템 기본 표시 언어를 선택하세요.</p>
                      </div>
                      <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5">
                        <option>한국어 (Korean)</option>
                        <option>English (US)</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                   <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">근무 환경 설정</h2>
                   <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">기본 근무조 편성</label>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="border border-primary bg-primary/5 rounded-lg p-3 cursor-pointer">
                              <div className="flex items-center justify-between mb-1">
                                 <span className="text-sm font-bold text-primary">2교대 (24시간)</span>
                                 <span className="material-icons text-primary text-sm">check_circle</span>
                              </div>
                              <p className="text-xs text-slate-500">격일 근무 시스템</p>
                           </div>
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                              <div className="flex items-center justify-between mb-1">
                                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">3교대 (8시간)</span>
                                 <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"></span>
                              </div>
                              <p className="text-xs text-slate-500">주/야/비 시스템</p>
                           </div>
                        </div>
                      </div>
                   </div>
                </section>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
               <div className="space-y-6 animate-fade-in">
                 <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">알림 채널</h2>
                  <div className="space-y-4">
                     {[
                       { key: 'email', label: '이메일 알림', desc: '중요한 업데이트 및 리포트를 이메일로 수신합니다.' },
                       { key: 'push', label: '푸시 알림', desc: '실시간 이슈 및 메시지를 브라우저 푸시로 받습니다.' }
                     ].map((item) => (
                       <div key={item.key} className="flex items-center justify-between py-2">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                          </div>
                          <button 
                            onClick={() => toggleNotification(item.key as keyof typeof notifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                       </div>
                     ))}
                  </div>
                 </section>

                  <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">알림 유형</h2>
                  <div className="space-y-4">
                     {[
                       { key: 'weeklyReport', label: '주간 리포트 자동 발송', desc: '매주 월요일 오전 9시에 지난주 현황을 리포트합니다.' },
                       { key: 'shiftAlert', label: '근무 교대 알림', desc: '근무 시작 30분 전 알림을 발송합니다.' }
                     ].map((item) => (
                       <div key={item.key} className="flex items-center justify-between py-2">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                          </div>
                          <button 
                            onClick={() => toggleNotification(item.key as keyof typeof notifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                       </div>
                     ))}
                  </div>
                 </section>
               </div>
            )}

            {/* Security */}
             {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in">
                <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">비밀번호 변경</h2>
                  <form className="space-y-4 max-w-md">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">현재 비밀번호</label>
                        <input type="password" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary dark:text-white" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">새 비밀번호</label>
                        <input type="password" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary dark:text-white" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">새 비밀번호 확인</label>
                        <input type="password" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary dark:text-white" />
                     </div>
                     <button type="button" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
                        비밀번호 업데이트
                     </button>
                  </form>
                </section>
                 <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">로그인 활동</h2>
                  <div className="space-y-3">
                     <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                           <span className="material-icons text-slate-400">desktop_windows</span>
                           <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">Windows PC - Chrome</p>
                              <p className="text-xs text-green-500">현재 활동 중 • 서울, 대한민국</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                           <span className="material-icons text-slate-400">smartphone</span>
                           <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">iPhone 13 - Safari</p>
                              <p className="text-xs text-slate-500">2시간 전 • 서울, 대한민국</p>
                           </div>
                        </div>
                        <button className="text-xs text-red-500 hover:text-red-600">로그아웃</button>
                     </div>
                  </div>
                </section>
              </div>
             )}

             {/* System */}
             {activeTab === 'system' && (
                <div className="space-y-6 animate-fade-in">
                    <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">데이터 백업 및 복구</h2>
                         <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-700">
                             <div>
                                 <p className="text-sm font-medium text-slate-900 dark:text-white">자동 백업</p>
                                 <p className="text-xs text-slate-500 mt-1">매일 오전 3시에 시스템 데이터를 자동으로 백업합니다.</p>
                             </div>
                             <div className="flex gap-2">
                                 <button className="px-3 py-1.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-600 rounded text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">설정</button>
                             </div>
                         </div>
                         <div className="mt-4 flex gap-3">
                             <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                                 <span className="material-icons text-sm">cloud_download</span>
                                 수동 백업 실행
                             </button>
                              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                 <span className="material-icons text-sm">history</span>
                                 백업 기록 보기
                             </button>
                         </div>
                    </section>

                    <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-red-500 mb-4">위험 구역</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">이 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.</p>
                        <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-lg">
                            <div>
                                <p className="text-sm font-bold text-red-600 dark:text-red-400">모든 데이터 초기화</p>
                                <p className="text-xs text-red-500/80 mt-1">직원 정보, 근무 기록, 일지를 포함한 모든 데이터를 삭제합니다.</p>
                            </div>
                            <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors">
                                초기화
                            </button>
                        </div>
                    </section>
                </div>
             )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;