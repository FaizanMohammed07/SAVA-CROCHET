import { motion } from "framer-motion";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import craftsmanship from "@/assets/craftsmanship.jpg";

const images = [
  product1,
  gallery1,
  product3,
  product6,
  craftsmanship,
  product2,
  gallery2,
  product5,
];

const GallerySection = () => {
  return (
    <section id="gallery" className="py-24 px-6 bg-card">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-3">
            Follow @savacrochets
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-light text-foreground">
            From Our Studio
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            A peek into the handmade world of Sava Crochets — behind the scenes,
            work in progress, and finished pieces.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group cursor-pointer overflow-hidden rounded-2xl"
            >
              <img
                src={img}
                alt={`Gallery image ${i + 1}`}
                className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
