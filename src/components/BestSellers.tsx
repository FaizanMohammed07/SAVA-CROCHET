import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import product1 from "@/assets/product-1.jpg";
import product3 from "@/assets/product-3.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const bestSellers = [
  { name: "Amigurumi Bear", price: "$45", image: product1, reviews: 48 },
  { name: "Floral Tote Bag", price: "$62", image: product3, reviews: 35 },
  { name: "Bucket Hat", price: "$38", image: product5, reviews: 29 },
  { name: "Flower Bouquet", price: "$55", image: product6, reviews: 52 },
];

const BestSellers = () => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % bestSellers.length);
  const prev = () => setCurrent((c) => (c - 1 + bestSellers.length) % bestSellers.length);

  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-3">Most Loved</p>
            <h2 className="text-4xl md:text-5xl font-display font-light text-foreground">Best Sellers</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={prev} className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-card transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-card transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="overflow-hidden rounded-2xl mb-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-display text-lg text-foreground">{item.name}</h3>
              <div className="flex items-center justify-between mt-1">
                <p className="text-muted-foreground text-sm">{item.price}</p>
                <p className="text-xs text-muted-foreground">{item.reviews} reviews</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
