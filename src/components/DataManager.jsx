import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = 'https://life-os-backend-production-63db.up.railway.app/api/v1';

export default function DataManager() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API}/export-data`);
      const data = res.data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `lifeos_backup_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('Datos exportados correctamente', 'success');
    } catch (e) {
      showMessage('Error al exportar datos', 'error');
    }
    setExporting(false);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const res = await axios.post(`${API}/import-data`, data);
        if (res.data.status === 'success') {
          showMessage('Datos importados correctamente. Recarga la página.', 'success');
          setTimeout(() => window.location.reload(), 2000);
        } else {
          showMessage('Error al importar datos', 'error');
        }
      } catch (error) {
        showMessage(error.response?.data?.detail || 'Error al procesar el archivo', 'error');
      }
      setImporting(false);
    };
    reader.onerror = () => {
      showMessage('Error al leer el archivo', 'error');
      setImporting(false);
    };
    reader.readAsText(file);
    // Resetear input
    event.target.value = '';
  };

  return (
    <div className="rounded-3xl border bg-white/5 border-white/10 p-6">
      <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
        <Download size={16} className="text-cyan-400" />
        Gestión de datos
      </h3>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {exporting ? 'Exportando...' : 'Exportar backup'}
        </button>
        
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer disabled:opacity-50">
          {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {importing ? 'Importando...' : 'Importar backup'}
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
            className="hidden"
          />
        </label>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
            messageType === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : messageType === 'error'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
          }`}
        >
          {messageType === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message}
        </motion.div>
      )}
    </div>
  );
}