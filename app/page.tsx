'use client';

import React, { useState, useEffect } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  FlaskConical,
  Atom,
  Beef,
  Egg,
  Milk,
  Carrot,
  Banana,
  RefreshCcw,
  Waves // For Turbidity
} from 'lucide-react';

// --- Types & Interfaces ---

interface Threshold {
  max?: number;
  min?: number;
  weight: number;
}

interface BaseValues {
  temp: number;
  humidity: number;
  voc: number;
  ammonia: number;
  h2s: number;
  ethyl: number;
  alcohol: number;
  turbidity: number; // Added Turbidity
  [key: string]: number;
}

interface FoodProfile {
  name: string;
  icon: React.ReactNode;
  baseValues: BaseValues;
  thresholds: Record<string, Threshold>;
  graphs: string[]; // New: Which charts to show for this food
}

type FoodProfileKey = 'banana' | 'milk' | 'meat' | 'egg' | 'veggies';

// --- Configuration & Domain Knowledge ---

const FOOD_PROFILES: Record<FoodProfileKey, FoodProfile> = {
  banana: {
    name: 'Fruit',
    icon: <Banana className="w-6 h-6" />,
    baseValues: { temp: 18, humidity: 85, voc: 100, ammonia: 0, h2s: 0, ethyl: 10, alcohol: 0, turbidity: 0 },
    thresholds: {
      ethyl: { max: 150, weight: 2 },
      alcohol: { max: 50, weight: 3 },
      temp: { max: 30, weight: 1 }
    },
    graphs: ['ethyl', 'alcohol'] // Specific graphs for Banana
  },
  milk: {
    name: 'Pasteurized Milk',
    icon: <Milk className="w-6 h-6" />,
    baseValues: { temp: 4, humidity: 90, voc: 20, ammonia: 0, h2s: 0, ethyl: 0, alcohol: 0, turbidity: 5 },
    thresholds: {
      temp: { max: 7, weight: 3 },
      voc: { max: 300, weight: 2 },
      turbidity: { max: 50, weight: 2 }, // High turbidity in whey/clear liquids = bad, or separation in milk
    },
    graphs: ['turbidity', 'temp'] // Specific graphs for Milk
  },
  meat: {
    name: 'Raw Meat (Poultry/Beef)',
    icon: <Beef className="w-6 h-6" />,
    baseValues: { temp: 2, humidity: 80, voc: 50, ammonia: 2, h2s: 0, ethyl: 0, alcohol: 0, turbidity: 0 },
    thresholds: {
      ammonia: { max: 25, weight: 3 },
      h2s: { max: 2, weight: 3 },
      temp: { max: 5, weight: 2 }
    },
    graphs: ['ammonia', 'h2s'] // Specific graphs for Meat
  },
  egg: {
    name: 'Chicken Eggs',
    icon: <Egg className="w-6 h-6" />,
    baseValues: { temp: 10, humidity: 70, voc: 10, ammonia: 0, h2s: 0, ethyl: 0, alcohol: 0, turbidity: 0 },
    thresholds: {
      h2s: { max: 5, weight: 3 },
      ammonia: { max: 15, weight: 2 }
    },
    graphs: ['h2s', 'ammonia'] // Specific graphs for Eggs
  },
  veggies: {
    name: 'Vegetables',
    icon: <Carrot className="w-6 h-6" />,
    baseValues: { temp: 5, humidity: 95, voc: 30, ammonia: 0, h2s: 0, ethyl: 5, alcohol: 0, turbidity: 10 },
    thresholds: {
      humidity: { min: 80, weight: 1 },
      voc: { max: 200, weight: 2 },
      turbidity: { max: 100, weight: 1 } // Dirty wash water check
    },
    graphs: ['voc', 'humidity'] // Specific graphs for Veggies
  }
};

