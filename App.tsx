import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DailyLog from './components/DailyLog';
import Schedule from './components/Schedule';
import EmployeeManagement from './components/EmployeeManagement';
import AttendanceReport from './components/AttendanceReport';
import Settings from './components/Settings';
import Notifications from './components/Notifications';
import { ViewType, Employee, AttendanceRecord } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [dailyLogTab, setDailyLogTab] = useState<'log' | 'handover'>('log');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Data Seeding
  useEffect(() => {
    const seedInitialData = async () => {
      const batch = writeBatch(db);
      let isSeeded = false;

      // Seed Employees
      const empColRef = collection(db, 'employees');
      const empSnapshot = await getDocs(empColRef);
      
      if (empSnapshot.empty) {
        console.log("Seeding employees...");
        const initialEmployees: Omit<Employee, 'id'>[] = [
          {
            name: '전민수',
            role: '방제팀 과장',
            team: 'A',
            shift: 'A',
            status: 'On-Duty',
            monthlyHours: 184,
            totalHours: 240,
            timeInfo: '07:22 AM',
            timeLabel: '출근 시간',
            avatarUrl: 'https://picsum.photos/200/200?random=10',
            email: 'minsu.jeon@company.com',
            phone: '010-1234-5678',
            department: '방제팀',
            joinDate: '2020-03-01'
          },
          {
            name: '김지민',
            role: '방제팀 과장',
            team: 'B',
            shift: 'B',
            status: 'Off-Duty',
            monthlyHours: 168,
            totalHours: 240,
            timeInfo: '내일 07:30 AM',
            timeLabel: '다음 근무',
            avatarUrl: 'https://picsum.photos/200/200?random=11',
            email: 'jimin.kim@company.com',
            phone: '010-9876-5432',
            department: '방제팀',
            joinDate: '2021-05-15'
          }
        ];

        initialEmployees.forEach(emp => {
          const docRef = doc(empColRef);
          batch.set(docRef, emp);
        });
        isSeeded = true;
      }

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
           isSeeded = true;
      }

      if (isSeeded) {
          await batch.commit();
          console.log("All initial data seeded successfully.");
      }
    };

    seedInitialData();
  }, []);

  // Real-time Data Sync
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'employees'), (snapshot) => {
      const empData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      setEmployees(empData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddEmployee = async (newEmployee: Employee) => {
    try {
      // Remove id if it exists (Firestore generates it) or use it if needed
      const { id, ...empData } = newEmployee; 
      await addDoc(collection(db, 'employees'), empData);
    } catch (error) {
      console.error("Error adding employee: ", error);
      alert("직원 등록 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
    try {
      const empRef = doc(db, 'employees', updatedEmployee.id);
      await updateDoc(empRef, { ...updatedEmployee });
    } catch (error) {
      console.error("Error updating employee: ", error);
      alert("직원 정보 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('정말로 이 직원을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'employees', id));
      } catch (error) {
        console.error("Error deleting employee: ", error);
        alert("직원 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleNavigateToHandover = () => {
    setCurrentView('dailylog');
    setDailyLogTab('handover');
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    // Reset to default 'log' tab when navigating normally, unless it was triggered by handover action
    if (view === 'dailylog') {
        setDailyLogTab('log');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
        <div className="flex flex-col items-center gap-4">
           <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           <p>시스템 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {currentView === 'dashboard' && (
          <Dashboard 
            employees={employees} 
            onNavigateToHandover={handleNavigateToHandover} 
          />
        )}
        {currentView === 'dailylog' && <DailyLog initialTab={dailyLogTab} />}
        {currentView === 'schedule' && <Schedule />}
        {currentView === 'employees' && (
          <EmployeeManagement 
            employees={employees} 
            onAdd={handleAddEmployee} 
            onUpdate={handleUpdateEmployee} 
            onDelete={handleDeleteEmployee} 
          />
        )}
        {currentView === 'reports' && <AttendanceReport />}
        {currentView === 'settings' && <Settings />}
        {currentView === 'notifications' && <Notifications />}
      </main>
    </div>
  );
};

export default App;