import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-[73px]">
        <Outlet />
      </main>
      <FooterSection />
    </div>
  );
};

export default MainLayout;
