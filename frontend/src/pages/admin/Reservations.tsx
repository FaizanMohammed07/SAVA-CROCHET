import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MessageSquare, DollarSign } from "lucide-react";
import {
  useAdminReservations,
  useUpdateReservationStatus,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Reservation } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-purple-100 text-purple-800",
  rejected: "bg-gray-100 text-gray-800",
  in_production: "bg-orange-100 text-orange-800",
  quality_check: "bg-teal-100 text-teal-800",
  ready: "bg-indigo-100 text-indigo-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminReservations = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  const { data, isLoading } = useAdminReservations({
    page,
    limit: 15,
    status: statusFilter || undefined,
  });
  const reservations = (data?.data as Reservation[]) || [];
  const pagination = data?.pagination;

  const updateStatus = useUpdateReservationStatus();

  const openUpdate = (res: Reservation) => {
    setSelectedRes(res);
    setNewStatus(res.status);
    setEstimatedPrice(res.estimatedPrice?.toString() || "");
    setAdminNotes(res.adminNotes || "");
    setDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedRes) return;
    try {
      await updateStatus.mutateAsync({
        id: selectedRes._id,
        status: newStatus,
        estimatedPrice: estimatedPrice ? Number(estimatedPrice) : undefined,
        adminNotes: adminNotes || undefined,
      });
      toast({ title: "Reservation updated" });
      setDialogOpen(false);
    } catch {
      toast({ title: "Error updating reservation", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-3xl text-foreground"
      >
        Reservations
      </motion.h1>

      <Select
        value={statusFilter}
        onValueChange={(v) => {
          setStatusFilter(v === "all" ? "" : v);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-40 rounded-xl font-body">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.keys(statusColors).map((s) => (
            <SelectItem key={s} value={s} className="capitalize">
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-warm-brown" />
        </div>
      ) : reservations.length === 0 ? (
        <p className="text-muted-foreground font-body text-center py-10">
          No reservations found
        </p>
      ) : (
        <>
          <div className="grid gap-4">
            {reservations.map((res: Reservation) => (
              <div
                key={res._id}
                className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-body font-medium capitalize ${statusColors[res.status]}`}
                      >
                        {res.status}
                      </span>
                      <span className="text-xs text-muted-foreground font-body">
                        {new Date(res.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-body text-sm font-medium capitalize mb-1">
                      {res.category || "Custom"}
                    </p>
                    <p className="text-sm font-body text-muted-foreground line-clamp-2">
                      {res.designRequest}
                    </p>
                    {res.colorPreference?.length > 0 && (
                      <p className="text-xs font-body text-muted-foreground mt-1">
                        Color: {res.colorPreference}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs font-body text-muted-foreground">
                      {res.size && <span>Size: {res.size}</span>}
                      {res.deliveryDeadline && (
                        <span>
                          Deadline:{" "}
                          {new Date(res.deliveryDeadline).toLocaleDateString()}
                        </span>
                      )}
                      {res.priority && <span>Priority: {res.priority}</span>}
                    </div>
                    {res.estimatedPrice && (
                      <p className="text-sm font-body font-medium mt-2 text-warm-brown">
                        <DollarSign size={14} className="inline -mt-0.5" />{" "}
                        Estimated: ₹{res.estimatedPrice.toLocaleString()}
                      </p>
                    )}
                    {res.adminNotes && (
                      <p className="text-xs font-body text-muted-foreground mt-1 italic">
                        <MessageSquare
                          size={12}
                          className="inline -mt-0.5 mr-1"
                        />{" "}
                        {res.adminNotes}
                      </p>
                    )}
                    <p className="text-xs font-body text-muted-foreground mt-1">
                      By:{" "}
                      {typeof res.user === "object"
                        ? res.user.fullName ||
                          `${res.user.firstName} ${res.user.lastName}`
                        : "User"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => openUpdate(res)}
                    className="rounded-xl font-body text-sm shrink-0"
                  >
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg font-body text-sm"
              >
                Previous
              </Button>
              <span className="text-sm font-body text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(page + 1)}
                className="rounded-lg font-body text-sm"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Manage Reservation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-body font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1 rounded-xl font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(statusColors).map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-body font-medium">
                Estimated Price (₹)
              </label>
              <Input
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                type="number"
                className="mt-1 rounded-xl font-body"
                placeholder="Enter price estimate"
              />
            </div>
            <div>
              <label className="text-sm font-body font-medium">
                Admin Notes
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1 rounded-xl font-body"
                rows={3}
                placeholder="Add notes for the customer..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl font-body"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateStatus.isPending}
              className="bg-warm-brown hover:bg-warm-brown/90 rounded-xl font-body"
            >
              {updateStatus.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReservations;
