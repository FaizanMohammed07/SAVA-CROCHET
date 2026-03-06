import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";
import YarnTextAnimation from "@/components/YarnTextAnimation";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Initial viewport - background + intro */}
      <div className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Handmade crochet"
            className="w-full h-full object-cover"
          />
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
              Artisan Crochet — Made by Hand
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-4xl md:text-6xl font-display font-light leading-tight text-foreground mb-6"
            >
              Where Every Stitch
              <br />
              <span className="text-gradient">Tells a Story</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg text-muted-foreground font-light mb-10 max-w-lg leading-relaxed"
            >
              Explore our curated collection of one-of-a-kind crochet pieces —
              from cozy blankets to charming amigurumi — each lovingly
              handcrafted with premium natural yarns.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-sm tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                Shop Collection
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-sm tracking-wider border-foreground/20 text-foreground hover:bg-foreground/5 transition-all duration-300 hover:scale-105"
              >
                Our Story
              </Button>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="mt-16 flex flex-col items-start gap-2"
            >
              <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-body">
                Scroll to discover
              </span>
              <motion.div
                className="w-px h-12 bg-gradient-to-b from-muted-foreground/50 to-transparent"
                animate={{ scaleY: [1, 0.5, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll-driven crochet text animation */}
      <div className="bg-gradient-to-b from-background via-cream/30 to-background">
        <YarnTextAnimation />
      </div>
    </section>
  );
};

export default HeroSection;
