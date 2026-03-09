import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Palette, Ruler, Calendar, FileText } from "lucide-react";
import { useCreateReservation } from "@/hooks/useReservations";
import { toast } from "sonner";

const CATEGORIES = [
  "Amigurumi",
  "Clothing",
  "Accessories",
  "Home Decor",
  "Baby Item",
  "Bag / Purse",
  "Wall Hanging",
  "Blanket / Throw",
  "Other",
];

const NewReservation = () => {
  const navigate = useNavigate();
  const createReservation = useCreateReservation();

  const [form, setForm] = useState({
    category: "",
    designRequest: "",
    colorPreference: "",
    size: "",
    deliveryDeadline: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReservation.mutate(
      {
        category: form.category,
        designRequest: form.designRequest,
        colorPreference: form.colorPreference || undefined,
        size: form.size || undefined,
        deliveryDeadline: form.deliveryDeadline || undefined,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            "Custom order request submitted! We'll get back to you soon.",
          );
          navigate("/account/reservations");
        },
        onError: () => toast.error("Failed to submit request"),
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3">
            Custom Order
          </h1>
          <p className="text-muted-foreground font-body mb-8">
            Tell us what you'd like and we'll craft it just for you. Every piece
            is made with love and care.
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl p-6 md:p-8 border border-border space-y-6"
          >
            <div>
              <label className="block text-sm font-body font-medium text-foreground mb-2">
                What would you like?
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, category: type })}
                    className={`px-4 py-2 rounded-xl text-sm font-body border transition ${
                      form.category === type
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-foreground mb-1.5">
                Design Request
              </label>
              <textarea
                value={form.designRequest}
                onChange={(e) =>
                  setForm({ ...form, designRequest: e.target.value })
                }
                rows={5}
                required
                placeholder="Describe your dream piece — style, purpose, any specific details..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-body font-medium text-foreground mb-1.5">
                <Palette size={14} /> Color Preference
              </label>
              <input
                value={form.colorPreference}
                onChange={(e) =>
                  setForm({ ...form, colorPreference: e.target.value })
                }
                placeholder="e.g. Dusty Pink, Sage Green, Cream"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-body font-medium text-foreground mb-1.5">
                  <Ruler size={14} /> Size (optional)
                </label>
                <input
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="e.g. 30cm tall, Medium"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-body font-medium text-foreground mb-1.5">
                  <Calendar size={14} /> Needed by (optional)
                </label>
                <input
                  type="date"
                  value={form.deliveryDeadline}
                  onChange={(e) =>
                    setForm({ ...form, deliveryDeadline: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-body font-medium text-foreground mb-1.5">
                <FileText size={14} /> Additional Notes (optional)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Any extra details, references, or special requests..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={
                createReservation.isPending ||
                !form.category ||
                !form.designRequest
              }
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {createReservation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Submit Custom Order Request
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default NewReservation;
