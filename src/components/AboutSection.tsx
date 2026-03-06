import { motion } from "framer-motion";
import craftsmanship from "@/assets/craftsmanship.jpg";

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-6 bg-card">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden">
              <img
                src={craftsmanship}
                alt="Handmade crochet craftsmanship"
                className="w-full h-[500px] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-2xl bg-sage/30 -z-10" />
            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-peach/30 -z-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-3">
              Our Story
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-light text-foreground mb-6">
              About Sava Crochets
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              What began as a quiet evening hobby has blossomed into Sava
              Crochets — a brand built on passion, patience, and the timeless
              art of handmade crochet. Every creation starts with carefully
              selected premium natural yarns and ends with a piece that carries
              warmth in every stitch.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              We don't rush. We don't mass-produce. Each item is thoughtfully
              designed and meticulously handcrafted, making every Sava piece
              truly one of a kind. From adorable amigurumi to cozy blankets, our
              work is a celebration of slow craftsmanship and heartfelt
              artistry.
            </p>

            <div className="grid grid-cols-3 gap-6">
              {[
                { num: "500+", label: "Pieces Crafted" },
                { num: "100%", label: "Handmade" },
                { num: "200+", label: "Happy Customers" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-display font-semibold text-primary">
                    {stat.num}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
