import { motion } from "framer-motion";
import { Instagram, Facebook, Heart, MessageCircle } from "lucide-react";

const FooterSection = () => {
  return (
    <footer
      id="contact"
      className="bg-foreground text-primary-foreground py-16 px-6"
    >
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12"
        >
          <div className="md:col-span-2">
            <h3 className="font-display text-2xl mb-4">Sava Crochets</h3>
            <p className="text-primary-foreground/60 text-sm leading-relaxed max-w-sm mb-6">
              Handmade crochet creations crafted with love, patience, and the
              finest natural yarns. Every stitch tells a story — every piece is
              made to be cherished.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/10 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/10 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/10 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4">Quick Links</h4>
            <div className="flex flex-col gap-3">
              {["Shop", "About", "Gallery", "Contact"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4">Stay in the Loop</h4>
            <p className="text-sm text-primary-foreground/60 mb-4">
              Be the first to know about new collections, special offers, and
              behind-the-scenes stories.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-primary-foreground/10 rounded-l-full px-4 py-2 text-sm outline-none border border-primary-foreground/20 placeholder:text-primary-foreground/40"
              />
              <button className="bg-primary-foreground/20 hover:bg-primary-foreground/30 px-5 py-2 rounded-r-full text-sm transition-colors">
                Join
              </button>
            </div>
          </div>
        </motion.div>

        <div className="section-divider mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/40">
            © 2026 Sava Crochets. All rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/40 flex items-center gap-1">
            Made with <Heart size={12} className="text-dusty-pink" /> by Sava
            Crochets
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
