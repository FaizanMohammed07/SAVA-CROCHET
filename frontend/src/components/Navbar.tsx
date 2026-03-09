import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Menu,
  X,
  User,
  LogOut,
  Heart,
  Package,
  LayoutDashboard,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import logoImg from "@/assets/logo-crochet.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchOverlay from "@/components/SearchOverlay";
import { useCartAnimation } from "@/hooks/useCartAnimation";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { data: cartData } = useCart();
  const { cartBouncing } = useCartAnimation();
  const navigate = useNavigate();

  const cart = cartData?.data;
  const cartCount = cart?.totalItems || 0;

  // Ctrl+K / Cmd+K keyboard shortcut to open search
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setIsSearchOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  const navLinks = [
    { label: "Shop", to: "/shop" },
    { label: "About", to: "/#about" },
    { label: "Gallery", to: "/#gallery" },
    { label: "Custom Order", to: "/reservations/new" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        <Link to="/" className="flex items-center">
          <img
            src={logoImg}
            alt="Sava Crochets"
            className="h-8 md:h-10 w-auto"
          />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors duration-300 tracking-wide"
            >
              {link.label}
            </Link>
          ))}

          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-full transition-colors duration-200 border border-border/50"
          >
            <Search size={14} />
            <span className="hidden lg:inline">Search</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background text-[10px] font-mono text-muted-foreground border border-border/50">
              ⌘K
            </kbd>
          </button>

          {/* Wishlist */}
          {isAuthenticated && (
            <Link
              to="/account/wishlist"
              className="p-2 text-foreground hover:text-dusty-pink transition-colors"
            >
              <Heart size={20} />
            </Link>
          )}

          {/* Cart */}
          <Link
            to="/cart"
            data-cart-icon
            className={`relative p-2 text-foreground hover:text-primary transition-colors ${
              cartBouncing ? "animate-cart-bounce" : ""
            }`}
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-dusty-pink text-white text-[10px] flex items-center justify-center font-medium">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* Auth */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
                  <div className="w-8 h-8 rounded-full bg-sage/30 flex items-center justify-center text-foreground">
                    {user?.firstName?.charAt(0).toUpperCase() || (
                      <User size={16} />
                    )}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user?.fullName}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/account/profile")}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/account/orders")}>
                  <Package className="mr-2 h-4 w-4" /> My Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/account/wishlist")}>
                  <Heart className="mr-2 h-4 w-4" /> Wishlist
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Panel
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="text-sm font-body bg-primary text-primary-foreground px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          )}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-foreground"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-background border-b border-border"
          >
            <div className="flex flex-col items-center gap-4 py-6">
              {/* Mobile Search Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsSearchOpen(true);
                }}
                className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search size={16} />
                Search Products
              </button>

              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/cart"
                onClick={() => setIsOpen(false)}
                className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                Cart ({cartCount})
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/account/profile"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                  >
                    My Account
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="text-sm font-body text-destructive"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-body bg-primary text-primary-foreground px-5 py-2 rounded-full"
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </motion.nav>
  );
};

export default Navbar;
