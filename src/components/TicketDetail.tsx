import React, { useState, useEffect } from "react";
import { 
  X, Calendar, Shield, User, AlertTriangle, Play, CheckCircle, 
  Sparkles, Send, PhoneCall, Mail, MessageSquare, Clipboard, Copy, Clock,
  FileText, History, HelpCircle
} from "lucide-react";
import { Complaint, User as UserType, UserRole, Interaction } from "../types.js";

interface TicketDetailProps {
  complaint: Complaint;
  onClose: () => void;
  onUpdateTicket: (id: string, updates: any) => Promise<void>;
  agents: UserType[];
  currentUser: UserType | null;
  onLogInteraction: (interactionData: any) => Promise<void>;
}

export default function TicketDetail({ 
  complaint, 
  onClose, 
  onUpdateTicket, 
  agents, 
  currentUser,
  onLogInteraction
}: TicketDetailProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "interaction" | "ai">("timeline");
  const [status, setStatus] = useState(complaint.status);
  const [priority, setPriority] = useState(complaint.priority);
  const [assignedAgentId, setAssignedAgentId] = useState(complaint.assignedAgentId || "");
  const [updating, setUpdating] = useState(false);

  // Interaction logger state
  const [intType, setIntType] = useState<"Phone Call" | "Email" | "Chat" | "Visit" | "WhatsApp" | "Video Call">("Phone Call");
  const [intSummary, setIntSummary] = useState("");
  const [intNotes, setIntNotes] = useState("");
  const [submittingInt, setSubmittingInt] = useState(false);

  // AI draft assistant state
  const [aiDraft, setAiDraft] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset internal states on ticket change
  useEffect(() => {
    setStatus(complaint.status);
    setPriority(complaint.priority);
    setAssignedAgentId(complaint.assignedAgentId || "");
    setAiDraft("");
    setIntSummary("");
    setIntNotes("");
  }, [complaint]);

  const isStaff = currentUser && currentUser.role !== UserRole.CUSTOMER;

  const handleUpdateBaseFields = async () => {
    setUpdating(true);
    try {
      await onUpdateTicket(complaint.id, {
        status,
        priority,
        assignedAgentId: assignedAgentId || undefined
      });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intSummary.trim()) return;

    setSubmittingInt(true);
    try {
      await onLogInteraction({
        customerId: complaint.customerId,
        complaintId: complaint.id,
        type: intType,
        summary: intSummary,
        notes: intNotes
      });
      setIntSummary("");
      setIntNotes("");
      setActiveTab("timeline"); // Switch back to timeline to see the auto-logged event
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingInt(false);
    }
  };

  const handleGenerateAiReply = async () => {
    setGeneratingAi(true);
    setAiDraft("");
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/ai-reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("registry_token")}`
        }
      });
      const data = await res.json();
      if (data.suggestion) {
        setAiDraft(data.suggestion);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAi(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyDraftToNotes = () => {
    setIntType("Email");
    setIntSummary(`AI Draft response sent to customer regarding: ${complaint.title}`);
    setIntNotes(aiDraft);
    setActiveTab("interaction");
  };

  // SLA time remaining calculation helper
  const calculateSlaTimer = () => {
    const due = new Date(complaint.dueDate).getTime();
    const now = new Date().getTime();
    const diff = due - now;

    if (complaint.status === "Resolved" || complaint.status === "Closed") {
      return { text: "SLA Met", color: "bg-emerald-500 text-white", ratio: 100, breached: false };
    }

    if (diff < 0) {
      return { text: "SLA BREACHED", color: "bg-rose-600 text-white animate-pulse", ratio: 0, breached: true };
    }

    const hoursLeft = Math.ceil(diff / (1000 * 60 * 60));
    
    // SLA indicator thresholds
    let color = "bg-indigo-600 text-white";
    if (hoursLeft <= 4) color = "bg-amber-500 text-slate-900";
    if (hoursLeft <= 1) color = "bg-rose-500 text-white";

    return { 
      text: `${hoursLeft} hours remaining`, 
      color, 
      ratio: Math.min(100, Math.round((hoursLeft / 48) * 100)),
      breached: false 
    };
  };

  const slaInfo = calculateSlaTimer();

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "Critical": return "bg-rose-100 text-rose-800 border-rose-200";
      case "High": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Medium": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "New": return "bg-sky-100 text-sky-800 border-sky-200";
      case "Assigned": return "bg-violet-100 text-violet-800 border-violet-200";
      case "In Progress": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Waiting for Customer": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Escalated": return "bg-rose-100 text-rose-800 border-rose-200 animate-pulse";
      case "Resolved": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Closed": return "bg-slate-100 text-slate-800 border-slate-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="bg-slate-50 border-l border-slate-200 w-96 flex flex-col h-screen sticky top-0 shrink-0 z-10 shadow-2xl">
      
      {/* Detail Header */}
      <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
            {complaint.id}
          </span>
          <h2 className="text-sm font-bold text-slate-800 mt-2 truncate max-w-[200px]">
            {complaint.title}
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* SLA Visual Widget */}
      <div className="bg-slate-900 text-slate-100 p-5 flex flex-col space-y-2 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>SLA Agreement Target</span>
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${slaInfo.color}`}>
            {slaInfo.text}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${slaInfo.breached ? 'bg-rose-500' : 'bg-indigo-500'}`}
            style={{ width: `${slaInfo.ratio}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
          <span>Created: {new Date(complaint.createdDate).toLocaleDateString()}</span>
          <span>Target: {new Date(complaint.dueDate).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Main Core Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Ticket Metadata Summary */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket Metadata</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block mb-1">Category</span>
              <span className="text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200/60 px-2 py-1 rounded block truncate">
                {complaint.category}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block mb-1">Department</span>
              <span className="text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200/60 px-2 py-1 rounded block truncate">
                {complaint.department}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Ticket Status</label>
              <select
                disabled={!isStaff || updating}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
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
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Ticket Priority</label>
              <select
                disabled={!isStaff || updating}
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {isStaff && (
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Assigned Support Agent</label>
                <select
                  disabled={updating}
                  value={assignedAgentId}
                  onChange={(e) => setAssignedAgentId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.fullName} ({a.department})</option>
                  ))}
                </select>
              </div>
            )}

            {isStaff && (
              <button
                disabled={updating}
                onClick={handleUpdateBaseFields}
                className="w-full mt-2 bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center justify-center space-x-1"
              >
                {updating ? (
                  <span>Updating Metadata...</span>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Save Metadata Changes</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Customer Case Context Description */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Complaint Context</h3>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-lg max-h-48 overflow-y-auto whitespace-pre-line font-medium">
            {complaint.description}
          </p>
        </div>

        {/* Chronology & Action Center Tabs */}
        <div className="space-y-4">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex-1 text-center py-2 text-xs font-bold transition-all duration-200 border-b-2 ${
                activeTab === "timeline" 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Timeline History
            </button>
            {isStaff && (
              <button
                onClick={() => setActiveTab("interaction")}
                className={`flex-1 text-center py-2 text-xs font-bold transition-all duration-200 border-b-2 ${
                  activeTab === "interaction" 
                    ? "border-indigo-600 text-indigo-600" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Log Contact
              </button>
            )}
            {isStaff && (
              <button
                onClick={() => setActiveTab("ai")}
                className={`flex-1 text-center py-2 text-xs font-bold transition-all duration-200 border-b-2 ${
                  activeTab === "ai" 
                    ? "border-indigo-600 text-indigo-600" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                AI Draft
              </button>
            )}
          </div>

          {/* TAB 1: Chronological Action Timeline */}
          {activeTab === "timeline" && (
            <div className="relative pl-4 space-y-6 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
              {complaint.timeline.map((event) => (
                <div key={event.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-indigo-500 group-hover:scale-125 transition" />
                  
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {event.action}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Performed by: <span className="font-semibold text-slate-700">{event.performedBy}</span>
                  </div>
                  {event.notes && (
                    <div className="text-[11px] text-slate-600 bg-white border border-slate-200/50 p-2.5 rounded-lg mt-1 whitespace-pre-line leading-relaxed italic font-medium">
                      {event.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Log Client Interaction on Ticket */}
          {activeTab === "interaction" && isStaff && (
            <form onSubmit={handleLogInteraction} className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Log Customer Interaction</h3>
              
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Contact Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Phone Call", "Email", "Chat"] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setIntType(type)}
                      className={`text-xs p-2 rounded-lg border text-center transition font-semibold ${
                        intType === type 
                          ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm" 
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Interaction Summary</label>
                <input
                  type="text"
                  value={intSummary}
                  onChange={(e) => setIntSummary(e.target.value)}
                  placeholder="e.g. Call regarding backup logs..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Detailed Log Notes / Reply Text</label>
                <textarea
                  value={intNotes}
                  onChange={(e) => setIntNotes(e.target.value)}
                  placeholder="Record summary of customer points discussed..."
                  rows={4}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={submittingInt}
                className="w-full bg-slate-900 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-black transition flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingInt ? "Logging Interaction..." : "Save Interaction Log"}</span>
              </button>
            </form>
          )}

          {/* TAB 3: AI Copy Response Suggestions */}
          {activeTab === "ai" && isStaff && (
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  <span>AI Reply Composer</span>
                </h3>
                <button
                  onClick={handleGenerateAiReply}
                  disabled={generatingAi}
                  className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{generatingAi ? "Analyzing..." : "Draft with Gemini"}</span>
                </button>
              </div>

              {aiDraft ? (
                <div className="space-y-3 animate-fadeIn">
                  <div className="relative">
                    <pre className="text-[11px] text-slate-600 font-sans whitespace-pre-wrap leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-60 overflow-y-auto italic">
                      {aiDraft}
                    </pre>
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-2 top-2 bg-white/90 hover:bg-white text-slate-600 border border-slate-200 p-1.5 rounded-md hover:text-slate-800 transition"
                      title="Copy response draft"
                    >
                      {copied ? <span className="text-[10px] text-emerald-600 font-bold px-1">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button
                    onClick={applyDraftToNotes}
                    className="w-full bg-emerald-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center space-x-1.5"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Apply as Active Interaction Reply</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center space-y-2">
                  <HelpCircle className="w-6 h-6 text-slate-300" />
                  <p>Click "Draft with Gemini" to generate an automatic, context-aware reply suggestions email instantly.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
