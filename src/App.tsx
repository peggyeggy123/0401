/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Plus, Trash2, Calculator, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CutRow {
  id: string;
  length: string;
  count: string;
}

interface BarResult {
  id: number;
  cuts: { length: number; count: number }[];
  used: number;
  remaining: number;
  utilization: number;
}

export default function App() {
  const [stockLength, setStockLength] = useState<string>('6000');
  const [rows, setRows] = useState<CutRow[]>([
    { id: '1', length: '', count: '' },
    { id: '2', length: '', count: '' },
    { id: '3', length: '', count: '' },
    { id: '4', length: '', count: '' },
    { id: '5', length: '', count: '' },
  ]);
  const [results, setResults] = useState<BarResult[] | null>(null);

  const handleAddRow = () => {
    setRows([...rows, { id: Math.random().toString(36).substr(2, 9), length: '', count: '' }]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const handleInputChange = (id: string, field: 'length' | 'count', value: string) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleClear = () => {
    setRows([
      { id: '1', length: '', count: '' },
      { id: '2', length: '', count: '' },
      { id: '3', length: '', count: '' },
      { id: '4', length: '', count: '' },
      { id: '5', length: '', count: '' },
    ]);
    setResults(null);
  };

  const calculateOptimization = () => {
    const stock = parseFloat(stockLength);
    if (isNaN(stock) || stock <= 0) return;

    // Flatten all required cuts into a list of individual lengths
    const allCuts: number[] = [];
    rows.forEach((row) => {
      const len = parseFloat(row.length);
      const cnt = parseInt(row.count);
      if (!isNaN(len) && !isNaN(cnt) && len > 0 && cnt > 0) {
        for (let i = 0; i < cnt; i++) {
          allCuts.push(len);
        }
      }
    });

    if (allCuts.length === 0) return;

    // Sort descending for First Fit Decreasing (FFD)
    allCuts.sort((a, b) => b - a);

    const bars: BarResult[] = [];
    let barId = 1;

    allCuts.forEach((cut) => {
      // Try to fit in existing bars
      let placed = false;
      for (const bar of bars) {
        if (bar.used + cut <= stock) {
          // Find if this length already exists in this bar to group it
          const existingCut = bar.cuts.find((c) => c.length === cut);
          if (existingCut) {
            existingCut.count++;
          } else {
            bar.cuts.push({ length: cut, count: 1 });
          }
          bar.used += cut;
          bar.remaining = stock - bar.used;
          bar.utilization = (bar.used / stock) * 100;
          placed = true;
          break;
        }
      }

      // If not placed, start a new bar
      if (!placed) {
        bars.push({
          id: barId++,
          cuts: [{ length: cut, count: 1 }],
          used: cut,
          remaining: stock - cut,
          utilization: (cut / stock) * 100,
        });
      }
    });

    setResults(bars);
    // Scroll to results
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const totalUsedBars = results?.length || 0;
  const averageUtilization = useMemo(() => {
    if (!results || results.length === 0) return 0;
    return results.reduce((acc, bar) => acc + bar.utilization, 0) / results.length;
  }, [results]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-2 py-4">
          <h1 className="text-4xl font-black tracking-tight text-blue-600">鋼筋切斷計算器</h1>
          <p className="text-gray-500 font-medium">極簡、直覺、現場專用</p>
        </header>

        {/* Stock Length Input */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 space-y-4">
          <label className="block text-xl font-bold text-gray-700">原料長度 (mm)</label>
          <input
            type="number"
            inputMode="numeric"
            value={stockLength}
            onChange={(e) => setStockLength(e.target.value)}
            className="w-full text-4xl font-black p-4 bg-gray-50 border-4 border-blue-100 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="例如: 6000"
          />
        </section>

        {/* Input Rows */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-2xl font-bold text-gray-700">輸入需求</h2>
            <button
              onClick={handleAddRow}
              className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-full active:scale-95 transition-transform"
            >
              <Plus size={20} />
              新增一行
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {rows.map((row, index) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">長度 (mm)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={row.length}
                      onChange={(e) => handleInputChange(row.id, 'length', e.target.value)}
                      className="w-full text-2xl font-bold p-2 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="長度"
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">支數</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={row.count}
                      onChange={(e) => handleInputChange(row.id, 'count', e.target.value)}
                      className="w-full text-2xl font-bold p-2 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder="支數"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveRow(row.id)}
                    className="mt-5 p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={24} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleClear}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-600 text-xl font-black py-6 rounded-3xl active:scale-95 transition-transform"
          >
            <RotateCcw size={24} />
            全部清除
          </button>
          <button
            onClick={calculateOptimization}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white text-xl font-black py-6 rounded-3xl shadow-lg shadow-blue-200 active:scale-95 transition-transform"
          >
            <Calculator size={24} />
            開始計算
          </button>
        </div>

        {/* Results Section */}
        {results && (
          <motion.section
            id="results-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 pt-8 border-t-4 border-dashed border-gray-200"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-gray-800">計算結果</h2>
              <div className="flex justify-center gap-4">
                <div className="bg-blue-50 px-4 py-2 rounded-2xl">
                  <p className="text-xs font-bold text-blue-400 uppercase">總共需要</p>
                  <p className="text-2xl font-black text-blue-600">{totalUsedBars} 根</p>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-2xl">
                  <p className="text-xs font-bold text-green-400 uppercase">平均利用率</p>
                  <p className="text-2xl font-black text-green-600">{averageUtilization.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {results.map((bar) => (
                <motion.div
                  key={bar.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: bar.id * 0.05 }}
                  className="bg-white rounded-3xl p-6 shadow-md border-l-8 border-blue-500 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-black text-gray-400">第 {bar.id} 根</h3>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
                        利用率: {bar.utilization.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {bar.cuts.map((cut, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-3xl font-black text-gray-800">
                        <span className="text-blue-600">{cut.length}</span>
                        <span className="text-gray-300 text-xl">×</span>
                        <span>{cut.count}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertCircle size={20} />
                      <span className="text-xl font-black">剩餘：{bar.remaining} mm</span>
                    </div>
                    {bar.remaining < 50 && (
                      <div className="flex items-center gap-1 text-green-500 font-bold text-sm">
                        <CheckCircle2 size={16} />
                        極低損耗
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full py-4 text-gray-400 font-bold hover:text-blue-500 transition-colors"
            >
              回到頂部
            </button>
          </motion.section>
        )}
      </div>

      {/* Floating Summary for Mobile */}
      {results && (
        <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur shadow-2xl rounded-3xl p-4 flex justify-between items-center border border-gray-100 md:hidden">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">總計</p>
            <p className="text-2xl font-black text-blue-600">{totalUsedBars} 根原料</p>
          </div>
          <button
            onClick={handleClear}
            className="bg-gray-100 p-3 rounded-2xl text-gray-500 active:scale-95 transition-transform"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
