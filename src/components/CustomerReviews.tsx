import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Emma T.",
    text: "The amigurumi bear I ordered is absolutely stunning. You can feel the love and care in every stitch. It's now my daughter's favorite toy!",
    rating: 5,
  },
  {
    name: "Sarah M.",
    text: "I ordered a custom blanket and it exceeded all expectations. The quality is incredible and it arrived beautifully packaged. Will definitely order again!",
    rating: 5,
  },
  {
    name: "Olivia R.",
    text: "The crochet flower bouquet is a work of art. It looks so realistic and will last forever. Perfect gift for my mom's birthday.",
    rating: 5,
  },
];

const CustomerReviews = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-3">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-display font-light text-foreground">
            What Our Customers Say
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-card rounded-3xl p-8 hover:shadow-lg transition-shadow duration-500"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} size={14} className="fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6 italic">"{review.text}"</p>
              <p className="font-display text-lg text-foreground">{review.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
