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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Envelope {
  id: string;
  categoryId: string;
  vendorMatchType: string;
  vendorMatch: string | null;
  capAmount: number;
  periodType: string;
  startDate: string | null;
  endDate: string | null;
  maxSingleTransaction: number | null;
  isActive: boolean;
}

interface EditEnvelopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  envelope: Envelope;
  onSuccess: () => void;
}

export function EditEnvelopeDialog({
  open,
  onOpenChange,
  envelope,
  onSuccess,
}: EditEnvelopeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorMatchType: envelope.vendorMatchType as "ANY" | "EXACT" | "CONTAINS",
    vendorMatch: envelope.vendorMatch || "",
    capAmount: envelope.capAmount.toString(),
    periodType: envelope.periodType as "SEASON_WIDE" | "MONTHLY",
    startDate: envelope.startDate ? envelope.startDate.split("T")[0] : "",
    endDate: envelope.endDate ? envelope.endDate.split("T")[0] : "",
    maxSingleTransaction: envelope.maxSingleTransaction?.toString() || "",
    isActive: envelope.isActive,
  });

  useEffect(() => {
    setFormData({
      vendorMatchType: envelope.vendorMatchType as "ANY" | "EXACT" | "CONTAINS",
      vendorMatch: envelope.vendorMatch || "",
      capAmount: envelope.capAmount.toString(),
      periodType: envelope.periodType as "SEASON_WIDE" | "MONTHLY",
      startDate: envelope.startDate ? envelope.startDate.split("T")[0] : "",
      endDate: envelope.endDate ? envelope.endDate.split("T")[0] : "",
      maxSingleTransaction: envelope.maxSingleTransaction?.toString() || "",
      isActive: envelope.isActive,
    });
  }, [envelope]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.capAmount || Number(formData.capAmount) <= 0) {
      toast.error("Please enter a valid cap amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/budget-envelopes/${envelope.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorMatchType: formData.vendorMatchType,
          vendorMatch: formData.vendorMatch || null,
          capAmount: Number(formData.capAmount),
          periodType: formData.periodType,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          maxSingleTransaction: formData.maxSingleTransaction
            ? Number(formData.maxSingleTransaction)
            : null,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update envelope");
      }

      toast.success("Envelope updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error updating envelope:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update envelope");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pre-Authorized Envelope</DialogTitle>
          <DialogDescription>
            Update envelope settings. Category cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Deactivate to stop auto-approvals
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
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
                value={formData.capAmount}
                onChange={(e) =>
                  setFormData({ ...formData, capAmount: e.target.value })
                }
                required
              />
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
                value={formData.vendorMatch}
                onChange={(e) =>
                  setFormData({ ...formData, vendorMatch: e.target.value })
                }
              />
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
              value={formData.maxSingleTransaction}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxSingleTransaction: e.target.value,
                })
              }
            />
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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
