"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  userApi,
  unitApi,
  type UserProfile,
  type Unit,
} from "@/services/api";
import { toast, Toaster } from "sonner";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Mail,
  ListFilter,
  BadgePlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [unitFilter, setUnitFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form State for Add/Edit
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [unitId, setUnitId] = useState<string | undefined>(undefined);
  const [bulkInput, setBulkInput] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await userApi.getUsers({
        unitId: unitFilter !== "all" ? unitFilter : undefined,
        isApproved: approvalFilter !== "all" ? approvalFilter : undefined,
        search: debouncedSearchTerm || undefined,
      });
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await unitApi.getAll();
      setUnits(response.data);
    } catch (error) {
      toast.error("Failed to load units");
    }
  };

  // Initial load and unit fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnits();
    }
  }, [isAuthenticated]);

  // Fetch users when filters or debounced search changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, unitFilter, approvalFilter, debouncedSearchTerm]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setUnitId(undefined);
    setBulkInput("");
    setRejectionReason("");
    setSelectedUser(null);
  };

  const handleAddUser = async () => {
    setIsSubmitting(true);
    try {
      if (bulkInput) {
        await userApi.addInterns({ unitId, input: bulkInput });
      } else {
        if (!name.trim() || !email.trim()) {
          throw new Error("Name and Email are required for single user addition.");
        }
        await userApi.addInterns({ unitId, input: { name, email } });
      }
      toast.success("User(s) added successfully. Default status is Pending.");
      setShowAddUserModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error("Failed to add user(s)");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (
    userId: string,
    isApproved: boolean,
    reason?: string
  ) => {
    setIsSubmitting(true);
    try {
      await userApi.updateStatus(userId, {
        isApproved,
        rejectionReason: reason,
      });
      toast.success("User status updated successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignUnit = async (userId: string, newUnitId?: string) => {
    setIsSubmitting(true);
    try {
      await userApi.updateStatus(userId, {
        unitId: newUnitId,
      });
      toast.success("User unit updated successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to assign unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await userApi.delete(selectedUser._id);
      toast.success("User deleted successfully");
      setShowDeleteUserModal(false);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter(user => {
      if (debouncedSearchTerm && 
          !user.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) && 
          !user.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [users, debouncedSearchTerm]);


  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600 mt-1">Manage interns and their unit assignments</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowAddUserModal(true);
            }}
            className="bg-journal-maroon hover:bg-journal-maroon-dark text-white font-bold h-11 px-6 shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add User(s)
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-journal-maroon" />
            <p className="text-gray-500 font-medium">Loading users...</p>
          </div>
        ) : (
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-journal-maroon" />
                All Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={unitFilter}
                    onChange={(e) => setUnitFilter(e.target.value)}
                    className="w-full md:w-40 rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-journal-maroon"
                  >
                    <option value="all">All Units</option>
                    <option value="unassigned">Unassigned</option>
                    {units.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={approvalFilter}
                    onChange={(e) => setApprovalFilter(e.target.value)}
                    className="w-full md:w-40 rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-journal-maroon"
                  >
                    <option value="all">All Statuses</option>
                    <option value="true">Approved</option>
                    <option value="false">Pending</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Unit
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <select
                              value={user.unit?._id || "unassigned"}
                              onChange={(e) => handleAssignUnit(user._id, e.target.value)}
                              className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-journal-maroon focus:border-journal-maroon sm:text-sm"
                              disabled={isSubmitting}
                            >
                              <option value="unassigned">Unassigned</option>
                              {units.map((unit) => (
                                <option key={unit._id} value={unit._id}>
                                  {unit.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Badge
                              variant={user.isApproved ? "default" : "secondary"}
                              className={user.isApproved ? "bg-green-100 text-green-700 hover:bg-green-100/80" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80"}
                            >
                              {user.isApproved ? "Approved" : "Pending"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {!user.isApproved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Approve User"
                                  onClick={() => handleUpdateStatus(user._id, true)}
                                  disabled={isSubmitting}
                                  className="text-green-600 hover:bg-green-50 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {user.isApproved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Mark as Pending"
                                  onClick={() => handleUpdateStatus(user._id, false)}
                                  disabled={isSubmitting}
                                  className="text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete User"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteUserModal(true);
                                }}
                                disabled={isSubmitting}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add User Modal */}
        <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <BadgePlus className="h-6 w-6 text-journal-maroon" />
                Add New User(s)
              </DialogTitle>
              <DialogDescription>
                Add single users or multiple users in bulk to units.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="single" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single User</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Add</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Name *</Label>
                  <Input
                    id="add-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="focus:ring-journal-maroon"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email *</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                    className="focus:ring-journal-maroon"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-unit">Assign Unit (Optional)</Label>
                  <select
                    id="add-unit"
                    value={unitId || ""}
                    onChange={(e) => setUnitId(e.target.value === "" ? undefined : e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-journal-maroon focus:border-journal-maroon sm:text-sm"
                  >
                    <option value="">Unassigned</option>
                    {units.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
              </TabsContent>
              <TabsContent value="bulk" className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-input">User Data (One per line)</Label>
                  <Textarea
                    id="bulk-input"
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder={`e.g.
John Doe, john@example.com
Jane Smith <jane@example.com>
user@domain.com`}
                    rows={8}
                    className="focus:ring-journal-maroon"
                  />
                                    <p className="text-xs text-gray-500">
                    <span>Separate multiple users by newlines.</span><br />
                    <span>Format: <code>'Name, Email'</code> or <code>'Name &lt;Email&gt;'</code>.</span><br />
                    <span>If only email, name will be derived.</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-unit">Assign All to Unit (Optional)</Label>
                  <select
                    id="bulk-unit"
                    value={unitId || ""}
                    onChange={(e) => setUnitId(e.target.value === "" ? undefined : e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-journal-maroon focus:border-journal-maroon sm:text-sm"
                  >
                    <option value="">Unassigned</option>
                    {units.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={isSubmitting}
                className="bg-journal-maroon hover:bg-journal-maroon-dark text-white font-bold"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add User(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteUserModal} onOpenChange={setShowDeleteUserModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">Delete User?</DialogTitle>
              <DialogDescription className="text-base pt-2">
                Are you sure you want to delete <strong>{selectedUser?.name} ({selectedUser?.email})</strong>?
                <br /><br />
                <span className="text-red-600 font-medium">
                  This action cannot be undone.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setShowDeleteUserModal(false)} className="flex-1 h-12 font-bold">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                className="flex-1 h-12 font-bold bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Yes, Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster position="top-right" />
    </AdminLayout>
  );
}
