
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/UI';
import { 
  CheckCircle, BarChart, Zap, Shield, ArrowRight, 
  Globe, TrendingUp, Layout, Smartphone, Cloud, Star, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';

// --- Components ---

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <div className="group p-8 rounded-3xl bg-slate-900/40 border border-white/5 hover:border-primary/50 hover:bg-slate-900/80 transition-all duration-300 relative overflow-hidden backdrop-blur-sm">
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300">
      <Icon className="text-primary" size={28} />
    </div>
    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{description}</p>
  </div>
);

const PricingCard = ({ title, price, period, features, recommended, onAction }: any) => (
  <div className={`relative p-8 rounded-3xl border flex flex-col h-full transition-all duration-300 hover:transform hover:-translate-y-2 ${recommended ? 'bg-slate-900/80 border-primary/50 shadow-2xl shadow-primary/10 z-10 scale-105 ring-1 ring-primary/20' : 'bg-slate-900/20 border-white/5 hover:bg-slate-900/40'}`}>
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg uppercase tracking-wide">
        Best Value
      </div>
    )}
    <div className="mb-6">
      <h3 className={`text-lg font-bold mb-2 ${recommended ? 'text-white' : 'text-slate-400'}`}>{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-white">{price}</span>
        {period && <span className="text-sm text-slate-500">{period}</span>}
      </div>
    </div>
    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>
    <ul className="space-y-4 mb-8 flex-1">
      {features.map((f: string, i: number) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <div className={`mt-0.5 p-0.5 rounded-full flex-shrink-0 ${recommended ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'}`}>
             <CheckCircle size={12} />
          </div>
          <span className="text-slate-300">{f}</span>
        </li>
      ))}
    </ul>
    <button 
      onClick={onAction}
      className={`w-full py-4 font-bold rounded-xl transition-all duration-300 ${recommended ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25 hover:shadow-primary/40' : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'}`}
    >
      Get Started
    </button>
  </div>
);

// --- Main Page ---