// --- Helper for Labels ---
const SENSOR_LABELS: Record<string, { label: string, color: string }> = {
  temp: { label: 'Temperature (°C)', color: '#fbbf24' },
  humidity: { label: 'Humidity (%)', color: '#60a5fa' },
  voc: { label: 'VOC Levels (ppb)', color: '#a78bfa' },
  ammonia: { label: 'Ammonia (ppm)', color: '#f43f5e' },
  h2s: { label: 'H2S Gas (ppm)', color: '#fb7185' },
  ethyl: { label: 'Ethylene (ppm)', color: '#34d399' },
  alcohol: { label: 'Alcohol (ppm)', color: '#2dd4bf' },
  turbidity: { label: 'Turbidity (NTU)', color: '#a3e635' },
};

// --- Components ---

interface SensorCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  status: 'good' | 'warning' | 'danger';
  max: number;
}

const SensorCard: React.FC<SensorCardProps> = ({ title, value, unit, icon, status, max }) => {
  const percent = Math.min(100, Math.max(0, (value / (max * 1.5)) * 100));
  
  let colorClass = "text-emerald-500";
  let bgClass = "bg-emerald-500";
  
  if (status === 'warning') {
    colorClass = "text-amber-500";
    bgClass = "bg-amber-500";
  } else if (status === 'danger') {
    colorClass = "text-rose-500";
    bgClass = "bg-rose-500";
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg hover:border-slate-500 transition-all duration-300">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          {icon}
          {title}
        </div>
        <div className={`text-xs px-2 py-1 rounded-full font-bold bg-opacity-20 ${bgClass.replace('bg-', 'text-')} ${bgClass}`}>
          {status.toUpperCase()}
        </div>
      </div>
      
      <div className="flex items-end gap-1 my-2">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        <span className="text-sm text-slate-500 mb-1">{unit}</span>
      </div>

      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${bgClass}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  quality: 'safe' | 'warning' | 'unsafe';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ quality }) => {
  let config = {
    color: 'bg-emerald-500',
    icon: <CheckCircle className="w-12 h-12 text-white" />,
    text: 'SAFE TO EAT',
    desc: 'No spoilage biomarkers detected.'
  };

  if (quality === 'warning') {
    config = {
      color: 'bg-amber-500',
      icon: <AlertTriangle className="w-12 h-12 text-white" />,
      text: 'CAUTION',
      desc: 'Early signs of degradation detected.'
    };
  } else if (quality === 'unsafe') {
    config = {
      color: 'bg-rose-600',
      icon: <XCircle className="w-12 h-12 text-white" />,
      text: 'UNSAFE',
      desc: 'Hazardous bacterial or chemical levels.'
    };
  }

  return (
    <div className={`${config.color} rounded-2xl p-6 shadow-xl text-white flex items-center justify-between transition-colors duration-500`}>
      <div>
        <h2 className="text-3xl font-bold tracking-wider">{config.text}</h2>
        <p className="text-white text-opacity-80 mt-1">{config.desc}</p>
      </div>
      <div className="bg-white bg-opacity-20 p-4 rounded-full animate-pulse">
        {config.icon}
      </div>
    </div>
  );
};

