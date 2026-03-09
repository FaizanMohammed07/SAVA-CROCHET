import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { useAdminPayments, useRefundPayment } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Payment } from "@/types";

const AdminPayments = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [refundId, setRefundId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useAdminPayments({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });
  const payments = data?.data || [];
  const pagination = data?.pagination;

  const refundPayment = useRefundPayment();

  const handleRefund = async () => {
    if (!refundId) return;
    try {
      await refundPayment.mutateAsync({ paymentId: refundId });
      toast({ title: "Refund initiated" });
      setRefundId(null);
    } catch {
      toast({ title: "Error processing refund", variant: "destructive" });
    }
  };

  const statusColor = (s: string) => {
    const colors: Record<string, string> = {
      completed: "text-green-600",
      pending: "text-yellow-600",
      failed: "text-red-600",
      refunded: "text-purple-600",
    };
    return colors[s] || "";
  };

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-3xl text-foreground"
      >
        Payments
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
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-warm-brown" />
        </div>
      ) : payments.length === 0 ? (
        <p className="text-muted-foreground font-body text-center py-10">
          No payments found
        </p>
      ) : (
        <>
          <div className="overflow-x-auto bg-card rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Transaction ID
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Order
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Method
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {(payments as Payment[]).map((payment) => (
                  <tr
                    key={payment._id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-body font-mono text-xs">
                      {payment.gatewayPaymentId || payment._id.slice(-8)}
                    </td>
                    <td className="py-3 px-4 text-sm font-body text-muted-foreground">
                      {typeof payment.order === "object" &&
                      payment.order?.orderNumber
                        ? payment.order.orderNumber
                        : typeof payment.order === "string"
                          ? payment.order.slice(-6)
                          : "—"}
                    </td>
                    <td className="py-3 px-4 text-sm font-body capitalize">
                      {payment.gateway}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-sm font-body font-medium capitalize ${statusColor(payment.status)}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-body text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-body text-right font-medium">
                      ₹{payment.amount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {payment.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRefundId(payment._id)}
                          className="h-7 rounded-lg text-xs font-body text-purple-600 hover:text-purple-700"
                        >
                          <RefreshCw size={12} className="mr-1" /> Refund
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg font-body text-sm"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Refund Confirm */}
      <Dialog open={!!refundId} onOpenChange={() => setRefundId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Confirm Refund
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm font-body text-muted-foreground">
            Are you sure you want to initiate a refund for this payment?
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRefundId(null)}
              className="rounded-xl font-body"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              disabled={refundPayment.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-body"
            >
              {refundPayment.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
