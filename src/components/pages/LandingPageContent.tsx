"use client";

import { useState } from "react";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { WhySection } from "@/components/sections/WhySection";
import { SavingsCounter } from "@/components/sections/SavingsCounter";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { VideoTestimonials } from "@/components/sections/VideoTestimonials";
import { InstagramGrid } from "@/components/sections/InstagramGrid";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";
import { MobileStickyCTA } from "@/components/sections/MobileStickyCTA";
import { RoleSection } from "@/components/sections/RoleSection";
import { ServiceBar } from "@/components/sections/ServiceBar";
import { useLandingBehaviorTracking } from "@/components/analytics/useLandingBehaviorTracking";

type LandingPageContentProps = {
  cityName?: string;
};

export function LandingPageContent({ cityName }: LandingPageContentProps) {
  const [heroProgress, setHeroProgress] = useState(0);
  const highlightRDV = heroProgress >= 0.7;
  useLandingBehaviorTracking();

  return (
    <>
      <Header highlightRDV={highlightRDV} />
      <main className="flex flex-col gap-6">
        <Hero onHeroProgress={setHeroProgress} highlightRDV={highlightRDV} cityName={cityName} />
        <ServiceBar />
        <WhySection />
        <SavingsCounter />
        <RoleSection />
        <BeforeAfter />
        <VideoTestimonials />
        <HowItWorks />
        <InstagramGrid />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <MobileStickyCTA />
    </>
  );
}
