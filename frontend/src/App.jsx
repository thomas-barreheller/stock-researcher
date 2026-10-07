import { useState, useEffect } from "react";



import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";



import { motion, AnimatePresence } from "framer-motion";



import {



  Cpu,



  ShoppingCart,



  Landmark,



  Stethoscope,



  Zap,



  Factory,



  Home,



  Radio,



  Wheat,



  Building2,



  Info,



  Radar as RadarIcon,



} from "lucide-react";







// Adresse de ton backend. En local, c'est celle-ci.



const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8001").replace(/\/$/, "");







// ------------------------------------------------------------------



// Formatage des nombres selon la langue active (virgule FR / point EN,



// "Md"/"T" en français, "B"/"T" en anglais)



// ------------------------------------------------------------------



function formatNum(lang, n, decimals = 2) {



  if (n == null || Number.isNaN(n)) return "N/A";



  const locale = lang === "en" ? "en-US" : "fr-FR";



  return n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });



}







function formatCompact(lang, n) {



  if (n == null) return "N/A";



  const units = lang === "en" ? ["T", "B", "M"] : ["T", "Md", "M"];



  if (n >= 1e12) return `${formatNum(lang, n / 1e12)} ${units[0]}`;



  if (n >= 1e9) return `${formatNum(lang, n / 1e9, 1)} ${units[1]}`;



  if (n >= 1e6) return `${formatNum(lang, n / 1e6, 0)} ${units[2]}`;



  return formatNum(lang, n, 0);



}







function formatPct(lang, n, decimals = 1) {



  if (n == null) return "N/A";



  const sign = n > 0 ? "+" : "";



  return `${sign}${formatNum(lang, n, decimals)} %`;



}







// ------------------------------------------------------------------



// Dictionnaire de traduction de l'interface (FR/EN)



// ------------------------------------------------------------------



