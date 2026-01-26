import { useState, useEffect } from 'react';
import { X, Activity, CheckCircle, AlertOctagon, TrendingUp, Sparkles, Zap } from 'lucide-react';
import { predictChurn } from '../services/api';

const PredictionModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        gender: 'Male',
        seniorcitizen: 0,
        partner: 'No',
        dependents: 'No',
        tenure: 12,
        phoneservice: 'No',
        multiplelines: 'No phone service',
        internetservice: 'Fiber optic',
        onlinesecurity: 'No',
        onlinebackup: 'No',
        deviceprotection: 'No',
        techsupport: 'No',
        streamingtv: 'No',
        streamingmovies: 'No',
        contract: 'Month-to-month',
        paperlessbilling: 'Yes',
        paymentmethod: 'Electronic check',
        monthlycharges: 70.00,
        totalcharges: 840.00
    });

    const [result, setResult] = useState(null);
    const [originalResult, setOriginalResult] = useState(null); // Storage for the baseline
    const [isSimulating, setIsSimulating] = useState(false);
    const [aiPlan, setAiPlan] = useState(null); // Store AI suggestions
    const [loading, setLoading] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setResult(null);
            setOriginalResult(null);
            setIsSimulating(false);
            setAiPlan(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValue = name === 'seniorcitizen' || name === 'tenure' ? parseInt(value) || 0 :
            name.includes('charges') ? parseFloat(value) || 0 : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Real-time Simulation Update
        if (isSimulating) {
            // Debounce could be added here perfectly for production, 
            // but for now we'll just trigger it.
            runSimulation({ ...formData, [name]: newValue });
        }
    };

    const runSimulation = async (simulatedData) => {
        try {
            const data = await predictChurn(simulatedData);
            setResult(data);
        } catch (err) {
            console.error("Simulation failed:", err);
        }
    };

    // --- AI LOGIC ENGINE ---
    const generateAiPlan = async () => {
        setLoading(true);

        // 1. Analyze Current State & Heuristics
        const suggestions = [];
        let newFormData = { ...formData };

        if (formData.contract === "Month-to-month") {
            newFormData.contract = "One year";
            suggestions.push({
                id: 1,
                icon: <Activity className="w-4 h-4" />,
                title: "Upgrade Contract",
                desc: "Moving to a 1-year commit significantly stabilizes risk."
            });
        }

        if (formData.techsupport === "No" || formData.onlinesecurity === "No") {
            newFormData.techsupport = "Yes";
            newFormData.onlinesecurity = "Yes";
            suggestions.push({
                id: 2,
                icon: <Zap className="w-4 h-4" />,
                title: "Bundle Support Services",
                desc: "Adding Tech Support & Security increases stickiness."
            });
        }

        if (formData.monthlycharges > 80) {
            newFormData.monthlycharges = (formData.monthlycharges * 0.85).toFixed(2); // 15% discount
            suggestions.push({
                id: 3,
                icon: <TrendingUp className="w-4 h-4" />,
                title: "Loyalty Discount",
                desc: "Apply a 15% discount to mitigate high billing sensitivity."
            });
        }

        // Slight artificial delay to make it feel like "thinking"
        await new Promise(r => setTimeout(r, 800));

        // 2. Apply & Run
        setFormData(newFormData);
        setAiPlan(suggestions);
        setIsSimulating(true);
        runSimulation(newFormData);
        setLoading(false);
    };


    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setOriginalResult(null);
        setAiPlan(null);

        try {
            const data = await predictChurn(formData);
            setResult(data);
            setOriginalResult(data); // Save baseline
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Helper for simulation toggles
    const Toggle = ({ label, name, value, current }) => (
        <button
            onClick={() => {
                const newVal = current === value ? 'No' : value;
                handleChange({ target: { name, value: newVal } });
            }}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${current === value
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
        >
            {label}
        </button>
    );

    // UI Helpers
    const Label = ({ children }) => (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {children}
        </label>
    );

    const Select = ({ name, options, value }) => (
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={handleChange}
                className="w-full bg-slate-800 border-2 border-slate-700 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-indigo-500 transition-colors font-medium"
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt === 0 ? 'No' : opt === 1 ? 'Yes' : opt}</option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="text-indigo-500" />
                            {isSimulating ? "Strategy Simulator" : result ? "Prediction Result" : `Step ${step} of 3: ${step === 1 ? "Customer Profile" : step === 2 ? "Services" : "Billing"}`}
                        </h2>
                        {!result && <div className="h-1 w-32 bg-slate-800 mt-2 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }}></div>
                        </div>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {result ? (
                        isSimulating ? (
                            // --- SIMULATOR VIEW ---
                            <div className="animate-in slide-in-from-right duration-300">
                                <div className="grid grid-cols-2 gap-8">
                                    {/* CONTROLS */}
                                    <div className="space-y-6">
                                        <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Adjust Strategy</h3>

                                        {/* AI SUGGESTIONS DISPLAY */}
                                        {aiPlan && (
                                            <div className="mb-6 space-y-3">
                                                <div className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center gap-1 uppercase tracking-wider">
                                                    <Sparkles className="w-3 h-3 text-indigo-400" />
                                                    Active AI Interventions
                                                </div>
                                                {aiPlan.map(item => (
                                                    <div key={item.id} className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-3 rounded-xl flex gap-3 items-start">
                                                        <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400 mt-0.5">
                                                            {item.icon}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-indigo-100">{item.title}</div>
                                                            <div className="text-xs text-indigo-200/70 leading-relaxed">{item.desc}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div>
                                            <Label>Update Contract</Label>
                                            <div className="flex flex-col gap-2">
                                                {['Month-to-month', 'One year', 'Two year'].map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => handleChange({ target: { name: 'contract', value: opt } })}
                                                        className={`p-3 rounded-xl border text-sm font-medium transition-all text-left flex justify-between items-center ${formData.contract === opt
                                                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                                            }`}
                                                    >
                                                        {opt}
                                                        {formData.contract === opt && <CheckCircle className="w-4 h-4 text-indigo-400" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Offer Discount (Monthly Bill)</Label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="20"
                                                    max="150"
                                                    step="5"
                                                    name="monthlycharges"
                                                    value={formData.monthlycharges}
                                                    onChange={handleChange}
                                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                />
                                                <span className="font-mono text-white font-bold w-16 text-right">${formData.monthlycharges}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Add-on Services</Label>
                                            <div className="flex flex-wrap gap-2">
                                                <Toggle label="+ Tech Support" name="techsupport" value="Yes" current={formData.techsupport} />
                                                <Toggle label="+ Online Security" name="onlinesecurity" value="Yes" current={formData.onlinesecurity} />
                                                <Toggle label="+ Backup" name="onlinebackup" value="Yes" current={formData.onlinebackup} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* RESULTS COMPARISON */}
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                                        <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-8"> Projected Impact</h3>

                                        {/* Original Score Ghost */}
                                        <div className="absolute top-4 right-4 text-right opacity-50">
                                            <div className="text-xs text-slate-400 uppercase">Original</div>
                                            <div className={`text-lg font-bold ${originalResult.churn_prediction === 1 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {originalResult.risk_score}%
                                            </div>
                                        </div>

                                        {/* New Score */}
                                        <div className="relative w-40 h-40 mb-6 transition-all duration-500">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="80" cy="80" r="70" strokeWidth="10" stroke="#1e293b" fill="transparent" />
                                                <circle cx="80" cy="80" r="70" strokeWidth="10" stroke="currentColor" fill="transparent"
                                                    strokeDasharray={2 * Math.PI * 70}
                                                    strokeDashoffset={2 * Math.PI * 70 - (2 * Math.PI * 70 * result.risk_score) / 100}
                                                    strokeLinecap="round"
                                                    className={`transition-all duration-700 ease-out ${result.risk_score > 50 ? 'text-rose-500' : 'text-emerald-500'}`}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-4xl font-bold ${result.risk_score > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {result.risk_score}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Delta Badge */}
                                        {result.risk_score !== originalResult.risk_score && (
                                            <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 mb-4 ${result.risk_score < originalResult.risk_score
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-rose-500/20 text-rose-400'
                                                }`}>
                                                {result.risk_score < originalResult.risk_score ? (
                                                    <TrendingUp className="w-4 h-4 transform rotate-180" /> // Down arrow hack
                                                ) : (
                                                    <TrendingUp className="w-4 h-4" />
                                                )}
                                                {Math.abs(originalResult.risk_score - result.risk_score).toFixed(1)}% Change
                                            </div>
                                        )}

                                        <p className="text-center text-sm text-slate-400 px-4">
                                            {result.risk_score < 40
                                                ? "Great! This strategy effectively retains the customer."
                                                : "Risk is still high. Try longer contracts or lower bills."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800">
                                    <button
                                        onClick={() => {
                                            setIsSimulating(false);
                                            setAiPlan(null);
                                            // Optional: Reset form to original values if cancelled?
                                            // For now we keep edits as "Proposed Strategy"
                                        }}
                                        className="text-slate-400 hover:text-white font-medium px-4"
                                    >
                                        Cancel Simulation
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Commit Strategy
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // --- NORMAL RESULT VIEW ---
                            <div className="flex flex-col items-center py-6 animate-in fade-in zoom-in duration-300">
                                {/* Diagnosis Badge */}
                                <div className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wider mb-8 uppercase flex items-center gap-2 ${result.churn_prediction === 1
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                    {result.churn_prediction === 1 ? <AlertOctagon className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    {result.churn_prediction === 1 ? 'High Risk Assessment' : 'Safe Assessment'}
                                </div>

                                {/* Main Score Display */}
                                <div className="relative w-48 h-48 mb-8 group">
                                    {/* SVG Gauge */}
                                    <div className="absolute inset-0 rounded-full bg-slate-800/50 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                    <svg className="w-full h-full transform -rotate-90 relative z-10">
                                        <circle cx="96" cy="96" r="88" strokeWidth="12" stroke="currentColor" fill="transparent" className="text-slate-800" />
                                        <circle cx="96" cy="96" r="88" strokeWidth="12" stroke="currentColor" fill="transparent"
                                            strokeDasharray={2 * Math.PI * 88}
                                            strokeDashoffset={2 * Math.PI * 88 - (2 * Math.PI * 88 * result.risk_score) / 100}
                                            strokeLinecap="round"
                                            className={`transition-all duration-1000 ease-out ${result.churn_prediction === 1 ? 'text-rose-500' : 'text-emerald-500'}`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                        <span className="text-5xl font-bold text-white tracking-tight">{result.risk_score}%</span>
                                        <span className="text-xs text-slate-400 uppercase tracking-widest mt-2 font-medium">Churn Risk</span>
                                    </div>
                                </div>

                                {/* Headline */}
                                <h3 className="text-2xl font-bold text-white mb-2 text-center">
                                    {result.churn_prediction === 1
                                        ? 'Customer Likely to Churn'
                                        : 'Customer Likely to Stay'}
                                </h3>
                                <p className="text-slate-400 text-center mb-8 max-w-sm">
                                    Based on the profile data, this customer has a <strong className="text-white">{result.risk_level || (result.risk_score > 50 ? 'High' : 'Low')}</strong> probability of leaving.
                                </p>

                                {/* Key Factors Grid */}
                                <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-8">
                                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">Contract</div>
                                        <div className="text-white font-medium truncate">{formData.contract}</div>
                                    </div>
                                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">Tenure</div>
                                        <div className="text-white font-medium">{formData.tenure} Months</div>
                                    </div>
                                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">Monthly Bill</div>
                                        <div className="text-white font-medium">${formData.monthlycharges}</div>
                                    </div>
                                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">Internet</div>
                                        <div className="text-white font-medium">{formData.internetservice}</div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 w-full max-w-md">
                                    {/* SIMULATOR BUTTONS */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsSimulating(true)}
                                            className="flex-1 px-4 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700 flex flex-col items-center justify-center gap-1 group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                                Manual Sim
                                            </div>
                                        </button>

                                        <button
                                            onClick={generateAiPlan}
                                            disabled={loading}
                                            className="flex-[2] px-4 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden"
                                        >
                                            {loading ? (
                                                <Activity className="animate-spin w-5 h-5" />
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-yellow-300" />
                                                        Generate AI Plan
                                                    </div>
                                                    <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest text-indigo-100">Auto-Optimization</div>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex justify-center text-slate-500 text-sm font-medium hover:text-white cursor-pointer transition-colors pt-2" onClick={onClose}>
                                        Dismiss Result
                                    </div>
                                </div>
                            </div>
                    )
                    ) : (
                    <div className="space-y-6">

                        {/* Step 1: Profile */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div>
                                    <Label>Gender</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Male', 'Female'].map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, gender: g })}
                                                className={`p-4 rounded-xl border-2 font-medium transition-all ${formData.gender === g ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <Label>Senior Citizen?</Label>
                                        <Select name="seniorcitizen" value={formData.seniorcitizen} options={[0, 1]} />
                                    </div>
                                    <div>
                                        <Label>Have a Partner?</Label>
                                        <Select name="partner" value={formData.partner} options={['Yes', 'No']} />
                                    </div>
                                    <div>
                                        <Label>Have Dependents?</Label>
                                        <Select name="dependents" value={formData.dependents} options={['Yes', 'No']} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Services */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div>
                                    <Label>Tenure (Months as customer)</Label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="72"
                                        name="tenure"
                                        value={formData.tenure}
                                        onChange={handleChange}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                                        <span>1 month</span>
                                        <span className="text-indigo-400 font-bold text-base">{formData.tenure} months</span>
                                        <span>72 months</span>
                                    </div>
                                </div>

                                <div>
                                    <Label>Internet Service Type</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['DSL', 'Fiber optic', 'No'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, internetservice: type })}
                                                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${formData.internetservice === type ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Phone Service?</Label>
                                        <Select name="phoneservice" value={formData.phoneservice} options={['Yes', 'No']} />
                                    </div>
                                    <div>
                                        <Label>Online Security?</Label>
                                        <Select name="onlinesecurity" value={formData.onlinesecurity} options={['Yes', 'No']} />
                                    </div>
                                    <div>
                                        <Label>Tech Support?</Label>
                                        <Select name="techsupport" value={formData.techsupport} options={['Yes', 'No']} />
                                    </div>
                                    <div>
                                        <Label>Streaming Movies?</Label>
                                        <Select name="streamingmovies" value={formData.streamingmovies} options={['Yes', 'No']} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Billing */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div>
                                    <Label>Contract Type</Label>
                                    <Select name="contract" value={formData.contract} options={['Month-to-month', 'One year', 'Two year']} />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <Label>Monthly Bill ($)</Label>
                                        <input
                                            type="number"
                                            name="monthlycharges"
                                            value={formData.monthlycharges}
                                            onChange={handleChange}
                                            className="w-full bg-slate-800 border-2 border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <Label>Total Lifetime ($)</Label>
                                        <input
                                            type="number"
                                            name="totalcharges"
                                            value={formData.totalcharges}
                                            onChange={handleChange}
                                            className="w-full bg-slate-800 border-2 border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Paperless Billing</Label>
                                    <div className="flex gap-4">
                                        {['Yes', 'No'].map(opt => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, paperlessbilling: opt })}
                                                className={`flex-1 p-3 rounded-xl border-2 font-medium transition-all ${formData.paperlessbilling === opt ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label>Payment Method</Label>
                                    <Select name="paymentmethod" value={formData.paymentmethod} options={['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)']} />
                                </div>
                            </div>
                        )}

                        {/* Footer Navigation */}
                        <div className="flex justify-between items-center pt-6 border-t border-slate-800 mt-2">
                            {step > 1 ? (
                                <button type="button" onClick={handleBack} className="text-slate-400 hover:text-white font-medium px-4">
                                    Back
                                </button>
                            ) : (
                                <div></div>
                            )}

                            {step < 3 ? (
                                <button type="button" onClick={handleNext} className="bg-white text-slate-900 hover:bg-slate-200 px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-white/10">
                                    Next Step
                                </button>
                            ) : (
                                <button type="button" onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2">
                                    {loading ? <Activity className="animate-spin w-5 h-5" /> : 'Run Prediction'}
                                </button>
                            )}
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictionModal;
