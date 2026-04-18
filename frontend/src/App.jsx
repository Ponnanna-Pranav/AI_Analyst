import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileType, Table2, MessageSquare, BarChart } from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function App() {
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [dataRows, setDataRows] = useState([]);
  
  const [query, setQuery] = useState('');
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8081';

  const fetchDatasets = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/datasets`);
      setDatasets(res.data);
      if (res.data.length > 0 && !activeDataset) {
        selectDataset(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectDataset = async (dataset) => {
    setActiveDataset(dataset);
    setInsight(null);
    try {
      const res = await axios.get(`${API_URL}/api/datasets/${dataset.id}/data`);
      setDataRows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchDatasets();
    } catch (err) {
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleQuery = async () => {
    if (!query || !activeDataset) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/query`, {
        datasetId: activeDataset.id,
        query: query
      });
      
      // Axios might have already parsed the JSON response
      let parsedInsight;
      if (typeof res.data === 'object' && res.data !== null) {
        parsedInsight = res.data;
      } else {
        try {
          parsedInsight = JSON.parse(res.data);
        } catch (e) {
          parsedInsight = { summary: String(res.data), chartData: [] };
        }
      }
      
      // Ensure summary is a string to prevent React rendering crashes
      if (typeof parsedInsight.summary !== 'string') {
        parsedInsight.summary = JSON.stringify(parsedInsight.summary || parsedInsight);
      }
      setInsight(parsedInsight);
      
    } catch (err) {
      alert("Failed to get insights. Is OpenAI Key configured?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500/30">
      <nav className="bg-slate-800/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <BarChart className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              AI Data Analyst
            </h1>
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-400">
            <span>Powered by Java Spring Boot & OpenAI</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Data & Upload */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Upload Box */}
            <div className="glass rounded-2xl p-6 transition-all duration-300">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-indigo-400" />
                Upload Dataset
              </h2>
              <div className="relative border-2 border-dashed border-slate-600 rounded-xl p-8 hover:border-indigo-400 hover:bg-indigo-400/5 transition-colors group cursor-pointer">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                />
                <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-300">
                  <FileType className="w-8 h-8 mb-3" />
                  <span className="text-sm font-medium">
                    {uploading ? "Uploading..." : "Click or drag CSV here"}
                  </span>
                </div>
              </div>
            </div>

            {/* Dataset Selector */}
            {datasets.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Table2 className="w-5 h-5 mr-2 text-cyan-400" />
                  Your Datasets
                </h2>
                <div className="space-y-2">
                  {datasets.map(ds => (
                    <button
                      key={ds.id}
                      onClick={() => selectDataset(ds)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center ${
                        activeDataset?.id === ds.id 
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium scale-100 shadow-md' 
                          : 'hover:bg-slate-800 text-slate-400 border border-transparent scale-[0.99]'
                      }`}
                    >
                      <FileType className="w-4 h-4 mr-3 opacity-70" />
                      <div className="truncate flex-1">{ds.filename}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: AI Chat & Viz */}
          <div className="lg:col-span-2 space-y-6">
            
            {activeDataset ? (
              <>
                <div className="glass rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                  
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-indigo-400" />
                    Ask the AI Analyst
                  </h2>
                  <p className="text-xs text-slate-400 mb-4 px-2 tracking-wide uppercase font-semibold">
                    Dataset: <span className="text-indigo-300">{activeDataset.filename}</span>
                  </p>
                  
                  <div className="flex space-x-3 mb-6 relative">
                    <input
                      type="text"
                      className="flex-1 bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                      placeholder="e.g. 'Show me the total sales by region in a bar chart'"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleQuery()}
                    />
                    <button
                      onClick={handleQuery}
                      disabled={loading || !query}
                      className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                      {loading ? 'Analyzing...' : 'Analyze'}
                    </button>
                  </div>

                  {insight && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                      <div className="bg-slate-800/30 border border-indigo-500/20 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-indigo-300 mb-2">AI Summary</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {insight.summary}
                        </p>
                      </div>

                      {insight.chartData && insight.chartData.length > 0 && (
                        <div className="h-80 w-full bg-slate-800/20 border border-white/5 rounded-xl p-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={insight.chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip 
                                cursor={{fill: '#1e293b'}}
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} 
                              />
                              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Data Preview Table */}
                <div className="glass rounded-2xl p-6 overflow-hidden flex flex-col max-h-[500px]">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Table2 className="w-5 h-5 mr-2 text-slate-400" />
                    Data Preview
                  </h2>
                  <div className="overflow-auto rounded-lg border border-slate-700/50 text-sm flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-800/80 sticky top-0 backdrop-blur-md z-10 text-slate-300 font-medium">
                        <tr>
                          {activeDataset.headers.split(',').map((header, idx) => (
                            <th key={idx} className="p-3 border-b border-slate-700">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {dataRows.slice(0, 50).map((row) => (
                          <tr key={row.id} className="hover:bg-slate-800/30 text-slate-400">
                            {activeDataset.headers.split(',').map((header, idx) => (
                              <td key={idx} className="p-3 max-w-[200px] truncate">
                                {row.rowData[header]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-xs text-slate-500 text-center">
                    Showing first {Math.min(dataRows.length, 50)} rows of {dataRows.length} total.
                  </div>
                </div>
              </>
            ) : (
              <div className="glass rounded-2xl border-dashed border-2 border-slate-700 flex flex-col items-center justify-center p-12 h-full text-slate-400">
                <BarChart className="w-16 h-16 mb-4 opacity-50 text-indigo-400" />
                <h2 className="text-xl font-medium text-slate-300 mb-2">No Dataset Selected</h2>
                <p className="text-sm max-w-md text-center">
                  Upload a CSV file or select an existing dataset from the left panel to begin asking questions and generating insights.
                </p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
