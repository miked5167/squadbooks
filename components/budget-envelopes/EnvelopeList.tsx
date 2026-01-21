"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { CreateEnvelopeDialog } from "./CreateEnvelopeDialog";
import { EditEnvelopeDialog } from "./EditEnvelopeDialog";
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
  spent: number;
  remaining: number;
  percentUsed: number;
  transactionCount: number;
  category: {
    id: string;
    name: string;
    heading: string;
    color: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface EnvelopeListProps {
  teamId: string;
  budgetId: string;
  budgetStatus: string;
}

export function EnvelopeList({ teamId, budgetId, budgetStatus }: EnvelopeListProps) {
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingEnvelope, setEditingEnvelope] = useState<Envelope | null>(null);

  const canManageEnvelopes = budgetStatus === "LOCKED";

  useEffect(() => {
    fetchEnvelopes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, budgetId]);

  async function fetchEnvelopes() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/budget-envelopes?teamId=${teamId}&budgetId=${budgetId}`
      );
      if (!response.ok) throw new Error("Failed to fetch envelopes");
      const data = await response.json();
      setEnvelopes(data.envelopes || []);
    } catch (error) {
      console.error("Error fetching envelopes:", error);
      toast.error("Failed to load pre-authorized envelopes");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(envelopeId: string) {
    if (!confirm("Are you sure you want to deactivate this envelope? Existing transactions won't be affected.")) {
      return;
    }

    try {
      const response = await fetch(`/api/budget-envelopes/${envelopeId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete envelope");

      toast.success("Envelope deactivated successfully");
      fetchEnvelopes();
    } catch (error) {
      console.error("Error deleting envelope:", error);
      toast.error("Failed to deactivate envelope");
    }
  }

  function getStatusColor(percentUsed: number): string {
    if (percentUsed >= 95) return "text-red-600";
    if (percentUsed >= 80) return "text-yellow-600";
    return "text-green-600";
  }


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pre-Authorized Budget Envelopes</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pre-Authorized Budget Envelopes</CardTitle>
              <CardDescription>
                Auto-approve recurring expenses like ice time without approval fatigue.
                {budgetStatus !== "LOCKED" && (
                  <span className="block mt-2 text-yellow-600 dark:text-yellow-500">
                    <AlertCircle className="inline-block h-4 w-4 mr-1" />
                    Budget must be LOCKED to create envelopes
                  </span>
                )}
              </CardDescription>
            </div>
            {canManageEnvelopes && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Envelope
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {envelopes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No pre-authorized envelopes configured yet.</p>
              {canManageEnvelopes && (
                <p className="text-sm mt-2">
                  Create envelopes for recurring expenses to enable auto-approval.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {envelopes.map((envelope) => (
                <div
                  key={envelope.id}
                  className={`border rounded-lg p-4 ${
                    !envelope.isActive ? "opacity-50 bg-gray-50 dark:bg-gray-900" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{envelope.category.heading}</h3>
                        <Badge variant="outline">{envelope.category.name}</Badge>
                        {!envelope.isActive && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                        <Badge variant="secondary">
                          {envelope.periodType === "MONTHLY" ? "Monthly" : "Season-Wide"}
                        </Badge>
                      </div>

                      {envelope.vendorMatch && envelope.vendorMatchType !== "ANY" && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Vendor: {envelope.vendorMatchType === "EXACT" ? "Exactly" : "Contains"}{" "}
                          <span className="font-medium">{envelope.vendorMatch}</span>
                        </p>
                      )}

                      {envelope.maxSingleTransaction && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Max single transaction: $
                          {Number(envelope.maxSingleTransaction).toFixed(2)}
                        </p>
                      )}

                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            ${envelope.spent.toFixed(2)} of $
                            {Number(envelope.capAmount).toFixed(2)} used
                          </span>
                          <span className={`font-medium ${getStatusColor(envelope.percentUsed)}`}>
                            {envelope.percentUsed.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(envelope.percentUsed, 100)}
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{envelope.transactionCount} transactions</span>
                          <span className={getStatusColor(envelope.percentUsed)}>
                            ${envelope.remaining.toFixed(2)} remaining
                          </span>
                        </div>
                      </div>
                    </div>

                    {canManageEnvelopes && envelope.isActive && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingEnvelope(envelope)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(envelope.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateEnvelopeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        budgetId={budgetId}
        teamId={teamId}
        onSuccess={() => {
          setCreateDialogOpen(false);
          fetchEnvelopes();
        }}
      />

      {editingEnvelope && (
        <EditEnvelopeDialog
          open={!!editingEnvelope}
          onOpenChange={(open) => !open && setEditingEnvelope(null)}
          envelope={editingEnvelope}
          onSuccess={() => {
            setEditingEnvelope(null);
            fetchEnvelopes();
          }}
        />
      )}
    </div>
  );
}
