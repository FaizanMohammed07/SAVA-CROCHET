import { motion } from "framer-motion";
import { Eye, Heart } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const products = [
  { name: "Amigurumi Bear", price: "$45", image: product1, tag: "Best Seller" },
  { name: "Sage Baby Blanket", price: "$89", image: product2, tag: "New" },
  { name: "Floral Tote Bag", price: "$62", image: product3, tag: null },
  { name: "Artisan Coaster Set", price: "$28", image: product4, tag: null },
  { name: "Bucket Hat", price: "$38", image: product5, tag: "New" },
  { name: "Flower Bouquet", price: "$55", image: product6, tag: "Popular" },
];

const FeaturedCollection = () => {
  return (
    <section id="shop" className="py-24 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-3">Curated for you</p>
          <h2 className="text-4xl md:text-5xl font-display font-light text-foreground">
            Featured Collection
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, i) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl bg-card mb-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />

                {product.tag && (
                  <span className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm text-foreground text-xs px-3 py-1 rounded-full tracking-wider">
                    {product.tag}
                  </span>
                )}

                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <button className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors">
                    <Heart size={16} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors">
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">{product.price}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollection;
