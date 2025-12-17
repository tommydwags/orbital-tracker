import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics"; // Added for your config
import {
  Hammer,
  ShoppingCart,
  Database,
  Plus,
  Trash2,
  Check,
  Search,
  Save,
  Moon,
  Sun,
  AlertCircle,
  Package,
  ArrowRight,
  Zap,
  Activity,
  Edit2,
  X,
  Filter,
  ArrowUpDown,
  Loader2,
  Wifi,
  WifiOff,
  Minus,
  Coins,
  Weight,
  Info,
  Ship,
  User,
  Flag,
  Tag,
  Factory,
  Settings,
  Archive,
  Calendar,
  Layers,
  BarChart3,
  PieChart,
  MapPin,
  Globe,
  Navigation,
  Compass,
  Orbit,
  Mountain,
  Disc,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  LogOut,
  Lock
} from 'lucide-react';

// --- FIREBASE CONFIGURATION (Dual-Mode) ---
const getFirebaseConfig = () => {
  // A. Check for Canvas/Immersive Environment
  try {
    if (typeof __firebase_config !== 'undefined') {
      return JSON.parse(__firebase_config);
    }
  } catch (e) {
    console.error("Canvas config parse error", e);
  }

  // B. Manual Config for Real/External Deployment
  // UPDATED: Using your specific credentials
  const manualConfig = {
    apiKey: "AIzaSyD2pagm3feLw8KlmCoYFqZyKAE9_4erdUE",
    authDomain: "starfield-logistics.firebaseapp.com",
    projectId: "starfield-logistics",
    storageBucket: "starfield-logistics.firebasestorage.app",
    messagingSenderId: "59835681606",
    appId: "1:59835681606:web:d4ce891481673f733b3347",
    measurementId: "G-BJBBZQMVPE"
  };

  return manualConfig;
};

// Use the global app ID if in Canvas, otherwise use your project ID for the Firestore path
const appId = typeof __app_id !== 'undefined' ? __app_id : 'starfield-logistics';
const firebaseConfig = getFirebaseConfig();

let auth = null;
let db = null;
let analytics = null;

if (firebaseConfig) {
  try {
      const app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      // Initialize analytics only if in a browser environment that supports it
      if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
      }
  } catch (err) {
      console.error("Firebase Initialization Error:", err);
  }
}

// --- MASTER DATA ---
const INITIAL_SYSTEMS_DB = {
    'Sol': [
        { name: 'Mercury', moons: [] },
        { name: 'Venus', moons: [] },
        { name: 'Earth', moons: [{ name: 'Luna', environments: [] }] },
        { name: 'Mars', moons: ['Phobos', 'Deimos'] },
        { name: 'Jupiter', moons: ['Io', 'Europa', 'Ganymede', 'Callisto'] },
        { name: 'Saturn', moons: [{ name: 'Titan', environments: ['Craters'] }, 'Enceladus'] },
        { name: 'Uranus', moons: ['Miranda', 'Ariel', 'Umbriel', 'Titania', 'Oberon'] },
        { name: 'Neptune', moons: ['Triton'] },
        { name: 'Pluto', moons: ['Charon'] }
    ],
    'Alpha Centauri': [
        { name: 'Jemison', moons: [] },
        { name: 'Gagarin', moons: [] },
        { name: 'Olivas', moons: ['Chawla', 'Zamka'] }
    ],
    'Cheyenne': [
        { name: 'Akila', moons: ['Codos'] },
        { name: 'Montara', moons: [] }
    ],
    'Volii': [
        { name: 'Volii Alpha', moons: [] },
        { name: 'Volii Epsilon', moons: [] }
    ],
    'Narion': [
        { name: 'Niira', moons: [] },
        { name: 'Sumati', moons: ['Andraphon'] },
        { name: 'Vectera', moons: [] },
        { name: 'Anselon', moons: ['Kreet', 'Vectera'] }
    ],
    'Kryx': [
        { name: 'Suvorov', moons: [] },
        { name: 'The Key', moons: [] }
    ]
};

const MASTER_RESOURCE_DB = [
  { id: 'al', name: 'Aluminum', type: 'Raw Inorganic', mass: 0.5, value: 7 },
  { id: 'fe', name: 'Iron', type: 'Raw Inorganic', mass: 0.6, value: 8 },
  { id: 'he3', name: 'Helium-3', type: 'Raw Inorganic', mass: 0.1, value: 5 },
  { id: 'h2o', name: 'Water', type: 'Raw Inorganic', mass: 0.5, value: 4 },
  { id: 'cu', name: 'Copper', type: 'Raw Inorganic', mass: 0.6, value: 10 },
  { id: 'ni', name: 'Nickel', type: 'Raw Inorganic', mass: 0.6, value: 9 },
  { id: 'pb', name: 'Lead', type: 'Raw Inorganic', mass: 0.7, value: 10 },
  { id: 'u', name: 'Uranium', type: 'Raw Inorganic', mass: 0.6, value: 12 },
  { id: 'ar', name: 'Argon', type: 'Raw Inorganic', mass: 0.5, value: 6 },
  { id: 'c6hn', name: 'Benzene', type: 'Raw Inorganic', mass: 0.6, value: 7 },
  { id: 'cl', name: 'Chlorine', type: 'Raw Inorganic', mass: 0.5, value: 6 },
  { id: 'f', name: 'Fluorine', type: 'Raw Inorganic', mass: 0.5, value: 9 },
  { id: 'w', name: 'Tungsten', type: 'Raw Inorganic', mass: 0.7, value: 14 },
  { id: 'ti', name: 'Titanium', type: 'Raw Inorganic', mass: 0.5, value: 10 },
  { id: 'co', name: 'Cobalt', type: 'Raw Inorganic', mass: 0.6, value: 11 },
  { id: 'ag', name: 'Silver', type: 'Raw Inorganic', mass: 0.6, value: 18 },
  { id: 'au', name: 'Gold', type: 'Raw Inorganic', mass: 0.8, value: 24 },
  { id: 'pt', name: 'Platinum', type: 'Raw Inorganic', mass: 0.8, value: 24 },
  { id: 'pu', name: 'Plutonium', type: 'Raw Inorganic', mass: 0.8, value: 64 },
  { id: 'vyt', name: 'Vytinium', type: 'Raw Inorganic', mass: 1.2, value: 130 },
  { id: 'ald', name: 'Aldumite', type: 'Raw Inorganic', mass: 1.0, value: 110 },
  { id: 'ind', name: 'Indicite', type: 'Raw Inorganic', mass: 0.8, value: 105 },
  { id: 'roth', name: 'Rothicite', type: 'Raw Inorganic', mass: 0.9, value: 108 },
  { id: 'tas', name: 'Tasine', type: 'Raw Inorganic', mass: 0.5, value: 120 },
  { id: 'ver', name: 'Veryl', type: 'Raw Inorganic', mass: 0.7, value: 115 },
  { id: 'frame', name: 'Adaptive Frame', type: 'Manufactured', mass: 1.5, value: 25 },
  { id: 'wire', name: 'Zero Wire', type: 'Manufactured', mass: 0.3, value: 35 },
  { id: 'mag', name: 'Zero-G Gimbal', type: 'Manufactured', mass: 2.0, value: 85 },
  { id: 'pos', name: 'Positron Battery', type: 'Manufactured', mass: 1.5, value: 110 },
  { id: 'semi', name: 'Semimetal Wafer', type: 'Manufactured', mass: 1.2, value: 95 },
  { id: 'rheo', name: 'Rheostat', type: 'Manufactured', mass: 0.4, value: 40 },
  { id: 'iso', name: 'Isocentered Magnet', type: 'Manufactured', mass: 1.8, value: 65 },
  { id: 'mag_pres', name: 'Mag Pressure Tank', type: 'Manufactured', mass: 2.5, value: 140 },
  { id: 'mono', name: 'Monopropellant', type: 'Manufactured', mass: 1.0, value: 40 },
  { id: 'poly', name: 'Polytextile', type: 'Manufactured', mass: 0.5, value: 45 },
  { id: 'comm', name: 'Comm Relay', type: 'Manufactured', mass: 1.5, value: 30 },
  { id: 'micro', name: 'Microsecond Regulator', type: 'Manufactured', mass: 0.5, value: 105 },
  { id: 'sieve', name: 'Molecular Sieve', type: 'Manufactured', mass: 1.0, value: 90 },
  { id: 'super_mag', name: 'Supercooled Magnet', type: 'Manufactured', mass: 2.0, value: 95 },
  { id: 'tau', name: 'Tau Grade Rheostat', type: 'Manufactured', mass: 0.5, value: 80 },
  { id: 'fuel_rod', name: 'Nuclear Fuel Rod', type: 'Manufactured', mass: 2.0, value: 160 },
  { id: 'power', name: 'Power Circuit', type: 'Manufactured', mass: 0.6, value: 150 },
  { id: 'ing_fe', name: 'Iron Ingot', type: 'Ingot', mass: 1.0, value: 25 },
  { id: 'ing_al', name: 'Aluminum Ingot', type: 'Ingot', mass: 0.8, value: 22 },
  { id: 'ing_cu', name: 'Copper Ingot', type: 'Ingot', mass: 1.0, value: 28 },
  { id: 'ing_ni', name: 'Nickel Ingot', type: 'Ingot', mass: 1.0, value: 26 },
  { id: 'ing_ti', name: 'Titanium Ingot', type: 'Ingot', mass: 0.8, value: 35 },
  { id: 'ing_w', name: 'Tungsten Ingot', type: 'Ingot', mass: 1.2, value: 45 },
  { id: 'ing_co', name: 'Cobalt Ingot', type: 'Ingot', mass: 1.0, value: 30 },
  { id: 'ing_pt', name: 'Platinum Ingot', type: 'Ingot', mass: 1.2, value: 65 },
  { id: 'bat_s', name: 'Small Battery', type: 'Manufactured', mass: 0.5, value: 50 },
  { id: 'bat_m', name: 'Medium Battery', type: 'Manufactured', mass: 1.5, value: 150 },
  { id: 'bat_l', name: 'Large Battery', type: 'Manufactured', mass: 4.0, value: 400 },
  { id: 'seal', name: 'Sealant', type: 'Organic', mass: 0.1, value: 6 },
  { id: 'adh', name: 'Adhesive', type: 'Organic', mass: 0.1, value: 8 },
  { id: 'lub', name: 'Lubricant', type: 'Organic', mass: 0.1, value: 12 },
  { id: 'tox', name: 'Toxin', type: 'Organic', mass: 0.1, value: 10 },
  { id: 'fiber_root', name: 'Fiber (Root)', type: 'Flora', mass: 0.2, value: 4 },
  { id: 'fiber_leaf', name: 'Fiber (Leaf)', type: 'Flora', mass: 0.1, value: 4 },
  { id: 'fiber', name: 'Fiber (Processed)', type: 'Organic', mass: 0.1, value: 6 },
  { id: 'nutrient', name: 'Nutrient', type: 'Flora', mass: 0.1, value: 5 },
  { id: 'meta', name: 'Metabolic Agent', type: 'Flora', mass: 0.1, value: 8 },
  { id: 'struc', name: 'Structural Material', type: 'Flora', mass: 0.3, value: 8 },
];

const MASTER_BLUEPRINT_DB = [
  { id: 'bp_solar', name: 'Solar Array', category: 'Power', ingredients: [{ resourceId: 'ing_al', count: 4 }, { resourceId: 'ing_cu', count: 2 }, { resourceId: 'semi', count: 2 }] },
  { id: 'bp_wind', name: 'Wind Turbine', category: 'Power', ingredients: [{ resourceId: 'ing_al', count: 5 }, { resourceId: 'ing_ni', count: 3 }, { resourceId: 'ing_co', count: 2 }] },
  { id: 'bp_ext_water', name: 'Water Extractor', category: 'Extraction', ingredients: [{ resourceId: 'ing_ni', count: 4 }, { resourceId: 'ing_fe', count: 3 }, { resourceId: 'membrane', count: 1 }] },
  { id: 'bp_store_solid', name: 'Storage - Solid', category: 'Storage', ingredients: [{ resourceId: 'ing_al', count: 6 }, { resourceId: 'ing_fe', count: 3 }, { resourceId: 'frame', count: 2 }] },
  { id: 'bp_turret_bal', name: 'Ballistic Turret Mk1', category: 'Defense', ingredients: [{ resourceId: 'ing_al', count: 4 }, { resourceId: 'ing_fe', count: 2 }, { resourceId: 'wire', count: 2 }] },
  { id: 'bp_bench_ind', name: 'Industrial Workbench', category: 'Crafting', ingredients: [{ resourceId: 'ing_al', count: 4 }, { resourceId: 'ing_fe', count: 3 }] },
];

const PRIORITIES = {
  CRITICAL: { value: 3, label: 'Critical', color: 'text-red-500 border-red-500 bg-red-500/10' },
  HIGH: { value: 2, label: 'High', color: 'text-orange-500 border-orange-500 bg-orange-500/10' },
  STANDARD: { value: 1, label: 'Standard', color: 'text-blue-500 border-blue-500 bg-blue-500/10' },
  LOW: { value: 0, label: 'Low', color: 'text-slate-500 border-slate-500 bg-slate-500/10' }
};

