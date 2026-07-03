import fs from 'fs';
import path from 'path';

// --- DATABASE COLLECTIONS TYPES ---

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  SUPPORT_MANAGER = "SUPPORT_MANAGER",
  SUPPORT_AGENT = "SUPPORT_AGENT",
  CUSTOMER = "CUSTOMER"
}

export interface User {
  id: string;
  email: string;
  passwordHash: string; // Plaintext for simulation or simple hash
  fullName: string;
  role: UserRole;
  department?: string;
  status: "Active" | "Inactive";
  avatarUrl?: string;
  createdAt: string;
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
  id: string; // e.g., TKT-2026-0001
  customerId: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  department: string;
  assignedAgentId?: string;
  title: string;
  description: string;
  attachments: Array<{ name: string; type: string; size: string; content: string }>; // Base64 attachments
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
  rating: number; // 1-5
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

export interface DatabaseSchema {
  users: User[];
  customers: Customer[];
  complaints: Complaint[];
  interactions: Interaction[];
  feedbacks: Feedback[];
  knowledgeBase: KnowledgeArticle[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// --- INITIAL ENTERPRISE SEED DATA ---

const defaultSettings: SystemSettings = {
  slaHours: {
    Low: 72,
    Medium: 48,
    High: 24,
    Critical: 4
  },
  autoEscalate: true
};

const initialUsers: User[] = [
  {
    id: "USR-001",
    email: "admin@company.com",
    passwordHash: "admin123", // Simple hash for demo simulation
    fullName: "Eleanor Vance",
    role: UserRole.SUPER_ADMIN,
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "USR-002",
    email: "manager@company.com",
    passwordHash: "manager123",
    fullName: "Marcus Aurelius",
    role: UserRole.SUPPORT_MANAGER,
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    createdAt: "2026-01-12T09:30:00Z"
  },
  {
    id: "USR-003",
    email: "agent1@company.com",
    passwordHash: "agent123",
    fullName: "Sarah Connor",
    role: UserRole.SUPPORT_AGENT,
    department: "IT & Systems",
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    createdAt: "2026-01-15T10:00:00Z"
  },
  {
    id: "USR-004",
    email: "agent2@company.com",
    passwordHash: "agent2123",
    fullName: "James Carter",
    role: UserRole.SUPPORT_AGENT,
    department: "Finance",
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    createdAt: "2026-01-20T11:15:00Z"
  },
  {
    id: "USR-005",
    email: "customer1@client.com",
    passwordHash: "customer123",
    fullName: "John Doe",
    role: UserRole.CUSTOMER,
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    createdAt: "2026-02-01T14:20:00Z"
  }
];

const initialCustomers: Customer[] = [
  {
    id: "CST-001",
    fullName: "John Doe",
    phone: "+1-555-0199",
    email: "customer1@client.com",
    address: "742 Evergreen Terrace",
    city: "Springfield",
    state: "Oregon",
    country: "USA",
    dateOfRegistration: "2026-02-01T14:20:00Z",
    status: "Active",
    customerType: "VIP",
    profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
  },
  {
    id: "CST-002",
    fullName: "Acme Corporation (Alice Smith)",
    phone: "+1-800-ACME",
    email: "alice.smith@acme.com",
    address: "100 Industrial Parkway",
    city: "Detroit",
    state: "Michigan",
    country: "USA",
    dateOfRegistration: "2026-02-10T09:00:00Z",
    status: "Active",
    customerType: "Enterprise",
    profilePicture: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
  },
  {
    id: "CST-003",
    fullName: "Michael Chang",
    phone: "+852-2123-4567",
    email: "michael.chang@netvigator.com",
    address: "Flat B, 12/F, Nathan Road 300",
    city: "Kowloon",
    state: "Hong Kong",
    country: "China",
    dateOfRegistration: "2026-03-01T10:30:00Z",
    status: "Active",
    customerType: "Standard",
    profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
  },
  {
    id: "CST-004",
    fullName: "Sophia Martinez",
    phone: "+52-55-1234-5678",
    email: "sophia.martinez@prodigy.net.mx",
    address: "Paseo de la Reforma 222",
    city: "Mexico City",
    state: "CDMX",
    country: "Mexico",
    dateOfRegistration: "2026-03-15T15:45:00Z",
    status: "Active",
    customerType: "Standard",
    profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
  },
  {
    id: "CST-005",
    fullName: "David Sterling",
    phone: "+44-20-7946-0192",
    email: "dsterling@sterlingwealth.co.uk",
    address: "30 St Mary Axe (The Gherkin)",
    city: "London",
    state: "England",
    country: "UK",
    dateOfRegistration: "2026-04-05T08:15:00Z",
    status: "Active",
    customerType: "VIP",
    profilePicture: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150"
  }
];

const initialComplaints: Complaint[] = [
  {
    id: "TKT-2026-0001",
    customerId: "CST-001",
    category: "Technical Support",
    priority: "Critical",
    department: "IT & Systems",
    assignedAgentId: "USR-003",
    title: "Database server connection timeouts on production cluster",
    description: "Since 8:00 AM UTC, our application servers are intermittently experiencing 504 Gateway Timeouts when querying the customer profiles cluster. This is affecting roughly 15% of all live transactions. Needs immediate resolution as we are breaching our enterprise SLA.",
    attachments: [],
    status: "In Progress",
    createdDate: "2026-07-02T10:00:00Z",
    dueDate: "2026-07-02T14:00:00Z", // 4 hours SLA for critical
    timeline: [
      {
        id: "TM-001",
        timestamp: "2026-07-02T10:00:00Z",
        action: "Ticket Created",
        performedBy: "John Doe",
        notes: "Submitted online via Customer Portal."
      },
      {
        id: "TM-002",
        timestamp: "2026-07-02T10:15:00Z",
        action: "Agent Assigned",
        performedBy: "Marcus Aurelius (Manager)",
        notes: "Assigned to Sarah Connor due to high priority databases."
      },
      {
        id: "TM-003",
        timestamp: "2026-07-02T10:30:00Z",
        action: "Status Updated",
        performedBy: "Sarah Connor (Agent)",
        notes: "Currently investigating connections. Suspect load balancer saturation."
      }
    ]
  },
  {
    id: "TKT-2026-0002",
    customerId: "CST-002",
    category: "Billing & Payments",
    priority: "High",
    department: "Finance",
    assignedAgentId: "USR-004",
    title: "Double charge of monthly enterprise subscription invoice #ACME-9988",
    description: "We were charged $4,500 twice on July 1st for our monthly software subscription. Both charges have cleared our corporate credit card. Please issue an immediate refund for the overcharge.",
    attachments: [],
    status: "Assigned",
    createdDate: "2026-07-01T15:30:00Z",
    dueDate: "2026-07-02T15:30:00Z", // 24 hours SLA
    timeline: [
      {
        id: "TM-004",
        timestamp: "2026-07-01T15:30:00Z",
        action: "Ticket Created",
        performedBy: "Alice Smith",
        notes: "Created from email webhook ingestion."
      },
      {
        id: "TM-005",
        timestamp: "2026-07-01T16:00:00Z",
        action: "Agent Assigned",
        performedBy: "Marcus Aurelius (Manager)",
        notes: "Assigned to James Carter in Billing."
      }
    ]
  },
  {
    id: "TKT-2026-0003",
    customerId: "CST-003",
    category: "Technical Support",
    priority: "Medium",
    department: "IT & Systems",
    assignedAgentId: "USR-003",
    title: "Cannot reset password using the security question route",
    description: "I tried resetting my login password using the security questions option, but the system keeps throwing a 'Resource not found' exception when I click submit. The default email reset link works fine, but security questions are broken.",
    attachments: [],
    status: "Resolved",
    createdDate: "2026-06-30T09:00:00Z",
    dueDate: "2026-07-02T09:00:00Z", // 48 hours SLA
    resolvedDate: "2026-07-01T11:00:00Z",
    timeline: [
      {
        id: "TM-006",
        timestamp: "2026-06-30T09:00:00Z",
        action: "Ticket Created",
        performedBy: "Michael Chang",
        notes: "Registered via website portal form."
      },
      {
        id: "TM-007",
        timestamp: "2026-06-30T10:15:00Z",
        action: "Agent Assigned",
        performedBy: "Eleanor Vance (Admin)",
        notes: "Assigned to Sarah Connor for standard system bug resolution."
      },
      {
        id: "TM-008",
        timestamp: "2026-07-01T11:00:00Z",
        action: "Ticket Resolved",
        performedBy: "Sarah Connor (Agent)",
        notes: "Fixed backend routing issue in security questions middleware. Verified working."
      }
    ]
  },
  {
    id: "TKT-2026-0004",
    customerId: "CST-004",
    category: "Delivery & Logistics",
    priority: "Low",
    department: "Logistics",
    assignedAgentId: "USR-004",
    title: "Slight damage to the packaging of server rack shipment",
    description: "Our server rack shipment (Order #MX-4451) arrived yesterday. While the equipment inside is perfectly intact and functioning, the outer heavy duty crates were extensively crushed and split. Just raising this so you can check with your courier provider.",
    attachments: [],
    status: "Resolved",
    createdDate: "2026-06-28T14:00:00Z",
    dueDate: "2026-07-01T14:00:00Z", // 72 hours SLA
    resolvedDate: "2026-06-29T16:30:00Z",
    timeline: [
      {
        id: "TM-009",
        timestamp: "2026-06-28T14:00:00Z",
        action: "Ticket Created",
        performedBy: "Sophia Martinez",
        notes: "Submitted via mobile app."
      },
      {
        id: "TM-010",
        timestamp: "2026-06-29T09:00:00Z",
        action: "Agent Assigned",
        performedBy: "Marcus Aurelius (Manager)",
        notes: "Assigned to James Carter."
      },
      {
        id: "TM-011",
        timestamp: "2026-06-29T16:30:00Z",
        action: "Ticket Resolved",
        performedBy: "James Carter (Agent)",
        notes: "Logged report with FedEx Freight team. Sent apology note to Sophia."
      }
    ]
  },
  {
    id: "TKT-2026-0005",
    customerId: "CST-005",
    category: "Product Feedback",
    priority: "High",
    department: "Product Quality",
    assignedAgentId: "USR-003",
    title: "Memory leak in v3.4 Windows Desktop application",
    description: "After running the Windows client for more than 4 hours, memory usage ballooned to 6.2GB and finally crashed our terminal sessions. This is replicable across all 12 of our trading desk machines. We had to roll back to v3.2.",
    attachments: [],
    status: "New",
    createdDate: "2026-07-03T08:00:00Z",
    dueDate: "2026-07-04T08:00:00Z", // 24 hours SLA
    timeline: [
      {
        id: "TM-012",
        timestamp: "2026-07-03T08:00:00Z",
        action: "Ticket Created",
        performedBy: "David Sterling",
        notes: "Submitted via Premier Client helpline."
      }
    ]
  }
];

const initialInteractions: Interaction[] = [
  {
    id: "INT-001",
    date: "2026-07-02",
    time: "10:30 AM",
    agentId: "USR-003",
    customerId: "CST-001",
    type: "Phone Call",
    summary: "Incoming call from John Doe regarding connection timeouts",
    notes: "Customer was highly distressed due to live transactions dropping. Assured him that we have escalated this to critical tier and Sarah Connor is currently monitoring connection pools and load balancer distributions."
  },
  {
    id: "INT-002",
    date: "2026-07-01",
    time: "16:15 PM",
    agentId: "USR-004",
    customerId: "CST-002",
    type: "Email",
    summary: "Outbound email response regarding double subscription invoice charge",
    notes: "Informed Alice Smith that we have received the request and are pulling the transaction report from our payment gateway (Stripe) to process the immediate reversal."
  },
  {
    id: "INT-003",
    date: "2026-07-01",
    time: "10:45 AM",
    agentId: "USR-003",
    customerId: "CST-003",
    type: "Chat",
    summary: "Live chat with Michael Chang resolving security question route bug",
    notes: "Walked the user through the process of clearing his session cookie and verified together that the fixed routing URL now saves security questions without throwing server 500 crashes."
  }
];

const initialFeedbacks: Feedback[] = [
  {
    id: "FDB-001",
    complaintId: "TKT-2026-0003",
    rating: 5,
    comment: "Absolutely outstanding support! Sarah Connor solved the bug in less than a day, and the communication was incredibly polite and professional.",
    suggestions: "Keep up the amazing work, the response speed is brilliant.",
    resolutionSatisfaction: "Highly Satisfied",
    sentiment: "Positive",
    createdAt: "2026-07-01T12:00:00Z"
  },
  {
    id: "FDB-002",
    complaintId: "TKT-2026-0004",
    rating: 4,
    comment: "The response was fast, but it is a bit frustrating that the shipping provider treats fragile servers so poorly. Thanks for logging the report with them.",
    suggestions: "Maybe add fragile labels to shipments in bold letters.",
    resolutionSatisfaction: "Satisfied",
    sentiment: "Positive",
    createdAt: "2026-06-30T09:00:00Z"
  }
];

const initialKnowledgeBase: KnowledgeArticle[] = [
  {
    id: "KB-001",
    title: "How to resolve database 504 connection gateway timeouts",
    category: "Technical Support",
    content: "If your database server is returning 504 timeouts, perform the following troubleshooting steps:\n\n1. **Check Connection Pools**: Ensure that the database connections are not being leaked. Verify maximum limits against active connections.\n2. **Inspect Load Balancer**: Review if the HTTP gateway timeout on your ingress controller is lower than the database transaction execution timeout.\n3. **Query Optimization**: Run `EXPLAIN ANALYZE` on heavy query tables to verify if correct indexes are set on major lookup columns like customer_id, category, and date ranges.",
    type: "Solution",
    views: 128,
    updatedAt: "2026-06-15T12:00:00Z"
  },
  {
    id: "KB-002",
    title: "Enterprise billing FAQ & subscription cycles",
    category: "Billing & Payments",
    content: "Enterprise subscriptions are billed on a recurring monthly basis on the 1st of every month. Payments are automatically processed via standard credit card, ACH, or SEPA transfers. Invoices are dispatched to the billing email registered in your profile. If you require a custom purchase order (PO) reference, contact billing@company.com prior to the 25th of the month.",
    type: "FAQ",
    views: 85,
    updatedAt: "2026-05-10T14:30:00Z"
  },
  {
    id: "KB-003",
    title: "Configuring security questions and authentication layers",
    category: "Account Security",
    content: "We provide secondary verification layers to guard corporate client workspaces. To activate security questions:\n\n1. Navigate to Settings > Account Security.\n2. Click 'Configure Verification Questions'.\n3. Select three separate questions and input unique answers.\n4. Complete the multi-factor validation code sent to your mobile phone to lock in these credentials.\n\n*Note*: Questions are case-insensitive but must match spelling exactly during verification.",
    type: "Article",
    views: 245,
    updatedAt: "2026-06-20T10:00:00Z"
  }
];

const initialAuditLogs: AuditLog[] = [
  {
    id: "AUD-001",
    userId: "USR-001",
    userEmail: "admin@company.com",
    action: "System Initialized",
    details: "Customer Care Registry database bootstrapped with default settings and seed data.",
    timestamp: "2026-07-03T09:00:00Z"
  }
];

// --- DATABASE ACCESS ENGINE ---

export class LocalDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: initialUsers,
      customers: initialCustomers,
      complaints: initialComplaints,
      interactions: initialInteractions,
      feedbacks: initialFeedbacks,
      knowledgeBase: initialKnowledgeBase,
      auditLogs: initialAuditLogs,
      settings: defaultSettings
    };
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        // Merge with seed data to ensure users are always available for testing
        this.data = {
          users: parsed.users || initialUsers,
          customers: parsed.customers || initialCustomers,
          complaints: parsed.complaints || initialComplaints,
          interactions: parsed.interactions || initialInteractions,
          feedbacks: parsed.feedbacks || initialFeedbacks,
          knowledgeBase: parsed.knowledgeBase || initialKnowledgeBase,
          auditLogs: parsed.auditLogs || initialAuditLogs,
          settings: parsed.settings || defaultSettings
        };
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Error loading local database:", e);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Error saving local database:", e);
    }
  }

  // --- GETTERS ---
  
  getUsers() { return this.data.users; }
  getCustomers() { return this.data.customers; }
  getComplaints() { return this.data.complaints; }
  getInteractions() { return this.data.interactions; }
  getFeedbacks() { return this.data.feedbacks; }
  getKnowledgeBase() { return this.data.knowledgeBase; }
  getAuditLogs() { return this.data.auditLogs; }
  getSettings() { return this.data.settings; }

  // --- ACTIONS ---

  // User auth helpers
  findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: Omit<User, "id" | "createdAt">) {
    const id = `USR-${String(this.data.users.length + 1).padStart(3, '0')}`;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  // Customer Management
  createCustomer(cust: Omit<Customer, "id" | "dateOfRegistration">) {
    const id = `CST-${String(this.data.customers.length + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      ...cust,
      id,
      dateOfRegistration: new Date().toISOString()
    };
    this.data.customers.push(newCust);
    this.save();
    return newCust;
  }

  updateCustomer(id: string, updates: Partial<Customer>) {
    const index = this.data.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.customers[index] = { ...this.data.customers[index], ...updates };
      this.save();
      return this.data.customers[index];
    }
    return null;
  }

  deleteCustomer(id: string) {
    const index = this.data.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      const deleted = this.data.customers[index];
      this.data.customers.splice(index, 1);
      this.save();
      return deleted;
    }
    return null;
  }

  // Complaint Management (Ticketing)
  createComplaint(complaint: Omit<Complaint, "id" | "createdDate" | "dueDate" | "timeline">) {
    const date = new Date();
    const year = date.getFullYear();
    const count = this.data.complaints.length + 1;
    const id = `TKT-${year}-${String(count).padStart(4, '0')}`;
    
    // SLA calculation based on priority
    const slaHours = this.data.settings.slaHours[complaint.priority] || 24;
    const dueDate = new Date(date.getTime() + slaHours * 60 * 60 * 1000).toISOString();

    const initialTimeline: TimelineEvent[] = [
      {
        id: "TM-C-" + Date.now(),
        timestamp: date.toISOString(),
        action: "Ticket Created",
        performedBy: complaint.customerId, // Typically the customer
        notes: "Ticket registered in system."
      }
    ];

    const newComplaint: Complaint = {
      ...complaint,
      id,
      createdDate: date.toISOString(),
      dueDate,
      timeline: initialTimeline
    };

    this.data.complaints.push(newComplaint);
    this.save();
    return newComplaint;
  }

  updateComplaint(id: string, updates: Partial<Complaint>, performedByEmail: string) {
    const index = this.data.complaints.findIndex(c => c.id === id);
    if (index !== -1) {
      const original = this.data.complaints[index];
      const dateStr = new Date().toISOString();
      const timelineEvents: TimelineEvent[] = [];

      // Track lifecycle and SLA actions
      if (updates.status && updates.status !== original.status) {
        timelineEvents.push({
          id: `TM-U-${Date.now()}-S`,
          timestamp: dateStr,
          action: `Status Updated`,
          performedBy: performedByEmail,
          notes: `Status changed from '${original.status}' to '${updates.status}'.`
        });

        if (updates.status === "Resolved" || updates.status === "Closed") {
          updates.resolvedDate = dateStr;
        }
      }

      if (updates.assignedAgentId && updates.assignedAgentId !== original.assignedAgentId) {
        const agent = this.data.users.find(u => u.id === updates.assignedAgentId);
        timelineEvents.push({
          id: `TM-U-${Date.now()}-A`,
          timestamp: dateStr,
          action: "Agent Assigned",
          performedBy: performedByEmail,
          notes: `Assigned to ${agent ? agent.fullName : updates.assignedAgentId}.`
        });
        // Auto update status to Assigned if currently New
        if (original.status === "New") {
          updates.status = "Assigned";
        }
      }

      if (updates.priority && updates.priority !== original.priority) {
        timelineEvents.push({
          id: `TM-U-${Date.now()}-P`,
          timestamp: dateStr,
          action: "Priority Escalation",
          performedBy: performedByEmail,
          notes: `Priority escalated from '${original.priority}' to '${updates.priority}'.`
        });
        
        // Recalculate SLA due date
        const slaHours = this.data.settings.slaHours[updates.priority] || 24;
        const createdDate = new Date(original.createdDate);
        updates.dueDate = new Date(createdDate.getTime() + slaHours * 60 * 60 * 1000).toISOString();
      }

      const mergedTimeline = [...original.timeline, ...timelineEvents];
      
      this.data.complaints[index] = {
        ...original,
        ...updates,
        timeline: mergedTimeline
      };
      
      this.save();
      return this.data.complaints[index];
    }
    return null;
  }

  deleteComplaint(id: string) {
    const index = this.data.complaints.findIndex(c => c.id === id);
    if (index !== -1) {
      const deleted = this.data.complaints[index];
      this.data.complaints.splice(index, 1);
      this.save();
      return deleted;
    }
    return null;
  }

  // Interactions Management
  createInteraction(interaction: Omit<Interaction, "id">) {
    const id = `INT-${String(this.data.interactions.length + 1).padStart(3, '0')}`;
    const newInt: Interaction = {
      ...interaction,
      id
    };
    this.data.interactions.push(newInt);
    this.save();
    return newInt;
  }

  // Feedback management
  createFeedback(feedback: Omit<Feedback, "id" | "createdAt">) {
    const id = `FDB-${String(this.data.feedbacks.length + 1).padStart(3, '0')}`;
    const newFdb: Feedback = {
      ...feedback,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.feedbacks.push(newFdb);
    this.save();
    return newFdb;
  }

  // Knowledge Base management
  createKnowledgeArticle(art: Omit<KnowledgeArticle, "id" | "views" | "updatedAt">) {
    const id = `KB-${String(this.data.knowledgeBase.length + 1).padStart(3, '0')}`;
    const newArt: KnowledgeArticle = {
      ...art,
      id,
      views: 0,
      updatedAt: new Date().toISOString()
    };
    this.data.knowledgeBase.push(newArt);
    this.save();
    return newArt;
  }

  incrementKnowledgeViews(id: string) {
    const index = this.data.knowledgeBase.findIndex(a => a.id === id);
    if (index !== -1) {
      this.data.knowledgeBase[index].views += 1;
      this.save();
      return this.data.knowledgeBase[index];
    }
    return null;
  }

  // Audit Logs
  createAuditLog(userId: string, userEmail: string, action: string, details: string) {
    const id = `AUD-${String(this.data.auditLogs.length + 1).padStart(4, '0')}`;
    const newLog: AuditLog = {
      id,
      userId,
      userEmail,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(newLog); // Prepend so newest is first
    this.save();
    return newLog;
  }

  // Settings
  updateSettings(settings: Partial<SystemSettings>) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }
}

export const db = new LocalDatabase();
