"use client"

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
  RefreshCcw
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
  [key: string]: number; // Allows dynamic access by string key
}

interface FoodProfile {
  name: string;
  icon: React.ReactNode;
  baseValues: BaseValues;
  thresholds: Record<string, Threshold>;
}

// Define valid keys for our food profiles to prevent invalid lookups
type FoodProfileKey = 'banana' | 'milk' | 'meat' | 'egg' | 'veggies';

// --- Configuration & Domain Knowledge ---

const FOOD_PROFILES: Record<FoodProfileKey, FoodProfile> = {
  banana: {
    name: 'Banana (Fruit)',
    icon: <Banana className="w-6 h-6" />,
    baseValues: { temp: 18, humidity: 85, voc: 100, ammonia: 0, h2s: 0, ethyl: 10, alcohol: 0 },
    thresholds: {
      ethyl: { max: 150, weight: 2 }, // High ethylene = over-ripe
      alcohol: { max: 50, weight: 3 }, // Alcohol = rotting/fermenting
      temp: { max: 30, weight: 1 }
    }
  },
  milk: {
    name: 'Pasteurized Milk',
    icon: <Milk className="w-6 h-6" />,
    baseValues: { temp: 4, humidity: 90, voc: 20, ammonia: 0, h2s: 0, ethyl: 0, alcohol: 0 },
    thresholds: {
      temp: { max: 7, weight: 3 }, // Temp is critical for milk
      voc: { max: 300, weight: 2 }, // Souring releases VOCs
      ammonia: { max: 10, weight: 1 }
    }
  },
  meat: {
    name: 'Raw Meat (Poultry/Beef)',
    icon: <Beef className="w-6 h-6" />,
    baseValues: { temp: 2, humidity: 80, voc: 50, ammonia: 2, h2s: 0, ethyl: 0, alcohol: 0 },
    thresholds: {
      ammonia: { max: 25, weight: 3 }, // Protein breakdown
      h2s: { max: 2, weight: 3 }, // Sulfur smell
      temp: { max: 5, weight: 2 }
    }
  },
  egg: {
    name: 'Chicken Eggs',
    icon: <Egg className="w-6 h-6" />,
    baseValues: { temp: 10, humidity: 70, voc: 10, ammonia: 0, h2s: 0, ethyl: 0, alcohol: 0 },
    thresholds: {
      h2s: { max: 5, weight: 3 }, // Rotten egg smell
      ammonia: { max: 15, weight: 2 }
    }
  },
  veggies: {
    name: 'Fresh Vegetables',
    icon: <Carrot className="w-6 h-6" />,
    baseValues: { temp: 5, humidity: 95, voc: 30, ammonia: 0, h2s: 0, ethyl: 5, alcohol: 0 },
    thresholds: {
      humidity: { min: 80, weight: 1 }, // Need high humidity
      voc: { max: 200, weight: 2 }, // Decomposition
      temp: { max: 10, weight: 1 }
    }
  }
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
  // Calculate percentage for progress bar
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

      {/* Progress Bar */}
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

interface LiveChartProps {
  data: number[];
  color?: string;
}

const LiveChart: React.FC<LiveChartProps> = ({ data, color = "#10b981" }) => {
  if (!data || data.length < 2) return null;

  const maxVal = Math.max(...data) * 1.2;
  const minVal = 0;
  const range = maxVal - minVal || 1; // Avoid divide by zero
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - minVal) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-32 mt-4 bg-slate-900/50 rounded-lg p-2 relative overflow-hidden">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
          className="transition-all duration-300 ease-linear"
        />
        {/* Gradient fill area */}
        <polygon 
          fill={color} 
          fillOpacity="0.1" 
          points={`0,100 ${points} 100,100`} 
        />
      </svg>
    </div>
  );
};

// --- Main Application ---

