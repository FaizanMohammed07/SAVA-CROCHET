import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, Truck, Eye } from "lucide-react";
import { useAdminOrders, useUpdateOrderStatus } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Order } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
  refunded: "bg-gray-100 text-gray-800",
};

const AdminOrders = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const { toast } = useToast();

  const { data, isLoading } = useAdminOrders({
    page,
    limit: 15,
    status: statusFilter || undefined,
    search: search || undefined,
  });
  const orders = (data?.data as Order[]) || [];
  const pagination = data?.pagination;

  const updateStatus = useUpdateOrderStatus();

  const openUpdateDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || "");
    setUpdateDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedOrder) return;
    try {
      await updateStatus.mutateAsync({
        orderId: selectedOrder._id,
        status: newStatus,
        trackingNumber: trackingNumber || undefined,
      });
      toast({ title: "Order updated" });
      setUpdateDialogOpen(false);
    } catch {
      toast({ title: "Error updating order", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-3xl text-foreground"
      >
        Orders
      </motion.h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl font-body"
          />
        </div>
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
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-warm-brown" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground font-body text-center py-10">
          No orders found
        </p>
      ) : (
        <>
          <div className="overflow-x-auto bg-card rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Order #
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Payment
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-body font-medium">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-sm font-body text-muted-foreground">
                      {typeof order.user === "object"
                        ? order.user.fullName ||
                          `${order.user.firstName} ${order.user.lastName}`
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-sm font-body text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-body font-medium capitalize ${statusColors[order.status] || "bg-muted"}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-body capitalize ${order.paymentInfo?.status === "paid" ? "text-green-600" : order.paymentInfo?.status === "failed" ? "text-red-600" : "text-yellow-600"}`}
                      >
                        {order.paymentInfo?.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-body text-right font-medium">
                      ₹{order.totalAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedOrder(order)}
                          className="h-8 w-8 rounded-lg"
                          title="View"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openUpdateDialog(order)}
                          className="h-8 w-8 rounded-lg"
                          title="Update Status"
                        >
                          <Truck size={14} />
                        </Button>
                      </div>
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

      {/* Order Detail Dialog */}
      {selectedOrder && !updateDialogOpen && (
        <Dialog
          open={!!selectedOrder}
          onOpenChange={() => setSelectedOrder(null)}
        >
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Order #{selectedOrder.orderNumber}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm font-body">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[selectedOrder.status]}`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className="capitalize">
                  {selectedOrder.paymentInfo?.status} (
                  {selectedOrder.paymentInfo?.method})
                </span>
              </div>
              {selectedOrder.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tracking</span>
                  <span>{selectedOrder.trackingNumber}</span>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-2">Items</p>
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span>
                      {typeof item.product === "object"
                        ? item.product.productName
                        : "Product"}{" "}
                      × {item.quantity}
                    </span>
                    <span>
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between font-medium text-base">
                  <span>Total</span>
                  <span>₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
              {selectedOrder.shippingAddress && (
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Shipping Address
                  </p>
                  <p>{selectedOrder.shippingAddress.fullName}</p>
                  <p className="text-muted-foreground">
                    {selectedOrder.shippingAddress.addressLine1},{" "}
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state} -{" "}
                    {selectedOrder.shippingAddress.pincode}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setSelectedOrder(null);
                  openUpdateDialog(selectedOrder);
                }}
                className="bg-warm-brown hover:bg-warm-brown/90 rounded-xl font-body"
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Update Order Status
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
                  {[
                    "pending",
                    "confirmed",
                    "processing",
                    "shipped",
                    "out_for_delivery",
                    "delivered",
                    "cancelled",
                    "returned",
                    "refunded",
                  ].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newStatus === "shipped" && (
              <div>
                <label className="text-sm font-body font-medium">
                  Tracking Number
                </label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="mt-1 rounded-xl font-body"
                  placeholder="Enter tracking number"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
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

export default AdminOrders;
