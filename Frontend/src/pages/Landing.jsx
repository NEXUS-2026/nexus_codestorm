import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Eye, Zap, Shield, TrendingUp, ArrowRight, 
  Play, BarChart3, Package, Sparkles, 
  FileText, Video, CheckCircle2, Target, Cpu, Database
} from 'lucide-react'
import { motion } from 'framer-motion'
import LandingNav from '../components/LandingNav'

export default function Landing() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    document.documentElement.style.scrollBehavior = 'smooth'
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  const problems = [
    {
      stat: '15-20%',
      title: 'Manual Counting Errors',
      desc: 'Human error in box counting leads to inventory discrepancies and shipping mistakes'
    },
    {
      stat: 'Zero',
      title: 'Proof of Packing',
      desc: 'No video evidence or documentation when disputes arise about shipment contents'
    },
    {
      stat: 'No',
      title: 'Operator Accountability',
      desc: 'Unable to track individual operator performance or identify training needs'
    }
  ]

  const howItWorks = [
    { num: '01', title: 'Connect Camera', desc: 'Live webcam or upload pre-recorded video', icon: Video },
    { num: '02', title: 'AI Detection', desc: 'YOLOv5 counts boxes in real-time with 95%+ accuracy', icon: Cpu },
    { num: '03', title: 'Track Session', desc: 'Monitor count, operator, and batch ID live', icon: BarChart3 },
    { num: '04', title: 'Generate Challan', desc: 'Auto-create PDF with video evidence and audit trail', icon: FileText }
  ]

  const features = [
    {
      icon: Eye,
      title: 'Real-Time AI Detection',
      desc: 'YOLOv5-powered computer vision tracks every box with sub-50ms latency and 95%+ accuracy',
      color: 'from-sky-400 to-blue-500'
    },
    {
      icon: Video,
      title: 'Complete Session Recording',
      desc: 'Automatic video recording of every session for dispute resolution and audit trails',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: FileText,
      title: 'Instant PDF Challan',
      desc: 'Auto-generate compliance documents with QR codes, session details, and operator info',
      color: 'from-emerald-400 to-teal-500'
    },
    {
      icon: BarChart3,
      title: 'Operator Analytics',
      desc: 'Track performance metrics, throughput trends, and identify training needs',
      color: 'from-blue-400 to-indigo-500'
    },
    {
      icon: Shield,
      title: '100% Local Processing',
      desc: 'Complete data privacy with no cloud dependencies - all processing runs on your infrastructure',
      color: 'from-amber-400 to-orange-500'
    }
  ]

  const benefits = [
    { icon: CheckCircle2, text: 'Eliminate manual counting errors', color: 'text-emerald-400' },
    { icon: CheckCircle2, text: 'Video proof for every shipment', color: 'text-sky-400' },
    { icon: CheckCircle2, text: 'Track operator performance', color: 'text-purple-400' },
    { icon: CheckCircle2, text: 'Automated PDF challan generation', color: 'text-blue-400' },
    { icon: CheckCircle2, text: 'Real-time box counting', color: 'text-amber-400' },
    { icon: CheckCircle2, text: 'Complete data privacy', color: 'text-pink-400' }
  ]

  const techStack = [
    { category: 'Frontend', techs: ['React', 'Tailwind CSS', 'Framer Motion', 'Recharts'], icon: Package },
    { category: 'Backend', techs: ['Python Flask', 'MongoDB', 'WebSocket'], icon: Database },
    { category: 'AI/ML', techs: ['YOLOv5', 'OpenCV', 'Ultralytics'], icon: Cpu },
    { category: 'Tools', techs: ['ReportLab', 'Axios', 'React Router'], icon: Target }
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      
      <LandingNav />
      
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
              transform: `translateY(${scrollY * 0.5}px)`
            }}
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 -left-40 w-96 h-96 bg-sky-500/30 rounded-full blur-3xl" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-40 -right-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" 
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/30 rounded-full mb-8 backdrop-blur-sm"
          >
            <Sparkles size={14} className="text-sky-400" />
            <span className="text-sm font-medium text-sky-300">AI-Powered Warehouse Automation</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-6 leading-tight"
          >
            Count Smarter.<br />
            Pack Smarter.<br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Ship Smarter.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            AI-powered box detection system that eliminates counting errors, provides video proof, 
            and tracks operator performance—all without cloud dependencies.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center justify-center gap-4 flex-wrap mb-16"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="group px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-sky-500/50 transition-all hover:scale-105"
            >
              <span className="flex items-center gap-2">
                Open Dashboard
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              onClick={() => document.getElementById('how-it-works').scrollIntoView()}
              className="px-8 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl font-bold text-lg hover:bg-gray-800 hover:border-sky-500/50 transition-all"
            >
              <span className="flex items-center gap-2">
                <Play size={20} />
                See How It Works
              </span>
            </button>
          </motion.div>

          {/* Key Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
          >
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl hover:border-gray-700 transition-all"
                >
                  <Icon size={16} className={benefit.color} />
                  <span className="text-sm font-semibold text-gray-300">{benefit.text}</span>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              The Problem with <span className="text-red-400">Manual Counting</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Traditional warehouse operations face critical challenges that cost time and money
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {problems.map((problem, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="p-8 bg-gradient-to-br from-red-900/20 to-gray-900/50 backdrop-blur-sm border border-red-900/30 rounded-2xl hover:border-red-800/50 transition-all"
              >
                <div className="text-4xl font-black text-red-400 mb-3">{problem.stat}</div>
                <h3 className="text-xl font-bold mb-2">{problem.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{problem.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-lg text-gray-400">Simple 4-step process from camera to challan</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {howItWorks.map((step, idx) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: idx * 0.15, duration: 0.5 }}
                  className="relative group"
                >
                  <div className="relative z-10 p-6 bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl hover:border-sky-500/50 transition-all h-full">
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-sm shadow-lg">
                      {step.num}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon size={24} className="text-sky-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-24 px-6 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Complete <span className="bg-gradient-to-r from-emerald-400 to-sky-500 bg-clip-text text-transparent">Feature Set</span>
            </h2>
            <p className="text-lg text-gray-400">Everything you need for modern warehouse operations</p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="group relative p-6 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl hover:border-gray-700 transition-all overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <Icon size={20} className="text-white" />
                    </motion.div>
                    <h3 className="text-base font-bold mb-2 group-hover:text-white transition-colors">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{feature.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="relative py-24 px-6 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              About <span className="bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent">BoxGuard</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              An intelligent warehouse automation system built for NEXUS 2025
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-8 bg-gradient-to-br from-sky-900/20 to-gray-900/50 backdrop-blur-sm border border-sky-800/30 rounded-2xl"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Target size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Project Vision</h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                BoxGuard revolutionizes warehouse operations by combining cutting-edge AI with practical automation. 
                Our system eliminates manual counting errors, provides irrefutable video evidence, and delivers 
                real-time analytics—all while maintaining complete data privacy through local processing.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Built as a comprehensive solution for modern warehouses, BoxGuard addresses the critical gap 
                between traditional manual processes and the need for accurate, accountable, and efficient operations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-8 bg-gradient-to-br from-purple-900/20 to-gray-900/50 backdrop-blur-sm border border-purple-800/30 rounded-2xl"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                <Zap size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Key Innovations</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">Custom-trained YOLOv5 model achieving 95%+ accuracy on warehouse boxes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-sky-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">Real-time WebSocket streaming for sub-50ms detection latency</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">Automated PDF generation with QR codes and embedded video links</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">Comprehensive operator analytics with performance tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-pink-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">100% local processing ensuring complete data privacy</span>
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 bg-gradient-to-br from-emerald-900/20 to-gray-900/50 backdrop-blur-sm border border-emerald-800/30 rounded-2xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Impact & Benefits</h3>
                <p className="text-sm text-gray-400">Measurable improvements in warehouse operations</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="text-3xl font-black text-emerald-400 mb-1">95%+</div>
                <p className="text-sm text-gray-400">Detection Accuracy</p>
              </div>
              <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="text-3xl font-black text-sky-400 mb-1">100%</div>
                <p className="text-sm text-gray-400">Video Evidence</p>
              </div>
              <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="text-3xl font-black text-purple-400 mb-1">Zero</div>
                <p className="text-sm text-gray-400">Cloud Dependencies</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="relative py-20 px-6 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Built with <span className="text-sky-400">Modern Tech</span>
            </h2>
            <p className="text-gray-400">Powered by industry-leading technologies</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {techStack.map((stack, idx) => {
              const Icon = stack.icon
              return (
                <motion.div
                  key={stack.category}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="p-6 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl hover:border-sky-500/50 transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Icon size={20} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{stack.category}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stack.techs.map(tech => (
                      <span key={tech} className="px-3 py-1 bg-sky-500/10 border border-sky-500/30 rounded-full text-xs font-semibold text-sky-400">
                        {tech}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-12 bg-gradient-to-br from-sky-500/10 to-purple-500/10 border border-sky-500/30 rounded-3xl backdrop-blur-sm overflow-hidden"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute top-0 right-0 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 7, repeat: Infinity, delay: 1 }}
              className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
            />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                <span className="bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent">
                  Ready to Get Started?
                </span>
              </h2>
              <p className="text-lg text-gray-400 mb-10">
                Experience AI-powered warehouse intelligence today
              </p>

              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-10 py-5 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-sky-500/50 transition-all hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    Open Dashboard
                    <ArrowRight size={24} />
                  </span>
                </button>
                
                <button
                  onClick={() => navigate('/signup')}
                  className="px-10 py-5 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl font-bold text-xl hover:bg-gray-800 hover:border-sky-500/50 transition-all"
                >
                  Create Account
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative py-12 px-6 border-t border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Box size={20} className="text-white" />
                </div>
                <span className="text-2xl font-black">
                  <span className="bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent">Box</span>
                  <span className="text-white">Guard</span>
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4 max-w-md">
                AI-powered warehouse automation system that eliminates counting errors, 
                provides video proof, and tracks operator performance with complete data privacy.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield size={14} />
                <span>100% Local Processing • No Cloud Services • Complete Data Privacy</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-sky-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-sky-400 transition-colors">How It Works</a></li>
                <li><a href="#about" className="hover:text-sky-400 transition-colors">About</a></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-sky-400 transition-colors">Dashboard</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-3">Project Info</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>NEXUS 2025</li>
                <li>VYES Institute of Technology</li>
                <li>Senior AI/ML Track</li>
                <li className="pt-2 border-t border-gray-800 mt-2">
                  <span className="text-xs text-gray-500">Version 1.0.0</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-600">
              © 2025 BoxGuard. Built with ❤️ for warehouse automation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
