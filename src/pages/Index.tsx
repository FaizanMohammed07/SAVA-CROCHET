import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedCollection from "@/components/FeaturedCollection";
import AboutSection from "@/components/AboutSection";
import BestSellers from "@/components/BestSellers";
import CraftsmanshipSection from "@/components/CraftsmanshipSection";
import CustomerReviews from "@/components/CustomerReviews";
import GallerySection from "@/components/GallerySection";
import CTASection from "@/components/CTASection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <div className="section-divider" />
      <FeaturedCollection />
      <AboutSection />
      <div className="section-divider" />
      <BestSellers />
      <CraftsmanshipSection />
      <CustomerReviews />
      <GallerySection />
      <CTASection />
      <FooterSection />
    </div>
  );
};

export default Index;
