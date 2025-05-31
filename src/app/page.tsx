
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, MailWarning, Video, Settings, Eye, Users, LayoutDashboard, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import Image from 'next/image';
import Aurora from '@/components/landing/Aurora';
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Script from 'next/script';

export default function LandingPage() {
  const heroVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  const features = [
    { icon: <ShieldCheck className="h-10 w-10 text-primary" />, title: "Real-time Incident Detection", description: "Our AI diligently analyzes video feeds to instantly identify potential threats like trespassing, suspicious loitering, abandoned objects, and more." },
    { icon: <MailWarning className="h-10 w-10 text-primary" />, title: "Automated Alerts & Reporting", description: "Receive immediate notifications and detailed incident reports, complete with visual evidence, sent directly to designated personnel." },
    { icon: <Video className="h-10 w-10 text-primary" />, title: "Live & Archived Analysis", description: "Monitor live camera streams or process existing video footage. AEYE adapts to your operational needs for comprehensive oversight." },
    { icon: <Eye className="h-10 w-10 text-primary" />, title: "Enhanced Situational Awareness", description: "Gain a clearer understanding of events as they unfold, enabling faster and more informed decision-making for security teams." },
    { icon: <Users className="h-10 w-10 text-primary" />, title: "Community & Asset Protection", description: "Proactively safeguard people, property, and public spaces, fostering a safer environment for everyone." },
    { icon: <Settings className="h-10 w-10 text-primary" />, title: "Customizable & Scalable", description: "Easily configure detection parameters and integrate AEYE into your existing security infrastructure. Built to scale with your needs." },
  ];

  const statistics = [
     { icon: <AlertTriangle className="h-10 w-10 text-destructive" />, value: "Millions Annually", label: "Preventable Incidents Occur", description: "Many safety violations and security breaches could be identified earlier, or altogether prevented, with proactive AI detection." },
    { icon: <Clock className="h-10 w-10 text-destructive" />, value: "Up to 80% Slower", label: "Incident Response Times", description: "Manual monitoring and delayed detection significantly increase the time taken to respond to critical events, escalating potential damage." },
    { icon: <DollarSign className="h-10 w-10 text-destructive" />, value: "$10,000+", label: "Average Cost Per Missed Incident", description: "The financial impact of unaddressed security events, from theft and vandalism to operational downtime, can be substantial." },
  ];

  const wistiaStyles = `
    wistia-player[media-id='ivqggbjnl6']:not(:defined) {
      background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/ivqggbjnl6/swatch');
      display: block;
      filter: blur(5px);
      padding-top:42.29%;
    }
  `;

  return (
    <div className="flex flex-col min-h-screen">
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" async />
      <style dangerouslySetInnerHTML={{ __html: wistiaStyles }} />

      <header className="py-4 px-6 sm:px-10 md:px-16 sticky top-0 bg-background/80 backdrop-blur-md z-50 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/aeye-logo.png" alt="AEYE Logo" width={32} height={32} />
            <h1 className="text-3xl font-bold text-primary hidden sm:block">AEYE</h1>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <LayoutDashboard className="mr-2 h-5 w-5" /> Go to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-grow">
        <section id="hero-section" className="relative py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background/80 text-center overflow-hidden">
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0
          }}>
            <Aurora
              colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
              blend={0.5}
              amplitude={1.0}
              speed={0.2}
            />
          </div>

          <motion.div
            className="container mx-auto px-6 relative z-10"
            initial="hidden"
            animate="visible"
            variants={heroVariants}
          >
            <motion.h2
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary mb-6"
              variants={heroVariants}
            >
              Proactive Safety Through AI
            </motion.h2>
            <motion.p
              className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10"
              variants={{ ...heroVariants, visible: { ...heroVariants.visible, transition: { ...heroVariants.visible.transition, delay: 0.2 } } }}
            >
              AEYE leverages cutting-edge artificial intelligence to monitor public and private spaces, detect incidents in real-time, and enhance community well-being.
            </motion.p>
            <motion.div
              variants={{ ...heroVariants, visible: { ...heroVariants.visible, transition: { ...heroVariants.visible.transition, delay: 0.4 } } }}
            >
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-6 text-lg"
                >
                  <LayoutDashboard className="mr-2 h-6 w-6" />
                  Access Dashboard
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        <section id="features" className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-6">
            <motion.h3
              className="text-3xl md:text-4xl font-bold text-center text-primary mb-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={heroVariants}
            >
              Why AEYE?
            </motion.h3>
            <motion.p
              className="text-muted-foreground text-center mb-12 md:mb-16 max-w-2xl mx-auto text-lg"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={{ ...heroVariants, visible: { ...heroVariants.visible, transition: { ...heroVariants.visible.transition, delay: 0.2 } } }}
            >
              Our intelligent system empowers you with the tools to anticipate, identify, and respond to safety concerns efficiently.
            </motion.p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={cardVariants}
                >
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="statistics" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-6">
            <motion.h3
              className="text-3xl md:text-4xl font-bold text-center text-primary mb-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={heroVariants}
            >
              The Overlooked Cost of Reactive Security
            </motion.h3>
            <motion.p
              className="text-muted-foreground text-center mb-12 md:mb-16 max-w-2xl mx-auto text-lg"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={{ ...heroVariants, visible: { ...heroVariants.visible, transition: { ...heroVariants.visible.transition, delay: 0.2 } } }}
            >
              Without proactive AI monitoring, critical incidents often go unnoticed or are addressed too late, leading to significant consequences.
            </motion.p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              {statistics.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={cardVariants}
                >
                  <StatisticCard
                    icon={stat.icon}
                    value={stat.value}
                    label={stat.label}
                    description={stat.description}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-6 text-center">
                <motion.h3
                  className="text-3xl md:text-4xl font-bold text-primary mb-12 md:mb-16"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={heroVariants}
                >
                  Intelligent Vigilance, Simplified
                </motion.h3>
                <motion.div
                  className="relative max-w-4xl mx-auto rounded-xl shadow-2xl border-2 border-primary/20 overflow-hidden group"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={cardVariants}
                >
                  <wistia-player
                    media-id="ivqggbjnl6"
                    aspect="2.3645320197044337"
                    auto-play="muted"
                    end-video-behavior="loop"
                    className="pointer-events-none"
                  ></wistia-player>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col items-center justify-end p-4 sm:p-6 md:p-10 pointer-events-none">
                    <p className="text-white text-lg sm:text-xl md:text-2xl font-semibold shadow-text text-center">Visualize insights and manage alerts effortlessly.</p>
                  </div>
                </motion.div>
            </div>
        </section>

        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-accent/5">
          <div className="container mx-auto px-6 text-center">
            <motion.h3
              className="text-3xl md:text-4xl font-bold text-primary mb-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={heroVariants}
            >
              Ready to Enhance Your Security?
            </motion.h3>
            <motion.p
              className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={{ ...heroVariants, visible: { ...heroVariants.visible, transition: { ...heroVariants.visible.transition, delay: 0.2 } } }}
            >
              Discover how AEYE can transform your approach to safety and surveillance.
            </motion.p>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={{ ...heroVariants, visible: { ...heroVariants.visible, transition: { ...heroVariants.visible.transition, delay: 0.4 } } }}
            >
              {/* Button removed as per request */}
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-10 border-t bg-card">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <div className="flex justify-center items-center mb-2 gap-2">
            <Image src="/aeye-logo.png" alt="AEYE Footer Logo" width={28} height={28} />
            <span className="text-xl font-bold text-primary">AEYE</span>
          </div>
          <p>&copy; {new Date().getFullYear()} AEYE. All rights reserved.</p>
          <p className="text-sm mt-1">Pioneering AI for a Safer Tomorrow.</p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-background p-6 md:p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-border transform hover:-translate-y-1">
      <div className="mb-5 flex justify-center items-center h-16 w-16 rounded-full bg-accent/10 mx-auto ring-4 ring-accent/20">
        {icon}
      </div>
      <h4 className="text-xl lg:text-2xl font-semibold text-primary mb-3 text-center">{title}</h4>
      <p className="text-muted-foreground text-base text-center leading-relaxed">{description}</p>
    </div>
  );
}

interface StatisticCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  description: string;
}

function StatisticCard({ icon, value, label, description }: StatisticCardProps) {
  return (
    <div className="bg-card p-6 md:p-8 rounded-xl shadow-lg border border-border text-center">
      <div className="mb-4 flex justify-center items-center h-16 w-16 rounded-full bg-destructive/10 mx-auto">
        {icon}
      </div>
      <p className="text-3xl md:text-4xl font-bold text-destructive mb-2">{value}</p>
      <h4 className="text-lg font-semibold text-primary mb-2">{label}</h4>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

const styles = `
  .shadow-text {
    text-shadow: 0px 1px 3px rgba(0, 0, 0, 0.6);
  }
`;

// Ensure this script runs only on the client-side if document is used
if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.head) {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wistia-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'media-id'?: string;
        aspect?: string;
        'auto-play'?: "true" | "muted" | "false";
        'end-video-behavior'?: "loop" | "reset" | "pause";
        className?: string; // Added className to the declaration
      }, HTMLElement>;
    }
  }
}
