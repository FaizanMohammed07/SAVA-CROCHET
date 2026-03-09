import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Pencil, Trash2, Copy, Check } from "lucide-react";
import {
  useAdminCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Coupon } from "@/types";

const AdminCoupons = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useAdminCoupons();
  const coupons: Coupon[] = (data?.data as Coupon[]) || [];

  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const openCreate = () => {
    setEditCoupon(null);
    setDialogOpen(true);
  };
  const openEdit = (c: Coupon) => {
    setEditCoupon(c);
    setDialogOpen(true);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      code: fd.get("code") as string,
      discountType: fd.get("discountType") as "percentage" | "flat",
      discountValue: Number(fd.get("discountValue")),
      minOrderAmount: Number(fd.get("minOrderAmount")) || 0,
      maxDiscount: Number(fd.get("maxDiscount")) || undefined,
      usageLimit: Number(fd.get("usageLimit")) || undefined,
      // Use UTC explicitly (Z suffix) so "2026-03-09" → 2026-03-09T00:00:00.000Z (not local time)
      startDate: fd.get("startDate")
        ? new Date(
            (fd.get("startDate") as string) + "T00:00:00.000Z",
          ).toISOString()
        : new Date().toISOString(),
      endDate: fd.get("endDate")
        ? new Date(
            (fd.get("endDate") as string) + "T23:59:59.999Z",
          ).toISOString()
        : undefined,
      isActive: (fd.get("isActive") as string) === "on",
    };

    try {
      if (editCoupon) {
        await updateCoupon.mutateAsync({ id: editCoupon._id, ...payload });
        toast({ title: "Coupon updated" });
      } else {
        await createCoupon.mutateAsync(payload);
        toast({ title: "Coupon created" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Error saving coupon", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCoupon.mutateAsync(deleteId);
      toast({ title: "Coupon deleted" });
      setDeleteId(null);
    } catch {
      toast({ title: "Error deleting coupon", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-3xl text-foreground"
        >
          Coupons
        </motion.h1>
        <Button
          onClick={openCreate}
          className="bg-warm-brown hover:bg-warm-brown/90 rounded-xl"
        >
          <Plus size={16} className="mr-1" /> Create Coupon
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-warm-brown" />
        </div>
      ) : coupons.length === 0 ? (
        <p className="text-muted-foreground font-body text-center py-10">
          No coupons yet
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <div
              key={coupon._id}
              className="bg-card rounded-2xl border border-border p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <code className="text-base font-bold tracking-wider text-warm-brown">
                    {coupon.code}
                  </code>
                  <button
                    onClick={() => copyCode(coupon.code, coupon._id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copiedId === coupon._id ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-body ${coupon.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {coupon.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="text-sm font-body space-y-1">
                <p className="text-foreground font-medium">
                  {coupon.discountType === "percentage"
                    ? `${coupon.discountValue}% off`
                    : `₹${coupon.discountValue} flat off`}
                </p>
                {coupon.minOrderAmount > 0 && (
                  <p className="text-muted-foreground text-xs">
                    Min order: ₹{coupon.minOrderAmount.toLocaleString()}
                  </p>
                )}
                {coupon.maxDiscount && (
                  <p className="text-muted-foreground text-xs">
                    Max discount: ₹{coupon.maxDiscount.toLocaleString()}
                  </p>
                )}
                {coupon.endDate && (
                  <p className="text-muted-foreground text-xs">
                    Expires: {new Date(coupon.endDate).toLocaleDateString()}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Used: {coupon.usedCount || 0}
                  {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(coupon)}
                  className="rounded-lg text-xs font-body flex-1"
                >
                  <Pencil size={12} className="mr-1" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(coupon._id)}
                  className="rounded-lg text-xs font-body text-red-500 hover:text-red-600"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editCoupon ? "Edit Coupon" : "Create Coupon"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-body font-medium">Code *</label>
              <Input
                name="code"
                defaultValue={editCoupon?.code || ""}
                required
                className="mt-1 rounded-xl font-body uppercase"
                placeholder="SUMMER20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-body font-medium">
                  Discount Type
                </label>
                <Select
                  name="discountType"
                  defaultValue={editCoupon?.discountType || "percentage"}
                >
                  <SelectTrigger className="mt-1 rounded-xl font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-body font-medium">
                  Discount Value *
                </label>
                <Input
                  name="discountValue"
                  type="number"
                  defaultValue={editCoupon?.discountValue || ""}
                  required
                  className="mt-1 rounded-xl font-body"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-body font-medium">
                  Min Order (₹)
                </label>
                <Input
                  name="minOrderAmount"
                  type="number"
                  defaultValue={editCoupon?.minOrderAmount || ""}
                  className="mt-1 rounded-xl font-body"
                />
              </div>
              <div>
                <label className="text-sm font-body font-medium">
                  Max Discount (₹)
                </label>
                <Input
                  name="maxDiscount"
                  type="number"
                  defaultValue={editCoupon?.maxDiscount || ""}
                  className="mt-1 rounded-xl font-body"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-body font-medium">
                  Usage Limit
                </label>
                <Input
                  name="usageLimit"
                  type="number"
                  defaultValue={editCoupon?.usageLimit || ""}
                  className="mt-1 rounded-xl font-body"
                />
              </div>
              <div>
                <label className="text-sm font-body font-medium">
                  Start Date *
                </label>
                <Input
                  name="startDate"
                  type="date"
                  required
                  defaultValue={
                    editCoupon?.startDate
                      ? new Date(editCoupon.startDate)
                          .toISOString()
                          .split("T")[0]
                      : new Date().toISOString().split("T")[0]
                  }
                  className="mt-1 rounded-xl font-body"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-body font-medium">
                  End Date *
                </label>
                <Input
                  name="endDate"
                  type="date"
                  required
                  defaultValue={
                    editCoupon?.endDate
                      ? new Date(editCoupon.endDate).toISOString().split("T")[0]
                      : ""
                  }
                  className="mt-1 rounded-xl font-body"
                />
              </div>
              <div />
            </div>
            <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={editCoupon?.isActive !== false}
                className="rounded"
              />
              Active
            </label>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl font-body"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCoupon.isPending || updateCoupon.isPending}
                className="bg-warm-brown hover:bg-warm-brown/90 rounded-xl font-body"
              >
                {(createCoupon.isPending || updateCoupon.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                )}
                {editCoupon ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Delete Coupon
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm font-body text-muted-foreground">
            Are you sure? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="rounded-xl font-body"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteCoupon.isPending}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-body"
            >
              {deleteCoupon.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
