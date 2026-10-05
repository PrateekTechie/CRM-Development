import React, { useState, useEffect } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Drawer } from '../../ui/Drawer';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import {
  UserPlus,
  AlertTriangle,
  Building2,
  PhoneCall,
  DollarSign,
  Calendar,
  Tag,
  CheckCircle2,
  Sparkles,
  Eye,
  X
} from 'lucide-react';

export const AddLeadDrawer = () => {
  const {
    isAddLeadOpen,
    setIsAddLeadOpen,
    users,
    leads,
    editingLeadId,
    setEditingLeadId,
    addLead,
    updateLead,
    checkDuplicateLead,
    viewLead360,
    addToast,
    savingLead,
    updatingLeadIds,
  } = useCRM();
  const editingLead = leads.find(lead => lead.id === editingLeadId);
  const isEditing = Boolean(editingLeadId);
  const isSaving = isEditing ? updatingLeadIds.includes(editingLeadId) : savingLead;

  // Form State
  const initialFormState = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    preferredContactMethod: 'Phone',

    company: '',
    industry: 'Technology',
    website: '',
    companySize: '11-50',
    location: 'India',

    source: 'Website',
    ownerId: 'usr-1',
    status: 'New',
    stage: 'Prospecting',
    priority: 'High',
    score: 80,

    productInterest: 'Sales CRM Software',
    expectedValue: '5000',
    expectedCloseDate: '2026-10-25',
    requirement: '',
    notes: '',

    nextFollowUpDate: '',
    nextFollowUpTime: '10:00 AM',
    nextFollowUpNote: '',

    tags: ['Hot Lead', 'Demo Requested'],
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [ignoreDuplicate, setIgnoreDuplicate] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!isAddLeadOpen) return;
    if (!editingLead) {
      setFormData(initialFormState);
      return;
    }
    setFormData({
      ...initialFormState,
      ...editingLead,
      expectedValue: String(editingLead.expectedValue ?? ''),
      tags: [...(editingLead.tags || [])],
    });
    setErrors({});
    setIgnoreDuplicate(false);
  }, [isAddLeadOpen, editingLeadId]);

  // Reset or duplicate check on input change
  useEffect(() => {
    if (formData.email || formData.phone) {
      const match = checkDuplicateLead(formData.email, formData.phone, editingLeadId);
      setDuplicateMatch(match);
    } else {
      setDuplicateMatch(null);
    }
  }, [formData.email, formData.phone, checkDuplicateLead, editingLeadId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address (e.g. rahul@example.com).';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    }
    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required.';
    }
    if (formData.expectedValue && isNaN(Number(formData.expectedValue))) {
      newErrors.expectedValue = 'Expected value must be a valid number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const closeDrawer = () => {
    setIsAddLeadOpen(false);
    setEditingLeadId(null);
  };

  const handleSubmit = async (addAnother = false) => {
    if (!validate()) {
      addToast('Please resolve validation errors before submitting.', 'warning');
      return;
    }

    if (duplicateMatch && !ignoreDuplicate) {
      addToast('Please resolve duplicate lead warning or click "Continue Anyway".', 'warning');
      return;
    }

    const savedLead = isEditing
      ? await updateLead(editingLeadId, formData)
      : await addLead(formData);
    if (!savedLead) return;

    if (addAnother && !isEditing) {
      setFormData(initialFormState);
      setDuplicateMatch(null);
      setIgnoreDuplicate(false);
    } else {
      closeDrawer();
      setFormData(initialFormState);
      setDuplicateMatch(null);
      setIgnoreDuplicate(false);
    }
  };

  const addCustomTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const ownerName = users.find(u => u.id === formData.ownerId)?.name || 'Arjun Kapoor';

  return (
    <Drawer
      isOpen={isAddLeadOpen}
      onClose={closeDrawer}
      title={isEditing ? 'Edit Lead' : 'Add New Lead'}
      subtitle={isEditing ? 'Update lead details and follow-up information.' : 'Create a lead, configure management rules, and define the next follow-up action.'}
      width="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main 2-Column Form Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* DUPLICATE WARNING ALERT */}
          {duplicateMatch && !ignoreDuplicate && (
            <div className="p-4 bg-amber-950/80 border border-amber-800 rounded-lg space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Possible Duplicate Lead Detected
              </div>
              <p className="text-xs text-slate-200">
                A lead with this email/phone already exists in your workspace:
              </p>
              <div className="p-2.5 bg-[#121722] border border-amber-900/60 rounded text-xs space-y-1">
                <p className="font-semibold text-slate-100">{duplicateMatch.firstName} {duplicateMatch.lastName} ({duplicateMatch.company})</p>
                <p className="text-[11px] text-slate-400">{duplicateMatch.email} • {duplicateMatch.phone}</p>
                <p className="text-[11px] text-slate-400">Owner: {duplicateMatch.ownerName} | Status: <strong className="text-amber-400">{duplicateMatch.status}</strong></p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                  onClick={() => {
                    closeDrawer();
                    viewLead360(duplicateMatch.id);
                  }}
                >
                  View Existing Lead
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIgnoreDuplicate(true)}
                >
                  Continue Anyway
                </Button>
              </div>
            </div>
          )}

          {/* SECTION 1: CONTACT INFORMATION */}
          <div className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-[#283347] pb-2">
              <UserPlus className="w-4 h-4 text-blue-400" />
              1. Contact Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                placeholder="e.g. Rahul"
              />
              <Input
                label="Last Name"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                placeholder="e.g. Sharma"
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="e.g. rahul@example.com"
              />
              <Input
                label="Phone Number"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="e.g. +91 9876543210"
              />
              <Input
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. CTO & VP Engineering"
              />
              <Select
                label="Preferred Contact Method"
                name="preferredContactMethod"
                value={formData.preferredContactMethod}
                onChange={handleChange}
                options={['Phone', 'Email', 'WhatsApp', 'LinkedIn', 'Other']}
              />
            </div>
          </div>

          {/* SECTION 2: COMPANY INFORMATION */}
          <div className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-[#283347] pb-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              2. Company Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                name="company"
                required
                value={formData.company}
                onChange={handleChange}
                error={errors.company}
                placeholder="e.g. ABC Technologies"
              />
              <Select
                label="Industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                options={['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Real Estate', 'Other']}
              />
              <Input
                label="Website URL"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="e.g. https://abctechnologies.in"
              />
              <Select
                label="Company Size"
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
                options={['1-10', '11-50', '51-200', '201-500', '500+']}
              />
              <Input
                label="Location / City"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Bengaluru, India"
              />
            </div>
          </div>

          {/* SECTION 3: LEAD MANAGEMENT */}
          <div className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-[#283347] pb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              3. Lead Management & Routing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Lead Source"
                name="source"
                required
                value={formData.source}
                onChange={handleChange}
                options={['Website', 'LinkedIn', 'Instagram', 'Email', 'Referral', 'Campaign', 'Phone', 'Event', 'Other']}
              />
              <Select
                label="Lead Owner"
                name="ownerId"
                required
                value={formData.ownerId}
                onChange={handleChange}
                options={users.map(u => ({ value: u.id, label: u.name }))}
              />
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={['New', 'Contacted', 'Working', 'Qualified', 'Converted', 'Lost']}
              />
              <Select
                label="Stage"
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                options={['Prospecting', 'Discovery', 'Demo', 'Proposal', 'Negotiation']}
              />
              <Select
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                options={['Low', 'Medium', 'High']}
              />
              <Input
                label="Lead Score (0-100)"
                name="score"
                type="number"
                value={formData.score}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* SECTION 4: BUSINESS INFORMATION */}
          <div className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-[#283347] pb-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              4. Business Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product / Service Interest"
                name="productInterest"
                value={formData.productInterest}
                onChange={handleChange}
                placeholder="e.g. Sales CRM (25 Licenses)"
              />
              <Input
                label="Expected Deal Value (₹)"
                name="expectedValue"
                value={formData.expectedValue}
                onChange={handleChange}
                error={errors.expectedValue}
                placeholder="e.g. 5000"
              />
              <Input
                label="Expected Close Date"
                name="expectedCloseDate"
                type="date"
                value={formData.expectedCloseDate}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Customer Requirements & Notes</label>
              <textarea
                name="requirement"
                rows={3}
                value={formData.requirement}
                onChange={handleChange}
                placeholder="Describe specific customer pain points, key feature requests, and timeline requirements..."
                className="w-full bg-[#121722] text-slate-100 text-xs rounded-md border border-[#283347] p-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* SECTION 5: FOLLOW-UP */}
          <div className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-[#283347] pb-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              5. Next Action & Follow-up Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Next Follow-up Date"
                name="nextFollowUpDate"
                type="date"
                value={formData.nextFollowUpDate}
                onChange={handleChange}
              />
              <Input
                label="Follow-up Time"
                name="nextFollowUpTime"
                type="text"
                value={formData.nextFollowUpTime}
                onChange={handleChange}
                placeholder="e.g. 10:00 AM"
              />
            </div>
            <Input
              label="Follow-up Instruction Note"
              name="nextFollowUpNote"
              value={formData.nextFollowUpNote}
              onChange={handleChange}
              placeholder="e.g. Call Rahul to review technical proposal specs."
            />
          </div>

          {/* SECTION 6: TAGS */}
          <div className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-[#283347] pb-2">
              <Tag className="w-4 h-4 text-indigo-400" />
              6. Lead Tags
            </h3>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Add custom tag (press Enter or click Add)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
              />
              <Button variant="secondary" size="md" onClick={addCustomTag}>
                Add Tag
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {formData.tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800 text-xs font-medium">
                  {t}
                  <button onClick={() => removeTag(t)} className="text-blue-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Right Sticky Column: LIVE LEAD PREVIEW PANEL */}
        <div className="space-y-4">
          <div className="bg-[#161c28] border border-blue-500/40 rounded-lg p-5 sticky top-0 shadow-xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-[#283347] pb-3">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Live Lead Preview
              </span>
              <Badge variant="blue">Live Card</Badge>
            </div>

            {/* Live Name & Company */}
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100">
                {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : 'Rahul Sharma'}
              </h2>
              <p className="text-xs font-semibold text-slate-300">
                {formData.company || 'ABC Technologies'}
              </p>
              <p className="text-[11px] text-slate-400">
                {formData.title || 'CTO & VP Engineering'}
              </p>
            </div>

            <div className="space-y-2 border-t border-[#283347] pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Contact Method:</span>
                <span className="font-semibold text-slate-200">{formData.preferredContactMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lead Source:</span>
                <span className="font-semibold text-blue-400">{formData.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Owner:</span>
                <span className="font-semibold text-slate-200">{ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Priority:</span>
                <Badge variant={formData.priority.toLowerCase()}>{formData.priority}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lead Score:</span>
                <span className="font-bold text-emerald-400">{formData.score} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expected Value:</span>
                <span className="font-bold text-emerald-400">
                  ₹{Number(formData.expectedValue || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Next Follow-up box in preview */}
            <div className="p-3 bg-[#121722] border border-[#283347] rounded-md space-y-1 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Next Follow-up Action</span>
              <p className="font-semibold text-slate-200">
                {formData.nextFollowUpDate ? `${formData.nextFollowUpDate} at ${formData.nextFollowUpTime}` : 'Tomorrow, 10:00 AM'}
              </p>
              {formData.nextFollowUpNote && (
                <p className="text-[11px] text-slate-400 italic">"{formData.nextFollowUpNote}"</p>
              )}
            </div>

            {/* Form Submit Action Buttons */}
            <div className="pt-3 border-t border-[#283347] space-y-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => handleSubmit(false)}
                loading={isSaving}
              >
                {isSaving ? (isEditing ? 'Updating Lead...' : 'Saving Lead...') : (isEditing ? 'Update Lead' : 'Create Lead')}
              </Button>
              {!isEditing && (
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() => handleSubmit(true)}
                  disabled={isSaving}
                >
                  Create & Add Another
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={closeDrawer}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>

          </div>
        </div>

      </div>
    </Drawer>
  );
};
