import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-lf-midnight via-lf-ink to-lf-midnight">
      <div className="text-center">
        <h1 className="mb-4 font-display text-6xl font-bold text-white">404</h1>
        <p className="mb-8 text-xl text-lf-slate">Oops! Page not found</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-lf-gradient px-6 py-3 font-semibold text-white shadow-glow transition-all hover:shadow-glow-lg"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
