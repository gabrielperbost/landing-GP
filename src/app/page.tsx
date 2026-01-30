"use client";

import { useState } from "react";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { WhySection } from "@/components/sections/WhySection";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { NumericTestimonials } from "@/components/sections/NumericTestimonials";
import { VideoTestimonials } from "@/components/sections/VideoTestimonials";
import { InstagramGrid } from "@/components/sections/InstagramGrid";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";
import { MobileStickyCTA } from "@/components/sections/MobileStickyCTA";
import { InlineCTA } from "@/components/sections/InlineCTA";
import { RoleSection } from "@/components/sections/RoleSection";
import { ServiceBar } from "@/components/sections/ServiceBar";

export default function Page() {
  const [heroProgress, setHeroProgress] = useState(0);
  const highlightRDV = heroProgress >= 0.7;

  return (
    <>
      <Header highlightRDV={highlightRDV} />
      <main className="flex flex-col gap-6">
        <Hero onHeroProgress={setHeroProgress} highlightRDV={highlightRDV} />
        <ServiceBar />
        <WhySection />
        <RoleSection />
        <BeforeAfter />
        <HowItWorks />
        <NumericTestimonials />
        <VideoTestimonials />
        <InstagramGrid />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <MobileStickyCTA />
    </>
  );
}
