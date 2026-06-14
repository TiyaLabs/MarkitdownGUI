import React, { useState, useEffect } from 'react';
import { Layers, Zap, Moon, Sun, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpeedInsights } from '@vercel/speed-insights/react';

import DropZone from './components/DropZone';
import FileQueue from './components/FileQueue';
import MarkdownPreview from './components/MarkdownPreview';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [files, setFiles] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [mergedMarkdown, setMergedMarkdown] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('openaiKey') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleApiKeyChange = (e) => {
    const val = e.target.value;
    setOpenaiKey(val);
    localStorage.setItem('openaiKey', val);
  };

  const handleFilesSelected = (newFiles) => {
    // Client-side validation for 25MB limit
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    const validFiles = [];

    newFiles.forEach(f => {
      if (f.size > MAX_FILE_SIZE) {
        alert(`File ${f.name} terlalu besar. Ukuran maksimum adalah 25MB.`);
      } else {
        validFiles.push(f);
      }
    });

    setFiles((prev) => {
      const existingNames = new Set(prev.map(f => f.name));
      const filtered = validFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });
  };

  const handleRemoveFile = (filename) => {
    setFiles((prev) => prev.filter(f => f.name !== filename));
    setStatuses((prev) => {
      const newStat = { ...prev };
      delete newStat[filename];
      return newStat;
    });
  };

  const handleClearAll = () => {
    setFiles([]);
    setStatuses({});
    setMergedMarkdown('');
  };

  const handleConvert = async (merge) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setMergedMarkdown('');

    const newStatuses = { ...statuses };
    files.forEach(f => {
      newStatuses[f.name] = { state: 'loading' };
    });
    setStatuses(newStatuses);

    const formData = new FormData();
    files.forEach(f => {
      formData.append('files', f);
    });
    if (openaiKey.trim()) {
      formData.append('openai_api_key', openaiKey.trim());
    }

    const endpoint = merge ? '/api/convert-merge' : '/api/convert';

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Konversi gagal');
      }

      const data = await response.json();

      const finalStatuses = { ...statuses };

      data.results.forEach(res => {
        if (res.status === 'success') {
          finalStatuses[res.filename] = { state: 'success' };
        } else {
          finalStatuses[res.filename] = { state: 'error', error: res.error };
        }
      });

      setStatuses(finalStatuses);

      if (merge && data.merged_markdown) {
        setMergedMarkdown(data.merged_markdown);
      } else if (!merge && data.results.length === 1 && data.results[0].status === 'success') {
        setMergedMarkdown(data.results[0].markdown);
      } else if (!merge && data.results.length > 1) {
        let concat = '';
        data.results.forEach(r => {
          if (r.status === 'success') concat += `## Sumber: ${r.filename}\n\n${r.markdown}\n\n---\n\n`;
        });
        setMergedMarkdown(concat);
      }

    } catch (error) {
      const errorStatuses = { ...statuses };
      files.forEach(f => {
        if (errorStatuses[f.name]?.state === 'loading') {
          errorStatuses[f.name] = { state: 'error', error: error.message };
        }
      });
      setStatuses(errorStatuses);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">

      {/* LEFT PANEL - Upload & Controls */}
      <div className="left-panel">

        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="gradient-bg" style={{ padding: '0.5rem', borderRadius: '8px' }}>
              <Layers size={24} color="white" />
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              MarkItDown Studio
            </h1>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title={`Ganti ke mode ${theme === 'light' ? 'gelap' : 'terang'}`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                Konversi File
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Unggah dokumen Anda untuk mendapatkan Markdown yang rapi secara instan.
              </p>
            </div>
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              style={{
                background: showApiKeyInput ? 'var(--bg-tertiary)' : 'transparent',
                border: '1px solid',
                borderColor: showApiKeyInput ? 'var(--border-color)' : 'transparent',
                color: 'var(--text-secondary)',
                padding: '0.5rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease'
              }}
              title="Pengaturan OCR"
            >
              <Key size={16} />
              {showApiKeyInput ? 'Tutup' : 'OCR'}
            </button>
          </div>

          {/* OCR API Key Input */}
          <AnimatePresence>
            {showApiKeyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    OpenAI API Key (Opsional untuk OCR gambar/grafik)
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={handleApiKeyChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent-blue)'; e.target.style.boxShadow = '0 0 0 2px rgba(26, 115, 232, 0.2)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Key dikirim secara aman untuk memproses gambar dan tidak disimpan di server kami.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DropZone onFilesSelected={handleFilesSelected} />

          <FileQueue
            files={files}
            statuses={statuses}
            onRemoveFile={handleRemoveFile}
            onClearAll={handleClearAll}
          />

          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}
            >
              <motion.button
                whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                onClick={() => handleConvert(false)}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '0.85rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  borderRadius: '12px',
                  opacity: isProcessing ? 0.6 : 1,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'background 0.2s ease, opacity 0.2s ease',
                  cursor: isProcessing ? 'wait' : 'pointer'
                }}
              >
                <Zap size={18} color="var(--accent-blue)" />
                Konversi
              </motion.button>

              {files.length > 1 && (
                <motion.button
                  whileHover={{ scale: isProcessing ? 1 : 1.02, boxShadow: '0 10px 20px -10px var(--accent-purple)' }}
                  whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                  onClick={() => handleConvert(true)}
                  disabled={isProcessing}
                  className="gradient-bg"
                  style={{
                    flex: 1,
                    padding: '0.85rem 1rem',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    borderRadius: '12px',
                    opacity: isProcessing ? 0.6 : 1,
                    boxShadow: 'var(--shadow-md)',
                    transition: 'background 0.2s ease, opacity 0.2s ease',
                    cursor: isProcessing ? 'wait' : 'pointer'
                  }}
                >
                  <Layers size={18} />
                  Gabungkan Semua
                </motion.button>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Developed by <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Fatir</span>
        </div>
      </div>

      {/* RIGHT PANEL - Preview */}
      <div className="right-panel">
        {isProcessing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-glass)'
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--accent-blue)',
              animation: 'spin 1s linear infinite',
              marginBottom: '1.5rem'
            }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>Mengonversi Dokumen...</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Menggunakan AI untuk memproses file Anda.</p>
          </motion.div>
        ) : mergedMarkdown ? (
          <MarkdownPreview markdown={mergedMarkdown} filename={files.length > 1 ? 'gabungan-output.md' : `${files[0]?.name}.md`} />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            border: '2px dashed var(--border-color)',
            borderRadius: '16px',
            background: 'var(--bg-primary)'
          }}>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Layers size={64} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
            </motion.div>
            <p style={{ fontSize: '1.2rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Siap untuk Pratinjau</p>
            <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>Unggah dan konversi file untuk melihat hasil formatnya di sini.</p>
          </div>
        )}
      </div>

      <SpeedInsights />
    </div>
  );
}

export default App;
