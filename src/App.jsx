import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getDataStrategy, resetChat } from './gemini.js';

const CodeBlock = ({ title, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-mono text-slate-500">{title}</span>
        <button 
          onClick={handleCopy} 
          className="text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-[13px] font-mono text-indigo-600 leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default function App() {
  const [schema, setSchema] = useState('');
  const [goal, setGoal] = useState('');
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname], { header: 1 });
      
      if (data.length > 0) {
        setSchema(`Columns: ${data[0].join(', ')}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetChat(); 
    try {
      const result = await getDataStrategy(schema, goal, false);
      setStrategy(result);
    } catch (error) {
      alert("Pipeline generation failed.");
    }
    setLoading(false);
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpText.trim()) return;
    setLoading(true);
    try {
      const result = await getDataStrategy(null, null, true, followUpText);
      setStrategy(result); 
      setFollowUpText('');
    } catch (error) {
      alert("Refinement failed.");
    }
    setLoading(false);
  };

  const exportPythonScript = () => {
    if (!strategy) return;
    const scriptContent = `# InsightFlow AI Generated Pipeline\n\n# --- 1. Pandas Preprocessing ---\n${strategy.pandas_code}\n\n# --- 2. Exploratory Data Analysis ---\n${strategy.eda_code}\n\n# --- 3. Scikit-Learn Modeling ---\n${strategy.scikit_learn_models}`;
    const blob = new Blob([scriptContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "ml_pipeline.py");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 pb-20">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold tracking-tight text-sm">InsightFlow</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight mb-2 text-slate-900">Configure Pipeline</h1>
          <p className="text-sm text-slate-500">Define your dataset schema and objective to generate a structured machine learning pipeline.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Dataset Schema</label>
              <label className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded cursor-pointer hover:bg-indigo-100 transition-colors border border-indigo-200">
                Upload .xlsx to extract
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <textarea 
              className="w-full bg-white border border-slate-300 rounded-lg p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
              rows="3"
              placeholder="Example: ID (int), Price (float), Date (datetime) or click upload above."
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Predictive Goal</label>
            <input 
              type="text"
              className="w-full bg-white border border-slate-300 rounded-lg p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
              placeholder="Example: Predict customer churn"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 text-sm font-medium px-6 py-3 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm">
            {loading ? 'Processing...' : 'Generate Architecture'}
          </button>
        </form>

        {strategy && (
          <div className="mt-16 pt-10 border-t border-slate-200 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex justify-between items-center bg-slate-100 p-4 rounded-lg border border-slate-200">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Architecture Ready</h2>
                <p className="text-xs text-slate-500">Review the generated logic below.</p>
              </div>
              <button onClick={exportPythonScript} className="text-xs bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded shadow-sm hover:bg-slate-50 font-medium">
                Download .py Script
              </button>
            </div>

            <section>
              <h3 className="text-sm font-bold text-slate-900 mb-2">1. Data Cleaning Protocol</h3>
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-sm text-slate-600 leading-relaxed">
                {strategy.data_cleaning}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-900 mb-2">2. Preprocessing & Engineering</h3>
              <CodeBlock title="pandas_pipeline.py" code={strategy.pandas_code} />
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-900 mb-2">3. Exploratory Visualization</h3>
              <CodeBlock title="eda_charts.py" code={strategy.eda_code} />
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-900 mb-2">4. Model Evaluation</h3>
              <CodeBlock title="scikit_learn_models.py" code={strategy.scikit_learn_models} />
            </section>

            {/* Iterative Chat UI */}
            <div className="mt-12 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Refine this pipeline</h3>
              <p className="text-xs text-slate-500 mb-3">Ask the AI to change a metric, add a plot, or modify the encoding.</p>
              <form onSubmit={handleFollowUp} className="flex gap-2">
                <input 
                  type="text"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Use Random Forest instead of Logistic Regression..."
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  required
                />
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  Update
                </button>
              </form>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}