"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { emailCampaignApi, unitApi, type EmailRecipient, type Unit } from "@/services/api";
import { toast, Toaster } from "sonner";
import { Mail, Search, Users, Eye, Send, Plus, Loader2, X, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function EmailCampaignPage() {
  const { isAuthenticated } = useAuth();
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Email composition
  const [subject, setSubject] = useState("");
  const [headerTitle, setHeaderTitle] = useState("");
  const [bodyContent, setBodyContent] = useState("");

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewRecipient, setPreviewRecipient] = useState<{ name: string; email: string } | null>(null);

  // Sending
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Fetch Units
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await unitApi.getAll();
        setUnits(response.data);
      } catch (error) {
        toast.error("Failed to load units");
      }
    };
    fetchUnits();
  }, []);

  // Fetch recipients
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchRecipients = async () => {
      setIsLoading(true);
      try {
        const response = await emailCampaignApi.getRecipients({
          unitId: unitFilter !== "all" ? unitFilter : undefined,
          isApproved: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm || undefined,
        });
        setRecipients(response.data);
      } catch (error) {
        console.error("Failed to fetch recipients:", error);
        toast.error("Failed to load recipients");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipients();
  }, [isAuthenticated, unitFilter, statusFilter, searchTerm]);

  const toggleRecipient = (userId: string) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedRecipients(newSelected);
  };

  const selectAll = () => {
    setSelectedRecipients(new Set(recipients.map(r => r.userId)));
  };

  const clearSelection = () => {
    setSelectedRecipients(new Set());
  };

  const insertVariable = (variable: string) => {
    setBodyContent(prev => prev + `{{${variable}}}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });
    
    if (attachments.length + validFiles.length > 5) {
      toast.error('Maximum 5 attachments allowed');
      return;
    }
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handlePreview = async () => {
    if (selectedRecipients.size === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    try {
      const response = await emailCampaignApi.previewEmail({
        recipientIds: Array.from(selectedRecipients),
        subject,
        headerTitle,
        bodyContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setPreviewHtml(response.data.previewHtml);
      setPreviewRecipient(response.data.previewRecipient);
      setShowPreview(true);
    } catch (error) {
      toast.error("Failed to generate preview");
    }
  };

  const handleSend = async () => {
    if (selectedRecipients.size === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    if (!subject || !bodyContent) {
      toast.error("Please fill in subject and body content");
      return;
    }

    setIsSending(true);
    try {
      const response = await emailCampaignApi.sendCampaign({
        recipientIds: Array.from(selectedRecipients),
        subject,
        headerTitle: headerTitle || subject,
        bodyContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      toast.success(response.message);
      setSubject("");
      setHeaderTitle("");
      setBodyContent("");
      setAttachments([]);
      clearSelection();
    } catch (error) {
      toast.error("Failed to send email campaign");
    } finally {
      setIsSending(false);
    }
  };

  const availableVariables = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "unit", label: "Unit" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Campaign</h1>
            <p className="text-gray-600 mt-1">Design and send targeted email campaigns</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipient Selection */}
          <Card className="lg:col-span-1 shadow-sm border-gray-200">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-journal-maroon" />
                Recipients ({selectedRecipients.size})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Filters */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs uppercase text-gray-500 font-bold">Filter by Unit</Label>
                  <select
                    value={unitFilter}
                    onChange={(e) => setUnitFilter(e.target.value)}
                    className="w-full mt-1 rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-journal-maroon"
                  >
                    <option value="all">All Units</option>
                    <option value="unassigned">Unassigned</option>
                    {units.map(unit => (
                      <option key={unit._id} value={unit._id}>{unit.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs uppercase text-gray-500 font-bold">Approval Status</Label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full mt-1 rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-journal-maroon"
                  >
                    <option value="all">All Statuses</option>
                    <option value="true">Approved Only</option>
                    <option value="false">Not Approved</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs uppercase text-gray-500 font-bold">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 text-sm h-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={selectAll} variant="outline" size="sm" className="flex-1 text-xs">
                    Select All
                  </Button>
                  <Button onClick={clearSelection} variant="outline" size="sm" className="flex-1 text-xs">
                    Clear
                  </Button>
                </div>
              </div>

              {/* Recipient List */}
              <div className="border rounded-lg max-h-[400px] overflow-y-auto bg-white">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-journal-maroon" />
                  </div>
                ) : recipients.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No recipients matched the filters
                  </div>
                ) : (
                  recipients.map((recipient) => (
                    <div
                      key={recipient.userId}
                      className={`p-3 border-b last:border-0 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedRecipients.has(recipient.userId) ? "bg-journal-rose/50" : ""
                      }`}
                      onClick={() => toggleRecipient(recipient.userId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate text-gray-900">{recipient.name}</p>
                          <p className="text-xs text-gray-500 truncate">{recipient.email}</p>
                          <div className="flex gap-2 mt-1">
                             <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                               {recipient.unit || "No Unit"}
                             </span>
                             <span className={`text-[10px] px-1.5 py-0.5 rounded ${recipient.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                               {recipient.isApproved ? 'Approved' : 'Pending'}
                             </span>
                          </div>
                        </div>
                        {selectedRecipients.has(recipient.userId) && (
                          <div className="ml-2 flex-shrink-0">
                            <div className="w-5 h-5 bg-journal-maroon rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Composer */}
          <Card className="lg:col-span-2 shadow-sm border-gray-200">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-journal-maroon" />
                Compose Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Subject Line *</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="focus:ring-journal-maroon"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Branding Header</Label>
                  <Input
                    value={headerTitle}
                    onChange={(e) => setHeaderTitle(e.target.value)}
                    placeholder="Defaults to subject"
                    className="focus:ring-journal-maroon"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Personalization Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map((variable) => (
                    <Button
                      key={variable.key}
                      onClick={() => insertVariable(variable.key)}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 hover:bg-journal-rose hover:text-journal-maroon border-gray-200"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {variable.label}
                    </Button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 italic">
                  Tags will be replaced with recipient-specific data automatically.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Message Body *</Label>
                <RichTextEditor
                  value={bodyContent}
                  onChange={setBodyContent}
                  placeholder="Type your message here..."
                  className="min-h-[300px] border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Campaign Attachments</Label>
                <div className="flex flex-col gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Add supporting documents</p>
                      <p className="text-[11px] text-gray-500">Max 5 files, 10MB each (PDF, DOCX, Images)</p>
                    </div>
                    <input
                      type="file"
                      id="attachments"
                      multiple
                      accept="image/*,.pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button asChild variant="secondary" size="sm">
                      <label htmlFor="attachments" className="cursor-pointer">
                        <Plus className="h-4 w-4 mr-2" />
                        Select Files
                      </label>
                    </Button>
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 shadow-sm"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="bg-gray-100 p-1.5 rounded">
                              <span className="text-xs font-bold text-gray-500 uppercase">
                                {file.name.split('.').pop()}
                              </span>
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {(file.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => removeAttachment(index)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-500"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={handlePreview}
                  variant="outline"
                  className="h-11 px-6"
                  disabled={selectedRecipients.size === 0 || !bodyContent}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Email
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={selectedRecipients.size === 0 || !subject || !bodyContent || isSending}
                  className="bg-journal-maroon hover:bg-journal-maroon-dark h-11 px-8 text-white font-bold"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to {selectedRecipients.size} Users
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 border-b bg-gray-50">
              <DialogTitle className="flex items-center justify-between">
                <span>Campaign Preview</span>
                {previewRecipient && (
                  <span className="text-xs font-normal text-gray-500 bg-white px-3 py-1 rounded-full border">
                    Previewing for: <strong>{previewRecipient.name}</strong>
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100/50">
              <div className="max-w-[600px] mx-auto bg-white shadow-lg rounded-lg overflow-hidden border">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                
                {attachments.length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-t">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-3">Attachments</p>
                    <div className="flex flex-wrap gap-3">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-600 bg-white border px-3 py-2 rounded shadow-sm">
                          <span className="text-gray-400">📎</span>
                          <span className="font-medium">{file.name}</span>
                          <span className="text-[10px] text-gray-400">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <Button onClick={() => setShowPreview(false)}>Close Preview</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster position="top-right" />
    </AdminLayout>
  );
}
