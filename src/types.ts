export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  SUPPORT_MANAGER = "SUPPORT_MANAGER",
  SUPPORT_AGENT = "SUPPORT_AGENT",
  CUSTOMER = "CUSTOMER"
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
  status: "Active" | "Inactive";
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  dateOfRegistration: string;
  status: "Active" | "Inactive";
  customerType: "Enterprise" | "Standard" | "VIP";
  profilePicture?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  notes?: string;
}

export interface Complaint {
  id: string;
  customerId: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  department: string;
  assignedAgentId?: string;
  title: string;
  description: string;
  attachments: Array<{ name: string; type: string; size: string; content: string }>;
  status: "New" | "Assigned" | "In Progress" | "Waiting for Customer" | "Escalated" | "Resolved" | "Closed" | "Rejected";
  createdDate: string;
  dueDate: string;
  resolvedDate?: string;
  timeline: TimelineEvent[];
}

export interface Interaction {
  id: string;
  date: string;
  time: string;
  agentId: string;
  customerId: string;
  type: "Phone Call" | "Email" | "Chat" | "Visit" | "WhatsApp" | "Video Call";
  summary: string;
  notes: string;
  attachments?: Array<{ name: string; type: string; content: string }>;
  followUpDate?: string;
}

export interface Feedback {
  id: string;
  complaintId: string;
  rating: number;
  comment: string;
  suggestions?: string;
  resolutionSatisfaction: "Highly Satisfied" | "Satisfied" | "Neutral" | "Unsatisfied" | "Highly Unsatisfied";
  sentiment?: "Positive" | "Neutral" | "Negative";
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  type: "FAQ" | "Solution" | "Article";
  views: number;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  slaHours: {
    Low: number;
    Medium: number;
    High: number;
    Critical: number;
  };
  autoEscalate: boolean;
}

export interface AnalyticsMetrics {
  totalCustomers: number;
  activeCustomers: number;
  complaintsToday: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  avgResolutionTime: number;
  avgSatisfactionScore: number;
}

export interface AnalyticsCharts {
  topComplaintCategories: Array<{ name: string; value: number }>;
  monthlyTrends: Array<{ name: string; Filed: number; Resolved: number }>;
  departmentPerformance: Array<{ name: string; total: number; resolved: number; efficiency: number }>;
  agentPerformance: Array<{ name: string; resolved: number; pending: number; total: number }>;
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics;
  charts: AnalyticsCharts;
  recentActivities: Array<{ id: string; user: string; action: string; details: string; time: string }>;
}