const UI_TEXT = {



  fr: {



    subtitle: "Explore les chiffres clés d’une action, sa tendance récente et un brief généré par IA.",



    simpleMode: "Mode simple",



    radarLabel: "Activité inhabituelle :",



    radarScanning: "scan en cours...",



    radarNothing: (n) => `aucune des ${n} actions suivies ne remplit les critères du dernier scan`,



    spyLabel: (pct) => `SPY ${pct} (1m)`,



    searchPlaceholder: "Ex : AAPL, MC.PA...",



    search: "Rechercher",



    searching: "Recherche...",



    weekLow: "52 sem. bas",



    weekHigh: "52 sem. haut",



    microCap: "Micro-cap",



    megaCap: "Mega-cap",



    marketCap: "Capitalisation boursière",



    metricLabels: {



      pe: "P/E",



      forwardPe: "P/E prévisionnel",



      eps: "EPS",



      peg: "PEG",



      margin: "Marge nette",



      beta: "Bêta",



      debt: "Dette / capitaux propres",



      dividend: "Rendement du dividende",



    },



    metricTooltips: {



      pe: "Prix de l'action divisé par son bénéfice par action. Plus c'est élevé, plus le marché anticipe de croissance future. Calcul : prix actuel ÷ bénéfice net par action des 12 derniers mois (donnée Yahoo Finance, pas recalculée par l'app).",



      eps: "Bénéfice net de l'entreprise divisé par le nombre d'actions en circulation. Calcul : bénéfice net total ÷ nombre d'actions en circulation, sur les 12 derniers mois (donnée Yahoo Finance).",



      peg: "Le P/E ajusté par la croissance attendue. Autour de 1 est considéré comme équilibré. Calcul : P/E ÷ taux de croissance annuel des bénéfices attendu, en % (donnée Yahoo Finance).",



      beta: "Mesure la volatilité de l'action par rapport au marché. 1 = bouge comme le marché, plus haut = plus volatil. Calcul : covariance des rendements de l'action avec ceux du marché ÷ variance des rendements du marché, sur plusieurs années (donnée Yahoo Finance).",



      debt: "Dette totale rapportée aux capitaux propres. Plus c'est bas, moins l'entreprise dépend de l'emprunt. Calcul : dette totale ÷ capitaux propres, d'après le dernier bilan disponible (donnée Yahoo Finance).",



      dividend: "Dividende annuel versé, en pourcentage du prix de l'action. Calcul : dividende annuel par action ÷ prix actuel de l'action × 100 (donnée Yahoo Finance).",



      margin: "Part du chiffre d'affaires qui devient du bénéfice net. Calcul : bénéfice net ÷ chiffre d'affaires total, sur les 12 derniers mois (donnée Yahoo Finance).",



      forwardPe: "Le P/E calculé sur les bénéfices attendus des 12 prochains mois, plutôt que les bénéfices passés. Calcul : prix actuel ÷ bénéfice par action estimé pour les 12 prochains mois (donnée Yahoo Finance).",



    },



    trendDynamics: "Tendance récente du cours",



    analyzingRegime: "Analyse en cours...",



    bullRegimeSuffix: "% : profil récent plus favorable selon le modèle",



    understandLink: "Comprendre ce chiffre en 10 secondes",



    closeExplanation: "Fermer l'explication",



    analystRatings: "Avis des analystes",



    ratingBuy: "Acheter",



    ratingHold: "Conserver",



    ratingSell: "Vendre",



    noAnalystCoverage: "Pas de couverture par les analystes",



    avgTarget: "Cible moyenne :",



    capmTitle: "Modèle de risque et objectifs des analystes",



    computingCapm: "Calcul du rendement théorique en cours...",



    scenarioBearish: "Scénario Baissier",



    scenarioBase: "Scénario de Base (CAPM)",



    scenarioBullish: "Scénario Haussier",



    capmExpectedCaption: "Rendement théorique attendu",



    capmBubble: (rf, erp, beta) =>



      `Le CAPM estime le rendement annuel qu'un investisseur pourrait exiger pour compenser le risque de cette action. Calcul : ${rf} % de taux sans risque + le bêta de l'action (${beta}) × ${erp} % de prime de risque du marché. Ce résultat est un repère théorique fondé sur le risque, pas une prévision du prochain gain.`,



    analystTargetSentence: (count, price, currency, pct) => (



      <>Objectif de cours moyen de {count ?? "?"} analystes : <span className="font-medium text-ink">{price} {currency}</span> ({pct})</>



    ),



    priceChartTitle: "Prix sur 1 an",



    generateBrief: "Générer le brief IA",
    briefNotice: "Synthèse générée à partir des données affichées, sans accès garanti aux actualités en direct.",



    generatingBrief: "Génération en cours...",



    briefCard1: "Contexte & Catalyseurs",



    briefCard2: "Valorisation & Croissance",



    briefCard3: "Concurrents & Risques",



    compareCompetitors: "Comparer aux concurrents",



    loadingCompetitors: "Chargement...",



    tableCompany: "Entreprise",



    tablePrice: "Prix",



    tableMarketCap: "Capitalisation",



    tablePe: "P/E",



    tableEps: "EPS",



    tableRevGrowth: "Croissance CA",



    tableMargin: "Marge nette",



    footer: "Ces outils fournissent une analyse quantitative historique et ne constituent pas un conseil en investissement personnalisé. Les données peuvent être différées de 15 à 20 minutes.",



    genericError: "Erreur inconnue",



    radarLoadError: "Erreur lors du chargement du radar",



  },



  en: {



    subtitle: "Explore a stock’s key figures, recent price trend, and AI-generated brief.",



    simpleMode: "Simple mode",



    radarLabel: "Unusual activity:",



    radarScanning: "scanning...",



    radarNothing: (n) => `none of the ${n} tracked stocks met the criteria in the latest scan`,



    spyLabel: (pct) => `SPY ${pct} (1m)`,



    searchPlaceholder: "e.g. AAPL, MC.PA...",



    search: "Search",



    searching: "Searching...",



    weekLow: "52-wk low",



    weekHigh: "52-wk high",



    microCap: "Micro-cap",



    megaCap: "Mega-cap",



    marketCap: "Market cap",



    metricLabels: {



      pe: "P/E",



      forwardPe: "Forward P/E",



      eps: "EPS",



      peg: "PEG",



      margin: "Net margin",



      beta: "Beta",



      debt: "Debt/Equity",



      dividend: "Dividend yield",



    },



    metricTooltips: {



      pe: "The stock's price divided by its earnings per share. The higher it is, the more growth the market expects. Calculation: current price ÷ net profit per share over the last 12 months (Yahoo Finance data, not recomputed by this app).",



      eps: "The company's net profit divided by its number of outstanding shares. Calculation: total net profit ÷ number of outstanding shares, over the last 12 months (Yahoo Finance data).",



      peg: "P/E adjusted for expected growth. Around 1 is generally considered balanced. Calculation: P/E ÷ expected annual earnings growth rate, in % (Yahoo Finance data).",



      beta: "Measures the stock's volatility versus the market. 1 = moves like the market, higher = more volatile. Calculation: covariance of the stock's returns with the market's ÷ variance of the market's returns, over several years (Yahoo Finance data).",



      debt: "Total debt relative to shareholder equity. The lower, the less the company relies on borrowing. Calculation: total debt ÷ shareholder equity, from the latest available balance sheet (Yahoo Finance data).",



      dividend: "Annual dividend paid, as a percentage of the stock's price. Calculation: annual dividend per share ÷ current stock price × 100 (Yahoo Finance data).",



      margin: "The share of revenue that turns into net profit. Calculation: net profit ÷ total revenue, over the last 12 months (Yahoo Finance data).",



      forwardPe: "P/E calculated on expected earnings for the next 12 months, rather than past earnings. Calculation: current price ÷ estimated earnings per share for the next 12 months (Yahoo Finance data).",



    },



    trendDynamics: "Recent price trend",



    analyzingRegime: "Analyzing...",



    bullRegimeSuffix: "%: more favorable recent pattern, according to the model",



    understandLink: "Understand this number in 10 seconds",



    closeExplanation: "Close explanation",



    analystRatings: "Analyst ratings",



    ratingBuy: "Buy",



    ratingHold: "Hold",



    ratingSell: "Sell",



    noAnalystCoverage: "No analyst coverage",



    avgTarget: "Average target:",



    capmTitle: "Risk model and analyst targets",



    computingCapm: "Computing theoretical return...",



    scenarioBearish: "Bearish Scenario",



    scenarioBase: "Base Scenario (CAPM)",



    scenarioBullish: "Bullish Scenario",



    capmExpectedCaption: "Expected theoretical return",



    capmBubble: (rf, erp, beta) =>



      `CAPM estimates the annual return an investor might require to compensate for this stock's risk. Calculation: ${rf}% risk-free rate + the stock's beta (${beta}) × ${erp}% market risk premium. This result is a theoretical risk-based benchmark, not a forecast of the stock's next return.`,



    analystTargetSentence: (count, price, currency, pct) => (



      <>Average target price from {count ?? "?"} analysts: <span className="font-medium text-ink">{price} {currency}</span> ({pct})</>



    ),



    priceChartTitle: "Price over 1 year",



    generateBrief: "Generate AI brief",
    briefNotice: "Summary generated from the displayed data, without guaranteed access to live news.",



    generatingBrief: "Generating...",



    briefCard1: "Context & Catalysts",



    briefCard2: "Valuation & Growth",



    briefCard3: "Competitors & Risks",



    compareCompetitors: "Compare to competitors",



    loadingCompetitors: "Loading...",



    tableCompany: "Company",



    tablePrice: "Price",



    tableMarketCap: "Market Cap",



    tablePe: "P/E",



    tableEps: "EPS",



    tableRevGrowth: "Revenue Growth",



    tableMargin: "Net Margin",



    footer: "These tools provide historical quantitative analysis and do not constitute personalized investment advice. Data may be delayed by 15 to 20 minutes.",



    genericError: "Unknown error",



    radarLoadError: "Error loading the radar",



  },



};







// Associe un secteur (renvoyé par yfinance) à une icône Lucide.



const SECTOR_ICONS = {



  Technology: Cpu,



  "Consumer Cyclical": ShoppingCart,



  "Consumer Defensive": Wheat,



  Financial: Landmark,



  "Financial Services": Landmark,



  Healthcare: Stethoscope,



  Energy: Zap,



  Industrials: Factory,



  "Real Estate": Home,



  "Communication Services": Radio,



};







