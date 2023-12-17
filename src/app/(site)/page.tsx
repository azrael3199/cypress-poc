import TitleSection from "@/components/landing-page/title-section";
import React from "react";

const HomePage = () => {
  return (
    <section>
      <div className="gap-4 px-4 mt-10 overflow-hidden sm:px-6 sm:flex sm:flex-col md:justify-center md:items-center">
        <TitleSection
          pill="✨ Your workspace, Perfected"
          title="All-In-One Collaboration and Productivity Platform"
        />
        <div className="bg-white p-[2px] mt-[6] rounded-xl bg-gradient-to-r from-primary to-brand-primaryBlue sm:w-[300px]"></div>
      </div>
    </section>
  );
};

export default HomePage;
