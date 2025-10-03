import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  const location = useLocation();

  // Always include home as the first item
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...items
  ];

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isCurrent = item.current || isLast || item.href === location.pathname;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/60" />
              )}
              
              {index === 0 && (
                <Home className="h-4 w-4 mr-1" />
              )}

              {isCurrent || !item.href ? (
                <span 
                  className={cn(
                    "font-medium",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-foreground transition-colors duration-200"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};