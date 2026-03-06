import { motion } from "framer-motion";

const YarnTextAnimation = () => {
  // SVG text paths for "Sava" and "Crochets" drawn with yarn effect
  const yarnStrokeWidth = 3;
  const duration = 3;

  return (
    <div className="relative w-full max-w-2xl">
      {/* Sava - drawn with dusty pink yarn */}
      <svg
        viewBox="0 0 500 120"
        className="w-full h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Yarn texture filter */}
        <defs>
          <filter id="yarn-texture-1">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.8"
              numOctaves="4"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="1.5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="yarn-texture-2">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.6"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="1.2"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        {/* "Sava" text path - using a handwritten style path */}
        <motion.text
          x="10"
          y="85"
          className="font-display"
          fontSize="90"
          fontWeight="300"
          fontStyle="italic"
          stroke="hsl(var(--dusty-pink))"
          strokeWidth={yarnStrokeWidth}
          fill="none"
          filter="url(#yarn-texture-1)"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: duration, ease: "easeInOut", delay: 0.3 }}
        >
          Sava
        </motion.text>

        {/* Fill fade in after stroke completes */}
        <motion.text
          x="10"
          y="85"
          className="font-display"
          fontSize="90"
          fontWeight="300"
          fontStyle="italic"
          fill="hsl(var(--dusty-pink))"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: duration + 0.3 }}
        >
          Sava
        </motion.text>
      </svg>

      {/* Crochets - drawn with sage/warm-brown yarn */}
      <svg
        viewBox="0 0 700 120"
        className="w-full h-auto -mt-2"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.text
          x="10"
          y="85"
          className="font-display"
          fontSize="90"
          fontWeight="300"
          fontStyle="italic"
          stroke="hsl(var(--warm-brown))"
          strokeWidth={yarnStrokeWidth}
          fill="none"
          filter="url(#yarn-texture-2)"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ strokeDasharray: 1500, strokeDashoffset: 1500 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: duration + 1, ease: "easeInOut", delay: 0.8 }}
        >
          Crochets
        </motion.text>

        {/* Fill fade in after stroke completes */}
        <motion.text
          x="10"
          y="85"
          className="font-display"
          fontSize="90"
          fontWeight="300"
          fontStyle="italic"
          fill="hsl(var(--warm-brown))"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: duration + 1.8 }}
        >
          Crochets
        </motion.text>
      </svg>

      {/* Animated yarn ball / thread trailing effect */}
      <motion.div
        className="absolute w-3 h-3 rounded-full bg-dusty-pink"
        initial={{ opacity: 0, x: 0, y: 20 }}
        animate={{
          opacity: [0, 1, 1, 1, 0],
          x: [0, 100, 200, 300, 400],
          y: [20, 15, 25, 10, 20],
        }}
        transition={{ duration: duration, ease: "easeInOut", delay: 0.3 }}
      />
      <motion.div
        className="absolute w-3 h-3 rounded-full bg-warm-brown"
        initial={{ opacity: 0, x: 0, y: 90 }}
        animate={{
          opacity: [0, 1, 1, 1, 0],
          x: [0, 150, 300, 450, 600],
          y: [90, 85, 95, 80, 90],
        }}
        transition={{ duration: duration + 1, ease: "easeInOut", delay: 0.8 }}
      />

      {/* Yarn thread trail */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        viewBox="0 0 700 200"
        fill="none"
      >
        <motion.path
          d="M 0 30 Q 50 20, 100 30 T 200 25 T 300 30 T 400 25"
          stroke="hsl(var(--dusty-pink))"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: duration, ease: "easeInOut", delay: 0.3 }}
        />
        <motion.path
          d="M 0 130 Q 75 120, 150 130 T 300 125 T 450 130 T 600 125"
          stroke="hsl(var(--warm-brown))"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: duration + 1, ease: "easeInOut", delay: 0.8 }}
        />
      </svg>
    </div>
  );
};

export default YarnTextAnimation;
