"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  heading: string;
}

interface CreateEnvelopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string;
  teamId: string;
  onSuccess: () => void;
}

export function CreateEnvelopeDialog({
  open,
  onOpenChange,
  budgetId,
  teamId,
  onSuccess,
}: CreateEnvelopeDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: "",
    vendorMatchType: "ANY" as "ANY" | "EXACT" | "CONTAINS",
    vendorMatch: "",
    capAmount: "",
    periodType: "SEASON_WIDE" as "SEASON_WIDE" | "MONTHLY",
    startDate: "",
    endDate: "",
    maxSingleTransaction: "",
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teamId]);

  async function fetchCategories() {
    try {
      const response = await fetch(`/api/categories?teamId=${teamId}`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (!formData.capAmount || Number(formData.capAmount) <= 0) {
      toast.error("Please enter a valid cap amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/budget-envelopes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetId,
          categoryId: formData.categoryId,
          vendorMatchType: formData.vendorMatchType,
          vendorMatch: formData.vendorMatch || null,
          capAmount: Number(formData.capAmount),
          periodType: formData.periodType,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          maxSingleTransaction: formData.maxSingleTransaction
            ? Number(formData.maxSingleTransaction)
            : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create envelope");
      }

      toast.success("Pre-authorized envelope created successfully");
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Error creating envelope:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create envelope");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      categoryId: "",
      vendorMatchType: "ANY",
      vendorMatch: "",
      capAmount: "",
      periodType: "SEASON_WIDE",
      startDate: "",
      endDate: "",
      maxSingleTransaction: "",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Pre-Authorized Envelope</DialogTitle>
          <DialogDescription>
            Create an envelope to auto-approve recurring expenses within budget guardrails.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Budget Category *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) =>
                setFormData({ ...formData, categoryId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.heading} - {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capAmount">Cap Amount ($) *</Label>
              <Input
                id="capAmount"
                type="number"
                step="0.01"
                min="0"
                max="100000"
                placeholder="5000.00"
                value={formData.capAmount}
                onChange={(e) =>
                  setFormData({ ...formData, capAmount: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum total amount for this envelope
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodType">Period Type</Label>
              <Select
                value={formData.periodType}
                onValueChange={(value: "SEASON_WIDE" | "MONTHLY") =>
                  setFormData({ ...formData, periodType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEASON_WIDE">Season-Wide</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.periodType === "MONTHLY"
                  ? "Cap resets each month"
                  : "Cap applies to entire season"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorMatchType">Vendor Restriction</Label>
            <Select
              value={formData.vendorMatchType}
              onValueChange={(value: "ANY" | "EXACT" | "CONTAINS") =>
                setFormData({ ...formData, vendorMatchType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">Any Vendor</SelectItem>
                <SelectItem value="EXACT">Exact Match</SelectItem>
                <SelectItem value="CONTAINS">Contains Text</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.vendorMatchType !== "ANY" && (
            <div className="space-y-2">
              <Label htmlFor="vendorMatch">Vendor Name</Label>
              <Input
                id="vendorMatch"
                placeholder="e.g., Ice Arena"
                value={formData.vendorMatch}
                onChange={(e) =>
                  setFormData({ ...formData, vendorMatch: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                {formData.vendorMatchType === "EXACT"
                  ? "Vendor must match exactly"
                  : "Vendor must contain this text"}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maxSingleTransaction">
              Max Single Transaction ($)
            </Label>
            <Input
              id="maxSingleTransaction"
              type="number"
              step="0.01"
              min="0"
              max="100000"
              placeholder="500.00"
              value={formData.maxSingleTransaction}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxSingleTransaction: e.target.value,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Optional: Maximum amount for a single transaction (prevents one large expense)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Envelope"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
