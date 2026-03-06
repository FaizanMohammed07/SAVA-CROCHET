import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-6">
        <h1 className="mb-2 text-6xl font-display font-light text-foreground">
          404
        </h1>
        <p className="mb-2 text-lg font-display text-muted-foreground">
          This stitch got dropped!
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="inline-block rounded-full px-8 py-3 text-sm tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
        >
          Back to Sava Crochets
        </a>
      </div>
    </div>
  );
};

export default NotFound;
