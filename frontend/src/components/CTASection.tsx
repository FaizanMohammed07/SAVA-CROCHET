import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-peach/30 via-background to-sage/20" />
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-dusty-pink/20 animate-float blur-2xl" />
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-sage/20 animate-float-slow blur-2xl" />

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl font-display font-light text-foreground mb-6 leading-tight">
            Find Your Perfect
            <br />
            Handcrafted Treasure
          </h2>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            Whether it's a gift for someone special or a treat for yourself,
            every Sava Crochets piece is made to be cherished. Browse our
            collection and find something that speaks to you.
          </p>
          <Button
            size="lg"
            className="rounded-full px-10 py-6 text-sm tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:scale-105"
            asChild
          >
            <Link to="/shop">Shop Now</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
