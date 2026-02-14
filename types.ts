export type ViewType = 'dashboard' | 'dailylog' | 'schedule' | 'employees' | 'reports' | 'settings' | 'notifications';

export interface Employee {
  id: string;
  name: string;
  role: string;
  team: string;
  shift: 'A' | 'B';
  status: 'On-Duty' | 'Off-Duty';
  monthlyHours: number;
  totalHours: number;
  timeInfo: string;
  timeLabel: string;
  avatarUrl: string;
  email?: string;
  phone?: string;
  joinDate?: string;
  department?: string;
}

export interface WorkSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  team: 'A' | 'B';
  workerName: string;
  status: 'Scheduled' | 'Completed' | 'InProgress';
}

export interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  shifts: {
    team: 'A' | 'B';
    name: string;
    type: 'current' | 'future' | 'past';
  }[];
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  time: string;
  type: 'login' | 'logout' | 'edit';
}

export interface WorkLogEntry {
  id: string;
  date?: string;
  time: string;
  type: 'Pest' | 'Facility';
  category: string;
  details: string;
  location: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  status: 'Completed' | 'Pending' | 'In Progress';
  hasPhoto: boolean;
  photoUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  totalHours: string;
  status: 'Normal' | 'Late' | 'Overtime' | 'Leave';
  department: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  isRead: boolean;
  category: string;
}