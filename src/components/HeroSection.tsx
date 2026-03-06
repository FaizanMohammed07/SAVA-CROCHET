import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";
import YarnTextAnimation from "@/components/YarnTextAnimation";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="Handmade crochet" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 right-10 w-24 h-24 rounded-full bg-sage/30 animate-float blur-xl" />
      <div className="absolute bottom-32 right-1/4 w-16 h-16 rounded-full bg-dusty-pink/30 animate-float-slow blur-lg" />
      <div className="absolute top-1/3 right-1/3 w-12 h-12 rounded-full bg-peach/40 animate-float blur-md" />

      <div className="container mx-auto px-6 relative z-10 pt-24">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4 font-body"
          >
            Handmade with love
          </motion.p>

          <div className="mb-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-2xl md:text-3xl font-display font-light text-foreground mb-2"
            >
              Handcrafted With Love –
            </motion.p>
            <YarnTextAnimation />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-lg text-muted-foreground font-light mb-10 max-w-lg leading-relaxed"
          >
            Every stitch tells a story. Discover our collection of handmade crochet pieces, crafted with patience, care, and the finest yarns.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button size="lg" className="rounded-full px-8 py-6 text-sm tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:scale-105">
              Shop Collection
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-sm tracking-wider border-foreground/20 text-foreground hover:bg-foreground/5 transition-all duration-300 hover:scale-105"
            >
              Explore Handmade Creations
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
