import { motion } from "framer-motion";
import { Scissors, Heart, Clock, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Sparkles,
    title: "Premium Yarns",
    desc: "We handpick the softest, highest-quality natural and organic yarns — cotton, wool, and blends — from trusted artisan suppliers worldwide.",
  },
  {
    icon: Heart,
    title: "Made With Love",
    desc: "No machines, no shortcuts. Every single piece is handcrafted with care, ensuring each stitch carries warmth and intention.",
  },
  {
    icon: Clock,
    title: "Time & Patience",
    desc: "Great things take time. Our creations take hours — sometimes days — to complete, resulting in truly unique, one-of-a-kind treasures.",
  },
  {
    icon: Scissors,
    title: "Finished by Hand",
    desc: "Every item is carefully finished, quality-inspected, and beautifully gift-wrapped for an unforgettable boutique unboxing experience.",
  },
];

const CraftsmanshipSection = () => {
  return (
    <section className="py-24 px-6 bg-card">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-3">
            The Process
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-light text-foreground">
            Our Craftsmanship
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center mx-auto mb-5 group-hover:bg-accent transition-colors duration-300">
                <step.icon size={24} className="text-primary" />
              </div>
              <h3 className="font-display text-xl text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CraftsmanshipSection;