const PROJECT_TYPES = ['Outpost', 'Ship Engineering', 'Research', 'Weaponry', 'Spacesuit', 'Logistics', 'Other'];
const LOCATION_TYPES = ['Outpost', 'City', 'Settlement', 'Station', 'Wilderness', 'Mine'];

const DEFAULT_STATE = {
  resources: MASTER_RESOURCE_DB,
  blueprints: MASTER_BLUEPRINT_DB,
  systems: INITIAL_SYSTEMS_DB, 
  projects: [],
  nodes: [],
  stash: {},
  capacities: { ship: 1000, person: 135 }
};

// --- HELPER UTILS ---
const normalizePlanet = (p) => {
    if (!p) return { name: 'Unknown', moons: [], environments: [] };
    if (typeof p === 'string') return { name: p, moons: [], environments: [] };
    return { 
        name: p.name, 
        moons: (p.moons || []).map(m => typeof m === 'string' ? { name: m, environments: [] } : m), 
        environments: p.environments || [] 
    };
};

// --- UI COMPONENTS ---

const Card = ({ children, className = "", theme, onClick }) => {
  const themeStyle = theme === 'cockpit' 
    ? "bg-slate-900/90 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-amber-50" 
    : "bg-white border border-slate-200 shadow-sm text-slate-800";
  return <div onClick={onClick} className={`p-4 rounded-lg transition-all duration-300 relative overflow-hidden ${themeStyle} ${className}`}>{children}</div>;
};

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = "", theme, disabled }) => {
  const sizes = { sm: "px-2 py-1 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  let themeColors = {};
  if (theme === 'cockpit') {
    themeColors = {
      primary: "bg-amber-600 hover:bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]",
      secondary: "bg-transparent border border-amber-600 text-amber-500 hover:bg-amber-900/30",
      danger: "bg-red-900/30 border border-red-500/50 text-red-400 hover:bg-red-900/50",
      ghost: "text-amber-500 hover:bg-amber-900/20",
      success: "bg-green-600 text-black border-green-600 hover:bg-green-500"
    };
  } else {
    themeColors = {
      primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-sm",
      secondary: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50",
      danger: "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100",
      ghost: "text-slate-500 hover:bg-slate-100",
      success: "bg-green-600 text-white hover:bg-green-500"
    };
  }
  return <button onClick={onClick} className={`font-medium rounded transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${themeColors[variant]} ${className}`} disabled={disabled}>{children}</button>;
};

const Input = ({ label, type = "text", value, onChange, placeholder, theme, className = "" }) => {
  const inputStyle = theme === 'cockpit' ? "bg-slate-950 border-amber-700/50 text-amber-100 focus:border-amber-500" : "bg-white border-slate-300 text-slate-900 focus:border-blue-500";
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className={`text-[10px] uppercase tracking-wider font-semibold ${theme === 'cockpit' ? "text-amber-400/80" : "text-slate-600"}`}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={`w-full px-3 py-2 rounded border outline-none transition-colors ${inputStyle}`} />
    </div>
  );
};

const Badge = ({ children, theme, type = 'default' }) => {
    let colors = theme === 'cockpit' ? "bg-amber-900/30 text-amber-400 border-amber-700/30" : "bg-slate-100 text-slate-700 border-slate-200";
    if (type === 'CRITICAL') colors = theme === 'cockpit' ? "bg-red-900/40 text-red-400 border-red-500/40" : "bg-red-50 text-red-700 border-red-200";
    return <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide whitespace-nowrap border ${colors}`}>{children}</span>;
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, theme }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-sm p-6 rounded-xl shadow-2xl relative ${theme === 'cockpit' ? 'bg-slate-950 border border-amber-600 text-amber-50' : 'bg-white text-slate-800'}`}>
        <div className="mb-4"><h3 className="text-lg font-bold mb-2">{title}</h3><p className="text-sm opacity-80">{message}</p></div>
        <div className="flex justify-end gap-2"><Button theme={theme} variant="secondary" onClick={onCancel}>Cancel</Button><Button theme={theme} variant="danger" onClick={onConfirm}>Confirm</Button></div>
      </div>
    </div>
  );
};

const LoginView = ({ onLogin }) => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
    {/* Starfield-esque background decoration */}
    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,10,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
    
    <div className="relative z-10 max-w-sm w-full bg-slate-900/80 backdrop-blur-md border border-amber-500/30 p-8 rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.1)]">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/50 animate-pulse">
           <Zap size={40} className="text-amber-500" />
        </div>
      </div>
      
      <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Constellation</h1>
      <p className="text-amber-500/60 text-xs font-mono uppercase tracking-widest mb-8">Logistics & Companion System</p>
      
      <div className="space-y-4">
        <button 
          onClick={onLogin}
          className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold py-4 rounded-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-amber-900/20"
        >
           <Globe size={20} /> Authenticate Pilot
        </button>
        <div className="text-[10px] text-slate-500 font-mono uppercase">
           <Lock size={10} className="inline mr-1" /> Security Clearance Required
        </div>
      </div>
    </div>
  </div>
);

// --- SUB-COMPONENTS ---