const SECTOR_LABELS = {
  fr: {
    Technology: "Technologie",
    "Consumer Cyclical": "Consommation cyclique",
    "Consumer Defensive": "Consommation défensive",
    Financial: "Finance",
    "Financial Services": "Services financiers",
    Healthcare: "Santé",
    Energy: "Énergie",
    Industrials: "Industrie",
    "Real Estate": "Immobilier",
    "Communication Services": "Services de communication",
    Utilities: "Services aux collectivités",
    "Basic Materials": "Matériaux de base",
  },
  en: {},
};

function formatSector(lang, sector) {
  if (!sector) return "";
  return SECTOR_LABELS[lang]?.[sector] || sector;
}

function SectorIcon({ sector }) {



  const IconComponent = SECTOR_ICONS[sector] || Building2;



  return <IconComponent size={16} strokeWidth={2} className="text-ink-muted" />;



}







// Bouton "Comprendre ce chiffre en 10 secondes" — réutilisé par les 3 modules.



// En mode simple (forceOpen), l'explication reste affichée en permanence,



// sans avoir besoin de cliquer pour la découvrir.



function ExplainToggle({ title, explanation, methodology, forceOpen, t }) {



  const [open, setOpen] = useState(false);



  const isOpen = forceOpen || open;



  return (



    <div className="mt-3">



      {!forceOpen && (



        <button



          onClick={() => setOpen(!open)}



          className="rounded-sm text-xs font-semibold text-sky-dark underline decoration-dotted underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-dark"



        >



          {open ? t.closeExplanation : t.understandLink}



        </button>



      )}



      <AnimatePresence>



        {isOpen && (



          <motion.div



            initial={{ opacity: 0, height: 0 }}



            animate={{ opacity: 1, height: "auto" }}



            exit={{ opacity: 0, height: 0 }}



            className="overflow-hidden"



          >



            <p className="mt-2 text-sm text-ink-muted">



              <span className="mb-1 block font-semibold text-ink">{title}</span>



              {explanation}



            </p>



            {methodology && (



              <p className="mt-2 rounded-lg bg-ink/5 p-2.5 text-xs text-ink-muted">{methodology}</p>



            )}



          </motion.div>



        )}



      </AnimatePresence>



    </div>



  );



}







// Étiquette de métrique tactile (tap, pas seulement survol souris — pour



// que ça marche sur mobile). En mode simple, l'explication est affichée



// directement sous la valeur, sans interaction nécessaire.



function MetricLabel({ label, tooltip, value, simpleMode, isOpen, onToggle }) {
  if (value == null || value === "N/A") return null;




  if (simpleMode) {



    return (



      <div className="border-b border-ink/5 py-2 last:border-0">



        <div className="flex items-center justify-between">



          <span className="text-sm text-ink-muted">{label}</span>



          <span className="text-sm font-medium text-ink">{value ?? "N/A"}</span>



        </div>



        {tooltip && <p className="mt-0.5 text-xs text-ink-muted/80">{tooltip}</p>}



      </div>



    );



  }



  return (



    <div className="border-b border-ink/5 py-1.5 last:border-0">



      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-dark">



        <span className="flex items-center gap-1 text-sm text-ink-muted">



          {label}



          {tooltip && <Info size={12} className="opacity-50" />}



        </span>



        <span className="text-sm font-medium text-ink">{value ?? "N/A"}</span>



      </button>



      <AnimatePresence>



        {tooltip && isOpen && (



          <motion.p



            initial={{ opacity: 0, height: 0 }}



            animate={{ opacity: 1, height: "auto" }}



            exit={{ opacity: 0, height: 0 }}



            className="overflow-hidden pt-1 text-xs text-ink-muted"



          >



            {tooltip}



          </motion.p>



        )}



      </AnimatePresence>



    </div>



  );



}







// Échelle logarithmique Micro-cap → Mega-cap, pour la barre de taille.



const CAP_MIN = 5e7;



const CAP_MAX = 3.5e12;



function capPercent(marketCap) {



  if (!marketCap) return 0;



  const clamped = Math.min(Math.max(marketCap, CAP_MIN), CAP_MAX);



  const pct = (Math.log10(clamped) - Math.log10(CAP_MIN)) / (Math.log10(CAP_MAX) - Math.log10(CAP_MIN));



  return Math.round(pct * 100);



}







// ------------------------------------------------------------------



// Jauge "compteur de vitesse" pour le Module 1 (régime de marché)



// ------------------------------------------------------------------



function polarToCartesian(cx, cy, r, angleDeg) {



  const rad = (angleDeg * Math.PI) / 180;



  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };



}



function arcPath(cx, cy, r, startAngle, endAngle) {



  const start = polarToCartesian(cx, cy, r, startAngle);



  const end = polarToCartesian(cx, cy, r, endAngle);



  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;



}



function RegimeGauge({ percentage }) {



  const cx = 100, cy = 95, r = 80;



  const needleAngle = 180 - (percentage / 100) * 180;



  const tip = polarToCartesian(cx, cy, r - 18, needleAngle);



  return (



    <svg viewBox="0 0 200 110" className="mx-auto w-full max-w-[240px]">



      <path d={arcPath(cx, cy, r, 180, 117)} stroke="#B0463F" strokeWidth="16" fill="none" strokeLinecap="round" />



      <path d={arcPath(cx, cy, r, 117, 54)} stroke="#D9A441" strokeWidth="16" fill="none" strokeLinecap="round" />



      <path d={arcPath(cx, cy, r, 54, 0)} stroke="#3F8F5F" strokeWidth="16" fill="none" strokeLinecap="round" />



      <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#2B2620" strokeWidth="3" strokeLinecap="round" />



      <circle cx={cx} cy={cy} r="6" fill="#2B2620" />



    </svg>



  );



}







const SIGNAL_STYLES = {



  maintenir: "bg-rise/10 text-rise",



  surveillance: "bg-[#D9A441]/15 text-[#8a6a1f]",



  signal_sortie: "bg-fall/10 text-fall",



};







