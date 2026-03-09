import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";

// Fallback images for when API has no images
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const fallbackProducts = [
  {
    _id: "fallback-1",
    productName: "Amigurumi Teddy Bear",
    price: 2499,
    images: [{ url: product1, public_id: "" }],
    tag: "Best Seller",
  },
  {
    _id: "fallback-2",
    productName: "Sage Baby Blanket",
    price: 4999,
    images: [{ url: product2, public_id: "" }],
    tag: "New Arrival",
  },
  {
    _id: "fallback-3",
    productName: "Boho Floral Tote Bag",
    price: 3499,
    images: [{ url: product3, public_id: "" }],
    tag: "Trending",
  },
  {
    _id: "fallback-4",
    productName: "Artisan Coaster Set (6pc)",
    price: 1299,
    images: [{ url: product4, public_id: "" }],
  },
  {
    _id: "fallback-5",
    productName: "Summer Bucket Hat",
    price: 1999,
    images: [{ url: product5, public_id: "" }],
    tag: "New Arrival",
  },
  {
    _id: "fallback-6",
    productName: "Crochet Flower Bouquet",
    price: 2999,
    images: [{ url: product6, public_id: "" }],
    tag: "Popular",
  },
];

const FeaturedCollection = () => {
  const { data, isLoading } = useProducts({ limit: 6, featured: "true" });
  const apiProducts = data?.data;

  const hasApiProducts = apiProducts && apiProducts.length > 0;

  return (
    <section id="shop" className="py-20 md:py-24 px-4 md:px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-3 font-body">
            Curated for you
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-light text-foreground">
            Featured Collection
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto font-body text-sm md:text-base">
            Each piece is handmade to order. Custom colors and sizes available —
            just reach out!
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[3/4] rounded-2xl bg-muted animate-shimmer" />
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {hasApiProducts
              ? apiProducts.map((product, i) => (
                  <ProductCard key={product._id} product={product} index={i} />
                ))
              : fallbackProducts.map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="group cursor-pointer"
                  >
                    <Link to="/shop">
                      <div className="relative overflow-hidden rounded-2xl bg-card mb-4">
                        <img
                          src={product.images[0].url}
                          alt={product.productName}
                          className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
                        {product.tag && (
                          <span className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm text-foreground text-xs px-3 py-1 rounded-full tracking-wider font-body">
                            {product.tag}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-base md:text-lg text-foreground group-hover:text-primary transition-colors">
                        {product.productName}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1 font-body">
                        ₹{product.price.toLocaleString()}
                      </p>
                    </Link>
                  </motion.div>
                ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10 md:mt-12"
        >
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-sm tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors font-body group"
          >
            View All Products
            <span className="inline-block transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedCollection;