export const Landing = () => {
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const testimonials = [
    { name: "Sarah Jenkins", role: "Bakery Owner", feedback: "ElifySIS transformed how we handle our morning rush. The interface is so intuitive my staff learned it in minutes.", img: "https://i.pravatar.cc/150?img=1" },
    { name: "Michael Chen", role: "Retail Manager", feedback: "The inventory alerts saved us thousands in lost stock. It's the best investment we've made this year.", img: "https://i.pravatar.cc/150?img=11" },
    { name: "Elena Rodriguez", role: "Boutique Owner", feedback: "I love the dark mode! Plus, seeing my net profit in real-time gives me such peace of mind.", img: "https://i.pravatar.cc/150?img=5" },
    { name: "David Okonjo", role: "Supermarket CEO", feedback: "Finally, a system that handles multiple currencies and locations without crashing. Highly recommended!", img: "https://i.pravatar.cc/150?img=8" },
    { name: "James Wilson", role: "Electronics Store", feedback: "The POS is lightning fast. We process customers 2x faster than our old system.", img: "https://i.pravatar.cc/150?img=15" }
  ];

  // Auto-advance testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-primary/30 selection:text-white overflow-x-hidden">
      
      <style>{`
        .glass-nav {
            background: rgba(2, 6, 23, 0.6);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        
        .grid-bg-container {
            position: absolute;
            inset: 0;
            overflow: hidden;
            /* Fade out at bottom */
            mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
        }

        .grid-bg {
            position: absolute;
            inset: 0;
            background-size: 50px 50px;
            background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        }

        /* Moving Light Beams */
        @keyframes beam-h {
            0% { left: -100px; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { left: 100%; opacity: 0; }
        }
        @keyframes beam-v {
            0% { top: -100px; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }

        .light-beam-h {
            position: absolute;
            height: 1px;
            width: 200px; /* Length of the light packet */
            background: linear-gradient(90deg, transparent, #3b82f6, #a855f7, transparent);
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
            animation: beam-h 4s linear infinite;
            opacity: 0;
        }

        .light-beam-v {
            position: absolute;
            width: 1px;
            height: 200px; /* Length of the light packet */
            background: linear-gradient(180deg, transparent, #3b82f6, #a855f7, transparent);
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
            animation: beam-v 5s linear infinite;
            opacity: 0;
        }

        .text-glow {
            text-shadow: 0 0 40px rgba(26, 115, 232, 0.3);
        }
      `}</style>

      {/* Navbar */}
      <nav className="fixed w-full z-50 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
             <div className="relative w-10 h-10">
                <div className="relative w-full h-full bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center border border-white/10 text-white font-bold text-xl pb-1">e</div>
             </div>
             <span className="text-2xl font-bold tracking-tight text-white">ElifySIS</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#why-us" className="hover:text-white transition-colors">Why Us</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-slate-300 hover:text-white font-medium transition-colors">Log In</button>
            <button onClick={() => navigate('/signup')} className="bg-white text-slate-950 px-6 py-2.5 rounded-full font-bold hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]">
               Get Started
            </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
             {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
            <div className="md:hidden bg-slate-950 border-b border-white/10 p-4 absolute w-full">
                <div className="flex flex-col gap-4 text-center">
                    <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white py-2">Features</a>
                    <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white py-2">Why Us</a>
                    <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white py-2">Pricing</a>
                    <hr className="border-white/10"/>
                    <button onClick={() => navigate('/login')} className="text-white py-2 font-bold">Log In</button>
                    <button onClick={() => navigate('/signup')} className="bg-primary text-white py-3 rounded-xl font-bold">Get Started</button>
                </div>
            </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Animated Background */}
        <div className="grid-bg-container">
            <div className="grid-bg"></div>
            {/* Horizontal Beams - Aligned to 50px grid lines */}
            <div className="light-beam-h" style={{ top: '150px', animationDelay: '0s', animationDuration: '6s' }}></div>
            <div className="light-beam-h" style={{ top: '350px', animationDelay: '2s', animationDuration: '5s' }}></div>
            <div className="light-beam-h" style={{ top: '550px', animationDelay: '1s', animationDuration: '7s' }}></div>
            {/* Vertical Beams */}
            <div className="light-beam-v" style={{ left: '10%', animationDelay: '1.5s', animationDuration: '5s' }}></div>
            <div className="light-beam-v" style={{ left: '30%', animationDelay: '0.5s', animationDuration: '4s' }}></div>
            <div className="light-beam-v" style={{ left: '80%', animationDelay: '3s', animationDuration: '6s' }}></div>
        </div>
        
        {/* Glow Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-40"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] -z-10 opacity-30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-relaxed mb-8 tracking-normal animate-in fade-in slide-in-from-bottom-8 duration-1000 text-glow max-w-5xl mx-auto">
              Manage your business 
              <span className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">like a pro.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 mb-10 leading-relaxed max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              ElifySIS connects your sales, inventory, and finance in one beautiful, dark-mode enabled dashboard. Simple enough for beginners, powerful enough for enterprises.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <button onClick={() => navigate('/signup')} className="h-14 px-10 text-lg font-bold text-white bg-gradient-to-r from-primary to-accent rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105 flex items-center justify-center gap-2">
                  Start Free Trial <ArrowRight size={20}/>
              </button>
              <button onClick={() => navigate('/login')} className="h-14 px-10 text-lg font-bold text-white bg-slate-900 border border-white/10 hover:bg-slate-800 rounded-full transition-all flex items-center justify-center">
                  Live Demo
              </button>
            </div>

            {/* Dashboard Preview */}
            <div className="relative mx-auto max-w-6xl animate-in fade-in zoom-in duration-1000 delay-500">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-purple-600 rounded-[20px] blur-xl opacity-20"></div>
                <div className="relative rounded-2xl border border-white/10 bg-slate-950 overflow-hidden shadow-2xl">
                    {/* Browser Bar */}
                    <div className="h-8 bg-slate-900 border-b border-white/5 flex items-center px-4 gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                    {/* Using remote image as requested */}
                    <img 
                      src="https://raw.githubusercontent.com/Binoculars7/Learn-V1/refs/heads/main/elifysis.JPG"
                      alt="Dashboard Interface" 
                      className="w-full h-auto object-cover" 
                    />
                </div>
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-3">Features</h2>
                <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">Everything you need to grow.</h3>
                <p className="text-slate-400 text-lg">We've consolidated all the tools you use into one seamless operating system.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard 
                    icon={Layout} 
                    title="Intuitive Dashboard" 
                    description="Get a bird's eye view of your business with customizable widgets and real-time data visualization."
                />
                <FeatureCard 
                    icon={Smartphone} 
                    title="Mobile First POS" 
                    description="Process sales from anywhere in the store. Works perfectly on tablets and mobile devices."
                />
                <FeatureCard 
                    icon={Zap} 
                    title="Instant Sync" 
                    description="Changes made on one device reflect instantly across all other devices in your store."
                />
                <FeatureCard 
                    icon={Shield} 
                    title="Role-Based Security" 
                    description="Granular control over who sees what. Keep your financial data safe from unauthorized eyes."
                />
                <FeatureCard 
                    icon={BarChart} 
                    title="Advanced Reporting" 
                    description="Deep dive into sales trends, best performing products, and inventory turnover rates."
                />
                <FeatureCard 
                    icon={Cloud} 
                    title="Cloud Backup" 
                    description="Never lose your data. Automatic backups ensure your business record is safe forever."
                />
            </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="py-24 bg-slate-900/50 border-y border-white/5">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-16">
             <div className="flex-1 space-y-8">
                 <h2 className="text-4xl font-bold text-white">Why retailers love ElifySIS</h2>
                 <div className="space-y-6">
                     <div className="flex gap-4 group">
                         <div className="mt-1"><div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors flex items-center justify-center font-bold border border-white/10">1</div></div>
                         <div>
                             <h4 className="text-xl font-bold text-white mb-2">Setup in minutes, not days.</h4>
                             <p className="text-slate-400">No complex hardware requirements. Just sign up and start selling immediately.</p>
                         </div>
                     </div>
                     <div className="flex gap-4 group">
                         <div className="mt-1"><div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors flex items-center justify-center font-bold border border-white/10">2</div></div>
                         <div>
                             <h4 className="text-xl font-bold text-white mb-2">Designed for humans.</h4>
                             <p className="text-slate-400">Our UI is crafted to reduce eye strain and cognitive load, making long shifts easier.</p>
                         </div>
                     </div>
                     <div className="flex gap-4 group">
                         <div className="mt-1"><div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-pink-500/20 group-hover:text-pink-400 transition-colors flex items-center justify-center font-bold border border-white/10">3</div></div>
                         <div>
                             <h4 className="text-xl font-bold text-white mb-2">Scales with you.</h4>
                             <p className="text-slate-400">From a single kiosk to a multi-location chain, ElifySIS handles it all effortlessly.</p>
                         </div>
                     </div>
                 </div>
             </div>
             <div className="flex-1 relative">
                 <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 rounded-full blur-[100px] opacity-20"></div>
                 <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=1000" alt="Happy customer" className="relative rounded-2xl shadow-2xl border border-white/10 w-full" />
             </div>
         </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center max-w-3xl mx-auto mb-20">
                 <h2 className="text-4xl font-bold text-white mb-6">Simple, Transparent Pricing</h2>
                 <p className="text-slate-400 text-lg">No hidden fees. No credit card required for trial.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <PricingCard 
                    title="Demo" 
                    price="$0" 
                    period="forever"
                    features={['Single User', '50 Products Limit', 'Basic Dashboard', 'Community Support']} 
                    onAction={() => navigate('/signup')}
                 />
                 <PricingCard 
                    title="Monthly" 
                    price="$10" 
                    period="/mo"
                    features={['Unlimited Users', 'Unlimited Products', 'Full Analytics', 'Email Support']} 
                    onAction={() => navigate('/signup')}
                 />
                 <PricingCard 
                    title="Half-Year" 
                    price="$50" 
                    period="/6 mos"
                    features={['Save 17%', 'Priority Support', 'Advanced Exports', 'Custom Branding']} 
                    onAction={() => navigate('/signup')}
                 />
                 <PricingCard 
                    title="Yearly" 
                    price="$80" 
                    period="/yr"
                    recommended={true}
                    features={['Best Value (Save 33%)', 'Dedicated Manager', 'API Access', 'Free Onboarding']} 
                    onAction={() => navigate('/signup')}
                 />
             </div>
         </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-32 bg-slate-900 border-y border-white/5 relative overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
         <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-16">Trusted by businesses like yours</h2>
            
            <div className="relative min-h-[300px]">
                {testimonials.map((t, idx) => (
                    <div 
                        key={idx}
                        className={`absolute top-0 left-0 w-full transition-all duration-700 ease-in-out transform ${
                            idx === activeTestimonial 
                            ? 'opacity-100 translate-x-0 scale-100' 
                            : 'opacity-0 translate-x-12 scale-95 pointer-events-none'
                        }`}
                    >
                        <div className="flex flex-col items-center">
                            <div className="mb-8 relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                                <img src={t.img} alt={t.name} className="w-24 h-24 rounded-full border-4 border-slate-800 shadow-xl relative z-10" />
                                <div className="absolute -bottom-2 -right-2 bg-slate-800 p-2 rounded-full border border-white/10 z-20">
                                    <div className="flex text-amber-400">
                                        {[1,2,3,4,5].map(i => <Star key={i} size={10} fill="currentColor" />)}
                                    </div>
                                </div>
                            </div>
                            <blockquote className="text-2xl md:text-3xl text-slate-300 font-medium leading-relaxed mb-8 max-w-2xl mx-auto">
                                "{t.feedback}"
                            </blockquote>
                            <div className="text-center">
                                <h4 className="text-xl font-bold text-white">{t.name}</h4>
                                <p className="text-primary font-medium">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Carousel Controls */}
            <div className="flex justify-center items-center gap-4 mt-8">
                <button 
                    onClick={() => setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                    className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-white/5"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex gap-2">
                    {testimonials.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveTestimonial(idx)}
                            className={`transition-all duration-300 rounded-full ${
                                idx === activeTestimonial ? 'w-8 h-2 bg-primary' : 'w-2 h-2 bg-slate-700 hover:bg-slate-600'
                            }`}
                        />
                    ))}
                </div>
                <button 
                    onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
                    className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-white/5"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-slate-950 pt-20 border-t border-white/5">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden mb-20 shadow-2xl group">
                 <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-1000"></div>
                 <div className="relative z-10">
                     <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to modernize your store?</h2>
                     <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">Join thousands of retailers who trust ElifySIS to run their business smoothly and efficiently. Start your free trial today.</p>
                     <button onClick={() => navigate('/signup')} className="bg-white text-slate-950 px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-all">
                         Get Started Now
                     </button>
                 </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-12 border-b border-white/5">
                 <div className="col-span-2 lg:col-span-2">
                     <div className="flex items-center gap-2 mb-6">
                         <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold border border-white/20">E</div>
                         <span className="text-xl font-bold text-white">ElifySIS</span>
                     </div>
                     <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-xs">
                         The operating system for modern retail. Built by developers, loved by shop owners across the globe.
                     </p>
                     <div className="flex gap-4">
                         <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary/20 transition-all border border-white/5">
                             <Globe size={18} />
                         </a>
                     </div>
                 </div>
                 
                 <div>
                     <h4 className="font-bold text-white mb-6">Product</h4>
                     <ul className="space-y-4 text-sm text-slate-400">
                         <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                         <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                         <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                         <li><a href="#" className="hover:text-primary transition-colors">Updates</a></li>
                     </ul>
                 </div>
                 
                 <div>
                     <h4 className="font-bold text-white mb-6">Company</h4>
                     <ul className="space-y-4 text-sm text-slate-400">
                         <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                         <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                         <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                         <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                     </ul>
                 </div>
                 
                 <div>
                     <h4 className="font-bold text-white mb-6">Support</h4>
                     <ul className="space-y-4 text-sm text-slate-400">
                         <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                         <li><a href="#" className="hover:text-primary transition-colors">API Docs</a></li>
                         <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                         <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                     </ul>
                 </div>
             </div>
             
             <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600">
                 <p>© {new Date().getFullYear()} ElifySIS Inc. All rights reserved.</p>
                 <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                     <span>All systems operational</span>
                 </div>
             </div>
         </div>
      </footer>
    </div>
  );
};