interface SimpleBarChartProps {
  data: number[];
  color?: string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, color = "#10b981" }) => {
  if (!data || data.length === 0) return null;
  
  // Find max for scaling, default to at least 10 to avoid huge bars for small numbers
  const maxVal = Math.max(...data, 10) * 1.2;

  return (
    <div className="w-full h-32 mt-4 flex items-end justify-between gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800">
      {data.map((val, i) => {
        const height = Math.min(100, (val / maxVal) * 100);
        return (
          <div 
            key={i} 
            className="w-full rounded-t-sm transition-all duration-500 hover:brightness-125 relative group"
            style={{ 
              height: `${Math.max(4, height)}%`, // Min height 4% to show 0 values
              backgroundColor: color,
              opacity: 0.8
            }}
          >
             {/* Simple tooltip on hover */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-slate-600">
              {val}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [activeTab, setActiveTab] = useState<FoodProfileKey>('banana');
  const [simulationMode, setSimulationMode] = useState<'normal' | 'spoilage'>('normal');
  const [readings, setReadings] = useState<BaseValues>(FOOD_PROFILES['banana'].baseValues);
  
  // Generic history state that can hold any key
  const [history, setHistory] = useState<Record<string, number[]>>({ 
    ammonia: [], temp: [], voc: [], h2s: [], ethyl: [], alcohol: [], humidity: [], turbidity: []
  });
  
  const [quality, setQuality] = useState<'safe' | 'warning' | 'unsafe'>('safe');
  const [isScanning, setIsScanning] = useState(false);

  const getStatus = (sensor: string, value: number, profile: FoodProfile): 'good' | 'warning' | 'danger' => {
    const rules = profile.thresholds[sensor];
    if (!rules) return 'good';
    
    if (rules.max) {
      if (value > rules.max * 1.5) return 'danger';
      if (value > rules.max) return 'warning';
    }
    if (rules.min) {
      if (value < rules.min * 0.7) return 'danger';
      if (value < rules.min) return 'warning';
    }
    return 'good';
  };

  const currentProfile = FOOD_PROFILES[activeTab];

  const takeReading = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const isSpoiling = simulationMode === 'spoilage';
      const newReadings = { ...readings }; 
      
      Object.keys(currentProfile.baseValues).forEach(key => {
        let base = currentProfile.baseValues[key];
        let noise = (Math.random() - 0.5) * (base * 0.1 || 2);
        
        if (isSpoiling) {
          if (['ammonia', 'h2s', 'voc', 'ethyl', 'alcohol'].includes(key)) {
             base = base + 50 + (Math.random() * 20); 
          }
          if (key === 'turbidity') base = base + 40 + (Math.random() * 10); // Spoilage = cloudy
          if (key === 'temp') base += 5;
        }

        newReadings[key] = parseFloat((base + noise).toFixed(1));
      });

      setReadings(newReadings);

      let score = 0;
      Object.entries(currentProfile.thresholds).forEach(([key, rule]) => {
         if (newReadings[key] > (rule.max || Infinity)) score += rule.weight;
         if (rule.min && newReadings[key] < rule.min) score += rule.weight;
      });

      if (score >= 3) setQuality('unsafe');
      else if (score >= 1) setQuality('warning');
      else setQuality('safe');

      setHistory(prev => {
        const next = { ...prev };
        Object.keys(newReadings).forEach(key => {
           if (!next[key]) next[key] = new Array(12).fill(0);
           // Keep last 12 points
           next[key] = [...next[key].slice(1), newReadings[key]];
        });
        return next;
      });

      setIsScanning(false);
    }, 800);
  };

  useEffect(() => {
    const profile = FOOD_PROFILES[activeTab];
    setReadings(profile.baseValues);
    setQuality('safe');
    setSimulationMode('normal');
    
    // Generate Pre-filled History: Mix of Fresh and Not-So-Fresh
    // This creates a realistic looking "past" on the graphs
    const newHistory: Record<string, number[]> = {};
    
    Object.keys(profile.baseValues).forEach(key => {
      const base = profile.baseValues[key];
      const limit = profile.thresholds[key]?.max || (base * 1.5) || 20;

      newHistory[key] = Array.from({ length: 12 }).map(() => {
        // 70% chance of "Fresh" (near base), 30% chance of "Not So Fresh" (spikes)
        const isFresh = Math.random() > 0.3; 
        
        let val;
        if (isFresh) {
          // Clean data: Base +/- small noise
          val = base + ((Math.random() - 0.5) * (base * 0.2 || 2));
        } else {
          // "Not so fresh" data: Elevated levels (approaching limit)
          // Simulates moments where sensor detected spoilage pockets or drift
          val = base + (Math.random() * (limit * 0.5));
        }
        
        return Math.max(0, parseFloat(val.toFixed(1)));
      });
      
      // Ensure the very last point (current) is the ideal base to start fresh
      newHistory[key][11] = base;
    });
    
    setHistory(newHistory);

  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-raleway selection:bg-emerald-500 selection:text-white pb-12">
      
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BioSense IoT</h1>
              <p className="text-xs text-slate-400">Advanced Food Quality Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setSimulationMode('normal')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${simulationMode === 'normal' ? 'bg-slate-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Normal
              </button>
              <button 
                onClick={() => setSimulationMode('spoilage')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${simulationMode === 'spoilage' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Zap className="w-4 h-4" /> Spoilage
              </button>
            </div>

            <button
              onClick={takeReading}
              disabled={isScanning}
              className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCcw className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Reading...' : 'Read Sensors'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        
        <div className="flex overflow-x-auto gap-2 pb-4 mb-6 scrollbar-hide">
          {Object.entries(FOOD_PROFILES).map(([key, profile]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as FoodProfileKey)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all whitespace-nowrap
                ${activeTab === key 
                  ? 'bg-slate-800 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-900/20' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                }`}
            >
              {profile.icon}
              <span className="font-medium">{profile.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="space-y-6">
            <StatusBadge quality={quality} />
            
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Wind className="w-5 h-5 text-emerald-400" /> Environment
              </h3>
              
              <div className="space-y-4">
                <SensorCard 
                  title="Temperature" 
                  value={readings.temp} 
                  unit="°C" 
                  icon={<Thermometer className="w-4 h-4" />}
                  max={30}
                  status={getStatus('temp', readings.temp, currentProfile)}
                />
                <SensorCard 
                  title="Humidity" 
                  value={readings.humidity} 
                  unit="%" 
                  icon={<Droplets className="w-4 h-4" />}
                  max={100}
                  status={getStatus('humidity', readings.humidity, currentProfile)}
                />
              </div>
            </div>
            
             <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
               <h3 className="text-sm font-medium text-slate-400 mb-2">Temperature Trend</h3>
               <SimpleBarChart data={history.temp} color="#fbbf24" />
             </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <SensorCard 
                title="Ammonia" 
                value={readings.ammonia} 
                unit="ppm" 
                icon={<Atom className="w-4 h-4" />}
                max={50}
                status={getStatus('ammonia', readings.ammonia, currentProfile)}
              />
               <SensorCard 
                title="H2S Gas" 
                value={readings.h2s} 
                unit="ppm" 
                icon={<FlaskConical className="w-4 h-4" />}
                max={10}
                status={getStatus('h2s', readings.h2s, currentProfile)}
              />
               <SensorCard 
                title="Turbidity" 
                value={readings.turbidity} 
                unit="NTU" 
                icon={<Waves className="w-4 h-4" />}
                max={100}
                status={getStatus('turbidity', readings.turbidity, currentProfile)}
              />
               <SensorCard 
                title="Total VOCs" 
                value={readings.voc} 
                unit="ppb" 
                icon={<Wind className="w-4 h-4" />}
                max={500}
                status={getStatus('voc', readings.voc, currentProfile)}
              />
               <SensorCard 
                title="Ethylene" 
                value={readings.ethyl} 
                unit="ppm" 
                icon={<Zap className="w-4 h-4" />}
                max={200}
                status={getStatus('ethyl', readings.ethyl, currentProfile)}
              />
              <SensorCard 
                title="Alcohol" 
                value={readings.alcohol} 
                unit="ppm" 
                icon={<FlaskConical className="w-4 h-4" />}
                max={100}
                status={getStatus('alcohol', readings.alcohol, currentProfile)}
              />
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">
                {currentProfile.name} Specific Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentProfile.graphs.map(sensorKey => {
                  const info = SENSOR_LABELS[sensorKey] || { label: sensorKey, color: '#fff' };
                  return (
                    <div key={sensorKey}>
                      <p className="text-sm text-slate-400 mb-2">{info.label}</p>
                      <SimpleBarChart data={history[sensorKey]} color={info.color} />
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-slate-800 rounded-lg text-sm text-slate-300">
                <span className="font-bold text-white block mb-1">AI Diagnostic Insight:</span>
                {quality === 'safe' && "All critical parameters for this food type are within optimal range."}
                {quality === 'warning' && "Sensors are detecting deviation in key spoilage markers. Inspect physical appearance."}
                {quality === 'unsafe' && "CRITICAL: Food safety compromised. Hazardous levels detected for this specific food profile."}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}