const OverviewView = ({ appData, theme, setActiveTab }) => {
    const expProjects = appData.projects.filter(p => !p.completed && p.isExpedition);
    const activeProjects = appData.projects.filter(p => !p.completed);
    
    // Calculate Dashboard Stats
    let readiness = 100;
    let totalMassNeeded = 0;
    let totalCostNeeded = 0;
    const typeDistribution = {};
    const priorityCounts = { CRITICAL: 0, HIGH: 0, STANDARD: 0, LOW: 0 };

    if (activeProjects.length > 0) {
        let totalN = 0, totalH = 0;
        activeProjects.forEach(p => {
            const prio = p.priority || 'STANDARD';
            priorityCounts[prio] = (priorityCounts[prio] || 0) + 1;

            p.ingredients.forEach(i => {
                const res = appData.resources.find(r => r.id === i.resourceId);
                const needed = Math.max(0, i.count - i.current);
                
                if (p.isExpedition) {
                    totalN += i.count;
                    totalH += i.current;
                }

                if (needed > 0 && res) {
                    totalMassNeeded += needed * res.mass;
                    totalCostNeeded += needed * res.value;
                    const type = res.type || 'Other';
                    typeDistribution[type] = (typeDistribution[type] || 0) + needed;
                }
            });
        });
        if (expProjects.length > 0) readiness = totalN === 0 ? 100 : Math.round((totalH / totalN) * 100);
    }

    let color = readiness > 80 ? 'text-green-500' : readiness > 40 ? 'text-amber-500' : 'text-red-500';
    
    const sortedDistribution = Object.entries(typeDistribution).sort((a,b) => b[1] - a[1]).slice(0, 4); 

    return (
        <div className="space-y-4 pb-20 animate-in fade-in">
            {/* TOP ROW */}
            <div className="grid grid-cols-3 gap-2">
                <Card theme={theme} className="col-span-1 flex flex-col items-center justify-center py-2">
                    <div className="text-[9px] font-bold uppercase opacity-50 mb-1">Projected Cost</div>
                    <div className="text-sm font-mono font-bold text-yellow-500">{totalCostNeeded.toLocaleString()}</div>
                    <div className="text-[8px] opacity-40">Credits</div>
                </Card>
                <Card theme={theme} className="col-span-1 flex flex-col items-center justify-center p-0 overflow-hidden relative">
                      <div className={`absolute inset-0 flex items-center justify-center`}><svg className="w-full h-full -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className={`${color} opacity-10`} /><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${readiness * 2.51} 251`} className={`${color} transition-all duration-1000 ease-out`} /></svg></div>
                      <div className={`text-xl font-bold font-mono z-10 ${color}`}>{readiness}%</div>
                      <div className="text-[7px] uppercase font-bold tracking-widest opacity-60 z-10 mt-1">Readiness</div>
                </Card>
                <Card theme={theme} className="col-span-1 flex flex-col items-center justify-center py-2">
                    <div className="text-[9px] font-bold uppercase opacity-50 mb-1">Total Mass Load</div>
                    <div className="text-sm font-mono font-bold text-blue-500">{totalMassNeeded.toFixed(0)}</div>
                    <div className="text-[8px] opacity-40">Kilograms</div>
                </Card>
            </div>

            {/* SUPPLY CHAIN */}
            <Card theme={theme}>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold uppercase flex items-center gap-2"><BarChart3 size={14}/> Supply Chain Demand</h3>
                </div>
                {sortedDistribution.length > 0 ? (
                    <div className="space-y-2">
                        {sortedDistribution.map(([type, count]) => {
                            const total = Object.values(typeDistribution).reduce((a,b)=>a+b,0);
                            const pct = (count / total) * 100;
                            return (
                                <div key={type} className="flex items-center gap-2 text-xs">
                                    <div className="w-24 truncate opacity-70">{type}</div>
                                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${theme==='cockpit'?'bg-slate-800':'bg-slate-200'}`}><div className={`h-full ${theme==='cockpit'?'bg-amber-600':'bg-blue-600'}`} style={{width: `${pct}%`}}/></div>
                                    <div className="w-8 text-right font-mono opacity-50">{count}</div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-4 text-xs opacity-50">No active resource demands.</div>
                )}
            </Card>

            {/* PRIORITY */}
            <Card theme={theme} className="flex flex-col gap-2">
                <div className="flex justify-between items-center border-b border-opacity-10 border-current pb-1"><h3 className="text-xs font-bold uppercase flex items-center gap-2"><Activity size={14}/> Mission Priority</h3></div>
                <div className="grid grid-cols-4 gap-2 text-center">
                    <div><div className="text-lg font-bold text-red-500">{priorityCounts.CRITICAL}</div><div className="text-[8px] uppercase opacity-50">Crit</div></div>
                    <div><div className="text-lg font-bold text-orange-500">{priorityCounts.HIGH}</div><div className="text-[8px] uppercase opacity-50">High</div></div>
                    <div><div className="text-lg font-bold text-blue-500">{priorityCounts.STANDARD}</div><div className="text-[8px] uppercase opacity-50">Std</div></div>
                    <div><div className="text-lg font-bold opacity-50">{priorityCounts.LOW}</div><div className="text-[8px] uppercase opacity-50">Low</div></div>
                </div>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
                <Button theme={theme} variant="secondary" onClick={() => setActiveTab('projects')}><Hammer size={16}/> View Missions</Button>
                <Button theme={theme} variant="secondary" onClick={() => setActiveTab('manifest')}><ShoppingCart size={16}/> View Manifest</Button>
            </div>
        </div>
    );
};

const ProjectsView = ({ appData, theme, setModalOpen, setModalType, setEditProjectData, deleteProject, completeProject }) => {
    const [filterType, setFilterType] = useState('All');
    
    const activeProjects = appData.projects.filter(p => !p.completed).sort((a, b) => {
        const pA = PRIORITIES[a.priority || 'STANDARD'].value;
        const pB = PRIORITIES[b.priority || 'STANDARD'].value;
        return pB - pA;
    });
    
    const completedProjects = appData.projects.filter(p => p.completed).sort((a, b) => b.completedAt - a.completedAt);
    const filtered = activeProjects.filter(p => filterType === 'All' || p.type === filterType);

    return (
      <div className="space-y-4 pb-20">
        <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center"><h2 className={`text-xl font-bold uppercase tracking-widest ${theme === 'cockpit' ? 'text-amber-500' : 'text-slate-800'}`}>Mission Log</h2><Button theme={theme} onClick={() => { setEditProjectData(null); setModalType('addProject'); setModalOpen(true); }}><Plus size={16} /> New</Button></div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"><button onClick={() => setFilterType('All')} className={`px-3 py-1 text-xs font-bold uppercase rounded border ${filterType === 'All' ? (theme==='cockpit'?'bg-amber-600 text-black border-amber-600':'bg-blue-600 text-white') : 'opacity-50'}`}>All</button>{PROJECT_TYPES.map(t => (<button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1 text-xs font-bold uppercase rounded border whitespace-nowrap ${filterType === t ? (theme==='cockpit'?'bg-amber-600 text-black border-amber-600':'bg-blue-600 text-white') : 'opacity-50'}`}>{t}</button>))}</div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(project => {
             const canComplete = project.ingredients.every(i => i.current >= i.count);
             return (
                <Card key={project.id} theme={theme} className="group">
                   <div className="flex justify-between items-start mb-2">
                      <div><h3 className="font-bold text-lg">{project.name}</h3><div className="flex gap-2 mt-1"><Badge theme={theme} type={project.priority}>{project.priority}</Badge>{project.isExpedition && <Badge theme={theme} type="CRITICAL">EXPEDITION</Badge>}</div></div>
                      <div className="flex gap-1">
                          <button onClick={() => { setEditProjectData(project); setModalType('addProject'); setModalOpen(true); }} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-400"><Edit2 size={16}/></button>
                          <button onClick={() => deleteProject(project)} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                   </div>
                   <div className="space-y-3 mt-4">{project.ingredients.map(ing => { const res = appData.resources.find(r => r.id === ing.resourceId); const percent = Math.min(100, (ing.current / ing.count) * 100); return (<div key={ing.resourceId} className="space-y-1"><div className="flex justify-between text-xs font-mono opacity-80"><span>{res?.name || ing.resourceId}</span><span>{ing.current} / {ing.count}</span></div><div className={`h-1.5 rounded-full overflow-hidden ${theme==='cockpit'?'bg-slate-800':'bg-slate-200'}`}><div className={`h-full transition-all duration-500 ${theme==='cockpit'?'bg-amber-500':'bg-blue-600'}`} style={{width: `${percent}%`}} /></div></div>); })}</div>
                   {canComplete && (<div className="mt-4 pt-4 border-t border-opacity-10 border-current"><Button theme={theme} variant="success" className="w-full" onClick={() => completeProject(project)}><Check size={16}/> Complete Mission</Button></div>)}
                </Card>
             )
          })}
          {filtered.length === 0 && <div className="text-center py-12 opacity-50">No projects found.</div>}
        </div>

        {completedProjects.length > 0 && (
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-4 opacity-50 font-bold uppercase text-xs tracking-widest"><Archive size={14}/> Mission Archive</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-60">
                    {completedProjects.map(p => (
                        <Card key={p.id} theme={theme} className="flex justify-between items-center py-3">
                            <div><div className="font-bold line-through">{p.name}</div><div className="text-[10px] flex items-center gap-1"><Calendar size={10}/> {new Date(p.completedAt).toLocaleDateString()}</div></div>
                            <div className="text-xs border px-2 py-1 rounded border-green-500/30 text-green-500">COMPLETED</div>
                        </Card>
                    ))}
                </div>
            </div>
        )}
      </div>
    );
};

const NodesView = ({ appData, theme, setModalOpen, setModalType, setEditNodeData, deleteNode }) => {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [showOptimizer, setShowOptimizer] = useState(false);
    const [optimizedRoute, setOptimizedRoute] = useState([]);
    const [missingResources, setMissingResources] = useState([]);

    // Improved Weighted Optimizer with Missing Resource Detection
    const calculateRoute = () => {
        const needsMap = {}; // ResourceID -> QuantityNeeded
        appData.projects.filter(p => !p.completed).forEach(p => {
            p.ingredients.forEach(i => {
                const diff = Math.max(0, i.count - i.current);
                if (diff > 0) needsMap[i.resourceId] = (needsMap[i.resourceId] || 0) + diff;
            });
        });

        const neededRes = new Set(Object.keys(needsMap));
        if (neededRes.size === 0) { 
            setOptimizedRoute([]); 
            setMissingResources([]);
            return; 
        }

        let remainingNeeds = new Set(neededRes);
        const route = [];
        const availableNodes = [...appData.nodes];

        // Greedy loop with weighting
        while (remainingNeeds.size > 0 && availableNodes.length > 0) {
            let bestNode = null;
            let bestScore = -1;
            let bestCovered = [];

            availableNodes.forEach(node => {
                const covered = node.resources.filter(r => remainingNeeds.has(r));
                if (covered.length === 0) return;

                // --- WEIGHTED SCORING ---
                let score = 0;
                
                // 1. Quantity Weight: Prioritize nodes that yield resources we need A LOT of
                covered.forEach(r => {
                    const qtyNeeded = needsMap[r] || 0;
                    score += 10 + (qtyNeeded * 0.5); // Base 10 per resource + bonus for quantity
                });

                // 2. Cluster Bonus: Prioritize nodes in same System or Planet as previously picked nodes
                // (This minimizes Grav Jumps in the final plan)
                if (route.length > 0) {
                    const lastNode = route[route.length - 1];
                    if (node.system === lastNode.system) score += 5;
                    if (node.planet === lastNode.planet) score += 8;
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestNode = node;
                    bestCovered = covered;
                }
            });

            if (bestNode) {
                route.push({ ...bestNode, gathered: bestCovered });
                bestCovered.forEach(r => remainingNeeds.delete(r));
                // Remove used node to prevent duplicates
                const idx = availableNodes.findIndex(n => n.id === bestNode.id);
                availableNodes.splice(idx, 1);
            } else {
                break;
            }
        }
        
        // Final Sort: Group by System -> Planet to make the flight plan logical
        route.sort((a,b) => a.system.localeCompare(b.system) || a.planet.localeCompare(b.planet));
        
        // Calculate missing
        const missing = Array.from(remainingNeeds).map(id => appData.resources.find(r => r.id === id)?.name || id);

        setOptimizedRoute(route);
        setMissingResources(missing);
        setShowOptimizer(true);
    };

    const filteredNodes = (appData.nodes || []).filter(node => {
        const query = search.toLowerCase();
        const basicMatch = node.name.toLowerCase().includes(query) || node.system.toLowerCase().includes(query) || node.planet.toLowerCase().includes(query);
        if (basicMatch) return true;
        const resMatch = node.resources.some(rId => {
            const r = appData.resources.find(res => res.id === rId);
            return r && r.name.toLowerCase().includes(query);
        });
        return resMatch;
    }).sort((a,b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'system') return a.system.localeCompare(b.system) || a.planet.localeCompare(b.planet);
        if (sortBy === 'planet') return a.planet.localeCompare(b.planet);
        if (sortBy === 'type') return a.type.localeCompare(b.type);
        return 0;
    });

    return (
        <div className="space-y-4 pb-20">
            {showOptimizer ? (
                <Card theme={theme} className="border-l-4 border-green-500 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold uppercase text-xs flex items-center gap-2"><Compass size={16}/> Flight Plan (Optimized)</h3>
                        <Button size="sm" variant="ghost" onClick={() => setShowOptimizer(false)}><X size={14}/></Button>
                    </div>
                    {optimizedRoute.length > 0 ? (
                        <div className="space-y-3">
                            {optimizedRoute.map((stop, idx) => (
                                <div key={idx} className="flex gap-3 text-sm">
                                    <div className={`font-mono font-bold opacity-50`}>0{idx+1}</div>
                                    <div className="flex-1">
                                        <div className="font-bold">{stop.name} 
                                            <span className="opacity-60 text-xs font-normal ml-1">
                                                ({stop.system} - {stop.planet}
                                                {stop.environment && <span className="ml-1 border-l pl-1 border-current opacity-80 text-amber-500">{stop.environment}</span>}
                                                )
                                            </span>
                                        </div>
                                        <div className="text-xs opacity-70 mt-1">
                                            Target: {stop.gathered.map(rId => appData.resources.find(r=>r.id===rId)?.name).join(', ')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm opacity-60">No route nodes found covering needed resources.</div>
                    )}
                    
                    {/* Missing Resources Section */}
                    {missingResources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-current border-opacity-10">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase text-red-500 mb-2"><AlertTriangle size={12} /> Still Missing</div>
                            <div className="flex flex-wrap gap-1">
                                {missingResources.map(r => (
                                    <span key={r} className={`text-[10px] px-2 py-0.5 rounded border ${theme==='cockpit'?'border-red-900 bg-red-900/20 text-red-400':'border-red-200 bg-red-50 text-red-700'}`}>
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            ) : (
                <div className="flex gap-2">
                    <Button theme={theme} variant="secondary" className="flex-1" onClick={calculateRoute}><Navigation size={16}/> Calculate Optimal Route</Button>
                </div>
            )}

            <div className="flex gap-2 mt-4 items-center">
                <Input theme={theme} placeholder="Search Systems or Resources..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
                <div className="w-24">
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`w-full p-2.5 text-xs rounded outline-none ${theme==='cockpit'?'bg-slate-950 border border-amber-700':'bg-white border-slate-300'}`}>
                          <option value="name">Name</option>
                          <option value="system">System</option>
                          <option value="planet">Planet</option>
                          <option value="type">Type</option>
                      </select>
                </div>
                <Button theme={theme} onClick={() => { setEditNodeData(null); setModalType('addNode'); setModalOpen(true); }}><Plus size={16}/></Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNodes.map(node => (
                    <Card key={node.id} theme={theme} className="relative group">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg">{node.name}</h3>
                                <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
                                    <Globe size={12} /> {node.system} <ArrowRight size={8} /> {node.planet}
                                    {node.environment && <span className="opacity-70 border-l pl-2 border-current">{node.environment}</span>}
                                </div>
                                <div className="mt-1"><Badge theme={theme} type="default">{node.type}</Badge></div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => { setEditNodeData(node); setModalType('addNode'); setModalOpen(true); }} className="p-2 opacity-0 group-hover:opacity-100 hover:text-blue-400"><Edit2 size={16}/></button>
                                <button onClick={() => deleteNode(node.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-400"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <div className="border-t border-current border-opacity-10 pt-3 mt-3">
                            <div className="text-[10px] font-bold uppercase opacity-50 mb-2">Resources</div>
                            <div className="flex flex-wrap gap-2">
                                {node.resources.map(rId => {
                                    const r = appData.resources.find(res => res.id === rId);
                                    return <span key={rId} className={`px-2 py-1 rounded text-xs border ${theme==='cockpit'?'bg-slate-900 border-amber-900 text-amber-500':'bg-slate-100 border-slate-200'}`}>{r?.name || rId}</span>
                                })}
                            </div>
                        </div>
                    </Card>
                ))}
                {filteredNodes.length === 0 && <div className="col-span-full text-center py-12 opacity-50">No locations tracked.</div>}
            </div>
        </div>
    );
};

const ManifestView = ({ appData, theme, handleLoot, handleStashUpdate }) => {
    const [tab, setTab] = useState('acquisition'); 
    const [metric, setMetric] = useState('mass');
    const [editingStashId, setEditingStashId] = useState(null);
    const [tempStashQty, setTempStashQty] = useState(0);
    const [editingAcqId, setEditingAcqId] = useState(null);
    const [tempAcqQty, setTempAcqQty] = useState(0);
    const [stashAddId, setStashAddId] = useState('');
    const [stashAddQty, setStashAddQty] = useState(1);
    const [filterType, setFilterType] = useState('All');
    
    const allRes = useMemo(() => [...appData.resources].sort((a,b) => a.name.localeCompare(b.name)), [appData.resources]);
    const types = ['All', ...new Set(appData.resources.map(r => r.type))].sort();
    
    const filteredDropdownRes = allRes.filter(r => filterType === 'All' || r.type === filterType);
    
    useEffect(() => {
        if (filteredDropdownRes.length > 0) {
            if (!filteredDropdownRes.find(r => r.id === stashAddId)) {
                setStashAddId(filteredDropdownRes[0].id);
            }
        } else {
            setStashAddId('');
        }
    }, [filterType, filteredDropdownRes, stashAddId]);

    const needs = {};
    const allocated = {};
    appData.projects.filter(p => !p.completed).forEach(p => {
        p.ingredients.forEach(i => {
            needs[i.resourceId] = (needs[i.resourceId] || 0) + i.count;
            allocated[i.resourceId] = (allocated[i.resourceId] || 0) + i.current;
        });
    });

    const list = Object.keys(needs).map(id => {
        const r = appData.resources.find(x => x.id === id);
        return {
            id, name: r?.name || id,
            needed: needs[id], owned: allocated[id] || 0,
            mass: r?.mass || 0, val: r?.value || 0,
            type: r?.type || 'Unknown'
        };
    })
    .filter(i => i.owned < i.needed)
    .filter(i => filterType === 'All' || i.type === filterType)
    .sort((a,b) => a.name.localeCompare(b.name));

    const stashList = Object.entries(appData.stash).map(([id, qty]) => {
        const r = appData.resources.find(x => x.id === id);
        return { id, name: r?.name || id, qty, mass: r?.mass || 0, type: r?.type || 'Unknown' };
    })
    .filter(i => i.qty > 0)
    .filter(i => filterType === 'All' || i.type === filterType)
    .sort((a,b) => a.name.localeCompare(b.name));

    const massInCargo = Object.keys(needs).reduce((acc, id) => {
        const r = appData.resources.find(x => x.id === id);
        return acc + ((allocated[id] || 0) * (r?.mass || 0));
    }, 0) + Object.entries(appData.stash).reduce((acc, [id, qty]) => {
        const r = appData.resources.find(x => x.id === id);
        return acc + (qty * (r?.mass || 0));
    }, 0);
    
    const capacity = appData.capacities.ship + appData.capacities.person;
    const isOver = massInCargo > capacity;

    const startEditStash = (id, currentQty) => { setEditingStashId(id); setTempStashQty(currentQty); };
    const saveStashEdit = (id) => { handleStashUpdate(id, tempStashQty); setEditingStashId(null); };

    const startEditAcq = (id, currentOwned) => { setEditingAcqId(id); setTempAcqQty(currentOwned); };
    const saveAcqEdit = (id, currentOwned) => { 
        const delta = tempAcqQty - currentOwned; 
        if (delta !== 0) handleLoot(id, delta); 
        setEditingAcqId(null); 
    };

    return (
        <div className="space-y-6 pb-20">
            <Card theme={theme} className={`py-4 text-center border-l-4 ${metric === 'mass' ? 'border-l-blue-500' : 'border-l-yellow-500'}`}>
                <div className="text-xs font-bold uppercase opacity-60 mb-1">{metric === 'mass' ? 'Logistics Load' : 'Est. Purchase Cost'}</div>
                <div className={`text-3xl font-mono font-bold ${metric === 'credits' ? 'text-yellow-500' : ''}`}>
                    {metric === 'mass' ? massInCargo.toFixed(1) : list.reduce((a,b) => a + (Math.max(0,b.needed-b.owned)*b.val), 0).toLocaleString()}
                    <span className="text-sm opacity-50 ml-1">{metric === 'mass' ? 'kg' : 'Cr'}</span>
                </div>
                {metric === 'mass' && (<div className="mt-2 text-[10px] uppercase font-bold"><span className={isOver ? 'text-red-500' : 'text-green-500'}>{massInCargo.toFixed(1)} / {capacity} kg</span></div>)}
            </Card>
            <div className="flex border-b border-opacity-20 border-current">
                <button onClick={() => setTab('acquisition')} className={`flex-1 pb-2 text-xs font-bold uppercase tracking-widest ${tab==='acquisition' ? (theme==='cockpit'?'text-amber-500 border-b-2 border-amber-500':'text-blue-600 border-b-2 border-blue-600') : 'opacity-40'}`}>Acquisition</button>
                <button onClick={() => setTab('inventory')} className={`flex-1 pb-2 text-xs font-bold uppercase tracking-widest ${tab==='inventory' ? (theme==='cockpit'?'text-amber-500 border-b-2 border-amber-500':'text-blue-600 border-b-2 border-blue-600') : 'opacity-40'}`}>Inventory</button>
            </div>
            
            {/* Global Filter for both tabs */}
            <div className="flex justify-between items-center mb-2">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`text-xs p-1 rounded ${theme==='cockpit'?'bg-slate-950 border-amber-700':'bg-white border-slate-300'}`}>{types.map(t => <option key={t} value={t}>{t}</option>)}</select>
                {tab === 'acquisition' && (
                    <div className="flex bg-current/10 p-1 rounded">
                        <button onClick={() => setMetric('mass')} className={`px-3 py-1 text-[10px] uppercase font-bold rounded ${metric==='mass'?(theme==='cockpit'?'bg-amber-600 text-black':'bg-blue-600 text-white'):'opacity-50'}`}>Mass</button>
                        <button onClick={() => setMetric('credits')} className={`px-3 py-1 text-[10px] uppercase font-bold rounded ${metric==='credits'?(theme==='cockpit'?'bg-yellow-600 text-black':'bg-yellow-600 text-white'):'opacity-50'}`}>Credits</button>
                    </div>
                )}
            </div>

            {tab === 'acquisition' && (
                <div className="space-y-2">
                    {list.map(i => {
                        return (
                            <Card key={i.id} theme={theme} className="flex items-center justify-between p-3">
                                <div className="flex-1">
                                    <div className="font-bold text-sm">{i.name}</div>
                                    <div className="text-[10px] font-mono opacity-60">{metric === 'mass' ? `${i.mass} kg` : `${i.val} Cr`} / unit</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right cursor-pointer group" onClick={() => startEditAcq(i.id, i.owned)}>
                                        <div className="text-[9px] uppercase font-bold opacity-50">Owned / Need</div>
                                        {editingAcqId === i.id ? (
                                            <div className="flex items-center gap-1">
                                                <input 
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                    type="number" 
                                                    value={tempAcqQty} 
                                                    onChange={(e) => setTempAcqQty(parseInt(e.target.value) || 0)}
                                                    className={`w-12 p-0.5 text-center text-sm rounded ${theme==='cockpit'?'bg-slate-950 border-amber-500':'bg-white border-slate-300'} border`}
                                                />
                                                <button onClick={(e) => { e.stopPropagation(); saveAcqEdit(i.id, i.owned); }} className="text-green-500"><Check size={14}/></button>
                                            </div>
                                        ) : (
                                            <div className="font-mono font-bold text-sm group-hover:text-blue-500 flex items-center justify-end gap-1">
                                                {i.owned} / {i.needed} <Edit2 size={10} className="opacity-0 group-hover:opacity-50"/>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => handleLoot(i.id, 1)} className={`w-6 h-6 flex items-center justify-center rounded ${theme==='cockpit'?'bg-slate-800 hover:bg-green-900/50':'bg-slate-200 hover:bg-green-100'}`}><Plus size={12}/></button>
                                        <button onClick={() => handleLoot(i.id, -1)} className={`w-6 h-6 flex items-center justify-center rounded ${theme==='cockpit'?'bg-slate-800 hover:bg-red-900/50':'bg-slate-200 hover:bg-red-100'}`}><Minus size={12}/></button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                    {list.length === 0 && <div className="text-center opacity-50 py-8 text-sm">No pending acquisitions for active projects.</div>}
                </div>
            )}
            
            {tab === 'inventory' && (
                <div className="space-y-4">
                    <Card theme={theme} className="p-3 bg-current/5 border-l-4 border-l-slate-500">
                        <div className="text-xs font-bold uppercase opacity-70 mb-2">Add to Stash</div>
                        <div className="flex gap-2">
                            <select value={stashAddId} onChange={(e) => setStashAddId(e.target.value)} className={`flex-1 p-2 rounded text-sm outline-none ${theme==='cockpit'?'bg-slate-950 border border-amber-800':'bg-white border-slate-300'}`}>
                                {filteredDropdownRes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <input type="number" value={stashAddQty} onChange={(e) => setStashAddQty(parseInt(e.target.value)||1)} className={`w-16 p-2 rounded text-sm outline-none ${theme==='cockpit'?'bg-slate-950 border border-amber-800':'bg-white border-slate-300'}`} />
                            <Button theme={theme} onClick={() => { handleLoot(stashAddId, stashAddQty, true); setStashAddQty(1); }}><Plus size={16}/></Button>
                        </div>
                    </Card>
                    <div className="space-y-2">
                        {stashList.map(i => (
                            <Card key={i.id} theme={theme} className="flex justify-between items-center p-3">
                                <div><div className="font-bold text-sm">{i.name}</div><div className="text-[10px] opacity-60 font-mono">{(i.qty * i.mass).toFixed(1)} kg</div></div>
                                <div className="flex items-center gap-3">
                                    {editingStashId === i.id ? (
                                        <div className="flex items-center gap-1"><input autoFocus type="number" value={tempStashQty} onChange={(e) => setTempStashQty(parseInt(e.target.value) || 0)} className={`w-16 p-1 text-center rounded ${theme==='cockpit'?'bg-slate-950 border-amber-500':'bg-white border-slate-300'} border`} /><button onClick={() => saveStashEdit(i.id)} className="text-green-500"><Check size={16}/></button></div>
                                    ) : (
                                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => startEditStash(i.id, i.qty)}><span className="font-mono font-bold text-lg">{i.qty}</span><Edit2 size={12} className="opacity-0 group-hover:opacity-50" /></div>
                                    )}
                                </div>
                            </Card>
                        ))}
                        {stashList.length === 0 && <div className="text-center opacity-50 py-8 text-sm">Stash is empty (or filtered out).</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper wrapper for DB view to keep main clean
const DatabaseViewWrapper = ({ appData, theme, setModalOpen, setModalType, setEditBlueprintData, updateResource, updateBlueprint, deleteBlueprint, deleteResource, renameSystem, deleteSystem, addPlanet, deletePlanet, addEnvironment, deleteEnvironment, addMoon, deleteMoon, addMoonEnvironment, deleteMoonEnvironment }) => {
    const [viewMode, setViewMode] = useState('resources'); 
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({});
    
    // Systems Editor State
    const [newSysName, setNewSysName] = useState('');
    const [expandedSys, setExpandedSys] = useState(null);
    const [expandedPlanet, setExpandedPlanet] = useState(null); 
    const [expandedMoon, setExpandedMoon] = useState(null);
    const [newPlanetName, setNewPlanetName] = useState('');
    const [newEnvName, setNewEnvName] = useState('');
    const [newMoonName, setNewMoonName] = useState('');
    const [newMoonEnvName, setNewMoonEnvName] = useState('');
    
    // Resource Logic
    const resTypes = ['All', ...new Set(appData.resources.map(r => r.type))].sort();
    const filteredRes = appData.resources
        .filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
        .filter(r => filterType === 'All' || r.type === filterType)
        .sort((a,b) => a.name.localeCompare(b.name));
    
    // Blueprint Logic
    const bpCats = ['All', ...new Set(appData.blueprints.map(b => b.category))].sort();
    const filteredBps = appData.blueprints
        .filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
        .filter(b => filterType === 'All' || b.category === filterType)
        .sort((a,b) => a.name.localeCompare(b.name));

    // Systems Logic
    const systemsList = Object.keys(appData.systems).sort();

    const saveResEdit = () => { updateResource(editId, editForm); setEditId(null); };

    return (
        <div className="space-y-4 pb-20">
            <div className="flex gap-2 mb-2">
                <button onClick={() => { setViewMode('resources'); setFilterType('All'); }} className={`flex-1 py-2 text-xs font-bold uppercase rounded border ${viewMode==='resources' ? (theme==='cockpit'?'bg-amber-600 text-black border-amber-600':'bg-blue-600 text-white') : 'opacity-50'}`}>Resources</button>
                <button onClick={() => { setViewMode('blueprints'); setFilterType('All'); }} className={`flex-1 py-2 text-xs font-bold uppercase rounded border ${viewMode==='blueprints' ? (theme==='cockpit'?'bg-amber-600 text-black border-amber-600':'bg-blue-600 text-white') : 'opacity-50'}`}>Blueprints</button>
                <button onClick={() => setViewMode('systems')} className={`flex-1 py-2 text-xs font-bold uppercase rounded border ${viewMode==='systems' ? (theme==='cockpit'?'bg-amber-600 text-black border-amber-600':'bg-blue-600 text-white') : 'opacity-50'}`}>Systems</button>
            </div>
            
            {viewMode !== 'systems' && (
                <div className="flex gap-2">
                    <Input theme={theme} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
                    <div className="w-1/3">
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`w-full h-full px-2 rounded text-xs outline-none ${theme==='cockpit'?'bg-slate-950 border border-amber-800':'bg-white border-slate-300'}`}>
                            {(viewMode === 'resources' ? resTypes : bpCats).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <Button theme={theme} onClick={() => { setModalType(viewMode === 'resources' ? 'addResource' : 'addBlueprint'); setModalOpen(true); }}><Plus size={16}/></Button>
                </div>
            )}

            {viewMode === 'resources' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredRes.map(r => (
                        <Card key={r.id} theme={theme} className="relative">
                            {editId === r.id ? (
                                <div className="animate-in fade-in duration-200">
                                    <div className="flex justify-between items-center mb-2"><span className="font-bold text-sm">{r.name}</span><div className="flex gap-1"><button onClick={saveResEdit} className="p-1 rounded bg-green-500/20 text-green-500"><Check size={16}/></button><button onClick={() => setEditId(null)} className="p-1 rounded bg-red-500/20 text-red-500"><X size={16}/></button></div></div>
                                    <div className="grid grid-cols-2 gap-2"><div><label className="text-[9px] uppercase font-bold opacity-50">Mass</label><input type="number" step="0.1" value={editForm.mass} onChange={(e) => setEditForm({...editForm, mass: parseFloat(e.target.value)})} className={`w-full p-1 text-xs rounded border ${theme==='cockpit'?'bg-slate-950 border-amber-800':'bg-white border-slate-300'}`} /></div><div><label className="text-[9px] uppercase font-bold opacity-50">Value</label><input type="number" value={editForm.value} onChange={(e) => setEditForm({...editForm, value: parseInt(e.target.value)})} className={`w-full p-1 text-xs rounded border ${theme==='cockpit'?'bg-slate-900 border-amber-800':'bg-white border-slate-300'}`} /></div></div>
                                    <div className="mt-2 text-right"><button onClick={() => deleteResource(r.id)} className="text-[10px] text-red-500 flex items-center gap-1 justify-end ml-auto"><Trash2 size={10}/> Delete Resource</button></div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center py-2" onClick={() => { setEditId(r.id); setEditForm({...r}); }}><div><div className="font-bold text-sm">{r.name}</div><div className="mt-1"><Badge theme={theme} type={r.type}>{r.type}</Badge></div></div><div className="text-right text-xs font-mono opacity-70"><div>{r.mass} kg</div><div>{r.value} Cr</div></div><Edit2 size={12} className="absolute top-2 right-2 opacity-0 group-hover:opacity-50" /></div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {viewMode === 'blueprints' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredBps.map(bp => (
                        <Card key={bp.id} theme={theme} className="relative group">
                            <div className="flex justify-between items-start mb-2"><div><div className="font-bold">{bp.name}</div><div className="text-xs opacity-60 uppercase tracking-widest">{bp.category}</div></div><div className="flex gap-2"><button onClick={() => { setEditBlueprintData(bp); setModalType('editBlueprint'); setModalOpen(true); }} className="opacity-0 group-hover:opacity-100 hover:text-blue-400"><Edit2 size={16}/></button><button onClick={() => deleteBlueprint(bp.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-400"><Trash2 size={16}/></button></div></div>
                            <div className="text-xs opacity-70 space-y-1">{bp.ingredients?.map((ing, i) => { const r = appData.resources.find(x => x.id === ing.resourceId); return <div key={i} className="flex justify-between"><span>{r?.name || ing.resourceId}</span><span>x{ing.count}</span></div>; })}</div>
                        </Card>
                    ))}
                </div>
            )}

            {viewMode === 'systems' && (
                <div className="space-y-4">
                    {/* Add System */}
                    <Card theme={theme} className="p-3 bg-current/5">
                        <div className="text-xs font-bold uppercase opacity-70 mb-2">Register New System</div>
                        <div className="flex gap-2">
                            <Input theme={theme} value={newSysName} onChange={(e) => setNewSysName(e.target.value)} placeholder="System Name" className="flex-1" />
                            <Button theme={theme} onClick={() => { if(newSysName) { renameSystem(null, newSysName); setNewSysName(''); } }}><Plus size={16}/></Button>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {systemsList.map(sys => (
                            <Card key={sys} theme={theme} className="flex flex-col gap-2">
                                <div className="flex justify-between items-center border-b border-opacity-10 border-current pb-2">
                                    <div className="font-bold text-lg">{sys}</div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setExpandedSys(expandedSys === sys ? null : sys)} className="text-xs opacity-50 hover:opacity-100">{expandedSys === sys ? 'Close' : 'Edit'}</button>
                                        <button onClick={() => deleteSystem(sys)} className="text-red-500 opacity-50 hover:opacity-100"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                                {expandedSys === sys ? (
                                    <div className="space-y-2 animate-in fade-in">
                                        <div className="flex gap-2">
                                            <Input theme={theme} value={newPlanetName} onChange={(e) => setNewPlanetName(e.target.value)} placeholder="New Planet" className="flex-1" />
                                            <Button size="sm" theme={theme} onClick={() => { if(newPlanetName) { addPlanet(sys, newPlanetName); setNewPlanetName(''); } }}><Plus size={14}/></Button>
                                        </div>
                                        <div className="space-y-2">
                                            {(appData.systems[sys] || []).map(pItem => {
                                                const pName = typeof pItem === 'string' ? pItem : pItem.name;
                                                const pEnvs = typeof pItem === 'string' ? [] : (pItem.environments || []);
                                                const pMoons = typeof pItem === 'string' ? [] : (pItem.moons || []);
                                                
                                                return (
                                                    <div key={pName} className={`rounded border overflow-hidden ${theme==='cockpit'?'border-slate-700 bg-slate-800':'border-slate-200 bg-slate-50'}`}>
                                                        <div className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-current/5" onClick={() => setExpandedPlanet(expandedPlanet === pName ? null : pName)}>
                                                            <div className="text-sm font-bold flex items-center gap-2">
                                                                <Globe size={12}/> {pName}
                                                                <div className="flex gap-2 text-[10px] opacity-60">
                                                                   {pMoons.length > 0 && <span>{pMoons.length} Moons</span>}
                                                                   {pEnvs.length > 0 && <span>{pEnvs.length} Biomes</span>}
                                                                </div>
                                                            </div>
                                                            <button onClick={(e) => { e.stopPropagation(); deletePlanet(sys, pName); }} className="text-red-400 hover:text-red-600"><X size={12}/></button>
                                                        </div>
                                                        
                                                        {expandedPlanet === pName && (
                                                            <div className="p-2 border-t border-current border-opacity-10 bg-current/5 space-y-3">
                                                                {/* Environments Section */}
                                                                <div>
                                                                    <div className="text-[10px] uppercase font-bold opacity-50 mb-1">Environments</div>
                                                                    <div className="flex gap-1 mb-2">
                                                                        <Input theme={theme} value={newEnvName} onChange={(e) => setNewEnvName(e.target.value)} placeholder="Add Environment" className="flex-1" />
                                                                        <Button size="sm" theme={theme} onClick={() => { if(newEnvName) { addEnvironment(sys, pName, newEnvName); setNewEnvName(''); } }}><Plus size={12}/></Button>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {pEnvs.map(env => (
                                                                            <span key={env} className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 border ${theme==='cockpit'?'border-slate-600 bg-slate-700':'border-slate-300 bg-white'}`}>
                                                                                <Mountain size={8}/> {env}
                                                                                <button onClick={() => deleteEnvironment(sys, pName, env)} className="hover:text-red-500"><X size={8}/></button>
                                                                            </span>
                                                                        ))}
                                                                        {pEnvs.length === 0 && <span className="text-[10px] opacity-50 italic">No environments.</span>}
                                                                    </div>
                                                                </div>

                                                                {/* Moons Section */}
                                                                <div>
                                                                    <div className="text-[10px] uppercase font-bold opacity-50 mb-1">Moons</div>
                                                                    <div className="flex gap-1 mb-2">
                                                                        <Input theme={theme} value={newMoonName} onChange={(e) => setNewMoonName(e.target.value)} placeholder="Add Moon" className="flex-1" />
                                                                        <Button size="sm" theme={theme} onClick={() => { if(newMoonName) { addMoon(sys, pName, newMoonName); setNewMoonName(''); } }}><Plus size={12}/></Button>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        {pMoons.map(moonItem => {
                                                                            const mName = typeof moonItem === 'string' ? moonItem : moonItem.name;
                                                                            const mEnvs = typeof moonItem === 'string' ? [] : (moonItem.environments || []);
                                                                            return (
                                                                                <div key={mName} className={`text-[10px] px-2 py-1 rounded flex flex-col gap-1 border ${theme==='cockpit'?'border-slate-600 bg-slate-700':'border-slate-300 bg-white'}`}>
                                                                                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedMoon(expandedMoon === mName ? null : mName)}>
                                                                                        <div className="flex items-center gap-1"><Disc size={8}/> {mName} {mEnvs.length > 0 && `(${mEnvs.length} biomes)`}</div>
                                                                                        <button onClick={() => { e.stopPropagation(); deleteMoon(sys, pName, mName); }} className="hover:text-red-500"><X size={8}/></button>
                                                                                    </div>
                                                                                    {expandedMoon === mName && (
                                                                                        <div className="pl-2 border-l border-current border-opacity-20 mt-1">
                                                                                            <div className="flex gap-1 mb-1">
                                                                                                <Input theme={theme} value={newMoonEnvName} onChange={(e) => setNewMoonEnvName(e.target.value)} placeholder="Moon Biome" className="flex-1 text-[9px] h-6 py-0" />
                                                                                                <Button size="sm" theme={theme} className="h-6 py-0 px-2" onClick={() => { if(newMoonEnvName) { addMoonEnvironment(sys, pName, mName, newMoonEnvName); setNewMoonEnvName(''); } }}><Plus size={10}/></Button>
                                                                                            </div>
                                                                                            <div className="flex flex-wrap gap-1">
                                                                                                {mEnvs.map(me => (
                                                                                                    <span key={me} className="bg-current/10 px-1 rounded flex items-center gap-1">
                                                                                                        {me}
                                                                                                        <button onClick={() => deleteMoonEnvironment(sys, pName, mName, me)} className="hover:text-red-500"><X size={8}/></button>
                                                                                                    </span>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                        {pMoons.length === 0 && <span className="text-[10px] opacity-50 italic">No moons listed.</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs opacity-60 truncate">
                                        {(appData.systems[sys] || []).map(p => typeof p === 'string' ? p : p.name).join(', ')}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const SettingsView = ({ appData, theme, updateCapacities, confirmAction, saveDataToFirebase, setAppData, showNotification, exportData, importData, softReset, updateDbToMaster, user }) => {
    
    const handleLogout = async () => {
        confirmAction("Sign Out?", "You will return to the login screen.", async () => {
            try {
                if (auth) {
                    await signOut(auth);
                }
            } catch (error) {
                console.error("Logout failed", error);
            }
        });
    };

    return (
        <div className="space-y-6 pb-20">
            <Card theme={theme} className="flex flex-col gap-4 border-l-4 border-l-blue-500">
                <div className="flex justify-between items-center border-b border-opacity-10 border-current pb-2">
                    <h3 className="text-sm font-bold uppercase flex items-center gap-2"><User size={16}/> Pilot License</h3>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            {user?.photoURL ? <img src={user.photoURL} className="w-10 h-10 rounded-full border border-current" alt="Avatar"/> : <div className="w-10 h-10 rounded-full bg-current opacity-20"/>}
                            <div>
                                <div className="font-bold text-sm">{user?.displayName || 'Unknown Pilot'}</div>
                                <div className="text-[10px] opacity-60 font-mono">{user?.email}</div>
                            </div>
                        </div>
                        <p className="text-[10px] opacity-50 bg-green-500/10 text-green-500 p-2 rounded border border-green-500/20">
                            <Check size={10} className="inline mr-1"/> Cloud Sync Active
                        </p>
                        <Button theme={theme} variant="danger" size="sm" onClick={handleLogout}>
                            <LogOut size={16} /> Sign Out
                        </Button>
                    </div>
                </div>
            </Card>

            <Card theme={theme} className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-opacity-10 border-current pb-2"><h3 className="text-sm font-bold uppercase flex items-center gap-2"><Settings size={16}/> Capacity Configuration</h3></div>
                <div className="flex gap-4"><div className="flex-1"><label className="flex items-center gap-1 text-[10px] uppercase font-bold mb-1"><Ship size={10} /> Ship Cargo</label><input type="number" value={appData.capacities.ship} onChange={(e) => updateCapacities({ ship: parseInt(e.target.value) || 0 })} className={`w-full p-2 rounded text-sm font-mono ${theme==='cockpit'?'bg-slate-900 border border-amber-800 text-amber-100':'bg-slate-100 border border-slate-300'}`} /></div><div className="flex-1"><label className="flex items-center gap-1 text-[10px] uppercase font-bold mb-1"><User size={10} /> Personal</label><input type="number" value={appData.capacities.person} onChange={(e) => updateCapacities({ person: parseInt(e.target.value) || 0 })} className={`w-full p-2 rounded text-sm font-mono ${theme==='cockpit'?'bg-slate-900 border border-amber-800 text-amber-100':'bg-slate-100 border border-slate-300'}`} /></div></div>
            </Card>
            
            <Card theme={theme}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Database size={20}/> Data Management</h3>
                <div className="flex flex-col gap-3">
                    <Button theme={theme} variant="secondary" onClick={exportData}><Download size={16}/> Export Data (Backup)</Button>
                    <div className="relative">
                        <input type="file" accept=".json" onChange={importData} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <Button theme={theme} variant="secondary" className="w-full"><Upload size={16}/> Import Data</Button>
                    </div>
                </div>
            </Card>

            <Card theme={theme} className="border-amber-500/30">
                <h3 className="text-lg font-bold mb-2 text-amber-500 flex items-center gap-2"><Sparkles size={20}/> New Game+</h3>
                <p className="text-xs opacity-70 mb-4">Reset your universe state (Projects, Outposts, Stash) but keep your knowledge (Blueprints, Resource Data, System Maps).</p>
                <Button theme={theme} onClick={softReset}>Enter the Unity (Soft Reset)</Button>
            </Card>

            <Card theme={theme} className="border-red-500/30"><h3 className="text-lg font-bold mb-2 text-red-500 flex items-center gap-2"><AlertCircle size={20}/> Danger Zone</h3><Button theme={theme} variant="danger" size="sm" onClick={() => confirmAction("Factory Reset", "This cannot be undone.", () => { saveDataToFirebase(DEFAULT_STATE); setAppData(DEFAULT_STATE); })}>Factory Reset (Wipe All)</Button></Card>
        </div>
    );
};

// --- MAIN APP ---

export default function StarfieldCompanionV26() {
  const [theme, setTheme] = useState('cockpit');
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [appData, setAppData] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [editProjectData, setEditProjectData] = useState(null);
  const [editNodeData, setEditNodeData] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  // Edit Blueprint State
  const [editBlueprintData, setEditBlueprintData] = useState(null);

  // --- PERSISTENCE & FIREBASE ---
  useEffect(() => {
     const savedTheme = localStorage.getItem('starfield_theme');
     if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => { localStorage.setItem('starfield_theme', theme); }, [theme]);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    // AUTO-LOGIN LOGIC REMOVED
    // We now solely rely on onAuthStateChanged to detect if a persistent session exists.
    // If no session exists, the user will see the LoginView.
    return onAuthStateChanged(auth, (u) => { 
        setUser(u); 
        setLoading(false); 
    });
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    return onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'app_data', 'main_save'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure nodes array exists and systems db exists
        setAppData(prev => ({ ...prev, ...data, nodes: data.nodes || [], systems: data.systems || INITIAL_SYSTEMS_DB, resources: data.resources || MASTER_RESOURCE_DB, blueprints: data.blueprints || MASTER_BLUEPRINT_DB }));
      } else saveDataToFirebase(DEFAULT_STATE);
      setLoading(false);
    });
  }, [user]);

  const saveDataToFirebase = async (newData) => { if (user && db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'app_data', 'main_save'), newData); };
  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };
  const confirmAction = (title, message, action) => setConfirmState({ isOpen: true, title, message, onConfirm: () => { action(); setConfirmState(prev => ({ ...prev, isOpen: false })); } });

  // --- NEW ACTIONS (V24) ---
  const exportData = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "starfield_companion_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      showNotification("Data Exported");
  };

  const importData = (event) => {
      const fileReader = new FileReader();
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = e => {
          try {
              const parsed = JSON.parse(e.target.result);
              if (parsed.resources && parsed.projects) {
                  confirmAction("Import Data?", "This will overwrite your current progress.", () => {
                      setAppData(parsed);
                      saveDataToFirebase(parsed);
                      showNotification("Data Imported");
                  });
              } else showNotification("Invalid File");
          } catch(err) { showNotification("Import Failed"); }
      };
  };
  
  const updateDbToMaster = () => {
      confirmAction("Update Database?", "Merge master list?", () => { 
          const newRes = MASTER_RESOURCE_DB.filter(m => !appData.resources.find(r => r.id === m.id)); 
          const newBp = MASTER_BLUEPRINT_DB.filter(m => !appData.blueprints.find(b => b.id === m.id)); 
          // Merge systems logic could be complex, for now trust user edits or master depending on preference.
          // Here we just merge resources/blueprints to avoid overwriting custom systems.
          const newData = {...appData, resources: [...appData.resources, ...newRes], blueprints: [...appData.blueprints, ...newBp]};
          setAppData(newData); 
          saveDataToFirebase(newData); 
          showNotification(`DB Updated (+${newRes.length} items)`); 
      }); 
  };

  const softReset = () => {
      confirmAction("New Game+ Reset?", "This will clear Projects, Stash, and Nodes, but KEEP your Custom Database (Resources, Blueprints, Systems).", () => {
          const newData = {
              ...appData,
              projects: [],
              nodes: [],
              stash: {}
          };
          setAppData(newData);
          saveDataToFirebase(newData);
          showNotification("Universe Reset. Knowledge Retained.");
      });
  };

  const loginWithGoogle = async () => {
      try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
      } catch (error) {
          console.error("Login failed", error);
          showNotification("Login Failed: Popup Blocked?");
      }
  };

  // --- LOGIC ---
  const saveProject = (projectData) => {
    if (editProjectData) {
        const updatedProjects = appData.projects.map(p => {
            if (p.id !== editProjectData.id) return p;
            const newIngredients = projectData.ingredients.map(newIng => {
                const oldIng = p.ingredients.find(old => old.resourceId === newIng.resourceId);
                return { ...newIng, current: oldIng ? Math.min(oldIng.current, newIng.count) : 0 };
            });
            // FIX: Don't auto-complete
            return { ...p, ...projectData, ingredients: newIngredients, completed: false };
        });
        const newData = { ...appData, projects: updatedProjects };
        setAppData(newData); saveDataToFirebase(newData);
        showNotification("Project Updated");
    } else {
        // Deep copy stash for safe mutation
        const newStash = { ...appData.stash };
        const ingredients = projectData.ingredients.map(ing => {
            const inStash = newStash[ing.resourceId] || 0;
            const take = Math.min(inStash, ing.count);
            if (take > 0) {
                newStash[ing.resourceId] -= take;
                if (newStash[ing.resourceId] <= 0) delete newStash[ing.resourceId];
            }
            return { ...ing, current: take };
        });

        const newProject = {
          id: Date.now().toString(), ...projectData,
          ingredients: ingredients,
          createdAt: Date.now(), 
          // FIX: Initialize as not completed
          completed: false
        };
        const newData = { ...appData, projects: [newProject, ...appData.projects], stash: newStash };
        setAppData(newData); saveDataToFirebase(newData);
        showNotification("Project Created");
    }
    setModalOpen(false); setEditProjectData(null);
  };

  const deleteProject = (project) => {
      confirmAction("Dismantle Project?", "Resources will be returned to Stash.", () => {
          const newStash = { ...appData.stash };
          project.ingredients.forEach(ing => { if (ing.current > 0) newStash[ing.resourceId] = (newStash[ing.resourceId] || 0) + ing.current; });
          const newProjects = appData.projects.filter(p => p.id !== project.id);
          const newData = { ...appData, projects: newProjects, stash: newStash };
          setAppData(newData); saveDataToFirebase(newData);
          showNotification("Project Dismantled");
      });
  };

  const completeProject = (project) => {
      confirmAction("Complete Mission?", "Mark as done and archive.", () => {
          const newProjects = appData.projects.map(p => p.id === project.id ? { ...p, completed: true, completedAt: Date.now() } : p);
          const newData = { ...appData, projects: newProjects };
          setAppData(newData); saveDataToFirebase(newData);
          showNotification("Mission Completed!");
      });
  };

  const handleLoot = (resourceId, amount, forceStash = false) => {
      let remaining = Math.abs(amount);
      let newProjects = [...appData.projects];
      const newStash = { ...appData.stash };

      if (amount > 0) { // ADDING
          if (!forceStash) {
              const sortedIndices = newProjects.map((p, index) => ({ p, index, prioVal: PRIORITIES[p.priority || 'STANDARD'].value })).sort((a, b) => b.prioVal - a.prioVal);
              sortedIndices.forEach(({ index }) => {
                  if (newProjects[index].completed || remaining <= 0) return;
                  const newIngs = newProjects[index].ingredients.map(ing => {
                      if (ing.resourceId === resourceId && ing.current < ing.count && remaining > 0) {
                          const take = Math.min(ing.count - ing.current, remaining);
                          remaining -= take;
                          return { ...ing, current: ing.current + take };
                      }
                      return ing;
                  });
                  // FIX: Don't auto-complete
                  newProjects[index] = { ...newProjects[index], ingredients: newIngs, completed: false };
              });
          }
          if (remaining > 0) newStash[resourceId] = (newStash[resourceId] || 0) + remaining;
      } else { // REMOVING
          const inStash = newStash[resourceId] || 0;
          const takeFromStash = Math.min(inStash, remaining);
          if (takeFromStash > 0) {
              newStash[resourceId] -= takeFromStash;
              remaining -= takeFromStash;
              if (newStash[resourceId] <= 0) delete newStash[resourceId];
          }
          
          if (remaining > 0 && !forceStash) {
              // Take from projects if needed
              for (let i = 0; i < newProjects.length; i++) {
                  if (remaining <= 0) break;
                  if (newProjects[i].completed) continue;
                  const newIngs = newProjects[i].ingredients.map(ing => {
                      if (ing.resourceId === resourceId && ing.current > 0 && remaining > 0) {
                          const take = Math.min(ing.current, remaining);
                          remaining -= take;
                          return { ...ing, current: ing.current - take };
                      }
                      return ing;
                  });
                  newProjects[i] = { ...newProjects[i], ingredients: newIngs, completed: false }; 
              }
          }
      }

      const newData = { ...appData, projects: newProjects, stash: newStash };
      setAppData(newData); saveDataToFirebase(newData);
  };

  const handleStashUpdate = (id, newQty) => {
      const newStash = { ...appData.stash };
      if (newQty <= 0) delete newStash[id]; else newStash[id] = newQty;
      const newData = { ...appData, stash: newStash };
      setAppData(newData); saveDataToFirebase(newData);
  };

  // Node Logic
  const addNode = (node) => {
      // Default Title Logic
      const finalName = node.name || `${node.planet} ${node.type}`;
      const newData = { ...appData, nodes: [...(appData.nodes || []), { ...node, name: finalName, id: Date.now().toString() }] };
      setAppData(newData); saveDataToFirebase(newData); setModalOpen(false); showNotification("Node Tracked");
  };
  const updateNode = (id, node) => {
      const finalName = node.name || `${node.planet} ${node.type}`;
      const newData = { ...appData, nodes: appData.nodes.map(n => n.id === id ? { ...n, ...node, name: finalName } : n) };
      setAppData(newData); saveDataToFirebase(newData); setModalOpen(false); showNotification("Node Updated");
  };
  const deleteNode = (id) => {
      confirmAction("Delete Node?", "This will remove the tracking data.", () => {
          const newData = { ...appData, nodes: appData.nodes.filter(n => n.id !== id) };
          setAppData(newData); saveDataToFirebase(newData); showNotification("Node Deleted");
      });
  };
  
  // System/Planet/Moon Logic
  const renameSystem = (oldName, newName) => {
      if (!newName) return;
      const newSystems = { ...appData.systems };
      // If adding new
      if (oldName === null) {
          if (!newSystems[newName]) newSystems[newName] = [];
      } else {
          // Rename existing
          if (newSystems[oldName]) {
              newSystems[newName] = newSystems[oldName];
              delete newSystems[oldName];
              
              // Cascade update nodes
              const newNodes = appData.nodes.map(n => n.system === oldName ? { ...n, system: newName } : n);
              const newData = { ...appData, systems: newSystems, nodes: newNodes };
              setAppData(newData); saveDataToFirebase(newData); showNotification("System Renamed");
              return;
          }
      }
      const newData = { ...appData, systems: newSystems };
      setAppData(newData); saveDataToFirebase(newData);
  };
  
  const deleteSystem = (name) => {
      confirmAction("Delete System?", `This will also impact nodes in ${name}.`, () => {
          const newSystems = { ...appData.systems };
          delete newSystems[name];
          const newData = { ...appData, systems: newSystems };
          setAppData(newData); saveDataToFirebase(newData); showNotification("System Deleted");
      });
  };

  const addPlanet = (systemName, planetName) => {
      const planets = appData.systems[systemName] || [];
      // Normalize check: ensure not duping name (handle string vs object)
      if (planets.some(p => (typeof p === 'string' ? p : p.name) === planetName)) return;
      
      const newPlanetObj = { name: planetName, environments: [], moons: [] };
      const newSystems = { ...appData.systems, [systemName]: [...planets, newPlanetObj] };
      const newData = { ...appData, systems: newSystems };
      setAppData(newData); saveDataToFirebase(newData); showNotification("Planet Added");
  };
  
  const deletePlanet = (systemName, planetName) => {
      const planets = appData.systems[systemName] || [];
      const newSystems = { ...appData.systems, [systemName]: planets.filter(p => (typeof p === 'string' ? p : p.name) !== planetName) };
      const newData = { ...appData, systems: newSystems };
      setAppData(newData); saveDataToFirebase(newData);
  };
  
  const addEnvironment = (systemName, planetName, envName) => {
      const planets = [...(appData.systems[systemName] || [])];
      const pIndex = planets.findIndex(p => (typeof p === 'string' ? p : p.name) === planetName);
      if (pIndex === -1) return;

      // Convert string planet to object if needed
      if (typeof planets[pIndex] === 'string') {
          planets[pIndex] = { name: planets[pIndex], environments: [envName], moons: [] };
      } else {
          // Avoid dups
          // FIX: Handle undefined environments property safely
          const currentEnvs = planets[pIndex].environments || [];
          if (!currentEnvs.includes(envName)) {
              planets[pIndex] = { ...planets[pIndex], environments: [...currentEnvs, envName] };
          }
      }
      
      const newSystems = { ...appData.systems, [systemName]: planets };
      const newData = { ...appData, systems: newSystems };
      setAppData(newData); saveDataToFirebase(newData);
  };
  
  const deleteEnvironment = (systemName, planetName, envName) => {
      const planets = [...(appData.systems[systemName] || [])];
      const pIndex = planets.findIndex(p => (typeof p === 'string' ? p : p.name) === planetName);
      if (pIndex === -1 || typeof planets[pIndex] === 'string') return;
      
      // FIX: Handle undefined environments
      const currentEnvs = planets[pIndex].environments || [];
      planets[pIndex] = { ...planets[pIndex], environments: currentEnvs.filter(e => e !== envName) };
      const newSystems = { ...appData.systems, [systemName]: planets };
      const newData = { ...appData, systems: newSystems };
      setAppData(newData); saveDataToFirebase(newData);
  };

  const addMoon = (systemName, planetName, moonName) => {
      const planets = [...(appData.systems[systemName] || [])];
      const pIndex = planets.findIndex(p => (typeof p === 'string' ? p : p.name) === planetName);
      if (pIndex === -1) return;

      const newMoonObj = { name: moonName, environments: [] };

      if (typeof planets[pIndex] === 'string') {
          planets[pIndex] = { name: planets[pIndex], environments: [], moons: [newMoonObj] };
      } else {
          if (!planets[pIndex].moons) planets[pIndex].moons = [];
          // Check for existing moon
          if (!planets[pIndex].moons.some(m => (typeof m === 'string' ? m : m.name) === moonName)) {
              planets[pIndex] = { ...planets[pIndex], moons: [...planets[pIndex].moons, newMoonObj] };
          }
      }
      
      const newSystems = { ...appData.systems, [systemName]: planets };
      const newData = { ...appData, systems: newSystems };
      setAppData(newData); saveDataToFirebase(newData);
  };

  const deleteMoon = (systemName, planetName, moonName) => {
      const planets = [...(appData.systems[systemName] || [])];
      const pIndex = planets.findIndex(p => (typeof p === 'string' ? p : p.name) === planetName);
      if (pIndex === -1 || typeof planets[pIndex] === 'string') return;
      
      if (planets[pIndex].moons) {
          planets[pIndex] = { ...planets[pIndex], moons: planets[pIndex].moons.filter(m => (typeof m === 'string' ? m : m.name) !== moonName) };
      }
      const newSystems = { ...appData.systems, [systemName]: planets };
      const newData = { ...appData, systems: newSystems };
      setAppData(newData); saveDataToFirebase(newData);
  };

  const addMoonEnvironment = (systemName, planetName, moonName, envName) => {
      const planets = [...(appData.systems[systemName] || [])];
      const pIndex = planets.findIndex(p => (typeof p === 'string' ? p : p.name) === planetName);
      if (pIndex === -1 || typeof planets[pIndex] === 'string') return;

      const moons = [...(planets[pIndex].moons || [])];
      const mIndex = moons.findIndex(m => (typeof m === 'string' ? m : m.name) === moonName);
      if (mIndex === -1) return;

      // Ensure moon is object
      if (typeof moons[mIndex] === 'string') {
          moons[mIndex] = { name: moons[mIndex], environments: [envName] };
      } else {
          if (!moons[mIndex].environments) moons[mIndex].environments = [];
          if (!moons[mIndex].environments.includes(envName)) {
              moons[mIndex] = { ...moons[mIndex], environments: [...moons[mIndex].environments, envName] };
          }
      }
      
      planets[pIndex] = { ...planets[pIndex], moons };
      const newSystems = { ...appData.systems, [systemName]: planets };
      const newData = { ...appData, systems: newSystems };
      setAppData(newData); saveDataToFirebase(newData);
  };

  const deleteMoonEnvironment = (systemName, planetName, moonName, envName) => {
      const planets = [...(appData.systems[systemName] || [])];
      const pIndex = planets.findIndex(p => (typeof p === 'string' ? p : p.name) === planetName);
      if (pIndex === -1 || typeof planets[pIndex] === 'string') return;

      const moons = [...(planets[pIndex].moons || [])];
      const mIndex = moons.findIndex(m => (typeof m === 'string' ? m : m.name) === moonName);
      if (mIndex === -1 || typeof moons[mIndex] === 'string') return;

      moons[mIndex] = { ...moons[mIndex], environments: moons[mIndex].environments.filter(e => e !== envName) };
      
      planets[pIndex] = { ...planets[pIndex], moons };
      const newSystems = { ...appData.systems, [systemName]: planets };
      const newData = { ...appData, systems: newSystems };
      setAppData(newData); saveDataToFirebase(newData);
  };

  const updateResource = (id, updates) => { const newData = { ...appData, resources: appData.resources.map(r => r.id === id ? { ...r, ...updates } : r) }; setAppData(newData); saveDataToFirebase(newData); showNotification("Resource Updated"); };
  const updateBlueprint = (id, updates) => { const newData = { ...appData, blueprints: appData.blueprints.map(b => b.id === id ? { ...b, ...updates } : b) }; setAppData(newData); saveDataToFirebase(newData); showNotification("Blueprint Updated"); };
  const deleteBlueprint = (id) => { confirmAction("Delete Blueprint?", "Are you sure?", () => { const newData = { ...appData, blueprints: appData.blueprints.filter(b => b.id !== id) }; setAppData(newData); saveDataToFirebase(newData); showNotification("Blueprint deleted"); }); };
  const deleteResource = (id) => { confirmAction("Delete Resource?", "This might break blueprints using it.", () => { const newData = { ...appData, resources: appData.resources.filter(r => r.id !== id) }; setAppData(newData); saveDataToFirebase(newData); showNotification("Resource deleted"); }); };
  const addBlueprintToDb = (bp) => { const newData = { ...appData, blueprints: [...appData.blueprints, { ...bp, id: Date.now().toString() }] }; setAppData(newData); saveDataToFirebase(newData); setModalOpen(false); };
  const addResourceToDb = (res) => { const id = res.name.toLowerCase().replace(/[^a-z0-9]/g, ''); const newData = { ...appData, resources: [...appData.resources, { ...res, id }] }; setAppData(newData); saveDataToFirebase(newData); setModalOpen(false); };
  const updateCapacities = (newCaps) => { const newData = { ...appData, capacities: { ...appData.capacities, ...newCaps } }; setAppData(newData); saveDataToFirebase(newData); };

  // --- RE-USED FORMS ---
  const AddProjectForm = () => {
      const [mode, setMode] = useState(editProjectData ? 'custom' : 'custom'); 
      const [name, setName] = useState(editProjectData?.name || '');
      const [type, setType] = useState(editProjectData?.type || 'Outpost');
      const [priority, setPriority] = useState(editProjectData?.priority || 'STANDARD');
      const [isExpedition, setIsExpedition] = useState(editProjectData?.isExpedition || false);
      const [bpId, setBpId] = useState(appData.blueprints[0]?.id || '');
      const [ings, setIngs] = useState(editProjectData ? editProjectData.ingredients : [{ resourceId: appData.resources[0]?.id || '', count: 1 }]);
      const [filterType, setFilterType] = useState('All');
      const types = ['All', ...new Set(appData.resources.map(r => r.type))].sort();

      const handleSubmit = () => {
          let finalIngs = ings;
          let finalName = name;
          if (!editProjectData && mode === 'blueprint') {
              const bp = appData.blueprints.find(b => b.id === bpId);
              if (bp) { finalIngs = bp.ingredients; finalName = `${bp.name} Project`; }
          }
          saveProject({ name: finalName, type, priority, isExpedition, ingredients: finalIngs });
      };

      return (
          <div className="space-y-4">
              <h3 className="text-lg font-bold">{editProjectData ? 'Edit Project' : 'New Project'}</h3>
              {!editProjectData && (<div className="flex gap-2 mb-4"><Button size="sm" theme={theme} variant={mode === 'custom' ? 'primary' : 'secondary'} onClick={() => setMode('custom')}>Custom</Button><Button size="sm" theme={theme} variant={mode === 'blueprint' ? 'primary' : 'secondary'} onClick={() => setMode('blueprint')}>Blueprint</Button></div>)}
              {mode === 'custom' && <Input theme={theme} label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Outpost Hab 1" />}
              {mode === 'blueprint' && !editProjectData && <div className="space-y-2"><label className="text-xs font-bold uppercase opacity-70">Blueprint</label><select value={bpId} onChange={(e) => setBpId(e.target.value)} className={`w-full p-2 rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>{appData.blueprints.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>}
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-xs font-bold uppercase opacity-70">Type</label><select value={type} onChange={(e) => setType(e.target.value)} className={`w-full p-2 rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>{PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div className="space-y-1"><label className="text-xs font-bold uppercase opacity-70">Priority</label><select value={priority} onChange={(e) => setPriority(e.target.value)} className={`w-full p-2 rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>{Object.keys(PRIORITIES).map(k => <option key={k} value={k}>{PRIORITIES[k].label}</option>)}</select></div>
              </div>
              <div className="flex items-center gap-2 py-2"><input type="checkbox" checked={isExpedition} onChange={(e) => setIsExpedition(e.target.checked)} className="w-5 h-5 rounded" /><span className="text-sm font-bold">Expedition Essential</span></div>
              {mode === 'custom' && (
                  <div className="space-y-2">
                      <div className="flex justify-between items-center"><label className="text-xs font-bold uppercase opacity-70">Resources Needed</label><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`text-xs p-1 rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>{types.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      {ings.map((ing, i) => {
                          const currentRes = appData.resources.find(r => r.id === ing.resourceId);
                          const availableOptions = appData.resources.filter(r => filterType === 'All' || r.type === filterType);
                          const showCurrent = currentRes && !availableOptions.find(r => r.id === currentRes.id);
                          
                          return (
                              <div key={i} className="flex gap-2">
                                  <select value={ing.resourceId} onChange={(e) => { const n = [...ings]; n[i].resourceId = e.target.value; setIngs(n); }} className={`flex-1 p-2 rounded text-sm ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>
                                      {showCurrent && <option value={currentRes.id}>{currentRes.name}</option>}
                                      {availableOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                  </select>
                                  <input type="number" min="1" value={ing.count} onChange={(e) => { const n = [...ings]; n[i].count = parseInt(e.target.value); setIngs(n); }} className={`w-20 p-2 rounded text-sm ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`} />
                                  <Button theme={theme} variant="danger" size="sm" onClick={() => setIngs(ings.filter((_, idx) => idx !== i))}><Trash2 size={12}/></Button>
                              </div>
                          )
                      })}
                      <Button theme={theme} variant="secondary" size="sm" onClick={() => setIngs([...ings, {resourceId: appData.resources[0]?.id || '', count:1}])}><Plus size={12}/> Add Line</Button>
                  </div>
              )}
              <div className="flex justify-end gap-2 mt-4"><Button theme={theme} variant="ghost" onClick={() => { setModalOpen(false); setEditProjectData(null); }}>Cancel</Button><Button theme={theme} onClick={handleSubmit}>{editProjectData ? 'Update' : 'Create'}</Button></div>
          </div>
      );
  };
  
  const AddNodeForm = () => {
      const [name, setName] = useState(editNodeData?.name || '');
      const [system, setSystem] = useState(editNodeData?.system || (Object.keys(appData.systems).length > 0 ? Object.keys(appData.systems)[0] : 'Sol'));
      const [planet, setPlanet] = useState(editNodeData?.planet || '');
      const [environment, setEnvironment] = useState(editNodeData?.environment || '');
      
      const [customSystem, setCustomSystem] = useState('');
      const [customPlanet, setCustomPlanet] = useState('');
      const [isAddingSystem, setIsAddingSystem] = useState(false);
      const [isAddingPlanet, setIsAddingPlanet] = useState(false);

      const [type, setType] = useState(editNodeData?.type || 'Outpost');
      const [selectedRes, setSelectedRes] = useState(editNodeData?.resources || []);
      const [filterType, setFilterType] = useState('All');
      const types = ['All', ...new Set(appData.resources.map(r => r.type))].sort();

      const toggleRes = (id) => {
          if (selectedRes.includes(id)) setSelectedRes(selectedRes.filter(r => r !== id));
          else setSelectedRes([...selectedRes, id]);
      };

      const handleSubmit = () => {
          let finalSystem = system;
          let finalPlanet = planet;
          
          if (isAddingSystem && customSystem) {
              addSystem(customSystem);
              finalSystem = customSystem;
          }
          if (isAddingPlanet && customPlanet) {
              addPlanet(finalSystem, customPlanet);
              finalPlanet = customPlanet;
          }

          if (editNodeData) updateNode(editNodeData.id, { name, system: finalSystem, planet: finalPlanet, environment, type, resources: selectedRes });
          else addNode({ name, system: finalSystem, planet: finalPlanet, environment, type, resources: selectedRes });
      };

      const filteredRes = appData.resources.filter(r => filterType === 'All' || r.type === filterType);
      
      // Get Planet/Moon Details
      const availablePlanets = appData.systems[system] || [];
      
      // Helper to find envs for selected planet/moon
      let availableEnvs = [];
      // 1. Is it a planet object directly?
      const planetObj = availablePlanets.find(p => (typeof p === 'string' ? p : p.name) === planet);
      if (planetObj && typeof planetObj !== 'string') {
          // If we selected a planet, use its environments
          // BUT check if the 'planet' state is actually a moon name...
          // The dropdown values are tricky. Let's trace.
          // Dropdown puts planet name as value, and moon name as value.
          // So 'planet' state holds the name.
          if (planetObj.name === planet) {
             availableEnvs = planetObj.environments || [];
          }
      }
      
      // 2. Is it a moon?
      // Iterate all planets to find if 'planet' state is actually a moon
      availablePlanets.forEach(p => {
          const pMoons = typeof p === 'string' ? [] : (p.moons || []);
          const foundMoon = pMoons.find(m => (typeof m === 'string' ? m : m.name) === planet);
          if (foundMoon && typeof foundMoon !== 'string') {
              availableEnvs = foundMoon.environments || [];
          }
      });

      useEffect(() => {
          // Auto select if list changes
          let allLocations = [];
          availablePlanets.forEach(p => {
              const pName = typeof p === 'string' ? p : p.name;
              allLocations.push(pName);
              const moons = typeof p === 'string' ? [] : (p.moons || []);
              moons.forEach(m => allLocations.push(typeof m === 'string' ? m : m.name));
          });
          
          if (system && !isAddingSystem && !allLocations.includes(planet)) {
             if (allLocations.length > 0) setPlanet(allLocations[0]);
             else setPlanet('');
          }
      }, [system, availablePlanets]);

      return (
          <div className="space-y-4">
              <h3 className="text-lg font-bold">{editNodeData ? 'Edit Node' : 'New Node'}</h3>
              <Input theme={theme} label="Name (Optional - Auto generates)" value={name} onChange={(e) => setName(e.target.value)} placeholder={`${planet || 'Planet'} ${type || 'Node'}`} />
              
              <div className="flex gap-2">
                  <div className="flex-1">
                      <label className="text-xs font-bold uppercase opacity-70">System</label>
                      {isAddingSystem ? (
                          <div className="flex gap-1">
                              <Input className="flex-1" theme={theme} value={customSystem} onChange={(e) => setCustomSystem(e.target.value)} placeholder="New System Name" />
                              <button onClick={() => setIsAddingSystem(false)} className="p-2"><X size={14}/></button>
                          </div>
                      ) : (
                          <select value={system} onChange={(e) => { 
                              if(e.target.value === '__NEW__') { setIsAddingSystem(true); setSystem(''); } else { setSystem(e.target.value); }
                          }} className={`w-full p-2 mt-1 rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>
                              {Object.keys(appData.systems).sort().map(s => <option key={s} value={s}>{s}</option>)}
                              <option value="__NEW__">+ Discover New System</option>
                          </select>
                      )}
                  </div>
                  <div className="flex-1">
                      <label className="text-xs font-bold uppercase opacity-70">Planet/Moon</label>
                      {isAddingPlanet || isAddingSystem ? (
                          <div className="flex gap-1">
                              <Input className="flex-1" theme={theme} value={customPlanet} onChange={(e) => setCustomPlanet(e.target.value)} placeholder="New Planet Name" />
                              {!isAddingSystem && <button onClick={() => setIsAddingPlanet(false)} className="p-2"><X size={14}/></button>}
                          </div>
                      ) : (
                          <select value={planet} onChange={(e) => {
                              if(e.target.value === '__NEW__') { setIsAddingPlanet(true); setPlanet(''); } else { setPlanet(e.target.value); }
                          }} className={`w-full p-2 mt-1 rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>
                              {availablePlanets.map(p => {
                                  const pName = typeof p === 'string' ? p : p.name;
                                  const pMoons = typeof p === 'string' ? [] : (p.moons || []);
                                  return (
                                    <React.Fragment key={pName}>
                                        <option value={pName}>{pName}</option>
                                        {pMoons.map(m => {
                                            const mName = typeof m === 'string' ? m : m.name;
                                            return <option key={mName} value={mName}>&nbsp;&nbsp;↳ {mName}</option>
                                        })}
                                    </React.Fragment>
                                  )
                              })}
                              <option value="__NEW__">+ Discover New Planet</option>
                          </select>
                      )}
                  </div>
              </div>
              
              <div className="flex gap-2">
                 <div className="flex-1"><label className="text-xs font-bold uppercase opacity-70">Type</label><select value={type} onChange={(e) => setType(e.target.value)} className={`w-full p-2 rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>{LOCATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                 <div className="flex-1">
                      <label className="text-xs font-bold uppercase opacity-70">Environment</label>
                      {availableEnvs.length > 0 ? (
                          <select value={environment} onChange={(e) => setEnvironment(e.target.value)} className={`w-full p-2 rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>
                              <option value="">(None)</option>
                              {availableEnvs.map(e => <option key={e} value={e}>{e}</option>)}
                              <option value="__MANUAL__">Manual Entry...</option>
                          </select>
                      ) : (
                         <Input theme={theme} value={environment} onChange={(e) => setEnvironment(e.target.value)} placeholder="e.g. Craters" />
                      )}
                      {environment === '__MANUAL__' && <Input theme={theme} value="" onChange={(e) => setEnvironment(e.target.value)} placeholder="Type Env..." className="mt-1" />}
                 </div>
              </div>
              
              <div className="space-y-2">
                  <div className="flex justify-between items-center"><label className="text-xs font-bold uppercase opacity-70">Available Resources</label><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`text-xs p-1 rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>{types.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div className={`grid grid-cols-3 gap-2 h-40 overflow-y-auto p-2 rounded ${theme==='cockpit'?'bg-slate-900 border border-slate-800':'bg-slate-50 border border-slate-200'}`}>
                      {filteredRes.map(r => (
                          <div key={r.id} onClick={() => toggleRes(r.id)} className={`text-[10px] p-2 rounded cursor-pointer border ${selectedRes.includes(r.id) ? (theme==='cockpit'?'bg-amber-600 text-black border-amber-600':'bg-blue-600 text-white border-blue-600') : 'opacity-60 hover:opacity-100'}`}>
                              {r.name}
                          </div>
                      ))}
                  </div>
              </div>
              <div className="flex justify-end gap-2 mt-4"><Button theme={theme} variant="ghost" onClick={() => { setModalOpen(false); setEditNodeData(null); }}>Cancel</Button><Button theme={theme} onClick={handleSubmit}>{editNodeData ? 'Update' : 'Track'}</Button></div>
          </div>
      );
  };
  
  const BlueprintForm = ({ initialData, isEdit }) => {
      const [name, setName] = useState(initialData?.name || '');
      const [category, setCategory] = useState(initialData?.category || 'Crafting');
      const [customCat, setCustomCat] = useState('');
      const [isCustomCat, setIsCustomCat] = useState(false);
      const [ings, setIngs] = useState(initialData?.ingredients || [{ resourceId: appData.resources[0]?.id || '', count: 1 }]);
      
      const [resFilter, setResFilter] = useState('All');
      const resTypes = ['All', ...new Set(appData.resources.map(r => r.type))].sort();
      
      const existingCats = ['Crafting', 'Power', 'Defense', 'Furniture', 'Structure', 'Storage', 'Extraction', 'Base', ...new Set(appData.blueprints.map(b => b.category))];
      const uniqueCats = [...new Set(existingCats)].sort();

      const handleSave = () => { 
          const finalCat = isCustomCat ? customCat : category;
          if (isEdit) { updateBlueprint(initialData.id, { name, category: finalCat, ingredients: ings }); setModalOpen(false); } 
          else { addBlueprintToDb({ name, category: finalCat, ingredients: ings }); } 
      };
      
      return (
          <div className="space-y-4">
              <h3 className="text-lg font-bold">{isEdit ? 'Edit Blueprint' : 'New Blueprint'}</h3>
              <Input theme={theme} label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              
              <div className="space-y-1">
                  <label className="text-xs font-bold uppercase opacity-70">Category</label>
                  {!isCustomCat ? (
                      <div className="flex gap-2">
                          <select value={category} onChange={(e) => setCategory(e.target.value)} className={`flex-1 p-2 rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>
                              {uniqueCats.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <Button theme={theme} onClick={() => setIsCustomCat(true)}><Plus size={14}/></Button>
                      </div>
                  ) : (
                      <div className="flex gap-2">
                          <Input className="flex-1" theme={theme} value={customCat} onChange={(e) => setCustomCat(e.target.value)} placeholder="New Category Name" />
                          <Button theme={theme} onClick={() => setIsCustomCat(false)}><X size={14}/></Button>
                      </div>
                  )}
              </div>

              <div className="space-y-2">
                  <div className="flex justify-between items-center"><label className="text-xs font-bold uppercase opacity-70">Ingredients</label><select value={resFilter} onChange={(e) => setResFilter(e.target.value)} className={`text-xs p-1 rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>{resTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  {ings.map((ing, idx) => {
                      const currentRes = appData.resources.find(r => r.id === ing.resourceId);
                      const availableOptions = appData.resources.filter(r => resFilter === 'All' || r.type === resFilter);
                      const showCurrent = currentRes && !availableOptions.find(r => r.id === currentRes.id);
                      
                      return (
                          <div key={idx} className="flex gap-2">
                              <select value={ing.resourceId} onChange={(e) => { const n=[...ings]; n[idx].resourceId=e.target.value; setIngs(n); }} className={`flex-1 p-2 text-xs rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>
                                  {showCurrent && <option value={currentRes.id}>{currentRes.name}</option>}
                                  {availableOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                              </select>
                              <input type="number" className={`w-16 p-2 text-xs rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`} value={ing.count} onChange={(e) => { const n=[...ings]; n[idx].count=parseInt(e.target.value); setIngs(n); }} />
                              <button onClick={() => setIngs(ings.filter((_,i) => i!==idx))} className="text-red-500"><Trash2 size={16}/></button>
                          </div>
                      )
                  })}
                  <Button theme={theme} size="sm" variant="secondary" onClick={() => setIngs([...ings, {resourceId: appData.resources[0]?.id || '', count: 1}])}><Plus size={12}/> Add</Button>
              </div>
              <div className="flex justify-end gap-2 mt-4"><Button theme={theme} variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button theme={theme} onClick={handleSave}>Save</Button></div>
          </div>
      );
  };

  const AddResourceForm = () => { const [data, setData] = useState({ name: '', type: 'Raw Inorganic', mass: 1, value: 10 }); return (<div className="space-y-3"><h3 className="text-lg font-bold">New Resource Definition</h3><Input theme={theme} label="Name" value={data.name} onChange={(e) => setData({...data, name: e.target.value})} /><div className="flex gap-2"><div className="flex-1"><label className="text-xs font-bold uppercase opacity-70">Type</label><select value={data.type} onChange={(e) => setData({...data, type: e.target.value})} className={`w-full p-2 mt-1 rounded ${theme==='cockpit'?'bg-slate-900 border-amber-700':'bg-white border-slate-300'}`}>{['Raw Inorganic', 'Organic', 'Flora', 'Ingot', 'Manufactured', 'Exotic'].map(t => <option key={t} value={t}>{t}</option>)}</select></div><Input className="flex-1" theme={theme} type="number" label="Mass" value={data.mass} onChange={(e) => setData({...data, mass: parseFloat(e.target.value)})} /><Input className="flex-1" theme={theme} type="number" label="Value" value={data.value} onChange={(e) => setData({...data, value: parseInt(e.target.value)})} /></div><div className="flex justify-end gap-2 mt-4"><Button theme={theme} variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button theme={theme} onClick={() => addResourceToDb(data)}>Save</Button></div></div>); };

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${theme === 'cockpit' ? 'bg-slate-950 text-amber-500' : 'bg-slate-50 text-slate-800'}`}><Loader2 size={48} className="animate-spin" /></div>;
  const themeClasses = theme === 'cockpit' ? "bg-slate-950 text-amber-500 font-mono" : "bg-slate-50 text-slate-800 font-sans";

  if (!user) return <LoginView onLogin={loginWithGoogle} />;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${themeClasses}`}>
      <header className={`p-4 border-b flex justify-between items-center sticky top-0 z-20 backdrop-blur-md ${theme === 'cockpit' ? 'bg-slate-950/90 border-amber-900/50' : 'bg-white/90 border-slate-200'}`}><div className="flex items-center gap-2"><Zap size={20} className={theme==='cockpit'?'text-amber-400':'text-blue-600'} /><h1 className="font-bold tracking-widest uppercase text-sm md:text-base">Starfield Logistics<span className="opacity-50 ml-1 text-[10px]">Starvival Edition</span></h1></div><button onClick={() => setTheme(prev => prev === 'cockpit' ? 'clean' : 'cockpit')} className="p-2 rounded-full hover:bg-current/10 transition-colors">{theme === 'cockpit' ? <Sun size={18} /> : <Moon size={18} />}</button></header>
      <main className="flex-1 p-4 md:p-6 w-full max-w-4xl mx-auto">
        {activeTab === 'overview' && <OverviewView appData={appData} theme={theme} setActiveTab={setActiveTab} />}
        {activeTab === 'projects' && <ProjectsView appData={appData} theme={theme} setModalOpen={setModalOpen} setModalType={setModalType} setEditProjectData={setEditProjectData} deleteProject={deleteProject} completeProject={completeProject} />}
        {activeTab === 'manifest' && <ManifestView appData={appData} theme={theme} handleLoot={handleLoot} handleStashUpdate={handleStashUpdate} />}
        {activeTab === 'nodes' && <NodesView appData={appData} theme={theme} setModalOpen={setModalOpen} setModalType={setModalType} setEditNodeData={setEditNodeData} deleteNode={deleteNode} />}
        {activeTab === 'database' && <DatabaseViewWrapper appData={appData} theme={theme} setModalOpen={setModalOpen} setModalType={setModalType} setEditBlueprintData={setEditBlueprintData} updateResource={updateResource} updateBlueprint={updateBlueprint} deleteBlueprint={deleteBlueprint} deleteResource={deleteResource} renameSystem={renameSystem} deleteSystem={deleteSystem} addPlanet={addPlanet} deletePlanet={deletePlanet} addEnvironment={addEnvironment} deleteEnvironment={deleteEnvironment} addMoon={addMoon} deleteMoon={deleteMoon} addMoonEnvironment={addMoonEnvironment} deleteMoonEnvironment={deleteMoonEnvironment} />}
        {activeTab === 'settings' && <SettingsView appData={appData} theme={theme} updateCapacities={updateCapacities} confirmAction={confirmAction} saveDataToFirebase={saveDataToFirebase} setAppData={setAppData} showNotification={showNotification} exportData={exportData} importData={importData} softReset={softReset} updateDbToMaster={updateDbToMaster} user={user} />}
      </main>
      {notification && <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300"><div className={`px-4 py-3 rounded shadow-lg flex items-center gap-2 ${theme==='cockpit'?'bg-amber-900 text-amber-100 border border-amber-500':'bg-slate-800 text-white'}`}><Check size={16} /> {notification}</div></div>}
      <nav className={`fixed bottom-0 w-full border-t pb-safe pt-2 px-2 flex justify-around z-30 backdrop-blur-md ${theme === 'cockpit' ? 'bg-slate-950/95 border-amber-900/50' : 'bg-white/95 border-slate-200'}`}>
        {[{ id: 'overview', icon: Activity, label: 'Dash' }, { id: 'projects', icon: Hammer, label: 'Proj' }, { id: 'manifest', icon: ShoppingCart, label: 'Loot' }, { id: 'nodes', icon: MapPin, label: 'Nodes' }, { id: 'database', icon: Database, label: 'Db' }, { id: 'settings', icon: Settings, label: 'Sys' }].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center p-2 rounded-lg transition-all min-w-[50px] ${activeTab === tab.id ? (theme === 'cockpit' ? 'text-amber-400 bg-amber-900/20 -translate-y-1' : 'text-blue-600 bg-blue-50 -translate-y-1') : (theme === 'cockpit' ? 'text-amber-800' : 'text-slate-400')}`}><tab.icon size={20} /><span className="text-[9px] uppercase font-bold mt-1 tracking-wider">{tab.label}</span></button>))}
      </nav>
      {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"><div className={`w-full max-w-lg p-6 rounded-xl shadow-2xl relative ${theme === 'cockpit' ? 'bg-slate-950 border border-amber-600 text-amber-50' : 'bg-white text-slate-800'}`}><button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 opacity-50 hover:opacity-100"><Plus size={24} className="rotate-45"/></button>{modalType === 'addProject' && <AddProjectForm />}{modalType === 'addResource' && <AddResourceForm />}{modalType === 'addBlueprint' && <BlueprintForm isEdit={false} />}{modalType === 'editBlueprint' && <BlueprintForm initialData={editBlueprintData} isEdit={true} />}{modalType === 'addNode' && <AddNodeForm />}</div></div>}
      <ConfirmModal isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(prev => ({...prev, isOpen: false}))} theme={theme} />
      {theme === 'cockpit' && <div className="pointer-events-none fixed inset-0 z-40 bg-[linear-gradient(rgba(18,16,10,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20" />}
    </div>
  );
}