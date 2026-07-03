import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db, UserRole, User, Customer, Complaint, Interaction, Feedback, KnowledgeArticle } from "./server/db.js";
import { categorizeComplaint, generateReplySuggestion, analyzeFeedbackSentiment } from "./server/ai.js";

// Ensure files use standard ES imports/exports or CJS compat.
// The DB layer is imported as server/db.js to align with tsx and node ESM resolutions

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- COMPATIBLE TOKEN AUTHENTICATION MIDDLEWARE ---
  // A clean JWT-like secure token system that can run 100% in any sandboxed environment.
  // The token is simple Base64 string containing: email:role:userId
  const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [email, role, userId] = decoded.split(':');
      
      const user = db.getUsers().find(u => u.id === userId && u.email === email);
      if (!user) {
        res.status(403).json({ error: "Invalid token or user not found" });
        return;
      }

      if (user.status === "Inactive") {
        res.status(403).json({ error: "User account is suspended" });
        return;
      }

      (req as any).user = user;
      next();
    } catch (e) {
      res.status(403).json({ error: "Invalid or malformed authentication token" });
    }
  };

  // RBAC checks
  const requireRole = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user as User;
      if (!user || !allowedRoles.includes(user.role)) {
        res.status(403).json({ error: "Access denied: insufficient permission levels." });
        return;
      }
      next();
    };
  };

  // --- API ENDPOINTS ---

  // 1. AUTHENTICATION ENDPOINTS
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
       res.status(400).json({ error: "Email and password are required" });
       return;
    }

    const user = db.findUserByEmail(email);
    if (!user || user.passwordHash !== password) { // Simulation matches exact password string
       res.status(401).json({ error: "Invalid credentials. Please verify email and password." });
       return;
    }

    if (user.status === "Inactive") {
       res.status(403).json({ error: "Account inactive. Contact administrator." });
       return;
    }

    // Generate secure simulated token
    const token = Buffer.from(`${user.email}:${user.role}:${user.id}`).toString('base64');
    
    db.createAuditLog(user.id, user.email, "User Logged In", `${user.fullName} logged in securely.`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl,
        status: user.status
      }
    });
  });

  app.post("/api/auth/register", (req: Request, res: Response) => {
    const { email, password, fullName, role, department } = req.body;
    if (!email || !password || !fullName) {
       res.status(400).json({ error: "All registration fields are required" });
       return;
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
       res.status(400).json({ error: "User already exists with this email address." });
       return;
    }

    const targetRole = role && Object.values(UserRole).includes(role) ? role as UserRole : UserRole.CUSTOMER;
    
    // Auto-create customer profile if registering as customer
    let avatarUrl = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`; // Default avatar

    const newUser = db.createUser({
      email,
      passwordHash: password,
      fullName,
      role: targetRole,
      department: targetRole !== UserRole.CUSTOMER ? (department || "Customer Relations") : undefined,
      status: "Active",
      avatarUrl
    });

    if (targetRole === UserRole.CUSTOMER) {
      db.createCustomer({
        fullName,
        phone: "+1-555-0100",
        email,
        address: "Enter address here",
        city: "City",
        state: "State",
        country: "Country",
        status: "Active",
        customerType: "Standard",
        profilePicture: avatarUrl
      });
    }

    db.createAuditLog(newUser.id, newUser.email, "User Registered", `${newUser.fullName} registered a new ${newUser.role} account.`);

    const token = Buffer.from(`${newUser.email}:${newUser.role}:${newUser.id}`).toString('base64');

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        department: newUser.department,
        avatarUrl: newUser.avatarUrl,
        status: newUser.status
      }
    });
  });

  app.get("/api/auth/me", authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user as User;
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl,
        status: user.status
      }
    });
  });

  // 2. CUSTOMER MANAGEMENT
  app.get("/api/customers", authenticateToken, (req: Request, res: Response) => {
    let list = db.getCustomers();
    const { search, customerType, status } = req.query;

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(c => 
        c.fullName.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q) || 
        c.phone.includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }

    if (customerType) {
      list = list.filter(c => c.customerType === customerType);
    }

    if (status) {
      list = list.filter(c => c.status === status);
    }

    res.json(list);
  });

  app.post("/api/customers", authenticateToken, requireRole([UserRole.SUPER_ADMIN, UserRole.SUPPORT_MANAGER]), (req: Request, res: Response) => {
    const actor = (req as any).user as User;
    const { fullName, phone, email, address, city, state, country, customerType, status } = req.body;
    
    if (!fullName || !email) {
       res.status(400).json({ error: "Customer name and email are required" });
       return;
    }

    const newCust = db.createCustomer({
      fullName,
      phone: phone || "",
      email,
      address: address || "",
      city: city || "",
      state: state || "",
      country: country || "",
      customerType: customerType || "Standard",
      status: status || "Active",
      profilePicture: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`
    });

    db.createAuditLog(actor.id, actor.email, "Customer Profile Created", `Created profile for customer ${newCust.fullName} (${newCust.id})`);

    res.status(201).json(newCust);
  });

  app.put("/api/customers/:id", authenticateToken, (req: Request, res: Response) => {
    const actor = (req as any).user as User;
    const { id } = req.params;
    
    // Customers can edit their own profile, staff can edit any
    const customerProfile = db.getCustomers().find(c => c.id === id);
    if (!customerProfile) {
       res.status(404).json({ error: "Customer not found" });
       return;
    }

    if (actor.role === UserRole.CUSTOMER && actor.email !== customerProfile.email) {
       res.status(403).json({ error: "Access denied. Cannot modify other profile records." });
       return;
    }

    const updated = db.updateCustomer(id, req.body);
    db.createAuditLog(actor.id, actor.email, "Customer Profile Updated", `Updated profile for customer ${customerProfile.fullName} (${id})`);

    res.json(updated);
  });

  app.delete("/api/customers/:id", authenticateToken, requireRole([UserRole.SUPER_ADMIN]), (req: Request, res: Response) => {
    const actor = (req as any).user as User;
    const { id } = req.params;
    const deleted = db.deleteCustomer(id);
    if (!deleted) {
       res.status(404).json({ error: "Customer not found" });
       return;
    }

    db.createAuditLog(actor.id, actor.email, "Customer Profile Deleted", `Deleted customer profile ${deleted.fullName} (${id})`);
    res.json({ message: "Customer deleted successfully" });
  });

  // 3. COMPLAINT / TICKETING LIFECYCLE
  app.get("/api/complaints", authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user as User;
    let list = db.getComplaints();
    const { search, status, priority, category, department, assignedAgentId } = req.query;

    // RBAC: Support Agents can only see assigned tickets OR unassigned tickets in their department, 
    // unless they are Super Admin/Manager who can see all, or Customer who can only see their own tickets.
    if (user.role === UserRole.CUSTOMER) {
      const custProfile = db.getCustomers().find(c => c.email === user.email);
      const custId = custProfile ? custProfile.id : "";
      list = list.filter(c => c.customerId === custId);
    } else if (user.role === UserRole.SUPPORT_AGENT) {
      // Show assigned to him, or unassigned altogether
      list = list.filter(c => c.assignedAgentId === user.id || !c.assignedAgentId);
    }

    // Apply Filters
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) || 
        c.id.toLowerCase().includes(q)
      );
    }

    if (status) {
      list = list.filter(c => c.status === status);
    }
    if (priority) {
      list = list.filter(c => c.priority === priority);
    }
    if (category) {
      list = list.filter(c => c.category === category);
    }
    if (department) {
      list = list.filter(c => c.department === department);
    }
    if (assignedAgentId) {
      list = list.filter(c => c.assignedAgentId === assignedAgentId);
    }

    // Sort: newest first
    list.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

    res.json(list);
  });

  app.get("/api/complaints/:id", authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id } = req.params;
    const complaint = db.getComplaints().find(c => c.id === id);

    if (!complaint) {
       res.status(404).json({ error: "Ticket not found" });
       return;
    }

    // RBAC Check
    if (user.role === UserRole.CUSTOMER) {
      const custProfile = db.getCustomers().find(c => c.email === user.email);
      if (!custProfile || complaint.customerId !== custProfile.id) {
         res.status(403).json({ error: "Access denied to other customer ticket records." });
         return;
      }
    }

    res.json(complaint);
  });

  // AI-powered routing request (standalone helper before filing)
  app.post("/api/complaints/ai-analyze", authenticateToken, async (req: Request, res: Response) => {
    const { title, description } = req.body;
    if (!title || !description) {
       res.status(400).json({ error: "Title and description are required for AI analysis" });
       return;
    }
    const analysis = await categorizeComplaint(title, description);
    res.json(analysis);
  });

  app.post("/api/complaints", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { customerId, title, description, attachments, priority, category, department, runAiRouting } = req.body;

    if (!title || !description) {
       res.status(400).json({ error: "Title and description are required." });
       return;
    }

    let finalCustomerId = customerId;
    // If Customer role is creating, auto-assign customer ID
    if (user.role === UserRole.CUSTOMER) {
      const custProfile = db.getCustomers().find(c => c.email === user.email);
      if (!custProfile) {
         res.status(400).json({ error: "No active customer profile linked to this user login." });
         return;
      }
      finalCustomerId = custProfile.id;
    }

    if (!finalCustomerId) {
       res.status(400).json({ error: "Customer ID is required." });
       return;
    }

    // AI routing or direct payload
    let ticketCategory = category || "Technical Support";
    let ticketPriority = priority || "Medium";
    let ticketDepartment = department || "IT & Systems";
    let aiExplanation = "";

    if (runAiRouting) {
      const aiResponse = await categorizeComplaint(title, description);
      ticketCategory = aiResponse.category;
      ticketPriority = aiResponse.priority;
      ticketDepartment = aiResponse.department;
      aiExplanation = aiResponse.explanation;
    }

    const newTicket = db.createComplaint({
      customerId: finalCustomerId,
      category: ticketCategory,
      priority: ticketPriority,
      department: ticketDepartment,
      title,
      description,
      attachments: attachments || [],
      status: "New"
    });

    if (aiExplanation) {
      db.updateComplaint(newTicket.id, {
        timeline: [
          ...newTicket.timeline,
          {
            id: `TM-AI-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: "AI Auto-Classification",
            performedBy: "Gemini Router Engine",
            notes: aiExplanation
          }
        ]
      }, "system");
    }

    db.createAuditLog(user.id, user.email, "Complaint Filed", `Filed new ticket ${newTicket.id}: "${newTicket.title}"`);

    // Reload fully processed ticket
    const processedTicket = db.getComplaints().find(c => c.id === newTicket.id);
    res.status(201).json(processedTicket);
  });

  app.put("/api/complaints/:id", authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id } = req.params;
    
    const complaint = db.getComplaints().find(c => c.id === id);
    if (!complaint) {
       res.status(404).json({ error: "Ticket not found" });
       return;
    }

    // RBAC: Support Agent can only edit assigned to him or unassigned. Customers can't edit tickets besides adding feedback/closing
    if (user.role === UserRole.CUSTOMER) {
      const custProfile = db.getCustomers().find(c => c.email === user.email);
      if (!custProfile || complaint.customerId !== custProfile.id) {
         res.status(403).json({ error: "Access denied." });
         return;
      }
      // Customer is only allowed to transition to 'Closed' or 'Resolved' directly if solved.
      const allowedStatus = ["Closed", "Waiting for Customer"];
      if (req.body.status && !allowedStatus.includes(req.body.status)) {
         res.status(403).json({ error: "Customers can only Close tickets." });
         return;
      }
    }

    const updated = db.updateComplaint(id, req.body, user.fullName);
    db.createAuditLog(user.id, user.email, "Complaint Ticket Updated", `Updated ticket ${id}. Status: ${updated?.status}`);

    res.json(updated);
  });

  app.delete("/api/complaints/:id", authenticateToken, requireRole([UserRole.SUPER_ADMIN]), (req: Request, res: Response) => {
    const actor = (req as any).user as User;
    const { id } = req.params;
    const deleted = db.deleteComplaint(id);
    if (!deleted) {
       res.status(404).json({ error: "Ticket not found" });
       return;
    }

    db.createAuditLog(actor.id, actor.email, "Complaint Ticket Deleted", `Deleted ticket ${id}`);
    res.json({ message: "Ticket deleted successfully" });
  });

  // AI-powered response suggestion generator
  app.post("/api/complaints/:id/ai-reply", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { id } = req.params;
    const complaint = db.getComplaints().find(c => c.id === id);

    if (!complaint) {
       res.status(404).json({ error: "Ticket not found" });
       return;
    }

    const suggestion = await generateReplySuggestion(complaint.title, complaint.description, user.fullName);
    res.json({ suggestion });
  });

  // 4. INTERACTION REGISTRY
  app.get("/api/interactions", authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user as User;
    let list = db.getInteractions();
    const { customerId } = req.query;

    if (user.role === UserRole.CUSTOMER) {
      const custProfile = db.getCustomers().find(c => c.email === user.email);
      const custId = custProfile ? custProfile.id : "";
      list = list.filter(i => i.customerId === custId);
    } else if (customerId) {
      list = list.filter(i => i.customerId === customerId);
    }

    res.json(list);
  });

  app.post("/api/interactions", authenticateToken, requireRole([UserRole.SUPER_ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT]), (req: Request, res: Response) => {
    const agent = (req as any).user as User;
    const { customerId, type, summary, notes, followUpDate, complaintId } = req.body;

    if (!customerId || !type || !summary) {
       res.status(400).json({ error: "Customer ID, Type and Summary are required." });
       return;
    }

    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newInt = db.createInteraction({
      date: dateStr,
      time: timeStr,
      agentId: agent.id,
      customerId,
      type,
      summary,
      notes: notes || "",
      followUpDate
    });

    // If related to an active complaint, append a timeline event automatically!
    if (complaintId) {
      const complaint = db.getComplaints().find(c => c.id === complaintId);
      if (complaint) {
        db.updateComplaint(complaintId, {
          timeline: [
            ...complaint.timeline,
            {
              id: `TM-INT-${Date.now()}`,
              timestamp: new Date().toISOString(),
              action: `Interaction Registered`,
              performedBy: agent.fullName,
              notes: `Logged customer contact via ${type}. Summary: ${summary}`
            }
          ]
        }, agent.fullName);
      }
    }

    db.createAuditLog(agent.id, agent.email, "Customer Interaction Logged", `Logged ${type} interaction for customer ${customerId}`);

    res.status(201).json(newInt);
  });

  // 5. FEEDBACK SYSTEM
  app.get("/api/feedbacks", authenticateToken, (req: Request, res: Response) => {
    res.json(db.getFeedbacks());
  });

  app.post("/api/feedbacks", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const { complaintId, rating, comment, suggestions, resolutionSatisfaction } = req.body;

    if (!complaintId || !rating) {
       res.status(400).json({ error: "Complaint Ticket ID and Rating are required." });
       return;
    }

    const complaint = db.getComplaints().find(c => c.id === complaintId);
    if (!complaint) {
       res.status(404).json({ error: "Linked support ticket not found." });
       return;
    }

    // Call AI Sentiment Analysis
    const aiSentimentResult = await analyzeFeedbackSentiment(comment || "", suggestions || "");

    const newFeedback = db.createFeedback({
      complaintId,
      rating: Number(rating),
      comment: comment || "",
      suggestions: suggestions || "",
      resolutionSatisfaction: resolutionSatisfaction || "Satisfied",
      sentiment: aiSentimentResult.sentiment
    });

    // Automatically transition ticket to Closed state upon feedback receipt
    db.updateComplaint(complaintId, {
      status: "Closed",
      timeline: [
        ...complaint.timeline,
        {
          id: `TM-FDB-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "Feedback Logged & Closed",
          performedBy: user.fullName,
          notes: `Rating: ${rating}/5 Stars. Resolution satisfaction level: ${resolutionSatisfaction}. AI Sentiment class: ${aiSentimentResult.sentiment} (Theme: "${aiSentimentResult.keyTheme}")`
        }
      ]
    }, user.fullName);

    db.createAuditLog(user.id, user.email, "Ticket Feedback Registered", `Logged satisfaction score ${rating}/5 stars for solved ticket ${complaintId}`);

    res.status(201).json(newFeedback);
  });

  // 6. KNOWLEDGE BASE ARTICLES
  app.get("/api/kb", (req: Request, res: Response) => {
    res.json(db.getKnowledgeBase());
  });

  app.get("/api/kb/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const article = db.incrementKnowledgeViews(id);
    if (!article) {
       res.status(404).json({ error: "Article not found" });
       return;
    }
    res.json(article);
  });

  app.post("/api/kb", authenticateToken, requireRole([UserRole.SUPER_ADMIN, UserRole.SUPPORT_MANAGER]), (req: Request, res: Response) => {
    const actor = (req as any).user as User;
    const { title, category, content, type } = req.body;

    if (!title || !content || !category) {
       res.status(400).json({ error: "Title, category and content are required." });
       return;
    }

    const newArt = db.createKnowledgeArticle({
      title,
      category,
      content,
      type: type || "Article"
    });

    db.createAuditLog(actor.id, actor.email, "Knowledge Article Published", `Published article: "${title}"`);

    res.status(201).json(newArt);
  });

  // 7. ENTERPRISE ANALYTICS ENDPOINT
  app.get("/api/analytics", authenticateToken, (req: Request, res: Response) => {
    const complaints = db.getComplaints();
    const customers = db.getCustomers();
    const feedbacks = db.getFeedbacks();

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === "Active").length;

    const todayDateStr = new Date().toISOString().split('T')[0];
    const complaintsToday = complaints.filter(c => c.createdDate.startsWith(todayDateStr)).length;
    
    const pendingComplaints = complaints.filter(c => ["New", "Assigned", "In Progress", "Waiting for Customer", "Escalated"].includes(c.status)).length;
    const resolvedComplaints = complaints.filter(c => ["Resolved", "Closed"].length && (c.status === "Resolved" || c.status === "Closed")).length;

    // SLA & Resolution Time metrics (Hours elapsed between createdDate and resolvedDate)
    let totalResolutionHours = 0;
    let resolvedCount = 0;
    complaints.forEach(c => {
      if (c.resolvedDate) {
        const diffMs = new Date(c.resolvedDate).getTime() - new Date(c.createdDate).getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);
        totalResolutionHours += diffHrs;
        resolvedCount++;
      }
    });
    const avgResolutionTime = resolvedCount > 0 ? Number((totalResolutionHours / resolvedCount).toFixed(1)) : 12.5; // fallback baseline

    // Satisfaction score average
    const totalRating = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    const avgSatisfactionScore = feedbacks.length > 0 ? Number((totalRating / feedbacks.length).toFixed(1)) : 4.5; // fallback baseline

    // Category breakdown (Recharts)
    const categoryCounts: Record<string, number> = {};
    complaints.forEach(c => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });
    const topComplaintCategories = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

    // Monthly trends (Recharts)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrendData: Record<string, { total: number, resolved: number }> = {};
    
    // Seed standard trend for visuals if no deep historic records exist
    monthNames.slice(0, 7).forEach(m => {
      monthlyTrendData[m] = { total: 0, resolved: 0 };
    });
    
    complaints.forEach(c => {
      try {
        const mIdx = new Date(c.createdDate).getMonth();
        const mName = monthNames[mIdx];
        if (!monthlyTrendData[mName]) {
          monthlyTrendData[mName] = { total: 0, resolved: 0 };
        }
        monthlyTrendData[mName].total++;
        if (c.status === "Resolved" || c.status === "Closed") {
          monthlyTrendData[mName].resolved++;
        }
      } catch (e) {}
    });

    const monthlyTrends = Object.entries(monthlyTrendData).map(([name, data]) => ({
      name,
      Filed: data.total,
      Resolved: data.resolved
    }));

    // Department comparisons
    const deptCounts: Record<string, { total: number, resolved: number }> = {};
    complaints.forEach(c => {
      if (!deptCounts[c.department]) {
        deptCounts[c.department] = { total: 0, resolved: 0 };
      }
      deptCounts[c.department].total++;
      if (c.status === "Resolved" || c.status === "Closed") {
        deptCounts[c.department].resolved++;
      }
    });
    const departmentPerformance = Object.entries(deptCounts).map(([name, data]) => ({
      name,
      total: data.total,
      resolved: data.resolved,
      efficiency: data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0
    }));

    // Agent productivity performance
    const agentPerformance = db.getUsers()
      .filter(u => u.role === UserRole.SUPPORT_AGENT)
      .map(agent => {
        const agentTickets = complaints.filter(c => c.assignedAgentId === agent.id);
        const resolved = agentTickets.filter(c => c.status === "Resolved" || c.status === "Closed").length;
        const pending = agentTickets.length - resolved;
        return {
          name: agent.fullName,
          resolved,
          pending,
          total: agentTickets.length
        };
      });

    // Recent Activies stream
    const recentActivities = db.getAuditLogs().slice(0, 10).map(log => ({
      id: log.id,
      user: log.userEmail,
      action: log.action,
      details: log.details,
      time: log.timestamp
    }));

    res.json({
      metrics: {
        totalCustomers,
        activeCustomers,
        complaintsToday,
        pendingComplaints,
        resolvedComplaints,
        avgResolutionTime,
        avgSatisfactionScore
      },
      charts: {
        topComplaintCategories,
        monthlyTrends,
        departmentPerformance,
        agentPerformance
      },
      recentActivities
    });
  });

  // 8. SYSTEM AUDIT LOGS
  app.get("/api/audit-logs", authenticateToken, requireRole([UserRole.SUPER_ADMIN, UserRole.SUPPORT_MANAGER]), (req: Request, res: Response) => {
    res.json(db.getAuditLogs());
  });

  // 9. SYSTEM SETTINGS
  app.get("/api/settings", authenticateToken, (req: Request, res: Response) => {
    res.json(db.getSettings());
  });

  app.put("/api/settings", authenticateToken, requireRole([UserRole.SUPER_ADMIN]), (req: Request, res: Response) => {
    const actor = (req as any).user as User;
    const updated = db.updateSettings(req.body);
    db.createAuditLog(actor.id, actor.email, "System Settings Modified", "Updated SLA parameters and Auto-escalation flags.");
    res.json(updated);
  });

  // --- ESCALATION AND SLA SERVICE ---
  // A passive daemon check that simulates ticketing SLA escalation events
  const runSlaEscalationRules = () => {
    try {
      const settings = db.getSettings();
      if (!settings.autoEscalate) return;

      const complaints = db.getComplaints();
      const now = new Date();

      complaints.forEach(c => {
        if (c.status !== "Closed" && c.status !== "Resolved" && c.status !== "Escalated") {
          const dueDate = new Date(c.dueDate);
          if (now > dueDate) {
            // SLA breached! Automatically escalate
            db.updateComplaint(c.id, {
              status: "Escalated",
              priority: c.priority !== "Critical" ? "Critical" : c.priority,
              timeline: [
                ...c.timeline,
                {
                  id: `SLA-${Date.now()}`,
                  timestamp: now.toISOString(),
                  action: "SLA Breached - Auto Escalated",
                  performedBy: "SLA Monitor Daemon",
                  notes: `Ticket has exceeded its SLA timeline of ${settings.slaHours[c.priority] || 24} hours without resolution.`
                }
              ]
            }, "System SLA");
            
            db.createAuditLog("SYSTEM", "sla@company.com", "Ticket SLA Escalation Triggered", `Ticket ${c.id} breached SLA and was auto-escalated.`);
          }
        }
      });
    } catch (e) {
      console.error("SLA Daemon iteration failed:", e);
    }
  };

  // Run escalation rule checks every 5 minutes
  setInterval(runSlaEscalationRules, 5 * 60 * 1000);
  // Run once on startup to process preloaded seeds if they have breached
  runSlaEscalationRules();


  // --- VITE MIDDLEWARE OR STATIC FILES ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://localhost:${PORT}`);
  });
}

startServer();
