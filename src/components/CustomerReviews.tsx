import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Priya S.",
    text: "The amigurumi teddy bear I ordered for my daughter is absolutely magical. You can feel the love woven into every stitch. It's her favorite toy now — she won't sleep without it!",
    rating: 5,
  },
  {
    name: "Ananya M.",
    text: "I ordered a custom baby blanket as a gift, and it blew everyone away. The yarn quality is luxurious, the packaging was beautiful, and it arrived earlier than expected. Already planning my next order!",
    rating: 5,
  },
  {
    name: "Riya K.",
    text: "The crochet flower bouquet is a masterpiece — it looks incredibly lifelike and will stay beautiful forever. Gifted it to my mom on her birthday and she was in tears. Thank you, Sava Crochets!",
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
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-3">
            Testimonials
          </p>
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
                  <Star
                    key={j}
                    size={14}
                    className="fill-primary text-primary"
                  />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6 italic">
                "{review.text}"
              </p>
              <p className="font-display text-lg text-foreground">
                {review.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
