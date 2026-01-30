
import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Settings, Search, LayoutGrid, Menu, Users, MessageSquare, 
  ArrowRight, Shield, Coins, Castle, Map as MapIcon, Sword, TrendingUp, 
  Activity, Zap, Plus, Wrench, RefreshCw, Skull, Book, Target, Sparkles,
  Package, Box, Gem, Flame, Crosshair, Timer, Trophy, Star, AlertCircle,
  Hammer, ChevronUp, UserPlus, Factory, GraduationCap, Scroll, Scale, History
} from 'lucide-react';
import { chatWithAdvisor, discoverArtifact, generateWorldEvent, generateChapterLore, generateHeroSaga } from './services/geminiService';
import { Building, Message, StoryChapter, Decree, GameItem, Unit, Expedition, AgeType } from './types';

type AppMode = 'SETTLEMENT' | 'ECONOMY' | 'MILITARY' | 'CHRONICLES' | 'MAP' | 'RESEARCH' | 'COUNCIL';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>('SETTLEMENT');
  const [isRedAlert, setIsRedAlert] = useState(false);
  
  // Empire Story State
  const [currentAge, setCurrentAge] = useState<AgeType>(1);
  const [alignment, setAlignment] = useState<'Benevolent' | 'Conqueror'>('Benevolent');
  const [chapters, setChapters] = useState<StoryChapter[]>([
    { title: "The Ash Beginnings", summary: "Out of the ruins of the old world, a small settlement finds its footing.", milestone: "Founded the first Town Center." }
  ]);
  const [heroSaga, setHeroSaga] = useState("The Humble Warden");
  const [totalBattles, setTotalBattles] = useState(0);

  // Resources
  const [gold, setGold] = useState(1000);
  const [wood, setWood] = useState(1000);
  const [stone, setStone] = useState(500);
  const [villagers, setVillagers] = useState({ wood: 5, stone: 0, gold: 0, unassigned: 5 });

  // Buildings & Army
  const [settlement, setSettlement] = useState<Building[]>([
    { id: 'th', name: 'Town Center', level: 1, type: 'economy', description: 'The heart of your empire.', image: 'https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&q=80&w=800' }
  ]);
  const [units, setUnits] = useState<Unit[]>([
    { type: 'Villager', count: 10, powerPerUnit: 0, costGold: 50, costWood: 0 },
    { type: 'Infantry', count: 0, powerPerUnit: 5, costGold: 60, costWood: 20 },
    { type: 'Archer', count: 0, powerPerUnit: 8, costGold: 80, costWood: 40 },
    { type: 'Knight', count: 0, powerPerUnit: 35, costGold: 300, costWood: 150 },
    { type: 'Siege', count: 0, powerPerUnit: 120, costGold: 800, costWood: 500 },
  ]);

  const ageNames = { 1: "Dark Age", 2: "Feudal Age", 3: "Castle Age", 4: "Imperial Age" };
  const [notifications, setNotifications] = useState<{ id: number, text: string, x: number, y: number }[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Derived Values
  const production = useMemo(() => ({
    gold: (villagers.gold * 2 + (currentAge * 5)) * (alignment === 'Benevolent' ? 1.2 : 1),
    wood: villagers.wood * 3,
    stone: villagers.stone * 2,
  }), [villagers, currentAge, alignment]);

  const totalPower = useMemo(() => {
    const unitPower = units.reduce((acc, u) => acc + (u.count * u.powerPerUnit), 0);
    const bonusMultiplier = alignment === 'Conqueror' ? 1.2 : 1;
    return Math.floor(unitPower * bonusMultiplier * (1 + (totalBattles * 0.05)));
  }, [units, alignment, totalBattles]);

  // Production Loop
  useEffect(() => {
    const tick = setInterval(() => {
      setGold(g => g + production.gold);
      setWood(w => w + production.wood);
      setStone(s => s + production.stone);
    }, 4000);
    return () => clearInterval(tick);
  }, [production]);

  const addNotification = (text: string, x?: number, y?: number) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, x: x || 500, y: y || 400 }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 1500);
  };

  // Saga Advancement
  const advanceAge = async () => {
    const nextAge = (currentAge + 1) as AgeType;
    const summary = await generateChapterLore(ageNames[nextAge], alignment);
    setChapters([...chapters, { 
      title: `The ${ageNames[nextAge]} Rising`, 
      summary, 
      milestone: `Advanced to the ${ageNames[nextAge]}.` 
    }]);
    setCurrentAge(nextAge);
    setActiveMode('CHRONICLES');
    addNotification(`EPOCH REACHED: ${ageNames[nextAge]}`);
  };

  const handleBattle = async (enemyPower: number) => {
    if (totalPower >= enemyPower) {
      setTotalBattles(b => b + 1);
      const reward = Math.floor(enemyPower * 0.8);
      setGold(g => g + reward);
      addNotification(`VICTORY! +${reward}G`);
      
      if (totalBattles % 3 === 0) {
        const newSaga = await generateHeroSaga(currentAge, totalBattles + 1);
        setHeroSaga(newSaga);
      }
    } else {
      addNotification("DEFEAT: FORCES RETREATED");
      setIsRedAlert(true);
      setTimeout(() => setIsRedAlert(false), 2000);
    }
  };

  const trainUnit = (type: string) => {
    const u = units.find(unit => unit.type === type);
    if (u && gold >= u.costGold && wood >= u.costWood) {
      setGold(g => g - u.costGold);
      setWood(w => w - u.costWood);
      setUnits(units.map(unit => unit.type === type ? { ...unit, count: unit.count + 1 } : unit));
      if (type === 'Villager') setVillagers({ ...villagers, unassigned: villagers.unassigned + 1 });
      addNotification(`ENLISTED: ${type}`);
    }
  };

  const handleSendMessage = async (customMsg?: string) => {
    const text = customMsg || userInput;
    if (!text.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', text }]);
    setUserInput("");
    setIsTyping(true);
    const response = await chatWithAdvisor(chatHistory, text);
    setChatHistory(prev => [...prev, { role: 'model', text: response || "" }]);
    setIsTyping(false);
  };

  const renderView = () => {
    switch (activeMode) {
      case 'CHRONICLES':
        return (
          <div className="flex-1 flex flex-col space-y-8 animate-in fade-in duration-500">
             <div className="flex justify-between items-center border-b border-blue-500/20 pb-6">
                <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                   <History size={32} className="text-blue-500" /> Imperial Chronicles
                </h2>
                <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${alignment === 'Benevolent' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
                   Ethos: {alignment} Path
                </div>
             </div>
             <div className="flex-1 overflow-y-auto space-y-6 pr-4 scroll-parchment">
                {chapters.map((ch, i) => (
                  <div key={i} className="bg-black/40 border-l-4 border-blue-500 p-8 rounded-r-3xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl font-black">CH {i+1}</div>
                     <h3 className="text-xl font-black text-blue-300 uppercase mb-3">{ch.title}</h3>
                     <p className="text-sm italic text-white/70 mb-4 leading-relaxed font-sans">"{ch.summary}"</p>
                     <div className="flex items-center gap-3 text-[10px] font-bold text-blue-500">
                        <Star size={14} /> MILESTONE: {ch.milestone}
                     </div>
                  </div>
                )).reverse()}
             </div>
          </div>
        );
      case 'COUNCIL':
        return (
          <div className="flex-1 flex flex-col items-center justify-center space-y-12">
             <div className="text-center space-y-4 max-w-2xl">
                <Scale size={64} className="mx-auto text-yellow-500 mb-6" />
                <h2 className="text-4xl font-black uppercase tracking-widest">Imperial Decree</h2>
                <p className="text-blue-300 font-bold uppercase text-xs tracking-[0.2em]">The Grand Council awaits your wisdom on a matter of State.</p>
             </div>
             <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
                <div onClick={() => { setAlignment('Benevolent'); addNotification("PATH OF BENEVOLENCE CHOSEN"); setActiveMode('SETTLEMENT'); }} className="bg-green-950/20 border-2 border-green-500/30 p-10 rounded-3xl hover:border-green-400 cursor-pointer transition-all group">
                   <h3 className="text-2xl font-black text-green-400 uppercase mb-4 group-hover:scale-110 origin-left transition-transform">Pax Imperialis</h3>
                   <p className="text-xs text-white/60 leading-loose mb-8">FOCUS ON DOMESTIC HARMONY. THE CITIZENS ARE THE HEART OF THE EMPIRE. +20% PRODUCTION BONUS.</p>
                   <button className="btn-game bg-green-700 w-full py-3 rounded-xl font-black uppercase text-[10px]">Select Path</button>
                </div>
                <div onClick={() => { setAlignment('Conqueror'); addNotification("PATH OF CONQUEST CHOSEN"); setActiveMode('SETTLEMENT'); }} className="bg-red-950/20 border-2 border-red-500/30 p-10 rounded-3xl hover:border-red-400 cursor-pointer transition-all group">
                   <h3 className="text-2xl font-black text-red-400 uppercase mb-4 group-hover:scale-110 origin-left transition-transform">Bellum Aeternum</h3>
                   <p className="text-xs text-white/60 leading-loose mb-8">FOCUS ON GLOBAL DOMINANCE. IRON AND BLOOD SECURE THE FUTURE. +20% COMBAT POWER BONUS.</p>
                   <button className="btn-game bg-red-700 w-full py-3 rounded-xl font-black uppercase text-[10px]">Select Path</button>
                </div>
             </div>
          </div>
        );
      case 'MAP':
        return (
          <div className="flex-1 bg-slate-900 border-2 border-black rounded-3xl relative overflow-hidden flex flex-col p-10">
             <div className="flex justify-between items-start mb-10">
                <div className="bg-black/60 p-4 rounded-2xl border border-white/10">
                   <div className="text-[9px] font-black text-blue-500 mb-1 uppercase">Kingdom Domain</div>
                   <div className="text-2xl font-black text-white uppercase">{ageNames[currentAge]} Territory</div>
                </div>
                <div className="flex items-center gap-4 bg-red-900/30 p-4 rounded-2xl border border-red-500/30">
                   <Skull className="text-red-500 animate-pulse" />
                   <div className="text-right">
                      <div className="text-[10px] font-black text-red-400 uppercase">Enemy Presence</div>
                      <div className="text-lg font-black text-white uppercase">Viking Raid Sector</div>
                   </div>
                </div>
             </div>
             <div className="grid grid-cols-3 gap-8 flex-1">
                {[
                  { name: 'Barbarian Camp', p: 300 * currentAge, c: 'text-orange-500' },
                  { name: 'Rival Kingdom', p: 1000 * currentAge, c: 'text-red-500' },
                  { name: 'Ancient Grove', p: 150 * currentAge, c: 'text-blue-400' },
                ].map(loc => (
                  <div key={loc.name} className="bg-black/40 border-2 border-black rounded-3xl p-8 flex flex-col items-center justify-center hover:scale-105 transition-all">
                     <div className={`${loc.c} mb-4`}><Skull size={64}/></div>
                     <h3 className="text-xl font-black uppercase tracking-widest mb-1">{loc.name}</h3>
                     <span className="text-[10px] text-blue-500 font-bold mb-6">DEFENSE POWER: {loc.p}</span>
                     <button onClick={() => handleBattle(loc.p)} className="btn-game w-full py-4 rounded-2xl font-black text-xs uppercase btn-red">Launch Conquest</button>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'ECONOMY':
        return (
          <div className="flex-1 flex flex-col space-y-8">
             <div className="grid grid-cols-3 gap-8">
                {[
                  { label: 'Woodcutters', icon: <Zap />, count: villagers.wood, key: 'wood' as const, rate: 3 },
                  { label: 'Miners', icon: <Wrench />, count: villagers.stone, key: 'stone' as const, rate: 2 },
                  { label: 'Coiners', icon: <Coins />, count: villagers.gold, key: 'gold' as const, rate: 2 },
                ].map(job => (
                  <div key={job.label} className="bg-black/40 border-2 border-black rounded-3xl p-8 flex flex-col items-center relative group">
                     <div className="p-4 bg-slate-800 rounded-2xl text-blue-400 mb-6">{job.icon}</div>
                     <span className="text-2xl font-black">{job.count} <span className="text-xs text-blue-500">WORKERS</span></span>
                     <span className="text-[10px] font-black uppercase tracking-widest mb-6">{job.label}</span>
                     <div className="mt-4 text-[9px] font-bold text-green-500">PRODUCING: +{Math.floor(job.count * job.rate * (alignment === 'Benevolent' ? 1.2 : 1))} / Cycle</div>
                  </div>
                ))}
             </div>
             <div className="bg-blue-950/40 border-2 border-black rounded-3xl p-10 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black uppercase mb-2">Hire Villagers</h3>
                   <p className="text-xs text-blue-300 max-w-md">Fuel the empire's expansion through labor.</p>
                </div>
                <button onClick={() => trainUnit('Villager')} className="btn-game px-12 py-5 rounded-2xl btn-gold text-xs font-black uppercase shadow-xl">Hire (50G)</button>
             </div>
          </div>
        );
      case 'MILITARY':
        return (
          <div className="flex-1 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-3 gap-6">
               {units.filter(u => u.type !== 'Villager').map(u => (
                 <div key={u.type} className="bg-blue-900/40 border-2 border-black p-6 rounded-3xl flex flex-col items-center group">
                    <div className="p-4 bg-slate-900 rounded-full text-blue-500 mb-4 group-hover:rotate-12 transition-transform">
                       {u.type === 'Infantry' ? <Shield /> : u.type === 'Archer' ? <Crosshair /> : u.type === 'Knight' ? <Sword /> : <Factory />}
                    </div>
                    <span className="text-lg font-black uppercase mb-1">{u.type}</span>
                    <span className="text-2xl font-black text-white/80 mb-6">{u.count} <span className="text-[8px] text-blue-400">ENLISTED</span></span>
                    <button onClick={() => trainUnit(u.type)} className="btn-game w-full py-4 rounded-2xl text-[10px] font-black uppercase btn-gold">Recruit</button>
                 </div>
               ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-1 relative bg-black border-2 border-black rounded-3xl overflow-hidden group shadow-2xl">
            <img src={settlement[0].image} className="w-full h-full object-cover opacity-50 transition-transform duration-[20s] scale-110 group-hover:scale-100" alt="Settlement" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/95 via-blue-900/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-12 flex flex-col justify-end">
               <div className="flex justify-between items-end mb-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 w-fit rounded text-[10px] font-black uppercase tracking-[0.2em]">
                      <Star size={12} fill="currentColor"/> {ageNames[currentAge]}
                    </div>
                    <h2 className="text-6xl font-black tracking-widest uppercase">The Sovereign Core</h2>
                    <p className="text-lg text-blue-300 font-bold uppercase tracking-widest">A legacy built in {alignment} shadow.</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-black/60 p-8 rounded-3xl border-2 border-blue-500/30 backdrop-blur-md">
                      <div className="text-6xl font-black text-yellow-400 tracking-tighter">{totalPower.toLocaleString()}</div>
                      <div className="text-[11px] font-black text-blue-300 tracking-[0.3em] mt-2 uppercase">Combat Rating</div>
                    </div>
                  </div>
               </div>
               <div className="flex space-x-6">
                  <button onClick={() => setActiveMode('COUNCIL')} className="btn-game flex-1 py-6 rounded-2xl text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 group">
                    <Scale size={24} className="group-hover:rotate-12 transition-all"/> Decree Council
                  </button>
                  <button onClick={() => setActiveMode('CHRONICLES')} className="btn-game flex-1 py-6 rounded-2xl text-xs font-black uppercase tracking-[0.3em] btn-gold flex items-center justify-center gap-4 group shadow-lg">
                    <History size={24} className="group-hover:scale-110 transition-all"/> View Chronicles
                  </button>
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col h-screen text-white bg-slate-950 overflow-hidden relative transition-all duration-500 ${isRedAlert ? 'red-alert' : ''}`}>
      {notifications.map(n => (
        <div key={n.id} className="floating-text text-yellow-400 text-sm font-black z-[100]" style={{ left: n.x, top: n.y }}>{n.text}</div>
      ))}

      {/* Narrative Marquee */}
      <div className="h-10 bg-blue-600/20 flex items-center justify-center border-b border-blue-500/30 overflow-hidden relative">
         <div className="flex items-center gap-12 animate-marquee whitespace-nowrap text-[9px] font-black uppercase tracking-[0.4em] text-blue-400">
            <span>*** EPOCH: {ageNames[currentAge]} ***</span>
            <span>*** CHAPTER: {chapters[chapters.length-1].title} ***</span>
            <span>*** HERO STATUS: {heroSaga} ***</span>
            <span>*** ETHOS: {alignment} PATH ***</span>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Navigation */}
        <div className="w-72 bg-blue-900 border-r-2 border-black flex flex-col p-6 space-y-4 shadow-2xl z-10 overflow-y-auto scroll-parchment">
          <div className="text-[11px] font-black text-blue-500 tracking-[0.4em] mb-4 uppercase px-2">Imperial OS v7.0</div>
          {[
            { mode: 'SETTLEMENT' as AppMode, icon: <LayoutGrid />, label: "SOVEREIGNTY" },
            { mode: 'CHRONICLES' as AppMode, icon: <History />, label: "CHRONICLES" },
            { mode: 'COUNCIL' as AppMode, icon: <Scale />, label: "DECREES" },
            { mode: 'ECONOMY' as AppMode, icon: <Users />, label: "ECONOMY" },
            { mode: 'MILITARY' as AppMode, icon: <Sword />, label: "MILITARY" },
            { mode: 'MAP' as AppMode, icon: <MapIcon />, label: "CONQUEST" },
          ].map((item) => (
            <button 
              key={item.mode}
              onClick={() => setActiveMode(item.mode)}
              className={`w-full flex items-center space-x-4 p-5 rounded-2xl text-[11px] font-black uppercase transition-all border-2 ${
                activeMode === item.mode 
                  ? 'btn-game border-yellow-500 scale-[1.03] shadow-lg' 
                  : 'bg-black/20 border-transparent hover:bg-black/40 text-blue-400'
              }`}
            >
              <span className={activeMode === item.mode ? 'text-yellow-400' : 'text-blue-600'}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          
          <div className="mt-auto space-y-4">
             <div className="bg-black/40 border border-white/10 rounded-3xl p-5 group cursor-help">
                <div className="flex items-center gap-4 mb-3">
                   <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center border-2 border-black shadow-lg">
                      <User size={24} />
                   </div>
                   <div>
                      <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Imperial General</div>
                      <div className="text-[11px] font-black uppercase truncate w-32">{heroSaga}</div>
                   </div>
                </div>
                <div className="h-2 w-full bg-black rounded-full overflow-hidden">
                   <div className="h-full bg-yellow-500 shadow-[0_0_10px_#fbbf24]" style={{ width: `${(totalBattles % 10) * 10}%` }}></div>
                </div>
             </div>
          </div>
        </div>

        {/* Dynamic Viewport */}
        <div className="flex-1 flex flex-col bg-slate-900 p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '70px 70px' }}></div>
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <h1 className="text-5xl font-black tracking-[0.4em] uppercase flex items-center gap-8">
              <span className="w-5 h-16 bg-yellow-500 shadow-[0_0_25px_#fbbf24]"></span>
              <span>{activeMode} Terminal</span>
            </h1>
            <div className="flex items-center gap-10 bg-black/40 px-10 py-4 rounded-3xl border-2 border-white/5">
               <Activity className="text-blue-500 animate-pulse" size={32} />
               <div className="flex flex-col">
                  <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest">Epoch Status</span>
                  <span className="text-lg font-black text-green-400 uppercase tracking-widest">{ageNames[currentAge]}</span>
               </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative z-10">
            {renderView()}
          </div>
        </div>

        {/* Global Feed */}
        <div className="w-80 bg-blue-900 border-l-2 border-black flex flex-col p-6 space-y-8 z-10">
           <div className="text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase px-2">Intelligence Feed</div>
           
           <div className="bg-black/60 border-2 border-black rounded-3xl p-6 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center text-[10px] font-black text-blue-300 uppercase">
                 <span>Empire Stats</span>
                 <TrendingUp size={16} className="text-blue-500"/>
              </div>
              <div className="space-y-4">
                 {[
                   { label: 'Gold', val: gold.toLocaleString(), color: 'text-yellow-400' },
                   { label: 'Battles', val: totalBattles, color: 'text-red-400' },
                   { label: 'Alignment', val: alignment, color: 'text-blue-300' },
                 ].map(item => (
                   <div key={item.label} className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className={`text-[10px] font-black uppercase ${item.color}`}>{item.label}</span>
                      <span className="text-lg font-black">{item.val}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="flex-1 overflow-hidden flex flex-col space-y-4">
              <div className="text-[11px] font-black text-blue-300 uppercase tracking-widest px-2">Lore Snippets</div>
              <div className="bg-blue-600/10 border border-blue-500/30 p-6 rounded-3xl group relative overflow-hidden">
                 <p className="text-[10px] text-white/60 leading-relaxed uppercase italic">"The scribes speak of a golden age, or a world drowned in iron. The choice of the throne will write the final verse."</p>
              </div>
           </div>
        </div>
      </div>

      {/* Royal Advisor Console */}
      <div className="h-48 bg-blue-950 border-t-2 border-black flex p-6 gap-8 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] z-30">
        <div onClick={() => handleSendMessage("Grand Vizier, analyze our current chapter and ethos.")} className="w-48 bg-gradient-to-br from-blue-800 to-blue-950 border-2 border-black flex flex-col items-center justify-center rounded-3xl group cursor-pointer hover:scale-[1.05] transition-all shadow-2xl relative overflow-hidden">
           <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
           <Users size={72} className="text-blue-200 group-hover:text-yellow-400 transition-colors" />
           <span className="text-[11px] font-black mt-3 tracking-[0.4em] uppercase text-blue-400">Grand Vizier</span>
        </div>

        <div className="flex-1 flex flex-col bg-slate-900 border-2 border-black rounded-3xl overflow-hidden shadow-2xl relative group">
           <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[15px] scroll-parchment">
              {chatHistory.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full opacity-20 gap-4">
                    <MessageSquare size={64} className="animate-pulse" />
                    <span className="text-[12px] font-black uppercase tracking-[0.5em]">Establishing Narrative Link...</span>
                 </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-7 py-5 rounded-3xl border-2 ${msg.role === 'user' ? 'bg-blue-700 border-blue-500 ml-24' : 'bg-blue-900 border-black text-yellow-50 mr-24 shadow-[10px_10px_0_rgba(0,0,0,0.5)]'}`}>
                      <span className="text-[10px] font-black opacity-40 block mb-2 uppercase tracking-[0.3em]">{msg.role === 'user' ? 'Sovereign' : 'Grand Vizier'}</span>
                      <p className="leading-relaxed font-sans">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
           </div>
           
           <div className="h-16 bg-black/60 border-t-2 border-black flex items-center px-8">
              <input 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="CONFER WITH THE VIZIER ON IMPERIAL MATTERS..."
                className="flex-1 bg-transparent text-sm font-black uppercase tracking-[0.3em] outline-none text-blue-100 placeholder-blue-900/50"
              />
              <button onClick={() => handleSendMessage()} className="w-16 h-12 btn-game rounded-2xl flex items-center justify-center ml-6 group transition-all hover:btn-gold">
                <ArrowRight size={32} className="group-hover:translate-x-3 transition-transform" />
              </button>
           </div>
        </div>

        <div className="w-80 flex flex-col gap-3">
           <button onClick={() => advanceAge()} className="btn-game flex-1 flex items-center justify-center gap-6 group rounded-3xl shadow-xl">
             <ChevronUp size={28} className="text-blue-400 group-hover:scale-125 transition-all" />
             <span className="text-[14px] font-black tracking-[0.3em]">REACH_NEXT_EPOCH</span>
           </button>
           <div className="flex gap-3 h-1/2">
             <button onClick={() => setActiveMode('COUNCIL')} className="btn-game flex-1 rounded-2xl flex items-center justify-center group"><Scale size={28} className="group-hover:rotate-12 transition-all"/></button>
             <button onClick={() => setActiveMode('RESEARCH')} className="btn-game flex-1 rounded-2xl flex items-center justify-center group"><GraduationCap size={28} className="group-hover:scale-110 transition-all"/></button>
             <button onClick={() => { setGold(g => g + 1000); addNotification("TREASURY INJECTION!"); }} className="btn-game flex-1 bg-green-900 border-green-600 rounded-2xl flex items-center justify-center group shadow-lg"><Plus size={28} className="group-hover:rotate-90 transition-all"/></button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;
