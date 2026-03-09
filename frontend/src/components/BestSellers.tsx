import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import product1 from "@/assets/product-1.jpg";
import product3 from "@/assets/product-3.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const fallbackBestSellers = [
  {
    _id: "fb-1",
    productName: "Amigurumi Teddy Bear",
    price: 2499,
    images: [{ url: product1, public_id: "" }],
    rating: { average: 4.8, count: 48 },
  },
  {
    _id: "fb-2",
    productName: "Boho Floral Tote Bag",
    price: 3499,
    images: [{ url: product3, public_id: "" }],
    rating: { average: 4.6, count: 35 },
  },
  {
    _id: "fb-3",
    productName: "Summer Bucket Hat",
    price: 1999,
    images: [{ url: product5, public_id: "" }],
    rating: { average: 4.5, count: 29 },
  },
  {
    _id: "fb-4",
    productName: "Crochet Flower Bouquet",
    price: 2999,
    images: [{ url: product6, public_id: "" }],
    rating: { average: 4.9, count: 52 },
  },
];

const BestSellers = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useProducts({ limit: 8, sort: "rating" });
  const apiProducts = data?.data;

  const hasApiProducts = apiProducts && apiProducts.length > 0;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.offsetWidth * 0.6;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-20 md:py-24 px-4 md:px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-10 md:mb-12"
        >
          <div>
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-3 font-body">
              Customer Favorites
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-light text-foreground">
              Best Sellers
            </h2>
          </div>
          <div className="flex gap-2 md:gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll("left")}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-card hover:border-primary/30 transition-all duration-200"
            >
              <ChevronLeft size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll("right")}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-card hover:border-primary/30 transition-all duration-200"
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex gap-4 md:gap-6 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[47%] sm:w-[45%] md:w-[30%] lg:w-[23%] space-y-3"
              >
                <div className="aspect-[3/4] rounded-2xl bg-muted animate-shimmer" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : hasApiProducts ? (
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4"
          >
            {apiProducts.map((product, i) => (
              <div
                key={product._id}
                className="flex-shrink-0 w-[47%] sm:w-[45%] md:w-[30%] lg:w-[23%] snap-start"
              >
                <ProductCard product={product} index={i} />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4"
          >
            {fallbackBestSellers.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex-shrink-0 w-[47%] sm:w-[45%] md:w-[30%] lg:w-[23%] snap-start group cursor-pointer"
              >
                <Link to="/shop">
                  <div className="overflow-hidden rounded-2xl mb-4">
                    <img
                      src={item.images[0].url}
                      alt={item.productName}
                      className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-display text-base md:text-lg text-foreground line-clamp-1">
                    {item.productName}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-muted-foreground text-sm font-body">
                      ₹{item.price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star
                        size={12}
                        className="text-amber-400 fill-amber-400"
                      />
                      <span className="text-xs text-muted-foreground font-body">
                        {item.rating.average} ({item.rating.count})
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BestSellers;