function App() {



  const [ticker, setTicker] = useState("");



  // Autocomplétion : suggestions de tickers pendant la frappe



  const [suggestions, setSuggestions] = useState([]);



  const [showSuggestions, setShowSuggestions] = useState(false);



  const [stock, setStock] = useState(null);



  const [loading, setLoading] = useState(false);



  const [error, setError] = useState(null);







  // Langue de l'interface et du contenu généré (FR par défaut)



  const [lang, setLang] = useState("fr");



  const t = UI_TEXT[lang];







  // Mode simple : explications toujours visibles, langage courant partout



  const [simpleMode, setSimpleMode] = useState(false);



  // Quelle métrique a sa bulle d'explication ouverte (une seule à la fois)



  const [openMetric, setOpenMetric] = useState(null);







  const [brief, setBrief] = useState(null);



  const [briefLoading, setBriefLoading] = useState(false);



  const [briefError, setBriefError] = useState(null);







  const [competitors, setCompetitors] = useState(null);



  const [competitorsLoading, setCompetitorsLoading] = useState(false);



  const [competitorsError, setCompetitorsError] = useState(null);







  // Module 1 — régime de marché (HMM)



  const [regime, setRegime] = useState(null);



  const [regimeLoading, setRegimeLoading] = useState(false);



  const [regimeError, setRegimeError] = useState(null);







  // Module 2 — rendement CAPM



  const [expReturns, setExpReturns] = useState(null);



  const [expReturnsLoading, setExpReturnsLoading] = useState(false);



  const [expReturnsError, setExpReturnsError] = useState(null);







  // Module 3 — radar (indépendant du ticker recherché)



  const [radar, setRadar] = useState(null);



  const [radarLoading, setRadarLoading] = useState(false);



  const [radarError, setRadarError] = useState(null);







  // Le radar scanne un univers fixe : on le recharge à chaque changement



  // de langue (le cache backend de 24h fait le reste, par langue).



  useEffect(() => {



    async function loadRadar() {



      setRadarLoading(true);



      setRadarError(null);



      try {



        const response = await fetch(`${BACKEND_URL}/api/radar?lang=${lang}`);



        if (!response.ok) throw new Error(t.radarLoadError);



        const data = await response.json();



        setRadar(data);



      } catch (err) {



        setRadarError(err.message);



      } finally {



        setRadarLoading(false);



      }



    }



    loadRadar();



    // eslint-disable-next-line react-hooks/exhaustive-deps



  }, [lang]);







  // Autocomplétion : à chaque frappe, on interroge /api/search après un



  // court délai (debounce) pour ne pas envoyer une requête à chaque lettre.



  useEffect(() => {



    if (!ticker.trim() || ticker.trim().length < 2) {



      setSuggestions([]);



      return;



    }



    const timeoutId = setTimeout(async () => {



      try {



        const response = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(ticker.trim())}`);



        if (!response.ok) return;



        const data = await response.json();



        setSuggestions(data.results || []);



        setShowSuggestions(true);



      } catch {



        setSuggestions([]);



      }



    }, 300);



    return () => clearTimeout(timeoutId);



  }, [ticker]);







  // Dès qu'une action est chargée (ou que la langue change), on lance en



  // parallèle les modules 1 et 2.



  useEffect(() => {



    if (!stock) return;







    async function loadRegime() {



      setRegimeLoading(true);



      setRegimeError(null);



      setRegime(null);



      try {



        const response = await fetch(`${BACKEND_URL}/api/regime/${stock.ticker}?lang=${lang}`);



        if (!response.ok) {



          const data = await response.json();



          throw new Error(data.detail || t.genericError);



        }



        setRegime(await response.json());



      } catch (err) {



        setRegimeError(err.message);



      } finally {



        setRegimeLoading(false);



      }



    }







    async function loadExpReturns() {



      setExpReturnsLoading(true);



      setExpReturnsError(null);



      setExpReturns(null);



      try {



        const response = await fetch(`${BACKEND_URL}/api/expected-returns/${stock.ticker}?lang=${lang}`);



        if (!response.ok) {



          const data = await response.json();



          throw new Error(data.detail || t.genericError);



        }



        setExpReturns(await response.json());



      } catch (err) {



        setExpReturnsError(err.message);



      } finally {



        setExpReturnsLoading(false);



      }



    }







    loadRegime();



    loadExpReturns();



    // eslint-disable-next-line react-hooks/exhaustive-deps



  }, [stock, lang]);







  async function runSearch(tickerValue) {



    if (!tickerValue.trim()) return;







    setShowSuggestions(false);



    setLoading(true);



    setError(null);



    setStock(null);



    setBrief(null);



    setBriefError(null);



    setCompetitors(null);



    setCompetitorsError(null);







    try {



      const response = await fetch(`${BACKEND_URL}/api/stock/${tickerValue.trim()}`);



      if (!response.ok) {



        const data = await response.json();



        throw new Error(data.detail || t.genericError);



      }



      setStock(await response.json());



    } catch (err) {



      setError(err.message);



    } finally {



      setLoading(false);



    }



  }







  function handleSearch(e) {



    e.preventDefault();



    runSearch(ticker);



  }







  function handleSelectSuggestion(symbol) {



    setTicker(symbol);



    runSearch(symbol);



  }







  async function handleGenerateBrief() {



    if (!stock) return;



    setBriefLoading(true);



    setBriefError(null);



    setBrief(null);



    try {



      const response = await fetch(`${BACKEND_URL}/api/research`, {



        method: "POST",



        headers: { "Content-Type": "application/json" },



        body: JSON.stringify({ ticker: stock.ticker, lang }),



      });



      if (!response.ok) {



        const data = await response.json();



        throw new Error(data.detail || t.genericError);



      }



      setBrief(await response.json());



    } catch (err) {



      setBriefError(err.message);



    } finally {



      setBriefLoading(false);



    }



  }







  async function handleLoadCompetitors() {



    const tickers = brief?.competitors_risks?.competitor_tickers;



    if (!tickers || tickers.length === 0) return;



    setCompetitorsLoading(true);



    setCompetitorsError(null);



    setCompetitors(null);



    try {



      const response = await fetch(`${BACKEND_URL}/api/competitors`, {



        method: "POST",



        headers: { "Content-Type": "application/json" },



        body: JSON.stringify({ tickers }),



      });



      if (!response.ok) {



        const data = await response.json();



        throw new Error(data.detail || t.genericError);



      }



      const data = await response.json();



      setCompetitors(data.competitors);



    } catch (err) {



      setCompetitorsError(err.message);



    } finally {



      setCompetitorsLoading(false);



    }



  }







  const isUp = stock?.change_percent >= 0;



  const rangePct =



    stock?.week52_low != null && stock?.week52_high != null && stock?.current_price != null



      ? Math.min(100, Math.max(0, ((stock.current_price - stock.week52_low) / (stock.week52_high - stock.week52_low)) * 100))



      : null;







  return (



    <div className="min-h-screen bg-butter font-body text-ink">



      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">



        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">



          <div>



            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Stock Researcher</h1>



            <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>



          </div>







          <div className="flex flex-wrap items-center gap-4 self-start">



            {/* Switch de langue */}



            <div className="flex overflow-hidden rounded-full border border-ink/10 bg-butter-card text-sm font-medium shadow-sm">



              <button



                onClick={() => setLang("fr")}



                className={`px-3 py-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-dark ${lang === "fr" ? "bg-sky text-white" : "text-ink-muted"}`}



              >



                FR



              </button>



              <button



                onClick={() => setLang("en")}



                className={`px-3 py-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-dark ${lang === "en" ? "bg-sky text-white" : "text-ink-muted"}`}



              >



                EN



              </button>



            </div>







            <button



              type="button"



              role="switch"



              aria-checked={simpleMode}



              onClick={() => setSimpleMode(!simpleMode)}



              className="flex shrink-0 items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-dark"



            >



              <span className="text-sm font-medium text-ink">{t.simpleMode}</span>



              <span



                className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${



                  simpleMode ? "bg-sky" : "bg-ink/20"



                }`}



              >



                <span



                  className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${



                    simpleMode ? "translate-x-5" : "translate-x-0"



                  }`}



                />



              </span>



            </button>



          </div>



        </header>















        <form onSubmit={handleSearch} className="relative mb-8 flex flex-wrap gap-2 rounded-2xl bg-butter-card p-4 shadow-sm sm:flex-nowrap">



          <div className="relative w-full min-w-0 sm:max-w-xs">



            <label htmlFor="ticker-search" className="sr-only">



              {lang === "fr" ? "Rechercher une entreprise ou un ticker" : "Search for a company or ticker"}



            </label>



            <input



              id="ticker-search"



              name="ticker"



              type="text"



              value={ticker}



              onChange={(e) => setTicker(e.target.value)}



              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}



              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}



              placeholder={t.searchPlaceholder}



              className="w-full rounded-full border border-ink/15 bg-butter-card px-5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/30"



              data-testid="ticker-input"



              autoComplete="off"



            />



            {showSuggestions && suggestions.length > 0 && (



              <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-ink/10 bg-butter-card py-1 shadow-lg">



                {suggestions.map((s) => (



                  <li key={s.ticker}>



                    <button



                      type="button"



                      onMouseDown={() => handleSelectSuggestion(s.ticker)}



                      className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm hover:bg-sky-light"



                    >



                      <span className="truncate">



                        <span className="font-medium text-ink">{s.ticker}</span>{" "}



                        <span className="text-ink-muted">{s.name}</span>



                      </span>



                      {s.exchange && <span className="shrink-0 text-xs text-ink-muted">{s.exchange}</span>}



                    </button>



                  </li>



                ))}



              </ul>



            )}



          </div>



          <button



            type="submit"



            className="w-full rounded-full bg-sky px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-dark disabled:opacity-50 sm:w-auto"



            disabled={loading}



            data-testid="search-button"



          >



            {loading ? t.searching : t.search}



          </button>



        </form>



        {/* Module 3 — Radar, en bannière fine pour ne pas dominer la page */}



        <section className="mb-6 rounded-2xl border border-ink/10 bg-butter-card px-5 py-3 shadow-sm">



          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">



            <RadarIcon size={15} className="shrink-0 text-sky-dark" />



            <span className="font-semibold text-ink">{t.radarLabel}</span>



            {radarLoading && <span className="text-ink-muted">{t.radarScanning}</span>}



            {radarError && <span className="text-fall">{radarError}</span>}



            {radar && (



              <>



                {radar.hits.length === 0 ? (



                  <span className="text-ink-muted">{t.radarNothing(radar.universe_size)}</span>



                ) : (



                  <span className="flex flex-wrap gap-1.5">



                    {radar.hits.map((hit) => (



                      <span key={hit.ticker} className="rounded-full bg-rise/10 px-2.5 py-0.5 text-xs font-medium text-rise">



                        {hit.ticker} · RVOL {formatNum(lang, hit.rvol, 1)}



                      </span>



                    ))}



                  </span>



                )}



                <span className="ml-auto text-xs text-ink-muted">{t.spyLabel(formatPct(lang, radar.spy_1mo_pct))}</span>



              </>



            )}



          </div>



          {radar && <ExplainToggle title={radar.title} explanation={radar.explanation} methodology={radar.methodology} forceOpen={simpleMode} t={t} />}



        </section>







        {error && (



          <p className="mb-6 text-sm text-fall" role="alert">



            {error}



          </p>



        )}







        <AnimatePresence mode="wait">



          {stock && (



            <motion.div



              key={stock.ticker}



              initial={{ opacity: 0, y: 8 }}



              animate={{ opacity: 1, y: 0 }}



              transition={{ duration: 0.35, ease: "easeOut" }}



            >



              {/* Bloc héros : prix (large) + météo + avis analystes, en grille */}



              <div className="grid gap-5 lg:grid-cols-3">



                {/* Carte clé */}



                <section className="rounded-2xl border border-ink/10 bg-butter-card p-6 shadow-sm lg:col-span-2 lg:row-span-2" data-testid="stock-card">



                  <div className="flex flex-wrap items-baseline justify-between gap-2">



                    <div>



                      <h2 className="text-sm font-medium text-ink-muted">



                        {stock.name} · {stock.ticker}



                      </h2>



                      <p className="mt-1 tabular-nums font-display text-4xl font-semibold text-ink">



                        {formatNum(lang, stock.current_price)} <span className="text-lg text-ink-muted">{stock.currency}</span>



                      </p>



                    </div>



                    <span className={`tabular-nums rounded-full px-3 py-1 text-sm font-semibold ${isUp ? "bg-rise/10 text-rise" : "bg-fall/10 text-fall"}`}>



                      {formatPct(lang, stock.change_percent)}



                    </span>



                  </div>







                  {stock.sector && (



                    <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">



                      <SectorIcon sector={stock.sector} />



                      <span>
                        {formatSector(lang, stock.sector)}
                        {lang === "en" && stock.industry ? ` — ${stock.industry}` : ""}
                      </span>



                    </div>



                  )}







                  {rangePct !== null && (



                    <div className="mt-6">



                      <div className="mb-1 flex justify-between text-xs text-ink-muted">



                        <span>{t.weekLow} : {formatNum(lang, stock.week52_low)}</span>



                        <span>{t.weekHigh} : {formatNum(lang, stock.week52_high)}</span>



                      </div>



                      <div className="relative h-1.5 rounded-full bg-sky-light">



                        <div className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-butter-card bg-sky shadow" style={{ left: `${rangePct}%` }} />



                      </div>



                    </div>



                  )}







                  {stock.market_cap && (



                    <div className="mt-6">



                      <div className="mb-1 flex justify-between text-xs text-ink-muted">



                        <span>{t.microCap}</span>



                        <span className="font-medium text-ink">



                          {t.marketCap} : {formatCompact(lang, stock.market_cap)} {stock.currency}



                        </span>



                        <span>{t.megaCap}</span>



                      </div>



                      <div className="relative h-1.5 rounded-full bg-gradient-to-r from-sky-light via-sky/40 to-sky">



                        <div className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-butter-card bg-ink shadow" style={{ left: `${capPercent(stock.market_cap)}%` }} />



                      </div>



                    </div>



                  )}







                  <div className="mt-6 grid grid-cols-1 gap-x-8 sm:grid-cols-2">



                    <MetricLabel label={t.metricLabels.pe} tooltip={t.metricTooltips.pe} value={formatNum(lang, stock.pe_ratio)} simpleMode={simpleMode} isOpen={openMetric === "pe"} onToggle={() => setOpenMetric(openMetric === "pe" ? null : "pe")} />



                    <MetricLabel label={t.metricLabels.forwardPe} tooltip={t.metricTooltips.forwardPe} value={formatNum(lang, stock.forward_pe)} simpleMode={simpleMode} isOpen={openMetric === "forward_pe"} onToggle={() => setOpenMetric(openMetric === "forward_pe" ? null : "forward_pe")} />



                    <MetricLabel label={t.metricLabels.eps} tooltip={t.metricTooltips.eps} value={formatNum(lang, stock.eps)} simpleMode={simpleMode} isOpen={openMetric === "eps"} onToggle={() => setOpenMetric(openMetric === "eps" ? null : "eps")} />



                    <MetricLabel label={t.metricLabels.peg} tooltip={t.metricTooltips.peg} value={formatNum(lang, stock.peg_ratio)} simpleMode={simpleMode} isOpen={openMetric === "peg"} onToggle={() => setOpenMetric(openMetric === "peg" ? null : "peg")} />



                    <MetricLabel label={t.metricLabels.margin} tooltip={t.metricTooltips.margin} value={stock.profit_margin != null ? formatPct(lang, stock.profit_margin * 100) : null} simpleMode={simpleMode} isOpen={openMetric === "margin"} onToggle={() => setOpenMetric(openMetric === "margin" ? null : "margin")} />



                    <MetricLabel label={t.metricLabels.beta} tooltip={t.metricTooltips.beta} value={formatNum(lang, stock.beta ?? expReturns?.beta)} simpleMode={simpleMode} isOpen={openMetric === "beta"} onToggle={() => setOpenMetric(openMetric === "beta" ? null : "beta")} />



                    <MetricLabel label={t.metricLabels.debt} tooltip={t.metricTooltips.debt} value={formatNum(lang, stock.debt_to_equity)} simpleMode={simpleMode} isOpen={openMetric === "debt"} onToggle={() => setOpenMetric(openMetric === "debt" ? null : "debt")} />



                    <MetricLabel label={t.metricLabels.dividend} tooltip={t.metricTooltips.dividend} value={stock.dividend_yield != null ? formatPct(lang, stock.dividend_yield) : null} simpleMode={simpleMode} isOpen={openMetric === "dividend"} onToggle={() => setOpenMetric(openMetric === "dividend" ? null : "dividend")} />



                  </div>



                </section>







                {/* Module 1 — La météo de l'action */}



                <section className="rounded-2xl border border-ink/10 bg-butter-card p-6 shadow-sm lg:col-span-1">



                  <h3 className="mb-1 text-sm font-semibold text-ink">{t.trendDynamics}</h3>



                  {regimeLoading && <p className="text-sm text-ink-muted">{t.analyzingRegime}</p>}



                  {regimeError && <p className="text-sm text-fall">{regimeError}</p>}



                  {regime && (



                    <>



                      <RegimeGauge percentage={regime.bull_probability} />



                      <div className="-mt-2 flex flex-col items-center">



                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${SIGNAL_STYLES[regime.signal]}`}>



                          {regime.signal_label}



                        </span>



                        <span className="mt-1 text-xs text-ink-muted">



                          {formatNum(lang, regime.bull_probability, 1)} {t.bullRegimeSuffix}
                          <small className="mt-2 block max-w-xs text-center text-[11px] leading-relaxed text-ink-muted/80">
                            {lang === "fr"
                              ? "Ce résultat décrit la dernière journée analysée ; il ne prédit pas la prochaine variation."
                              : "This result describes the latest analyzed day; it does not predict the next price move."}
                          </small>



                        </span>



                      </div>



                      <ExplainToggle title={regime.title} explanation={regime.explanation} methodology={regime.methodology} forceOpen={simpleMode} t={t} />



                    </>



                  )}



                </section>







                {/* Avis des analystes — juste sous la jauge, même colonne */}



                <section className="rounded-2xl border border-ink/10 bg-butter-card p-6 shadow-sm lg:col-span-1" data-testid="analyst-ratings">



                  <h3 className="mb-3 text-sm font-semibold text-ink">{t.analystRatings}</h3>



                  {stock.analyst_buy_count == null && stock.analyst_hold_count == null && stock.analyst_sell_count == null ? (



                    <p className="text-sm text-ink-muted">{t.noAnalystCoverage}</p>



                  ) : (



                    (() => {



                      const buy = stock.analyst_buy_count ?? 0;



                      const hold = stock.analyst_hold_count ?? 0;



                      const sell = stock.analyst_sell_count ?? 0;



                      const total = buy + hold + sell || 1;



                      return (



                        <>



                          <div className="flex h-2.5 overflow-hidden rounded-full bg-ink/5">



                            <div className="bg-rise" style={{ width: `${(buy / total) * 100}%` }} />



                            <div className="bg-ink/25" style={{ width: `${(hold / total) * 100}%` }} />



                            <div className="bg-fall" style={{ width: `${(sell / total) * 100}%` }} />



                          </div>



                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">



                            <span className="font-medium text-rise">{t.ratingBuy} : {buy}</span>



                            <span className="font-medium text-ink-muted">{t.ratingHold} : {hold}</span>



                            <span className="font-medium text-fall">{t.ratingSell} : {sell}</span>



                          </div>



                          {stock.target_mean_price && (



                            <p className="mt-2 text-sm text-ink-muted">



                              {t.avgTarget} <span className="font-medium text-ink">{formatNum(lang, stock.target_mean_price)} {stock.currency}</span>



                            </p>



                          )}



                        </>



                      );



                    })()



                  )}



                </section>



              </div>







              {/* Module 2 — La prime de risque (CAPM) */}



              <section className="mt-6 rounded-2xl border border-ink/10 bg-butter-card p-6 shadow-sm">



                <h3 className="mb-4 text-sm font-semibold text-ink">{t.capmTitle}</h3>



                {expReturnsLoading && <p className="text-sm text-ink-muted">{t.computingCapm}</p>}



                {expReturnsError && <p className="text-sm text-fall">{expReturnsError}</p>}



                {expReturns && (



                  <>



                    {/* Le CAPM et les objectifs d'analystes sont deux informations différentes. */}


                    <div className="rounded-xl border border-sky/20 bg-sky/5 p-4">


                      <p className="text-xs font-semibold text-sky-dark">


                        {lang === "fr" ? "Calcul théorique CAPM" : "Theoretical CAPM calculation"}


                      </p>


                      <p className="mt-1 tabular-nums font-display text-2xl font-semibold text-ink">


                        {formatPct(lang, expReturns.capm_expected_return_pct)}


                      </p>


                      <p className="mt-1 text-xs leading-relaxed text-ink-muted">


                        {lang === "fr"


                          ? "Résultat d'un modèle de risque, pas une prévision de gain."


                          : "Result of a risk model, not a forecast of profit."}


                      </p>


                    </div>





                    {expReturns.scenario_bearish.target_price != null ||
                    expReturns.scenario_bullish.target_price != null ? (
                      <div className="mt-5">
                        <h4 className="mb-2 text-sm font-semibold text-ink">
                          {lang === "fr" ? "Objectifs de cours des analystes" : "Analyst price targets"}
                        </h4>
                        <p className="mb-3 text-xs leading-relaxed text-ink-muted">
                          {lang === "fr"
                            ? "Écarts entre le cours actuel et les objectifs publiés ; ce ne sont pas des gains garantis."
                            : "Differences between the current price and published targets; these are not guaranteed returns."}
                        </p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {expReturns.scenario_bearish.target_price != null && (
                            <div className="rounded-xl bg-ink/5 p-3">
                              <p className="text-xs text-ink-muted">
                                {lang === "fr" ? "Objectif bas" : "Low target"}
                              </p>
                              <p className="mt-1 tabular-nums font-display text-xl font-semibold text-ink">
                                {formatPct(lang, expReturns.scenario_bearish.gain_pct)}
                              </p>
                              <p className="text-xs text-ink-muted">
                                {formatNum(lang, expReturns.scenario_bearish.target_price)} {stock.currency}
                              </p>
                            </div>
                          )}

                          {expReturns.scenario_bullish.target_price != null && (
                            <div className="rounded-xl bg-ink/5 p-3">
                              <p className="text-xs text-ink-muted">
                                {lang === "fr" ? "Objectif haut" : "High target"}
                              </p>
                              <p className="mt-1 tabular-nums font-display text-xl font-semibold text-ink">
                                {formatPct(lang, expReturns.scenario_bullish.gain_pct)}
                              </p>
                              <p className="text-xs text-ink-muted">
                                {formatNum(lang, expReturns.scenario_bullish.target_price)} {stock.currency}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-xl bg-ink/5 p-4">
                        <h4 className="text-sm font-semibold text-ink">
                          {lang === "fr" ? "Objectifs de cours des analystes" : "Analyst price targets"}
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                          {lang === "fr"
                            ? "Les objectifs de cours des analystes sont indisponibles pour cette action auprès de la source actuelle."
                            : "Analyst price targets are unavailable for this stock from the current data source."}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 rounded-lg bg-ink/5 p-3 text-xs text-ink-muted">



                      {t.capmBubble(



                        formatNum(lang, expReturns.risk_free_rate_pct, 2),



                        formatNum(lang, expReturns.erp_pct, 1),



                        formatNum(lang, expReturns.beta, 2)



                      )}



                    </div>







                    {expReturns.scenario_base.target_price && (



                      <p className="mt-3 text-sm text-ink-muted">



                        {t.analystTargetSentence(



                          expReturns.analyst_count,



                          formatNum(lang, expReturns.scenario_base.target_price),



                          stock.currency,



                          formatPct(lang, expReturns.scenario_base.gain_pct)



                        )}



                      </p>



                    )}







                    <ExplainToggle title={expReturns.title} explanation={expReturns.explanation} methodology={expReturns.methodology} forceOpen={simpleMode} t={t} />



                  </>



                )}



              </section>







              {/* Graphique du prix sur 1 an */}



              {stock.price_history && stock.price_history.length > 0 && (



                <section className="mt-6 rounded-2xl border border-ink/10 bg-butter-card p-6 shadow-sm" data-testid="price-chart">



                  <h3 className="mb-4 text-sm font-semibold text-ink">{t.priceChartTitle}</h3>



                  <ResponsiveContainer width="100%" height={240}>



                    <AreaChart data={stock.price_history}>



                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B6459", fontFamily: "Manrope" }} interval={Math.floor(stock.price_history.length / 6)} axisLine={{ stroke: "#2B262015" }} tickLine={false} />



                      <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#6B6459", fontFamily: "Manrope" }} axisLine={false} tickLine={false} />



                      <RechartsTooltip contentStyle={{ fontFamily: "Manrope", fontSize: 12, borderRadius: 8, border: "1px solid #2B262015" }} />



                      <Area type="monotone" dataKey="close" stroke="#2F9BD6" fill="#2F9BD6" fillOpacity={0.15} strokeWidth={2} />



                    </AreaChart>



                  </ResponsiveContainer>



                </section>



              )}







              {/* Brief IA */}



              <section className="mt-6">



                <motion.button



                  whileTap={{ scale: 0.97 }}



                  onClick={handleGenerateBrief}



                  disabled={briefLoading}



                  className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-butter-card transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50"



                  data-testid="generate-brief-button"



                >



                  {briefLoading ? t.generatingBrief : t.generateBrief}



                </motion.button>







                <p className="mt-2 max-w-xl text-xs leading-relaxed text-ink-muted">
                  {t.briefNotice}
                </p>

                {briefError && <p className="mt-2 text-sm text-fall" role="alert">{briefError}</p>}







                <AnimatePresence>



                  {brief && (



                    <motion.div



                      initial={{ opacity: 0, y: 8 }}



                      animate={{ opacity: 1, y: 0 }}



                      transition={{ duration: 0.3 }}



                      className="mt-4 grid gap-4 md:grid-cols-3"



                      data-testid="brief-cards"



                    >



                      <div className="rounded-2xl border-t-4 border-t-sky bg-butter-card p-4 shadow-sm">



                        <h4 className="mb-2 text-sm font-semibold text-ink">{t.briefCard1}</h4>



                        <p className="mb-2 text-sm text-ink-muted">{brief.context_catalysts?.business_model}</p>



                        <p className="text-sm text-ink-muted">{brief.context_catalysts?.catalysts_12m}</p>



                      </div>



                      <div className="rounded-2xl border-t-4 border-t-ink bg-butter-card p-4 shadow-sm">



                        <h4 className="mb-2 text-sm font-semibold text-ink">{t.briefCard2}</h4>



                        <p className="mb-2 text-sm font-medium text-sky-dark">{brief.valuation_growth?.verdict}</p>



                        <p className="text-sm text-ink-muted">{brief.valuation_growth?.explanation}</p>



                      </div>



                      <div className="rounded-2xl border-t-4 border-t-fall bg-butter-card p-4 shadow-sm">



                        <h4 className="mb-2 text-sm font-semibold text-ink">{t.briefCard3}</h4>



                        <p className="mb-2 text-sm text-ink-muted">{brief.competitors_risks?.risks}</p>



                        <p className="mb-3 text-sm italic text-ink-muted">{brief.competitors_risks?.moat_note}</p>



                        <button



                          onClick={handleLoadCompetitors}



                          disabled={competitorsLoading}



                          className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-ink hover:text-butter-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50"



                          data-testid="load-competitors-button"



                        >



                          {competitorsLoading ? t.loadingCompetitors : t.compareCompetitors}



                        </button>



                        {competitorsError && <p className="mt-2 text-xs text-fall">{competitorsError}</p>}



                      </div>



                    </motion.div>



                  )}



                </AnimatePresence>







                <AnimatePresence>



                  {competitors && (



                    <motion.div



                      initial={{ opacity: 0, y: 8 }}



                      animate={{ opacity: 1, y: 0 }}



                      className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-butter-card p-4 shadow-sm"



                      data-testid="competitors-table"



                    >



                      <table className="w-full text-left text-sm tabular-nums">



                        <thead>



                          <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-muted">



                            <th className="py-2 pr-4 font-medium">{t.tableCompany}</th>



                            <th className="py-2 pr-4 font-medium">{t.tablePrice}</th>



                            <th className="py-2 pr-4 font-medium">{t.tableMarketCap}</th>



                            <th className="py-2 pr-4 font-medium">{t.tablePe}</th>



                            <th className="py-2 pr-4 font-medium">{t.tableEps}</th>



                            <th className="py-2 pr-4 font-medium">{t.tableRevGrowth}</th>



                            <th className="py-2 pr-4 font-medium">{t.tableMargin}</th>



                          </tr>



                        </thead>



                        <tbody>



                          {competitors.map((c) => (



                            <tr key={c.ticker} className="border-b border-ink/5 last:border-0">



                              {c.error ? (



                                <td colSpan={7} className="py-2 text-ink-muted">{c.ticker} — {c.error}</td>



                              ) : (



                                <>



                                  <td className="py-2 pr-4">{c.name} ({c.ticker})</td>



                                  <td className="py-2 pr-4">{formatNum(lang, c.price)} {c.currency}</td>



                                  <td className="py-2 pr-4">{formatCompact(lang, c.market_cap)}</td>



                                  <td className="py-2 pr-4">{formatNum(lang, c.pe_ratio)}</td>



                                  <td className="py-2 pr-4">{formatNum(lang, c.eps)}</td>



                                  <td className="py-2 pr-4">{c.revenue_growth != null ? formatPct(lang, c.revenue_growth * 100) : "N/A"}</td>



                                  <td className="py-2 pr-4">{c.profit_margin != null ? formatPct(lang, c.profit_margin * 100) : "N/A"}</td>



                                </>



                              )}



                            </tr>



                          ))}



                        </tbody>



                      </table>



                    </motion.div>



                  )}



                </AnimatePresence>



              </section>



            </motion.div>



          )}



        </AnimatePresence>







        <footer className="mt-10 border-t border-ink/10 pt-6 text-center text-xs text-ink-muted">



          {t.footer}



        </footer>



      </div>



    </div>



  );



}







export default App;
