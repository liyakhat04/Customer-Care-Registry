import React from "react";
import { X, Calendar, Phone, Mail, MapPin, Ticket, Clock, CheckCircle, ArrowRight, UserCheck } from "lucide-react";
import { Customer, Complaint, Interaction } from "../types.js";

interface CustomerDetailProps {
  customer: Customer;
  onClose: () => void;
  complaints: Complaint[];
  interactions: Interaction[];
  onSelectComplaint: (complaint: Complaint) => void;
}

export default function CustomerDetail({ 
  customer, 
  onClose, 
  complaints, 
  interactions, 
  onSelectComplaint 
}: CustomerDetailProps) {
  
  // Filter data for this specific customer
  const customerTickets = complaints.filter(c => c.customerId === customer.id);
  const customerInteractions = interactions.filter(i => i.customerId === customer.id);

  const getStatusColor = (s: string) => {
    switch (s) {
      case "New": return "bg-sky-100 text-sky-800";
      case "In Progress": return "bg-indigo-100 text-indigo-800";
      case "Resolved": return "bg-emerald-100 text-emerald-800";
      case "Closed": return "bg-slate-100 text-slate-800";
      case "Escalated": return "bg-rose-100 text-rose-800 animate-pulse";
      default: return "bg-slate-50 text-slate-600";
    }
  };

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case "VIP": return "bg-amber-100 text-amber-800 border-amber-300";
      case "Enterprise": return "bg-violet-100 text-violet-800 border-violet-300";
      default: return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="bg-slate-50 border-l border-slate-200 w-96 flex flex-col h-screen sticky top-0 shrink-0 z-10 shadow-2xl">
      
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src={customer.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
            alt={customer.fullName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
            referrerPolicy="no-referrer"
          />
          <div>
            <h2 className="text-sm font-bold text-slate-800 truncate max-w-[180px]">
              {customer.fullName}
            </h2>
            <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border mt-0.5 ${getClientTypeColor(customer.customerType)}`}>
              {customer.customerType} CLIENT
            </span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Contact info widget */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3.5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Profile</h3>
          
          <div className="flex items-center space-x-3 text-xs text-slate-600">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate select-all">{customer.email}</span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-600">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="select-all">{customer.phone}</span>
          </div>

          <div className="flex items-start space-x-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-700">{customer.address}</p>
              <p className="text-slate-500">{customer.city}, {customer.state}</p>
              <p className="text-slate-400 text-[11px] font-mono">{customer.country}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Registered:</span>
            </span>
            <span className="font-semibold text-slate-600">
              {new Date(customer.dateOfRegistration).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Unified Customer Care Ticket History */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
            <Ticket className="w-4 h-4 text-indigo-500" />
            <span>Support Tickets ({customerTickets.length})</span>
          </h3>

          {customerTickets.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-slate-200 text-xs text-slate-400">
              No tickets filed yet by this client.
            </div>
          ) : (
            <div className="space-y-2.5">
              {customerTickets.map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => onSelectComplaint(ticket)}
                  className="bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-400 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                      {ticket.id}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-2 line-clamp-1 group-hover:text-indigo-600">
                    {ticket.title}
                  </h4>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-3 font-mono">
                    <span>Priority: <span className="font-bold text-slate-600">{ticket.priority}</span></span>
                    <span className="flex items-center space-x-1 text-indigo-500 opacity-0 group-hover:opacity-100 transition">
                      <span>Interact</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unified Customer Communication History Log */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>Interaction Log History ({customerInteractions.length})</span>
          </h3>

          {customerInteractions.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-slate-200 text-xs text-slate-400">
              No interactions recorded.
            </div>
          ) : (
            <div className="relative pl-3.5 space-y-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200">
              {customerInteractions.map(interaction => (
                <div key={interaction.id} className="relative">
                  <div className="absolute -left-[18px] top-1 w-2 h-2 rounded-full border border-white bg-emerald-500" />
                  
                  <div className="text-[9px] text-slate-400 font-mono flex items-center space-x-2">
                    <span>{interaction.date}</span>
                    <span>•</span>
                    <span>{interaction.time}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {interaction.type}
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-white border border-slate-200/40 p-2.5 rounded-lg mt-1 italic">
                    "{interaction.summary}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
