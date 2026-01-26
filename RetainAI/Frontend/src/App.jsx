import { useState, useEffect } from 'react';
import { getStats, getFeatureImportance, getHistory, exportHistory } from './services/api';
import { Activity, Users, AlertTriangle, TrendingUp, RotateCcw, Download, ListFilter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PredictionModal from './components/PredictionModal';

function App() {
  const [stats, setStats] = useState(null);
  const [features, setFeatures] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    contract: 'All',
    internet_service: 'All',
    senior_citizen: -1 // -1 for All, 0 for No, 1 for Yes
  });

  const loadData = async () => {
    setLoading(true);

    // Fetch Stats with Filters
    try {
      const statsData = await getStats(filters);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }

    // Fetch Features
    try {
      const featuresData = await getFeatureImportance();
      setFeatures(featuresData);
    } catch (error) {
      console.error("Failed to load features:", error);
    }

    // Fetch History
    try {
      const historyData = await getHistory(currentPage);
      setHistory(historyData.items || []);
      setTotalPages(historyData.pages || 1);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload when filters or page changes
  useEffect(() => {
    loadData();
  }, [filters, currentPage]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                RetainAI
              </span>
            </div>
            <div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
              >
                New Prediction
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-in slide-in-from-top-4 fade-in duration-700">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
            <p className="text-slate-400">Monitor customer retention and risk metrics in real-time.</p>
          </div>

          <div className="flex flex-wrap gap-3 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center px-3 text-slate-400 border-r border-slate-700">
              <ListFilter className="w-5 h-5" />
            </div>

            <select
              value={filters.contract}
              onChange={(e) => handleFilterChange('contract', e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <option value="All">All Contracts</option>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>

            <select
              value={filters.internet_service}
              onChange={(e) => handleFilterChange('internet_service', e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <option value="All">All Internet Types</option>
              <option value="Fiber optic">Fiber Optic</option>
              <option value="DSL">DSL</option>
              <option value="No">No Internet</option>
            </select>

            <select
              value={filters.senior_citizen}
              onChange={(e) => handleFilterChange('senior_citizen', parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <option value={-1}>All Demographics</option>
              <option value={1}>Senior Citizens</option>
              <option value={0}>Non-Seniors</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Total Customers */}
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-24 h-24 text-indigo-500" />
            </div>
            <div className="relative z-10">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Total Customers</p>
              <h3 className="text-4xl font-bold text-white">
                {loading ? "..." : stats?.total_customers?.toLocaleString() || "0"}
              </h3>
              <div className="mt-4 flex items-center text-emerald-400 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Active Database</span>
              </div>
            </div>
          </div>

          {/* Churn Rate */}
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl relative overflow-hidden group hover:border-rose-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-24 h-24 text-rose-500" />
            </div>
            <div className="relative z-10">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Churn Rate</p>
              <h3 className="text-4xl font-bold text-white">
                {loading ? "..." : stats?.churn_rate || "0%"}
              </h3>
              <div className="mt-4 flex items-center text-rose-400 text-sm">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span>Critical Metric</span>
              </div>
            </div>
          </div>

          {/* Revenue at Risk */}
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle className="w-24 h-24 text-amber-500" />
            </div>
            <div className="relative z-10">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Revenue at Risk</p>
              <h3 className="text-4xl font-bold text-white">
                {loading ? "..." : stats?.revenue_at_risk || "$0.00"}
              </h3>
              <div className="mt-4 flex items-center text-amber-400 text-sm">
                <span>Potential Monthly Loss</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Placeholder */}
        {/* Analytics Chart */}
        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Chart */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 p-8 rounded-3xl backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-white">Retention Performance</h2>
                <p className="text-slate-400 text-sm">Churn distribution across contract types</p>
              </div>
              <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
                <div className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-md shadow-sm">Chart</div>
              </div>
            </div>

            <div className="h-[400px] w-full">
              {stats?.chart_data ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.chart_data}
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                    barGap={8}
                  >
                    <defs>
                      <linearGradient id="colorRetained" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="colorChurned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8' }}
                      axisLine={{ stroke: '#475569' }}
                      tickMargin={10}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        borderColor: '#475569',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: '#f8fafc'
                      }}
                      itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                    <Bar dataKey="Retained" fill="url(#colorRetained)" radius={[6, 6, 6, 6]} barSize={40} animationDuration={1500} />
                    <Bar dataKey="Churned" fill="url(#colorChurned)" radius={[6, 6, 6, 6]} barSize={40} animationDuration={1500} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500 flex-col gap-4">
                  <Activity className="w-10 h-10 animate-bounce opacity-25" />
                  <span>Analyzing data patterns...</span>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6 flex flex-col">
            {/* Risk Factors */}
            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl backdrop-blur-sm flex-1 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
              <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Key Risk Indicators
              </h3>

              <div className="space-y-5 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                {features ? (
                  features.map((item, index) => (
                    <div key={index} className="group">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                          {item.feature}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {(item.importance * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full relative group-hover:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500"
                          style={{ width: `${item.importance * 100 * 2}%` }} // Simplified visual scaling
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-center py-10">Loading risk factors...</div>
                )}
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-500">
              <div className="relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-2">Optimize Retention</h3>
                <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                  Start a new prediction analysis to identify high-risk customers before they churn.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-white text-indigo-700 px-4 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Start Analysis
                </button>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>

        {/* Recent History Table */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Recent Predictions</h2>
              <p className="text-sm text-slate-400">Log of all analyzed customer profiles</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportHistory}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-white rounded-lg text-sm font-medium transition-all hover:shadow-lg"
                title="Export to CSV"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={loadData}
                className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-600"
                title="Refresh History"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900/50 uppercase tracking-wider font-bold text-xs">
                <tr>
                  <th className="px-6 py-4 text-slate-500">Timestamp</th>
                  <th className="px-6 py-4 text-slate-500">Customer Profile</th>
                  <th className="px-6 py-4 text-slate-500">Tenure</th>
                  <th className="px-6 py-4 text-slate-500">Monthly Bill</th>
                  <th className="px-6 py-4 text-slate-500">Prediction</th>
                  <th className="px-6 py-4 text-slate-500 w-48">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {history && history.length > 0 ? (
                  history.map((item) => {
                    const [contract, internet] = item.customer.split(' - ');
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs opacity-70">
                          {item.date}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-white font-semibold">{contract}</span>
                            <span className="text-xs text-slate-500">{internet} Internet</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-300">{item.tenure}</span> <span className="text-xs text-slate-500">months</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-300">
                          ${item.monthly_charges}
                        </td>
                        <td className="px-6 py-4">
                          {item.prediction === 1 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:bg-rose-500/20 transition-all">
                              <AlertTriangle className="w-3 h-3" />
                              Churn
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                              <Activity className="w-3 h-3" />
                              Retain
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${item.risk_score > 70 ? 'bg-rose-500' : (item.risk_score > 40 ? 'bg-amber-400' : 'bg-emerald-500')}`}
                                style={{ width: `${item.risk_score}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs font-bold w-9 text-right ${item.risk_score > 70 ? 'text-rose-400' : (item.risk_score > 40 ? 'text-amber-400' : 'text-emerald-400')}`}>
                              {item.risk_score}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Users className="w-12 h-12 text-slate-700" />
                        <p>No stored predictions yet.</p>
                        <button onClick={() => setIsModalOpen(true)} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">Run your first analysis &rarr;</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-700/50 flex justify-between items-center bg-slate-900/30">
              <div className="text-sm text-slate-400">
                Page <span className="font-semibold text-white">{currentPage}</span> of <span className="font-semibold text-white">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </main >

      {/* Prediction Modal */}
      < PredictionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          loadData(); // Refresh history when closing
        }
        }
      />
    </div >
  )
}

export default App