export default function Page() {
  const [activeTab, setActiveTab] = useState<FoodProfileKey>('banana');
  const [simulationMode, setSimulationMode] = useState<'normal' | 'spoilage'>('normal');
  const [readings, setReadings] = useState<BaseValues>(FOOD_PROFILES['banana'].baseValues);
  const [history, setHistory] = useState<{ ammonia: number[]; temp: number[]; voc: number[] }>({ 
    ammonia: new Array(10).fill(0), 
    temp: new Array(10).fill(18), 
    voc: new Array(10).fill(100) 
  });
  const [quality, setQuality] = useState<'safe' | 'warning' | 'unsafe'>('safe');
  const [isScanning, setIsScanning] = useState(false);

  // Logic to determine sensor status color
  const getStatus = (sensor: string, value: number, profile: FoodProfile): 'good' | 'warning' | 'danger' => {
    const rules = profile.thresholds[sensor];
    if (!rules) return 'good';
    
    // Check Max limit
    if (rules.max) {
      if (value > rules.max * 1.5) return 'danger';
      if (value > rules.max) return 'warning';
    }
    // Check Min limit (e.g. for humidity)
    if (rules.min) {
      if (value < rules.min * 0.7) return 'danger';
      if (value < rules.min) return 'warning';
    }
    return 'good';
  };

  const currentProfile = FOOD_PROFILES[activeTab];

  // Manual Sensor Scan Function
  const takeReading = () => {
    setIsScanning(true);
    
    // Artificial delay to feel like a real sensor read
    setTimeout(() => {
      const isSpoiling = simulationMode === 'spoilage';
      const newReadings = { ...readings }; 
      
      // Calculate new values based on profile base + noise or spoilage factor
      Object.keys(currentProfile.baseValues).forEach(key => {
        let base = currentProfile.baseValues[key];
        let noise = (Math.random() - 0.5) * (base * 0.1 || 2);
        
        if (isSpoiling) {
          // Rapidly increase bad indicators if spoiling
          if (['ammonia', 'h2s', 'voc', 'ethyl', 'alcohol'].includes(key)) {
             base = base + 50 + (Math.random() * 20); 
          }
          // Temp usually rises slightly in decomposition
          if (key === 'temp') base += 5;
        }

        // Apply new reading
        newReadings[key] = parseFloat((base + noise).toFixed(1));
      });

      setReadings(newReadings);

      // Update Quality Status based on Weighted thresholds
      let score = 0;
      Object.entries(currentProfile.thresholds).forEach(([key, rule]) => {
         // Force strict check for max, default to Infinity if not present to avoid TS warnings
         if (newReadings[key] > (rule.max || Infinity)) score += rule.weight;
         if (rule.min && newReadings[key] < rule.min) score += rule.weight;
      });

      if (score >= 3) setQuality('unsafe');
      else if (score >= 1) setQuality('warning');
      else setQuality('safe');

      // Update History (Shift and append)
      setHistory(prev => ({
        ammonia: [...prev.ammonia.slice(1), newReadings.ammonia],
        temp: [...prev.temp.slice(1), newReadings.temp],
        voc: [...prev.voc.slice(1), newReadings.voc]
      }));

      setIsScanning(false);
    }, 800);
  };

  // Reset readings when tab changes
  useEffect(() => {
    const profile = FOOD_PROFILES[activeTab];
    setReadings(profile.baseValues);
    setQuality('safe');
    setSimulationMode('normal');
    // Pre-fill history so charts aren't empty
    setHistory({ 
      ammonia: new Array(10).fill(profile.baseValues.ammonia), 
      temp: new Array(10).fill(profile.baseValues.temp), 
      voc: new Array(10).fill(profile.baseValues.voc) 
    });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500 selection:text-white pb-12">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>

              <p className="text-xs text-slate-400">Advanced Food Quality Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Simulation Controls */}
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

            {/* Manual Scan Button */}
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
        
        {/* Navigation Tabs */}
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
          
          {/* Left Column: Status & Environmental */}
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
               <LiveChart data={history.temp} color="#fbbf24" />
             </div>
          </div>

          {/* Center & Right Column: Chemical Sensors */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Spoilage Indicators */}
              <SensorCard 
                title="Ammonia (NH3)" 
                value={readings.ammonia} 
                unit="ppm" 
                icon={<Atom className="w-4 h-4" />}
                max={50}
                status={getStatus('ammonia', readings.ammonia, currentProfile)}
              />
               <SensorCard 
                title="Hydrogen Sulfide (H2S)" 
                value={readings.h2s} 
                unit="ppm" 
                icon={<FlaskConical className="w-4 h-4" />}
                max={10}
                status={getStatus('h2s', readings.h2s, currentProfile)}
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
                title="Alcohol/Ethanol" 
                value={readings.alcohol} 
                unit="ppm" 
                icon={<FlaskConical className="w-4 h-4" />}
                max={100}
                status={getStatus('alcohol', readings.alcohol, currentProfile)}
              />
            </div>

            {/* Analysis Panel */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Real-time Chemical Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <p className="text-sm text-slate-400 mb-2">Ammonia Levels (Protein Breakdown)</p>
                   <LiveChart data={history.ammonia} color="#f43f5e" />
                </div>
                <div>
                   <p className="text-sm text-slate-400 mb-2">VOC Levels (Bacterial Activity)</p>
                   <LiveChart data={history.voc} color="#3b82f6" />
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-slate-800 rounded-lg text-sm text-slate-300">
                <span className="font-bold text-white block mb-1">AI Diagnostic Insight:</span>
                {quality === 'safe' && "All parameters are within the optimal freshness range for this product category. No bacterial metabolic byproducts detected."}
                {quality === 'warning' && "Sensors are detecting elevated levels of volatile organic compounds or temperature deviations. Recommend consuming soon or checking refrigeration."}
                {quality === 'unsafe' && "CRITICAL: High concentrations of Ammonia, H2S, or Alcohol detected indicating active decomposition or fermentation. Do not consume."}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}