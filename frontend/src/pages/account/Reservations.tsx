import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CalendarClock, Plus } from "lucide-react";
import {
  useReservations,
  useCancelReservation,
  useAcceptPriceEstimate,
} from "@/hooks/useReservations";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-indigo-100 text-indigo-800",
  rejected: "bg-red-100 text-red-800",
  in_production: "bg-orange-100 text-orange-800",
  quality_check: "bg-cyan-100 text-cyan-800",
  ready: "bg-teal-100 text-teal-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const Reservations = () => {
  const { data, isLoading } = useReservations();
  const cancelReservation = useCancelReservation();
  const acceptPrice = useAcceptPriceEstimate();
  const reservations = data?.data || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-warm-brown" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-3xl text-foreground"
          >
            My Custom Orders
          </motion.h1>
          <Link
            to="/reservations/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-body text-sm hover:opacity-90 transition"
          >
            <Plus size={16} /> New Request
          </Link>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <CalendarClock className="text-muted-foreground" size={28} />
            </div>
            <h2 className="font-display text-xl text-foreground mb-2">
              No custom orders yet
            </h2>
            <p className="text-muted-foreground font-body mb-4">
              Request a bespoke handcrafted piece
            </p>
            <Link
              to="/reservations/new"
              className="text-primary font-body text-sm hover:underline"
            >
              Make a Request
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => (
              <div
                key={res._id}
                className="bg-card rounded-2xl p-5 border border-border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">
                      #{res.reservationNumber}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {new Date(res.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-body font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[res.status] || "bg-muted"}`}
                  >
                    {res.status.replace("_", " ")}
                  </span>
                </div>
                <p className="font-body text-sm text-foreground mb-1">
                  <strong>Category:</strong> {res.category}
                </p>
                <p className="font-body text-sm text-muted-foreground line-clamp-2 mb-2">
                  {res.designRequest}
                </p>
                {res.colorPreference && (
                  <p className="font-body text-xs text-muted-foreground">
                    Color: {res.colorPreference}
                  </p>
                )}
                {res.estimatedPrice && (
                  <p className="font-body text-sm text-foreground mt-2">
                    Quoted: ₹{res.estimatedPrice.toLocaleString()}
                  </p>
                )}
                {res.status === "approved" &&
                  res.estimatedPrice &&
                  !res.priceAccepted && (
                    <button
                      onClick={() =>
                        acceptPrice.mutate(res._id, {
                          onSuccess: () =>
                            toast.success(
                              "Price accepted! Production will begin.",
                            ),
                          onError: () => toast.error("Failed to accept price"),
                        })
                      }
                      disabled={acceptPrice.isPending}
                      className="mt-2 px-4 py-2 rounded-xl bg-green-600 text-white font-body text-sm hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {acceptPrice.isPending
                        ? "Accepting..."
                        : "Accept Price & Proceed"}
                    </button>
                  )}
                {res.priceAccepted && (
                  <p className="font-body text-xs text-green-600 mt-1 font-medium">
                    ✓ Price accepted
                  </p>
                )}
                {res.adminNotes && (
                  <p className="font-body text-xs text-sage mt-1 italic">
                    Note: {res.adminNotes}
                  </p>
                )}
                {["pending", "under_review"].includes(res.status) && (
                  <button
                    onClick={() =>
                      cancelReservation.mutate(
                        { id: res._id },
                        { onSuccess: () => toast.success("Cancelled") },
                      )
                    }
                    className="mt-3 text-xs text-destructive font-body hover:underline"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservations;
