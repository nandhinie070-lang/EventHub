import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  ShieldCheck,
  Award,
  QrCode,
  ArrowRight,
  Users,
  CheckCircle2,
  TrendingUp,
  Layers
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';

const LandingPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const features = [
    {
      icon: Calendar,
      title: 'Seamless Event Discovery',
      description:
        'Browse inter-college hackathons, symposiums, cultural fests, and technical workshops with live seat tracking.'
    },
    {
      icon: QrCode,
      title: 'Instant QR Passports',
      description:
        'Generate tamper-proof cryptographic QR codes for ticket verification and frictionless attendee check-ins.'
    },
    {
      icon: ShieldCheck,
      title: 'Multi-Tier Approvals',
      description:
        'Structured governance workflows connecting Student Organizers, HODs, and Principals for approvals.'
    },
    {
      icon: Award,
      title: 'Automated E-Certificates',
      description:
        'Auto-generate high-resolution verifiable PDF certificates upon event completion and attendance validation.'
    }
  ];

  const stats = [
    { label: 'Active Students', value: '4,800+' },
    { label: 'Events Hosted', value: '180+' },
    { label: 'Departments', value: '9' },
    { label: 'Participant Satisfaction', value: '99.4%' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-3xl mx-auto"
          >
            {/* Pill Tag */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 mb-6 shadow-xs">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                Official Campus Event Management Ecosystem
              </span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]"
            >
              Transform your college event journey with{' '}
              <span className="text-gradient">EventHub</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              The all-in-one platform for students, faculty organizers, HODs, and institutional leaders. Experience automated registrations, live ticketing, and instant verified credentials.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/register">
                <Button size="lg" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto shadow-glow">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Access Portal
                </Button>
              </Link>
            </motion.div>

            {/* Campus Domain Notice */}
            <motion.div
              variants={itemVariants}
              className="mt-8 flex items-center justify-center space-x-6 text-xs text-slate-500 dark:text-slate-400"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Internal members sign in via @apex.edu
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> External guests welcome
              </span>
            </motion.div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 sm:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          >
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-soft text-center backdrop-blur-sm"
              >
                <p className="text-2xl sm:text-3xl font-extrabold text-gradient">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-slate-100/60 dark:bg-slate-950/40 border-y border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
              Features Built for Campus Life
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Engineered for Every Stage of the Event Lifecycle
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center text-white mb-5 shadow-soft">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role Journey CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl gradient-brand p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Ready to elevate your college experiences?
              </h2>
              <p className="text-indigo-100 text-sm sm:text-base leading-relaxed mb-8">
                Join thousands of students and faculty members in organizing, participating in, and celebrating campus achievements.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <button className="px-6 py-3 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg">
                    Create Student Account
                  </button>
                </Link>
                <Link to="/login">
                  <button className="px-6 py-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-900 text-white font-semibold text-sm border border-indigo-400/30 transition-colors">
                    Staff & Admin Sign In
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg gradient-brand flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              EventHub • Apex Institute of Technology
            </span>
          </div>
          <p>© 2026 EventHub Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
