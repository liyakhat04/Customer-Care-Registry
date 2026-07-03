import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Ticket, Users, BookOpen, ShieldAlert, Settings, 
  Sparkles, Search, Filter, Plus, ArrowRight, UserCheck, ShieldCheck, 
  LogOut, Activity, ChevronRight, HelpCircle, FileText, CheckCircle, 
  Trash2, Download, RefreshCw, Eye, ThumbsUp, MessageSquare, AlertCircle,
  TrendingUp, Clock, AlertTriangle, Play, Mail, Phone, X
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { User, UserRole, Customer, Complaint, Interaction, Feedback, KnowledgeArticle, AuditLog, SystemSettings, AnalyticsData } from "./types.js";
import Sidebar from "./components/Sidebar.js";
import Header from "./components/Header.js";
import TicketDetail from "./components/TicketDetail.js";
import CustomerDetail from "./components/CustomerDetail.js";

const systemAgents: User[] = [
  {
    id: "USR-003",
    email: "agent1@company.com",
    fullName: "Sarah Connor",
    role: UserRole.SUPPORT_AGENT,
    department: "IT & Systems",
    status: "Active"
  },
  {
    id: "USR-004",
    email: "agent2@company.com",
    fullName: "James Carter",
    role: UserRole.SUPPORT_AGENT,
    department: "Finance",
    status: "Active"
  }
];

