import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const YarnTextAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.9", "end 0.3"],
  });

  // Stagger: "Sava" draws from 0-50%, "Crochets" draws from 25-75%, fills from 70-100%
  const savaStroke = useTransform(scrollYProgress, [0, 0.45], [1200, 0]);
  const crochetsStroke = useTransform(scrollYProgress, [0.15, 0.65], [1800, 0]);
  const savaFill = useTransform(scrollYProgress, [0.4, 0.6], [0, 1]);
  const crochetsFill = useTransform(scrollYProgress, [0.55, 0.75], [0, 1]);
  const subtextOpacity = useTransform(scrollYProgress, [0.7, 0.9], [0, 1]);
  const subtextY = useTransform(scrollYProgress, [0.7, 0.9], [30, 0]);

  // Yarn ball positions following the text being drawn
  const yarnBall1X = useTransform(scrollYProgress, [0, 0.45], [0, 420]);
  const yarnBall1Opacity = useTransform(scrollYProgress, [0, 0.02, 0.43, 0.45], [0, 1, 1, 0]);
  const yarnBall2X = useTransform(scrollYProgress, [0.15, 0.65], [0, 620]);
  const yarnBall2Opacity = useTransform(scrollYProgress, [0.15, 0.17, 0.63, 0.65], [0, 1, 1, 0]);

  // Thread trails
  const thread1Length = useTransform(scrollYProgress, [0, 0.45], [0, 1]);
  const thread2Length = useTransform(scrollYProgress, [0.15, 0.65], [0, 1]);

  // Crochet stitch pattern overlay
  const stitchPatternOpacity = useTransform(scrollYProgress, [0.5, 0.8], [0, 0.15]);

  return (
    <div ref={containerRef} className="relative min-h-[80vh] flex items-center justify-center">
      <div className="sticky top-1/4 w-full max-w-3xl mx-auto">
        {/* Decorative crochet stitch pattern behind text */}
        <motion.div
          className="absolute inset-0 -m-8 rounded-3xl"
          style={{
            opacity: stitchPatternOpacity,
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--dusty-pink)) 1px, transparent 1px)`,
            backgroundSize: "12px 12px",
          }}
        />

        {/* "Sava" drawn with dusty pink yarn */}
        <svg
          viewBox="0 0 500 130"
          className="w-full h-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Yarn-like texture */}
            <filter id="yarn-scroll-1">
              <feTurbulence type="turbulence" baseFrequency="0.5" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="yarn-scroll-2">
              <feTurbulence type="turbulence" baseFrequency="0.4" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            {/* Crochet chain stitch pattern for stroke */}
            <pattern id="chain-stitch-pink" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="3" fill="none" stroke="hsl(var(--dusty-pink))" strokeWidth="1.2" />
            </pattern>
            <pattern id="chain-stitch-brown" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="3" fill="none" stroke="hsl(var(--warm-brown))" strokeWidth="1.2" />
            </pattern>
          </defs>

          {/* Background stitch trace */}
          <motion.text
            x="20"
            y="95"
            className="font-display"
            fontSize="100"
            fontWeight="400"
            fontStyle="italic"
            stroke="url(#chain-stitch-pink)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1200,
              strokeDashoffset: savaStroke,
            }}
          >
            Sava
          </motion.text>

          {/* Main yarn stroke */}
          <motion.text
            x="20"
            y="95"
            className="font-display"
            fontSize="100"
            fontWeight="400"
            fontStyle="italic"
            stroke="hsl(var(--dusty-pink))"
            strokeWidth="3"
            fill="none"
            filter="url(#yarn-scroll-1)"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1200,
              strokeDashoffset: savaStroke,
            }}
          >
            Sava
          </motion.text>

          {/* Fill */}
          <motion.text
            x="20"
            y="95"
            className="font-display"
            fontSize="100"
            fontWeight="400"
            fontStyle="italic"
            fill="hsl(var(--dusty-pink))"
            style={{ opacity: savaFill }}
          >
            Sava
          </motion.text>
        </svg>

        {/* "Crochets" drawn with warm brown yarn */}
        <svg
          viewBox="0 0 720 130"
          className="w-full h-auto -mt-4"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background stitch trace */}
          <motion.text
            x="20"
            y="95"
            className="font-display"
            fontSize="100"
            fontWeight="400"
            fontStyle="italic"
            stroke="url(#chain-stitch-brown)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1800,
              strokeDashoffset: crochetsStroke,
            }}
          >
            Crochets
          </motion.text>

          {/* Main yarn stroke */}
          <motion.text
            x="20"
            y="95"
            className="font-display"
            fontSize="100"
            fontWeight="400"
            fontStyle="italic"
            stroke="hsl(var(--warm-brown))"
            strokeWidth="3"
            fill="none"
            filter="url(#yarn-scroll-2)"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1800,
              strokeDashoffset: crochetsStroke,
            }}
          >
            Crochets
          </motion.text>

          {/* Fill */}
          <motion.text
            x="20"
            y="95"
            className="font-display"
            fontSize="100"
            fontWeight="400"
            fontStyle="italic"
            fill="hsl(var(--warm-brown))"
            style={{ opacity: crochetsFill }}
          >
            Crochets
          </motion.text>
        </svg>

        {/* Yarn ball trackers */}
        <motion.div
          className="absolute w-4 h-4 rounded-full bg-dusty-pink shadow-lg"
          style={{ x: yarnBall1X, opacity: yarnBall1Opacity, top: "25%" }}
        />
        <motion.div
          className="absolute w-4 h-4 rounded-full bg-warm-brown shadow-lg"
          style={{ x: yarnBall2X, opacity: yarnBall2Opacity, top: "65%" }}
        />

        {/* Trailing yarn threads */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 800 260" fill="none">
          <motion.path
            d="M 0 65 Q 60 50, 120 65 T 240 60 T 360 65 T 480 60"
            stroke="hsl(var(--dusty-pink))"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.3"
            style={{ pathLength: thread1Length }}
          />
          <motion.path
            d="M 0 175 Q 80 160, 160 175 T 320 170 T 480 175 T 640 170"
            stroke="hsl(var(--warm-brown))"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.3"
            style={{ pathLength: thread2Length }}
          />
        </svg>

        {/* Subtitle fades in after text is crocheted */}
        <motion.p
          className="text-center text-lg md:text-xl font-body text-muted-foreground mt-6 font-light tracking-wide"
          style={{ opacity: subtextOpacity, y: subtextY }}
        >
          Every stitch tells a story
        </motion.p>
      </div>
    </div>
  );
};

export default YarnTextAnimation;
