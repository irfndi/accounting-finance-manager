import React, { useState } from 'react';
export default function Counter({ initialValue = 0, label = "Counter" }) {
    const [count, setCount] = useState(initialValue);
    return (<div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{label}</h3>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => setCount(count - 1)} className="btn btn-secondary px-4 py-2" aria-label="Decrease counter">
          -
        </button>
        <span className="text-2xl font-bold text-slate-900 min-w-[3rem] text-center">
          {count}
        </span>
        <button type="button" onClick={() => setCount(count + 1)} className="btn btn-primary px-4 py-2" aria-label="Increase counter">
          +
        </button>
      </div>
      <button type="button" onClick={() => setCount(initialValue)} className="mt-4 text-sm text-slate-600 hover:text-slate-800 underline">
        Reset to {initialValue}
      </button>
    </div>);
}