export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem("registry_token"));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState("admin@company.com");
  const [loginPassword, setLoginPassword] = useState("admin123");
  const [loginError, setLoginError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>(UserRole.CUSTOMER);

  // Layout state
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // Database lists state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [kbArticles, setKbArticles] = useState<KnowledgeArticle[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Detail drawers state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Filter & Search states
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("");
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState("");
  const [ticketDepartmentFilter, setTicketDepartmentFilter] = useState("");

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("");

  const [kbSearch, setKbSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

  // Popup Modals state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showKbModal, setShowKbModal] = useState(false);

  // New Ticket Filing form states
  const [newTicketCustomer, setNewTicketCustomer] = useState("");
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [newTicketCategory, setNewTicketCategory] = useState("Technical Support");
  const [newTicketPriority, setNewTicketPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [newTicketDept, setNewTicketDept] = useState("IT & Systems");
  const [newTicketAiRouting, setNewTicketAiRouting] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);

  // New Customer form states
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustCity, setNewCustCity] = useState("");
  const [newCustState, setNewCustState] = useState("");
  const [newCustCountry, setNewCustCountry] = useState("");
  const [newCustType, setNewCustType] = useState<"Enterprise" | "Standard" | "VIP">("Standard");

  // New KB Article form states
  const [newKbTitle, setNewKbTitle] = useState("");
  const [newKbCategory, setNewKbCategory] = useState("Technical Support");
  const [newKbContent, setNewKbContent] = useState("");
  const [newKbType, setNewKbType] = useState<"FAQ" | "Solution" | "Article">("FAQ");

  // Ticket active feedback form state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSatisfaction, setFeedbackSatisfaction] = useState<"Highly Satisfied" | "Satisfied" | "Neutral" | "Unsatisfied">("Satisfied");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackTicketId, setFeedbackTicketId] = useState("");

  // Settings SLA editor state
  const [slaLow, setSlaLow] = useState(72);
  const [slaMedium, setSlaMedium] = useState(48);
  const [slaHigh, setSlaHigh] = useState(24);
  const [slaCritical, setSlaCritical] = useState(4);
  const [autoEscalate, setAutoEscalate] = useState(true);

  // Fetch core application data
  const fetchAllData = async (activeToken: string) => {
    try {
      setLoading(true);
      const headers = { 
        "Authorization": `Bearer ${activeToken}`,
        "Content-Type": "application/json"
      };

      // Fetch endpoints parallelized
      const [
        complaintsRes,
        customersRes,
        interactionsRes,
        feedbacksRes,
        kbRes,
        auditRes,
        settingsRes,
        analyticsRes
      ] = await Promise.all([
        fetch("/api/complaints", { headers }),
        fetch("/api/customers", { headers }),
        fetch("/api/interactions", { headers }),
        fetch("/api/feedbacks", { headers }),
        fetch("/api/kb"), // KB is public facing
        fetch("/api/audit-logs", { headers }).then(res => res.ok ? res : { json: () => [] }), // RBAC protected
        fetch("/api/settings", { headers }),
        fetch("/api/analytics", { headers })
      ]);

      const complaintsData = await complaintsRes.json();
      const customersData = await customersRes.json();
      const interactionsData = await interactionsRes.json();
      const feedbacksData = await feedbacksRes.json();
      const kbData = await kbRes.json();
      const settingsData = await settingsRes.json();
      const analyticsData = await analyticsRes.json();

      let auditData = [];
      if (auditRes.json) {
        auditData = await auditRes.json();
      }

      setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setInteractions(Array.isArray(interactionsData) ? interactionsData : []);
      setFeedbacks(Array.isArray(feedbacksData) ? feedbacksData : []);
      setKbArticles(Array.isArray(kbData) ? kbData : []);
      setAuditLogs(Array.isArray(auditData) ? auditData : []);
      
      if (settingsData && settingsData.slaHours) {
        setSystemSettings(settingsData);
        setSlaLow(settingsData.slaHours.Low);
        setSlaMedium(settingsData.slaHours.Medium);
        setSlaHigh(settingsData.slaHours.High);
        setSlaCritical(settingsData.slaHours.Critical);
        setAutoEscalate(settingsData.autoEscalate);
      }

      if (analyticsData && analyticsData.metrics) {
        setAnalytics(analyticsData);
      }

    } catch (e) {
      console.error("Error fetching registry data", e);
    } finally {
      setLoading(false);
    }
  };

  // Verify auth on start
  useEffect(() => {
    if (token) {
      fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error("Stale token session");
        }
      })
      .then(data => {
        setCurrentUser(data.user);
        // If customer logged in, default their tab to 'tickets' directly!
        if (data.user.role === UserRole.CUSTOMER) {
          setCurrentTab("tickets");
        }
        fetchAllData(token);
      })
      .catch(() => {
        handleLogout();
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("registry_token", data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        if (data.user.role === UserRole.CUSTOMER) {
          setCurrentTab("tickets");
        } else {
          setCurrentTab("dashboard");
        }
      } else {
        setLoginError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setLoginError("Failed to connect to authentication server.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: regEmail, 
          password: regPassword, 
          fullName: regName, 
          role: regRole 
        })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("registry_token", data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        setIsRegistering(false);
        if (data.user.role === UserRole.CUSTOMER) {
          setCurrentTab("tickets");
        } else {
          setCurrentTab("dashboard");
        }
      } else {
        setLoginError(data.error || "Registration failed.");
      }
    } catch (err) {
      setLoginError("Failed to connect to authentication server.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("registry_token");
    setToken(null);
    setCurrentUser(null);
    setSelectedComplaint(null);
    setSelectedCustomer(null);
    setComplaints([]);
    setCustomers([]);
  };

  // Instant simulation role-switching! Sets up standard bypass tokens to check RBAC immediately.
  const handleSwitchRoleSimulation = async (role: UserRole) => {
    let email = "admin@company.com";
    let password = "admin123";

    if (role === UserRole.SUPPORT_MANAGER) {
      email = "manager@company.com";
      password = "manager123";
    } else if (role === UserRole.SUPPORT_AGENT) {
      email = "agent1@company.com";
      password = "agent123";
    } else if (role === UserRole.CUSTOMER) {
      email = "customer1@client.com";
      password = "customer123";
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("registry_token", data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        setSelectedComplaint(null);
        setSelectedCustomer(null);
        if (data.user.role === UserRole.CUSTOMER) {
          setCurrentTab("tickets");
        } else {
          setCurrentTab("dashboard");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Ticket filing submission
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim() || !newTicketDesc.trim()) return;

    setCreatingTicket(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: newTicketCustomer || undefined,
          title: newTicketTitle,
          description: newTicketDesc,
          priority: newTicketPriority,
          category: newTicketCategory,
          department: newTicketDept,
          runAiRouting: newTicketAiRouting
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowTicketModal(false);
        setNewTicketTitle("");
        setNewTicketDesc("");
        setNewTicketAiRouting(false);
        fetchAllData(token!);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingTicket(false);
    }
  };

  // Customer creation submission
  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustEmail.trim()) return;

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: newCustName,
          email: newCustEmail,
          phone: newCustPhone,
          address: newCustAddress,
          city: newCustCity,
          state: newCustState,
          country: newCustCountry,
          customerType: newCustType
        })
      });
      if (res.ok) {
        setShowCustomerModal(false);
        setNewCustName("");
        setNewCustEmail("");
        setNewCustPhone("");
        setNewCustAddress("");
        setNewCustCity("");
        setNewCustState("");
        setNewCustCountry("");
        fetchAllData(token!);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // KB Article publication
  const handlePublishKbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbTitle.trim() || !newKbContent.trim()) return;

    try {
      const res = await fetch("/api/kb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newKbTitle,
          category: newKbCategory,
          content: newKbContent,
          type: newKbType
        })
      });
      if (res.ok) {
        setShowKbModal(false);
        setNewKbTitle("");
        setNewKbContent("");
        fetchAllData(token!);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update a ticket's status / agent / priority
  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    try {
      const res = await fetch(`/api/complaints/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok) {
        setComplaints(prev => prev.map(c => c.id === ticketId ? data : c));
        setSelectedComplaint(data);
        fetchAllData(token!); // Refresh analytics metrics
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Log an interaction and refresh
  const handleLogInteraction = async (interactionData: any) => {
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(interactionData)
      });
      if (res.ok) {
        fetchAllData(token!);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open an article details and tick a view
  const handleSelectArticle = async (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    try {
      await fetch(`/api/kb/${article.id}`); // Backend automatically increments views count!
      // Silently update article list to increment view counter dynamically
      setKbArticles(prev => prev.map(a => a.id === article.id ? { ...a, views: a.views + 1 } : a));
    } catch (e) {}
  };

  // Save persistent system Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          slaHours: {
            Low: slaLow,
            Medium: slaMedium,
            High: slaHigh,
            Critical: slaCritical
          },
          autoEscalate
        })
      });
      if (res.ok) {
        fetchAllData(token!);
        alert("SLA and escalation rules updated successfully!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Feedback from Customer
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          complaintId: feedbackTicketId,
          rating: feedbackRating,
          comment: feedbackComment,
          resolutionSatisfaction: feedbackSatisfaction
        })
      });
      if (res.ok) {
        setShowFeedbackModal(false);
        setFeedbackComment("");
        fetchAllData(token!);
        alert("Thank you for your valuable feedback! This ticket has been marked as Closed.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Excel / CSV Data Exporter (Highly powerful business utility)
  const handleExportTickets = () => {
    const list = complaints;
    if (list.length === 0) return;
    
    const headers = ["Ticket ID", "Customer ID", "Category", "Priority", "Department", "Status", "Created Date", "Due Date"];
    const rows = list.map(c => [
      c.id,
      c.customerId,
      c.category,
      c.priority,
      c.department,
      c.status,
      c.createdDate,
      c.dueDate
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CareRegistry_Tickets_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick Login Link Handler
  const triggerQuickLogin = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
  };

  // Filtering lists
  const filteredComplaints = complaints.filter(c => {
    const matchSearch = ticketSearch === "" || (
      c.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      c.id.toLowerCase().includes(ticketSearch.toLowerCase())
    );
    const matchStatus = ticketStatusFilter === "" || c.status === ticketStatusFilter;
    const matchPriority = ticketPriorityFilter === "" || c.priority === ticketPriorityFilter;
    const matchCategory = ticketCategoryFilter === "" || c.category === ticketCategoryFilter;
    const matchDept = ticketDepartmentFilter === "" || c.department === ticketDepartmentFilter;

    return matchSearch && matchStatus && matchPriority && matchCategory && matchDept;
  });

  const filteredCustomers = customers.filter(c => {
    const matchSearch = customerSearch === "" || (
      c.fullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      c.id.toLowerCase().includes(customerSearch.toLowerCase())
    );
    const matchType = customerTypeFilter === "" || c.customerType === customerTypeFilter;
    return matchSearch && matchType;
  });

  const filteredKbArticles = kbArticles.filter(art => {
    const matchSearch = kbSearch === "" || (
      art.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
      art.content.toLowerCase().includes(kbSearch.toLowerCase()) ||
      art.category.toLowerCase().includes(kbSearch.toLowerCase())
    );
    return matchSearch;
  });

  // Color mappings
  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
      case "Critical": return "bg-rose-100 text-rose-800 font-bold border border-rose-200";
      case "High": return "bg-orange-100 text-orange-800 font-bold border border-orange-200";
      case "Medium": return "bg-sky-100 text-sky-800 font-bold border border-sky-200";
      default: return "bg-slate-100 text-slate-700 font-medium border border-slate-200";
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case "New": return "bg-blue-50 text-blue-700 border border-blue-200 font-semibold";
      case "Assigned": return "bg-violet-50 text-violet-700 border border-violet-200 font-semibold";
      case "In Progress": return "bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold";
      case "Waiting for Customer": return "bg-amber-50 text-amber-700 border border-amber-200 font-semibold";
      case "Escalated": return "bg-rose-50 text-rose-700 border border-rose-300 animate-pulse font-bold";
      case "Resolved": return "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold";
      case "Closed": return "bg-slate-50 text-slate-600 border border-slate-200 font-semibold";
      default: return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  // Render Login & Registration (Offline glassmorphism UI)
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        
        {/* Dynamic Abstract Grid BG */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none pulse-glow" />
        
        <div className="w-full max-w-md z-10">
          
          {/* Logo Brand */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <Plus className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">CareRegistry</h1>
              <span className="text-xs font-mono text-indigo-400 font-semibold tracking-wider">ENTERPRISE CRM</span>
            </div>
          </div>

          {/* Core Glassmorphic Form Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
            
            <div className="text-center">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isRegistering ? "Create your care account" : "Sign in to CareRegistry"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isRegistering ? "Access unified operations tickets" : "Enter credentials or select a mock tester profile"}
              </p>
            </div>

            {loginError && (
              <div className="bg-rose-950/40 border border-rose-900/80 rounded-xl p-3 flex items-start space-x-2 text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {!isRegistering ? (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Corporate Email Address</label>
                  <input 
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Secure Password</label>
                  <input 
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-2"
                >
                  <span>Access Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              // Registration Form
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Security Password</label>
                  <input 
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Primary System Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value={UserRole.CUSTOMER}>VIP Customer</option>
                    <option value={UserRole.SUPPORT_AGENT}>Support Agent</option>
                    <option value={UserRole.SUPPORT_MANAGER}>Support Manager</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-sm transition"
                >
                  Create System Profile
                </button>
              </form>
            )}

            {/* Role Switch Links (DX testing luxury) */}
            <div className="border-t border-slate-800 pt-5 space-y-3 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Quick Select Testing Roles</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => triggerQuickLogin("admin@company.com", "admin123")}
                  className="bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-800 rounded-lg p-2.5 text-left transition"
                >
                  <div className="text-[10px] font-bold text-white leading-none">Eleanor Vance</div>
                  <span className="text-[9px] text-indigo-400 font-mono">Super Admin</span>
                </button>

                <button 
                  onClick={() => triggerQuickLogin("manager@company.com", "manager123")}
                  className="bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-800 rounded-lg p-2.5 text-left transition"
                >
                  <div className="text-[10px] font-bold text-white leading-none">Marcus Aurelius</div>
                  <span className="text-[9px] text-indigo-400 font-mono">Support Manager</span>
                </button>

                <button 
                  onClick={() => triggerQuickLogin("agent1@company.com", "agent123")}
                  className="bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-800 rounded-lg p-2.5 text-left transition"
                >
                  <div className="text-[10px] font-bold text-white leading-none">Sarah Connor</div>
                  <span className="text-[9px] text-indigo-400 font-mono">Support Agent</span>
                </button>

                <button 
                  onClick={() => triggerQuickLogin("customer1@client.com", "customer123")}
                  className="bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-800 rounded-lg p-2.5 text-left transition"
                >
                  <div className="text-[10px] font-bold text-white leading-none">John Doe</div>
                  <span className="text-[9px] text-indigo-400 font-mono">VIP Customer</span>
                </button>
              </div>
            </div>

            {/* Switch Auth modes */}
            <div className="text-center pt-2">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                {isRegistering ? "Already have an account? Sign in" : "Register a new registry user profile"}
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-800 overflow-hidden h-screen">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setSelectedComplaint(null);
          setSelectedCustomer(null);
          setSelectedArticle(null);
        }} 
        userRole={currentUser.role} 
      />

      {/* Main Content Space */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* 2. HEADER */}
        <Header 
          currentTab={currentTab} 
          currentUser={currentUser} 
          onSwitchRole={handleSwitchRoleSimulation} 
        />

        {/* 3. CORE VIEWS SWITCHBOARD */}
        <main className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            
            {loading ? (
              // Loading Skeleton
              <div className="space-y-6 animate-pulse">
                <div className="h-10 bg-slate-200 rounded-xl w-1/4" />
                <div className="grid grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="h-80 bg-slate-200 rounded-xl col-span-2" />
                  <div className="h-80 bg-slate-200 rounded-xl" />
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >

                  {/* ==================================================== */}
                  {/* TAB: DASHBOARD                                       */}
                  {/* ==================================================== */}
                  {currentTab === "dashboard" && analytics && (
                    <div className="space-y-8">
                      
                      {/* KPI Metric Summary Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Unified Customer base</span>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.metrics.totalCustomers}</h3>
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1 mt-1">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>{analytics.metrics.activeCustomers} active clients</span>
                            </span>
                          </div>
                          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Users className="w-6 h-6" />
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Open & Active Tickets</span>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.metrics.pendingComplaints}</h3>
                            <span className="text-[11px] text-slate-500 font-medium flex items-center space-x-1 mt-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              <span>Requires support focus</span>
                            </span>
                          </div>
                          <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
                            <Ticket className="w-6 h-6" />
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Mean SLA Resolution</span>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.metrics.avgResolutionTime}h</h3>
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1 mt-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Fast response times</span>
                            </span>
                          </div>
                          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <Clock className="w-6 h-6" />
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Satisfaction</span>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.metrics.avgSatisfactionScore}/5</h3>
                            <span className="text-[11px] text-indigo-600 font-semibold flex items-center space-x-1 mt-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Positive sentiment score</span>
                            </span>
                          </div>
                          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                            <ThumbsUp className="w-6 h-6" />
                          </div>
                        </div>

                      </div>

                      {/* Interactive Visualizer Charts (Recharts) */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Area Chart: Monthly Trends */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Historical Complaint Trends</h3>
                            <span className="text-xs text-slate-400 font-medium">Monthly Filed vs Resolved</span>
                          </div>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={analytics.charts.monthlyTrends}>
                                <defs>
                                  <linearGradient id="colorFiled" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Area type="monotone" dataKey="Filed" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorFiled)" />
                                <Area type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Pie Chart: Top Categories */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Incident Categories</h3>
                          <div className="h-72 flex flex-col justify-between">
                            <div className="flex-1 relative">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={analytics.charts.topComplaintCategories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={4}
                                    dataKey="value"
                                  >
                                    {[...Array(5)].map((_, index) => (
                                      <Cell key={index} fill={["#4f46e5", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e"][index % 5]} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                              {/* Centered Stat */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xl font-bold text-slate-800">{complaints.length}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Filed</span>
                              </div>
                            </div>
                            {/* Legend labels */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 border-t border-slate-100 pt-3">
                              {analytics.charts.topComplaintCategories.map((item, i) => (
                                <div key={item.name} className="flex items-center space-x-1.5 truncate">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ["#4f46e5", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e"][i % 5] }} />
                                  <span className="truncate">{item.name} ({item.value})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Department Efficiencies & Agent performance list */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Bar Chart: Department Metrics */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2 space-y-4">
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Department Resolution Comparison</h3>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analytics.charts.departmentPerformance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: "12px" }} />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar dataKey="total" name="Total Tickets" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="resolved" name="Resolved Tickets" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Recent Activity Timeline Stream */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                            <Activity className="w-4 h-4 text-indigo-500" />
                            <span>Recent Operational Trails</span>
                          </h3>
                          <div className="space-y-4 overflow-y-auto max-h-72 pr-2">
                            {analytics.recentActivities.map((act) => (
                              <div key={act.id} className="text-left border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                  <span className="text-[11px] font-bold text-slate-800 truncate max-w-[150px]">{act.action}</span>
                                  <span className="text-[9px] font-mono text-slate-400">{new Date(act.time).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{act.details}</p>
                                <span className="text-[9px] font-mono text-indigo-500 block mt-1">{act.user}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* ==================================================== */}
                  {/* TAB: TICKET CENTER (COMPLAINTS)                      */}
                  {/* ==================================================== */}
                  {currentTab === "tickets" && (
                    <div className="space-y-6">
                      
                      {/* Ticket controls and creation links */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Support Ticket Registry</h2>
                          <p className="text-xs text-slate-500">Monitor response lifecycles, assign owners, and track SLA timelines.</p>
                        </div>
                        
                        <div className="flex items-center space-x-3 shrink-0">
                          <button 
                            onClick={handleExportTickets}
                            className="bg-white text-slate-700 border border-slate-200 hover:border-slate-300 text-xs font-semibold px-4.5 py-2.5 rounded-xl transition flex items-center space-x-2"
                            title="Export results to CSV spreadsheet"
                          >
                            <Download className="w-4 h-4" />
                            <span className="hidden md:inline">Export Excel</span>
                          </button>

                          <button 
                            onClick={() => setShowTicketModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-lg shadow-indigo-600/10"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Lodge Support Ticket</span>
                          </button>
                        </div>
                      </div>

                      {/* Advanced Search & Multi-level Filter Rail */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
                        
                        <div className="relative md:col-span-2">
                          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Search by Customer name, Case Title, Ticket ID..."
                            value={ticketSearch}
                            onChange={(e) => setTicketSearch(e.target.value)}
                            className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div>
                          <select
                            value={ticketStatusFilter}
                            onChange={(e) => setTicketStatusFilter(e.target.value)}
                            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium text-slate-500"
                          >
                            <option value="">All Statuses</option>
                            <option value="New">New</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Waiting for Customer">Waiting for Customer</option>
                            <option value="Escalated">Escalated</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>

                        <div>
                          <select
                            value={ticketPriorityFilter}
                            onChange={(e) => setTicketPriorityFilter(e.target.value)}
                            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium text-slate-500"
                          >
                            <option value="">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>

                        <div>
                          <select
                            value={ticketCategoryFilter}
                            onChange={(e) => setTicketCategoryFilter(e.target.value)}
                            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium text-slate-500"
                          >
                            <option value="">All Categories</option>
                            <option value="Technical Support">Technical Support</option>
                            <option value="Billing & Payments">Billing & Payments</option>
                            <option value="Delivery & Logistics">Delivery & Logistics</option>
                            <option value="Product Feedback">Product Feedback</option>
                            <option value="Account Security">Account Security</option>
                          </select>
                        </div>

                      </div>

                      {/* Main Tickets Ledger Grid */}
                      {filteredComplaints.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
                          <HelpCircle className="w-10 h-10 text-slate-300 animate-pulse" />
                          <h4 className="font-bold text-slate-800 text-sm">No ticket records found</h4>
                          <p className="text-xs text-slate-400 max-w-sm">No complaints or care records match your current advanced filter choices.</p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs text-slate-600">
                              <thead className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                                <tr>
                                  <th className="p-4 pl-6">ID</th>
                                  <th className="p-4">Case Summary</th>
                                  <th className="p-4">Category</th>
                                  <th className="p-4">Priority</th>
                                  <th className="p-4">Linked Client ID</th>
                                  <th className="p-4">Status</th>
                                  <th className="p-4">Created Date</th>
                                  {currentUser.role === UserRole.CUSTOMER && <th className="p-4 pr-6 text-right">Actions</th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium">
                                {filteredComplaints.map((c) => {
                                  const customerObj = customers.find(cust => cust.id === c.customerId);
                                  return (
                                    <tr 
                                      key={c.id}
                                      onClick={() => {
                                        setSelectedComplaint(c);
                                        setSelectedCustomer(null);
                                      }}
                                      className={`hover:bg-slate-50/50 cursor-pointer transition-colors duration-150 ${selectedComplaint?.id === c.id ? "bg-indigo-50/30" : ""}`}
                                    >
                                      <td className="p-4 pl-6 font-mono font-bold text-slate-900">{c.id}</td>
                                      <td className="p-4">
                                        <div className="font-bold text-slate-800 line-clamp-1 hover:text-indigo-600">{c.title}</div>
                                        <span className="text-[10px] text-slate-400 truncate max-w-[200px] block mt-0.5">{c.description}</span>
                                      </td>
                                      <td className="p-4 text-slate-500">{c.category}</td>
                                      <td className="p-4">
                                        <span className={`inline-block text-[10px] px-2.5 py-1 rounded-lg ${getPriorityBadgeClass(c.priority)}`}>
                                          {c.priority}
                                        </span>
                                      </td>
                                      <td className="p-4 font-mono text-slate-500">
                                        {customerObj ? customerObj.fullName : c.customerId}
                                      </td>
                                      <td className="p-4">
                                        <span className={`inline-block text-[10px] px-2.5 py-1 rounded-lg ${getStatusBadgeClass(c.status)}`}>
                                          {c.status}
                                        </span>
                                      </td>
                                      <td className="p-4 font-mono text-slate-400">{new Date(c.createdDate).toLocaleDateString()}</td>
                                      {currentUser.role === UserRole.CUSTOMER && (
                                        <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                                          {c.status !== "Closed" && c.status !== "Resolved" ? (
                                            <button
                                              onClick={() => {
                                                setFeedbackTicketId(c.id);
                                                setShowFeedbackModal(true);
                                              }}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                                            >
                                              Add Feedback
                                            </button>
                                          ) : (
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Ticket Finalized</span>
                                          )}
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* ==================================================== */}
                  {/* TAB: CUSTOMER HUB                                    */}
                  {/* ==================================================== */}
                  {currentTab === "customers" && (
                    <div className="space-y-6">
                      
                      {/* Customer hub titles */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Customer Engagement Hub</h2>
                          <p className="text-xs text-slate-500">Add client directory cards, inspect service logs, and explore ticket history profiles.</p>
                        </div>
                        
                        <button 
                          onClick={() => setShowCustomerModal(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-lg shadow-indigo-600/10 shrink-0 self-start md:self-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add New Client</span>
                        </button>
                      </div>

                      {/* Filter cards */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative md:col-span-2">
                          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Search customer by name, email, country, phone..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div>
                          <select
                            value={customerTypeFilter}
                            onChange={(e) => setCustomerTypeFilter(e.target.value)}
                            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium text-slate-500"
                          >
                            <option value="">All Service Tiers</option>
                            <option value="Standard">Standard Tier</option>
                            <option value="Enterprise">Enterprise Workspace</option>
                            <option value="VIP">VIP Elite Services</option>
                          </select>
                        </div>
                      </div>

                      {/* Customers Ledger */}
                      {filteredCustomers.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
                          <Users className="w-10 h-10 text-slate-300" />
                          <h4 className="font-bold text-slate-800 text-sm">No clients listed</h4>
                          <p className="text-xs text-slate-400 max-w-sm">No customer directories found matching the search criteria.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredCustomers.map(cust => (
                            <div
                              key={cust.id}
                              onClick={() => {
                                setSelectedCustomer(cust);
                                setSelectedComplaint(null);
                              }}
                              className={`bg-white rounded-2xl border p-5 hover:border-indigo-500 hover:shadow-md transition cursor-pointer text-left flex flex-col justify-between ${selectedCustomer?.id === cust.id ? "border-indigo-600 bg-indigo-50/10 ring-1 ring-indigo-500/20" : "border-slate-200/80"}`}
                            >
                              <div>
                                <div className="flex items-center space-x-3.5">
                                  <img 
                                    src={cust.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                                    alt={cust.fullName}
                                    className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 leading-tight">
                                      {cust.fullName}
                                    </h3>
                                    <span className={`inline-block text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border mt-1 ${
                                      cust.customerType === "VIP" ? "bg-amber-50 border-amber-200 text-amber-700" :
                                      cust.customerType === "Enterprise" ? "bg-violet-50 border-violet-200 text-violet-700" :
                                      "bg-slate-50 border-slate-200 text-slate-600"
                                    }`}>
                                      {cust.customerType}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2 mt-5 text-[11px] text-slate-500 font-medium">
                                  <div className="flex items-center space-x-2">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="truncate">{cust.email}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{cust.phone}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-100 mt-5 pt-3 text-[10px] font-mono text-slate-400">
                                <span>ID: <span className="font-bold text-slate-700">{cust.id}</span></span>
                                <span className="flex items-center space-x-1 font-bold text-indigo-500">
                                  <span>View History</span>
                                  <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  )}

                  {/* ==================================================== */}
                  {/* TAB: KNOWLEDGE BASE                                  */}
                  {/* ==================================================== */}
                  {currentTab === "kb" && (
                    <div className="space-y-6">
                      
                      {/* Search header container */}
                      <div className="bg-slate-900 text-slate-100 p-8 rounded-2xl border border-slate-800 text-center space-y-4 relative overflow-hidden shadow-xl">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-900 to-slate-900 pointer-events-none" />
                        
                        <div className="relative z-10 max-w-xl mx-auto space-y-3">
                          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block">Unified Resource Center</span>
                          <h2 className="text-xl font-bold tracking-tight">How can we assist you today?</h2>
                          <p className="text-xs text-slate-400 leading-normal">Search across enterprise standard operating procedures, resolved FAQs, and help documentation.</p>
                          
                          <div className="relative pt-3">
                            <Search className="absolute left-3.5 top-6.5 w-4.5 h-4.5 text-slate-400" />
                            <input 
                              type="text"
                              placeholder="Search help topics, keywords, FAQs..."
                              value={kbSearch}
                              onChange={(e) => setKbSearch(e.target.value)}
                              className="w-full text-xs pl-11 pr-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-100 placeholder-slate-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Header directory bar */}
                      <div className="flex justify-between items-center pt-2">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                          {selectedArticle ? "Viewing Solution Guide" : "Knowledge Base Directories"}
                        </h3>
                        {currentUser.role !== UserRole.CUSTOMER && !selectedArticle && (
                          <button
                            onClick={() => setShowKbModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/10"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Publish Article</span>
                          </button>
                        )}
                        {selectedArticle && (
                          <button
                            onClick={() => setSelectedArticle(null)}
                            className="text-xs text-indigo-600 font-bold hover:text-indigo-800"
                          >
                            ← Back to Knowledge Directory
                          </button>
                        )}
                      </div>

                      {selectedArticle ? (
                        // Article Reader View
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 text-left">
                          <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                            <div>
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                                {selectedArticle.category}
                              </span>
                              <h2 className="text-base font-bold text-slate-900 mt-3">{selectedArticle.title}</h2>
                              <div className="flex items-center space-x-4 text-[10px] text-slate-400 font-mono mt-2">
                                <span>Article ID: {selectedArticle.id}</span>
                                <span>•</span>
                                <span>Last updated: {new Date(selectedArticle.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-medium">
                              <Eye className="w-4 h-4 text-slate-400" />
                              <span>{selectedArticle.views} views</span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium max-w-3xl">
                            {selectedArticle.content}
                          </div>

                          <div className="border-t border-slate-100 pt-5 flex items-center justify-between text-xs text-slate-400 font-medium">
                            <span>Was this care guide helpful?</span>
                            <div className="flex space-x-3">
                              <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-1.5 rounded-lg border border-slate-200 transition">
                                Yes
                              </button>
                              <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-1.5 rounded-lg border border-slate-200 transition">
                                No
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Document Category Grid
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredKbArticles.map((art) => (
                            <div
                              key={art.id}
                              onClick={() => handleSelectArticle(art)}
                              className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-indigo-400 hover:shadow-md transition cursor-pointer text-left flex flex-col justify-between"
                            >
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-bold font-mono text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                                    {art.category}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400">{art.type}</span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600">
                                  {art.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                  {art.content}
                                </p>
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-4 mt-4 border-t border-slate-100 font-mono">
                                <span>{art.views} views</span>
                                <span className="font-bold text-indigo-500 flex items-center space-x-1">
                                  <span>Open Guide</span>
                                  <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  )}

                  {/* ==================================================== */}
                  {/* TAB: AUDIT LOGS                                      */}
                  {/* ==================================================== */}
                  {currentTab === "audit" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Security Audit Ledger</h2>
                        <p className="text-xs text-slate-500">Monitors state modifications, SLA breaches, API requests, and administrative logs.</p>
                      </div>

                      <div className="bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 p-6 shadow-xl font-mono overflow-hidden">
                        <div className="flex justify-between border-b border-slate-800 pb-3 mb-4 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                          <span>Security Trail Ledger v1.0</span>
                          <span>ONLINE INTEGRITY SEAL</span>
                        </div>
                        
                        <div className="space-y-3 overflow-y-auto max-h-[480px] text-left">
                          {auditLogs.map((log) => (
                            <div key={log.id} className="text-[11px] leading-relaxed border-b border-slate-800/40 pb-2 last:border-0">
                              <span className="text-slate-500">[{new Date(log.timestamp).toISOString()}]</span>{" "}
                              <span className="text-rose-400 font-bold">{log.id}</span>{" "}
                              <span className="text-emerald-400 font-bold">({log.action})</span>{" "}
                              <span className="text-indigo-300 font-semibold">{log.userEmail}</span>{" "}
                              <span className="text-slate-300 block pl-4 mt-0.5">&gt;&gt; {log.details}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==================================================== */}
                  {/* TAB: SYSTEM SETTINGS                                 */}
                  {/* ==================================================== */}
                  {currentTab === "settings" && (
                    <form onSubmit={handleSaveSettings} className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-left space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Configuration Settings</h2>
                        <p className="text-xs text-slate-500">Configure response SLA agreement timelines and automated escalation processes.</p>
                      </div>

                      <div className="space-y-4 pt-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">SLA Turnaround Agreement (Hours)</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] text-slate-500 font-semibold block">Critical SLA Threshold</label>
                            <input 
                              type="number" 
                              value={slaCritical}
                              onChange={(e) => setSlaCritical(Number(e.target.value))}
                              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] text-slate-500 font-semibold block">High SLA Threshold</label>
                            <input 
                              type="number" 
                              value={slaHigh}
                              onChange={(e) => setSlaHigh(Number(e.target.value))}
                              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] text-slate-500 font-semibold block">Medium SLA Threshold</label>
                            <input 
                              type="number" 
                              value={slaMedium}
                              onChange={(e) => setSlaMedium(Number(e.target.value))}
                              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] text-slate-500 font-semibold block">Low SLA Threshold</label>
                            <input 
                              type="number" 
                              value={slaLow}
                              onChange={(e) => setSlaLow(Number(e.target.value))}
                              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-5 space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Automation Actions</h3>
                        
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">Auto SLA Escalations</h4>
                            <p className="text-[11px] text-slate-400 mt-1">If active, tickets that breach their SLA timers automatically trigger escalation priority and alerts.</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={autoEscalate}
                            onChange={(e) => setAutoEscalate(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-indigo-600/10"
                      >
                        Save Configuration Changes
                      </button>
                    </form>
                  )}

                </motion.div>
              </AnimatePresence>
            )}

          </div>

          {/* ==================================================== */}
          {/* DETAIL DRAWERS ON THE RIGHT SIDE                     */}
          {/* ==================================================== */}
          {selectedComplaint && (
            <TicketDetail 
              complaint={selectedComplaint} 
              onClose={() => setSelectedComplaint(null)} 
              onUpdateTicket={handleUpdateTicket}
              agents={systemAgents}
              currentUser={currentUser}
              onLogInteraction={handleLogInteraction}
            />
          )}

          {selectedCustomer && (
            <CustomerDetail 
              customer={selectedCustomer} 
              onClose={() => setSelectedCustomer(null)} 
              complaints={complaints}
              interactions={interactions}
              onSelectComplaint={(t) => {
                setSelectedComplaint(t);
                setSelectedCustomer(null);
                setCurrentTab("tickets");
              }}
            />
          )}

        </main>
      </div>

      {/* ==================================================== */}
      {/* POPUP MODAL: FILE TICKET                             */}
      {/* ==================================================== */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-2xl text-left space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Ticket className="w-4 h-4 text-indigo-500" />
                <span>Lodge Support Ticket</span>
              </h3>
              <button onClick={() => setShowTicketModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
              
              {currentUser.role !== UserRole.CUSTOMER && (
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Link Client Record</label>
                  <select
                    value={newTicketCustomer}
                    onChange={(e) => setNewTicketCustomer(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  >
                    <option value="">Choose registered Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.customerType})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Subject Summary</label>
                <input 
                  type="text" 
                  placeholder="Summarize the care case..."
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Issue Details</label>
                <textarea 
                  placeholder="Please describe transaction errors, connection pool issues, or logistics damages..."
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  rows={4}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <span>⚡ AI-Assisted Smart Routing</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={newTicketAiRouting}
                  onChange={(e) => setNewTicketAiRouting(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              {!newTicketAiRouting && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Category</label>
                    <select
                      value={newTicketCategory}
                      onChange={(e) => setNewTicketCategory(e.target.value)}
                      className="w-full text-[10px] p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                    >
                      <option value="Technical Support">Technical Support</option>
                      <option value="Billing & Payments">Billing & Payments</option>
                      <option value="Delivery & Logistics">Delivery & Logistics</option>
                      <option value="Product Feedback">Product Feedback</option>
                      <option value="Account Security">Account Security</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Priority</label>
                    <select
                      value={newTicketPriority}
                      onChange={(e) => setNewTicketPriority(e.target.value as any)}
                      className="w-full text-[10px] p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Dept</label>
                    <select
                      value={newTicketDept}
                      onChange={(e) => setNewTicketDept(e.target.value)}
                      className="w-full text-[10px] p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                    >
                      <option value="IT & Systems">IT & Systems</option>
                      <option value="Finance">Finance</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Product Quality">Product Quality</option>
                      <option value="Customer Relations">Customer Relations</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={creatingTicket}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition"
              >
                {creatingTicket ? "Executing Gemini Diagnostics Routing..." : "File Care Ticket"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* POPUP MODAL: ADD CUSTOMER                            */}
      {/* ==================================================== */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-2xl text-left space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Add Customer Record</span>
              </h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Service Tier</label>
                  <select
                    value={newCustType}
                    onChange={(e) => setNewCustType(e.target.value as any)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium text-slate-600"
                  >
                    <option value="Standard">Standard Tier</option>
                    <option value="Enterprise">Enterprise Workspace</option>
                    <option value="VIP">VIP Elite Services</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Address Line</label>
                <input 
                  type="text" 
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">City</label>
                  <input 
                    type="text" 
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">State</label>
                  <input 
                    type="text" 
                    value={newCustState}
                    onChange={(e) => setNewCustState(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Country</label>
                  <input 
                    type="text" 
                    value={newCustCountry}
                    onChange={(e) => setNewCustCountry(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition"
              >
                Create Customer profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* POPUP MODAL: ADD KB ARTICLE                          */}
      {/* ==================================================== */}
      {showKbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-2xl text-left space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Publish Knowledge Article</span>
              </h3>
              <button onClick={() => setShowKbModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishKbSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Article Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Setting up ACH automatic billing..."
                  value={newKbTitle}
                  onChange={(e) => setNewKbTitle(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">KB Category</label>
                  <select
                    value={newKbCategory}
                    onChange={(e) => setNewKbCategory(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-600 focus:outline-none"
                  >
                    <option value="Technical Support">Technical Support</option>
                    <option value="Billing & Payments">Billing & Payments</option>
                    <option value="Delivery & Logistics">Delivery & Logistics</option>
                    <option value="Product Feedback">Product Feedback</option>
                    <option value="Account Security">Account Security</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Doc Type</label>
                  <select
                    value={newKbType}
                    onChange={(e) => setNewKbType(e.target.value as any)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-600 focus:outline-none"
                  >
                    <option value="FAQ">FAQ Guide</option>
                    <option value="Solution">Solution Blueprint</option>
                    <option value="Article">Public Article</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Content / Resolution Details</label>
                <textarea 
                  placeholder="Draft resolution steps clearly here..."
                  value={newKbContent}
                  onChange={(e) => setNewKbContent(e.target.value)}
                  rows={6}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium font-sans"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition"
              >
                Publish Solution Guide
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* POPUP MODAL: CUSTOMER SATISFACTION FEEDBACK          */}
      {/* ==================================================== */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-2xl text-left space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Rate Resolution Quality</span>
              </h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Assign Score rating (1-5)</label>
                <div className="flex items-center space-x-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className={`w-10 h-10 rounded-lg text-lg font-bold transition ${
                        feedbackRating >= star 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15" 
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Resolution Satisfaction</label>
                <select
                  value={feedbackSatisfaction}
                  onChange={(e) => setFeedbackSatisfaction(e.target.value as any)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Highly Satisfied">Highly Satisfied</option>
                  <option value="Satisfied">Satisfied</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Unsatisfied">Unsatisfied</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Review Comments</label>
                <textarea 
                  placeholder="Let us know how your assigned support agent resolved your issue..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-700 font-semibold rounded-xl flex items-start space-x-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>By submitting feedback, your ticket will automatically close. Your comment sentiment is securely analyzed by Gemini AI to grade agent effectiveness.</span>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition"
              >
                Submit Review feedback
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
