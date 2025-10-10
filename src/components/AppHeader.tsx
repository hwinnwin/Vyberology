import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import vybeLogo from "@/assets/vybe-logo.png";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useNavigation } from "@/hooks/useNavigation";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  className?: string;
}

const routeNames: Record<string, string> = {
  "/": "Home",
  "/brand": "Brand Kit",
};

export const AppHeader = ({ className }: AppHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { canGoBack, goBack, goHome } = useNavigation();
  const { hasUnsavedChanges, confirmNavigation } = useUnsavedChanges();

  const isRootRoute = location.pathname === "/";

  // Keyboard shortcuts: Alt+← (Back), Alt+Home (Home)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === "ArrowLeft" && !isRootRoute) {
          e.preventDefault();
          handleBack();
        } else if (e.key === "Home") {
          e.preventDefault();
          handleHome();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRootRoute, hasUnsavedChanges]);

  const handleBack = async () => {
    if (hasUnsavedChanges) {
      const confirmed = await confirmNavigation();
      if (!confirmed) return;
    }
    goBack();
  };

  const handleHome = async () => {
    if (hasUnsavedChanges && location.pathname !== "/") {
      const confirmed = await confirmNavigation();
      if (!confirmed) return;
    }
    goHome();
  };

  // Generate breadcrumb items
  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ path: "/", name: "Home" }];

    let currentPath = "";
    paths.forEach((segment) => {
      currentPath += `/${segment}`;
      breadcrumbs.push({
        path: currentPath,
        name: routeNames[currentPath] || segment,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const showBreadcrumbs = !isMobile && breadcrumbs.length >= 2;

  if (isRootRoute) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-white/10 bg-lf-midnight/95 backdrop-blur supports-[backdrop-filter]:bg-lf-midnight/80",
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left: Back button or Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Back"
            className="h-11 w-11 text-lf-slate hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {showBreadcrumbs && (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.path} className="flex items-center gap-2">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="text-white">
                          {crumb.name}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link
                            to={crumb.path}
                            className="text-lf-slate hover:text-white"
                          >
                            {crumb.name}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        {/* Right: Logo (desktop) or Home button (mobile) */}
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleHome}
            aria-label="Home"
            className="h-11 w-11 text-lf-aurora hover:bg-white/5 hover:text-lf-violet"
          >
            <Home className="h-5 w-5" />
          </Button>
        ) : (
          <Link
            to="/"
            className="flex items-center transition-opacity hover:opacity-80"
            aria-label="Home"
          >
            <img src={vybeLogo} alt="Vyberology" className="h-8" />
          </Link>
        )}
      </div>
    </header>
  );
};
