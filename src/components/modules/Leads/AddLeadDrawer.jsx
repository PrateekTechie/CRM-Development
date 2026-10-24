import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { getSupabaseClient } from '../../../lib/supabase';
import { openLeadQuotationAttachment } from '../../../lib/quotationAttachments';
import { formatInrCurrency, parseQuotationValue } from '../../../lib/currencyUtils';
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

const QUOTATION_STATUS_OPTIONS = ['Not Sent', 'Draft', 'Sent', 'Under Review', 'Accepted', 'Rejected', 'Expired'];
const QUOTATION_FILE_TYPES = {
  pdf: { mime: 'application/pdf', signature: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  doc: { mime: 'application/msword', signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', signature: [0x50, 0x4b, 0x03, 0x04] },
  xls: { mime: 'application/vnd.ms-excel', signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', signature: [0x50, 0x4b, 0x03, 0x04] },
};
const MAX_QUOTATION_SIZE = 10 * 1024 * 1024;

const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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
    activeUser,
    addToast,
    savingLead,
    updatingLeadIds,
  } = useCRM();
  const editingLead = leads.find(lead => lead.id === editingLeadId);
  const isEditing = Boolean(editingLeadId);

  // Form State
  const initialFormState = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    preferredContactMethod: 'Phone',

    company: '',
    industry: '',
    website: '',
    companySize: '',
    location: '',

    source: 'Website',
    ownerId: activeUser?.id || '',
    status: 'New',
    stage: 'Prospecting',
    priority: 'Medium',
    score: 0,

    productInterest: '',
    expectedValue: '0',
    expectedCloseDate: '',
    quotationValue: '',
    quotationStatus: 'Not Sent',
    quotationAttachmentPath: '',
    quotationAttachmentName: '',
    quotationAttachmentSize: 0,
    quotationAttachmentType: '',
    quotationUploadedAt: '',
    requirement: '',
    notes: '',

    nextFollowUpDate: '',
    nextFollowUpTime: '10:00 AM',
    nextFollowUpNote: '',

    tags: [],
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [ignoreDuplicate, setIgnoreDuplicate] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [quotationFile, setQuotationFile] = useState(null);
  const [quotationUploadState, setQuotationUploadState] = useState({ status: 'idle', progress: 0, error: '' });
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [attachmentRetryLead, setAttachmentRetryLead] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInProgressRef = useRef(false);
  const fileOperationInProgressRef = useRef(false);
  const isSaving = (isEditing ? updatingLeadIds.includes(editingLeadId) : savingLead) || isSubmitting;

  useEffect(() => {
    if (!isAddLeadOpen) return;
    if (!editingLead) {
      setFormData(initialFormState);
      setQuotationFile(null);
      setQuotationUploadState({ status: 'idle', progress: 0, error: '' });
      setAttachmentRetryLead(null);
      return;
    }
    setFormData({
      ...initialFormState,
      ...editingLead,
      expectedValue: String(editingLead.expectedValue ?? ''),
      quotationValue: editingLead.quotationValue !== undefined && editingLead.quotationValue !== null ? String(editingLead.quotationValue) : '',
      quotationStatus: editingLead.quotationStatus || 'Not Sent',
      quotationAttachmentPath: editingLead.quotationAttachmentPath || '',
      quotationAttachmentName: editingLead.quotationAttachmentName || '',
      quotationAttachmentSize: editingLead.quotationAttachmentSize || 0,
      quotationAttachmentType: editingLead.quotationAttachmentType || '',
      quotationUploadedAt: editingLead.quotationUploadedAt || '',
      tags: [...(editingLead.tags || [])],
    });
    setQuotationFile(null);
    setQuotationUploadState({ status: 'idle', progress: 0, error: '' });
    setAttachmentRetryLead(null);
    setErrors({});
    setIgnoreDuplicate(false);
  }, [isAddLeadOpen, editingLeadId]);

  // Reset or duplicate check on input change
  useEffect(() => {
    if (formData.email || formData.phone) {
      const match = checkDuplicateLead(formData.email, formData.phone, editingLeadId || attachmentRetryLead?.id);
      setDuplicateMatch(match);
    } else {
      setDuplicateMatch(null);
    }
  }, [formData.email, formData.phone, checkDuplicateLead, editingLeadId, attachmentRetryLead?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleQuotationFileSelection = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    setQuotationFile(null);

    if (file.size > MAX_QUOTATION_SIZE) {
      setQuotationUploadState({ status: 'error', progress: 0, error: 'Quotation file must be smaller than 10 MB.' });
      return;
    }

    const extension = file.name.toLowerCase().split('.').pop();
    const expectedType = QUOTATION_FILE_TYPES[extension];
    if (!expectedType) {
      setQuotationUploadState({ status: 'error', progress: 0, error: 'Unsupported quotation file type. Choose a PDF, DOC, DOCX, XLS, or XLSX file.' });
      return;
    }

    setQuotationUploadState({ status: 'validating', progress: 0, error: '' });
    try {
      const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      const signatureMatches = expectedType.signature.every((byte, index) => header[index] === byte);
      const mimeMatches = !file.type || file.type === expectedType.mime
        || (['docx', 'xlsx'].includes(extension) && file.type === 'application/zip')
        || file.type === 'application/octet-stream';

      if (!signatureMatches || !mimeMatches) {
        throw new Error('The selected file content does not match its file type.');
      }

      setQuotationFile(file);
      setQuotationUploadState({ status: 'idle', progress: 0, error: '' });
    } catch (error) {
      setQuotationFile(null);
      setQuotationUploadState({ status: 'error', progress: 0, error: error.message || 'Unable to validate the selected quotation file.' });
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
    const quotationValue = parseQuotationValue(formData.quotationValue);
    if (quotationValue === undefined) {
      newErrors.quotationValue = 'Enter a non-negative amount with up to 10 digits and 2 decimal places.';
    } else if (quotationValue === null && editingLead?.quotationValue !== null && editingLead?.quotationValue !== undefined && editingLead.quotationValue !== '') {
      newErrors.quotationValue = 'Use the quotation details in Lead 360 to remove the saved quotation value.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const closeDrawer = () => {
    setIsAddLeadOpen(false);
    setEditingLeadId(null);
    setQuotationFile(null);
    setQuotationUploadState({ status: 'idle', progress: 0, error: '' });
    setAttachmentRetryLead(null);
  };

  const openExistingAttachment = async () => {
    const path = formData.quotationAttachmentPath;
    if (!path) return;
    try {
      await openLeadQuotationAttachment(editingLeadId, path);
    } catch (error) {
      console.error('Unable to open quotation attachment:', error);
      addToast(`This quotation file could not be opened: ${error.message || 'Supabase request failed.'}`, 'warning');
    }
  };

  const removeCurrentAttachment = async () => {
    if (fileOperationInProgressRef.current) return;
    fileOperationInProgressRef.current = true;
    try {
      const path = formData.quotationAttachmentPath;
      const attachmentFields = {
        quotationAttachmentPath: '',
        quotationAttachmentName: '',
        quotationAttachmentSize: 0,
        quotationAttachmentType: '',
        quotationUploadedAt: '',
      };

      if (editingLeadId && path) {
        const removedFromLead = await updateLead(editingLeadId, attachmentFields, editingLead);
        if (!removedFromLead) return;
      }

      setQuotationFile(null);
      setFormData(prev => ({ ...prev, ...attachmentFields }));

      if (path) {
        try {
          const client = getSupabaseClient();
          const { error } = await client.storage.from('lead-quotations').remove([path]);
          if (error) throw error;
        } catch (error) {
          console.error('Unable to remove unreferenced quotation object:', error);
          addToast(`The lead no longer references this quotation, but its storage object could not be deleted: ${error.message || 'Supabase request failed.'}`, 'warning');
        }
      }
    } finally {
      fileOperationInProgressRef.current = false;
    }
  };

  const uploadQuotationAttachment = async (leadId, leadSnapshot) => {
    if (!quotationFile) return true;
    if (fileOperationInProgressRef.current) return false;
    fileOperationInProgressRef.current = true;

    const storagePath = `${leadId}/${Date.now()}-${String(quotationFile.name || 'quotation').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const previousPath = formData.quotationAttachmentPath;
    const extension = quotationFile.name.toLowerCase().split('.').pop();
    const contentType = QUOTATION_FILE_TYPES[extension]?.mime || 'application/octet-stream';
    let uploadCompleted = false;
    let metadataUpdateAttempted = false;
    let client;
    setQuotationUploadState({ status: 'uploading', progress: 20, error: '' });

    try {
      client = getSupabaseClient();
      const { error: uploadError } = await client.storage
        .from('lead-quotations')
        .upload(storagePath, quotationFile, {
          cacheControl: '3600',
          upsert: false,
          contentType,
        });

      if (uploadError) throw new Error(uploadError.message || 'Upload failed.');
      uploadCompleted = true;

      const attachmentUpdate = {
        quotationAttachmentPath: storagePath,
        quotationAttachmentName: quotationFile.name,
        quotationAttachmentSize: quotationFile.size,
        quotationAttachmentType: contentType,
        quotationUploadedAt: new Date().toISOString(),
      };

      metadataUpdateAttempted = true;
      const updateOk = await updateLead(leadId, attachmentUpdate, leadSnapshot);
      if (!updateOk) {
        throw new Error('The lead was saved, but the attachment metadata could not be linked to it.');
      }

      if (previousPath && previousPath !== storagePath) {
        try {
          const { error: removeError } = await client.storage.from('lead-quotations').remove([previousPath]);
          if (removeError) throw removeError;
        } catch (removeError) {
          console.error('New quotation was linked, but the previous storage object could not be deleted:', removeError);
          addToast('The new quotation was saved, but the replaced storage file could not be deleted.', 'warning');
        }
      }

      setQuotationFile(null);
      setQuotationUploadState({ status: 'success', progress: 100, error: '' });
      setFormData(prev => ({
        ...prev,
        ...attachmentUpdate,
      }));
      return true;
    } catch (error) {
      if (uploadCompleted && !metadataUpdateAttempted) {
        try {
          const { error: cleanupError } = await client.storage.from('lead-quotations').remove([storagePath]);
          if (cleanupError) throw cleanupError;
        } catch (cleanupError) {
          console.error('Failed to remove an unlinked quotation upload:', cleanupError);
          addToast('The quotation was not linked to the lead, and its temporary storage object could not be removed.', 'warning');
        }
      } else if (metadataUpdateAttempted) {
        addToast('The attachment update result is uncertain. The uploaded file was retained to avoid deleting a file that may now be linked to the lead.', 'warning');
      }
      const message = error.message || 'Quotation upload failed.';
      setQuotationUploadState({ status: 'error', progress: 0, error: message });
      addToast(message, 'danger');
      return false;
    } finally {
      fileOperationInProgressRef.current = false;
    }
  };

  const handleSubmit = async (addAnother = false) => {
    if (submitInProgressRef.current || fileOperationInProgressRef.current) return;
    if (!validate()) {
      addToast('Please resolve validation errors before submitting.', 'warning');
      return;
    }

    if (duplicateMatch && !ignoreDuplicate) {
      addToast('Please resolve duplicate lead warning or click "Continue Anyway".', 'warning');
      return;
    }

    submitInProgressRef.current = true;
    setIsSubmitting(true);
    try {
      let savedLead = null;
      if (isEditing) {
        const ok = await updateLead(editingLeadId, formData);
        if (!ok) return;
        savedLead = { ...(leads.find(lead => lead.id === editingLeadId) || {}), ...formData, id: editingLeadId };
      } else if (attachmentRetryLead) {
        const ok = await updateLead(attachmentRetryLead.id, formData, attachmentRetryLead);
        if (!ok) return;
        savedLead = { ...attachmentRetryLead, ...formData, id: attachmentRetryLead.id };
      } else {
        savedLead = await addLead(formData);
        if (!savedLead) return;
      }

      if (quotationFile) {
        const uploadSucceeded = await uploadQuotationAttachment(savedLead.id, savedLead);
        if (!uploadSucceeded) {
          if (!isEditing) setAttachmentRetryLead(savedLead);
          addToast('The lead was saved, but the quotation upload failed. Please retry the upload or remove the attachment and save again.', 'warning');
          return;
        }
      }
      setAttachmentRetryLead(null);

      if (addAnother && !isEditing) {
        setFormData(initialFormState);
        setQuotationFile(null);
        setQuotationUploadState({ status: 'idle', progress: 0, error: '' });
        setDuplicateMatch(null);
        setIgnoreDuplicate(false);
      } else {
        closeDrawer();
        setFormData(initialFormState);
        setQuotationFile(null);
        setQuotationUploadState({ status: 'idle', progress: 0, error: '' });
        setDuplicateMatch(null);
        setIgnoreDuplicate(false);
      }
    } catch (error) {
      addToast(error.message || 'Unable to save lead.', 'danger');
    } finally {
      submitInProgressRef.current = false;
      setIsSubmitting(false);
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

          {/* SECTION 5: QUOTATION DETAILS */}
          <div className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-[#283347] pb-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              5. Quotation Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Quotation Value (₹)"
                name="quotationValue"
                type="text"
                inputMode="decimal"
                min="0"
                value={formData.quotationValue}
                onChange={handleChange}
                error={errors.quotationValue}
                placeholder="e.g. 25000"
                helperText="Enter an amount with up to 2 decimal places. Leave blank for a new lead."
              />
              <Select
                label="Quotation Status"
                name="quotationStatus"
                value={formData.quotationStatus}
                onChange={handleChange}
                options={QUOTATION_STATUS_OPTIONS}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Quotation Attachment</label>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDraggingFile(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingFile(false);
                  handleQuotationFileSelection(event.dataTransfer.files);
                }}
                className={`rounded-lg border-2 border-dashed p-4 transition-all ${
                  isDraggingFile
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-[#364559] bg-[#111827]'
                }`}
              >
                <input
                  id="quotation-upload-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  disabled={isSaving || quotationUploadState.status === 'uploading'}
                  onChange={(event) => {
                    void handleQuotationFileSelection(event.target.files);
                    event.target.value = '';
                  }}
                />
                <label htmlFor="quotation-upload-input" className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center text-xs text-slate-300">
                  <span className="font-semibold text-blue-300">Click to upload or drag a quotation file here</span>
                  <span className="text-[11px] text-slate-400">PDF, DOC, DOCX, XLS, XLSX • up to 10 MB</span>
                </label>
              </div>

              {quotationUploadState.error && (
                <span className="text-[11px] font-medium text-rose-400">⚠️ {quotationUploadState.error}</span>
              )}

              {(quotationFile || formData.quotationAttachmentPath) && (
                <div className="flex items-center justify-between gap-3 rounded-md border border-[#283347] bg-[#121722] p-3 text-xs text-slate-200">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-100">
                      {quotationFile ? quotationFile.name : formData.quotationAttachmentName}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {quotationFile ? formatFileSize(quotationFile.size) : formatFileSize(formData.quotationAttachmentSize)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.quotationAttachmentPath && !quotationFile && (
                      <button type="button" disabled={isSaving} className="text-blue-300 hover:text-blue-200 underline disabled:opacity-50" onClick={openExistingAttachment}>
                        Open
                      </button>
                    )}
                    <button type="button" disabled={isSaving || quotationUploadState.status === 'uploading'} className="text-rose-300 hover:text-rose-200 underline disabled:opacity-50" onClick={removeCurrentAttachment}>
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {quotationUploadState.status === 'validating' && (
                <p className="text-[11px] text-blue-300" role="status">Validating quotation file…</p>
              )}

              {quotationUploadState.status === 'uploading' && (
                <div className="space-y-1.5">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#0f172a]">
                    <div className="h-full w-2/5 rounded-full bg-blue-500 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-blue-300">Uploading quotation…</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 6: FOLLOW-UP */}
          <div className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-[#283347] pb-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              6. Next Action & Follow-up Schedule
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
              7. Lead Tags
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
              <div className="flex justify-between">
                <span className="text-slate-400">Quotation Value:</span>
                <span className="font-bold text-emerald-400">
                  {formatInrCurrency(parseQuotationValue(formData.quotationValue))}
                </span>
              </div>
            </div>

            {/* Next Follow-up box in preview */}
            <div className="p-3 bg-[#121722] border border-[#283347] rounded-md space-y-1 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Next Follow-up Action</span>
              <p className="font-semibold text-slate-200">
                {formData.nextFollowUpDate ? `${formData.nextFollowUpDate} at ${formData.nextFollowUpTime}` : 'Not Scheduled'}
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
                disabled={quotationUploadState.status === 'validating' || quotationUploadState.status === 'uploading'}
              >
                {isSaving ? (isEditing ? 'Updating Lead...' : 'Saving Lead...') : (isEditing ? 'Update Lead' : 'Create Lead')}
              </Button>
              {!isEditing && (
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() => handleSubmit(true)}
                  disabled={isSaving || quotationUploadState.status === 'validating' || quotationUploadState.status === 'uploading'}
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
