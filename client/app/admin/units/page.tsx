"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { unitApi, type Unit } from "@/services/api";
import { toast, Toaster } from "sonner";
import { Layers, Plus, Pencil, Trash2, Loader2, AlertCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AdminUnitsPage() {
  const { isAuthenticated } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const response = await unitApi.getAll();
      setUnits(response.data);
    } catch (error) {
      toast.error("Failed to load units");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchUnits();
  }, [isAuthenticated]);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Unit name is required");
    setIsSubmitting(true);
    try {
      await unitApi.create({ name, description });
      toast.success("Unit created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchUnits();
    } catch (error) {
      toast.error("Failed to create unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUnit || !name.trim()) return;
    setIsSubmitting(true);
    try {
      await unitApi.update(selectedUnit._id, { name, description });
      toast.success("Unit updated successfully");
      setShowEditModal(false);
      resetForm();
      fetchUnits();
    } catch (error) {
      toast.error("Failed to update unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUnit) return;
    setIsSubmitting(true);
    try {
      await unitApi.delete(selectedUnit._id);
      toast.success("Unit deleted successfully");
      setShowDeleteModal(false);
      fetchUnits();
    } catch (error) {
      toast.error("Failed to delete unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedUnit(null);
  };

  const openEdit = (unit: Unit) => {
    setSelectedUnit(unit);
    setName(unit.name);
    setDescription(unit.description || "");
    setShowEditModal(true);
  };

  const openDelete = (unit: Unit) => {
    setSelectedUnit(unit);
    setShowDeleteModal(true);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Units Management</h1>
            <p className="text-gray-600 mt-1">Organize users into track-specific units</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="bg-journal-maroon hover:bg-journal-maroon-dark text-white font-bold h-11 px-6 shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Unit
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
             <Loader2 className="h-10 w-10 animate-spin text-journal-maroon" />
             <p className="text-gray-500 font-medium">Loading units...</p>
          </div>
        ) : units.length === 0 ? (
          <Card className="border-dashed border-2 bg-gray-50/50">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Layers className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No units found</h3>
              <p className="text-gray-500 max-w-xs mt-2">
                Start by creating units to organize your interns and track their progress.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 border-journal-maroon text-journal-maroon hover:bg-journal-maroon hover:text-white"
                onClick={() => setShowCreateModal(true)}
              >
                Create your first unit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((unit) => (
              <Card key={unit._id} className="group hover:shadow-md transition-all duration-200 border-gray-200 overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-journal-maroon/10 rounded-lg">
                       <Layers className="h-5 w-5 text-journal-maroon" />
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-gray-400 hover:text-journal-maroon hover:bg-journal-rose"
                        onClick={() => openEdit(unit)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => openDelete(unit)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="mt-3 text-xl font-bold text-gray-900 group-hover:text-journal-maroon transition-colors">
                    {unit.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 line-clamp-3 min-h-[3rem]">
                    {unit.description || "No description provided for this unit."}
                  </p>
                  <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" />
                      Created {new Date(unit.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Plus className="h-6 w-6 text-journal-maroon" />
                Create Unit
              </DialogTitle>
              <DialogDescription>
                Define a new track or department for interns.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-bold">Unit Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Technology Unit"
                  className="h-11 focus:ring-journal-maroon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="font-bold">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this unit..."
                  rows={4}
                  className="focus:ring-journal-maroon"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="h-11 px-6">
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={isSubmitting || !name.trim()}
                className="bg-journal-maroon hover:bg-journal-maroon-dark text-white font-bold h-11 px-8"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Unit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Pencil className="h-6 w-6 text-journal-maroon" />
                Edit Unit
              </DialogTitle>
              <DialogDescription>
                Update the name or description of the unit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="font-bold">Unit Name *</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Technology Unit"
                  className="h-11 focus:ring-journal-maroon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="font-bold">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this unit..."
                  rows={4}
                  className="focus:ring-journal-maroon"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="h-11 px-6">
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={isSubmitting || !name.trim()}
                className="bg-journal-maroon hover:bg-journal-maroon-dark text-white font-bold h-11 px-8"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">Delete Unit?</DialogTitle>
              <DialogDescription className="text-base pt-2">
                Are you sure you want to delete <strong>{selectedUnit?.name}</strong>? 
                <br /><br />
                <span className="text-red-600 font-medium">
                  This action cannot be undone. Users in this unit will become "Unassigned".
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1 h-12 font-bold">
                Cancel, Keep Unit
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 h-12 font-bold bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Yes, Delete Unit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
      <Toaster position="top-right" />
    </AdminLayout>
  );
}
