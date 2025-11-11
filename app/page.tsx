"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Copy, Check, QrCode, Sun, Moon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Extend Window interface for external libraries
declare global {
  interface Window {
    QRCode: any;
    jsQR: any;
  }
}

export default function QRCodeApp() {
  const [activeTab, setActiveTab] = useState<'generate' | 'decode'>('generate');
  const [text, setText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [librariesLoaded, setLibrariesLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadScripts = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          const script1 = document.createElement('script');
          script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
          script1.onload = () => resolve();
          script1.onerror = reject;
          document.head.appendChild(script1);
        });
        await new Promise<void>((resolve, reject) => {
          const script2 = document.createElement('script');
          script2.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
          script2.onload = () => resolve();
          script2.onerror = reject;
          document.head.appendChild(script2);
        });

        setLibrariesLoaded(true);
      } catch (err) {
        setError('Failed to load QR code libraries');
      }
    };

    loadScripts();
  }, []);

  const generateQRCode = () => {
    if (!text.trim()) {
      setError('Please enter text to generate QR code');
      return;
    }

    if (!librariesLoaded || !window.QRCode) {
      setError('QR Code library is still loading. Please wait...');
      return;
    }

    setError('');

    try {
      const container = document.createElement('div');
      const qrCode = new window.QRCode(container, {
        text: text,
        width: 300,
        height: 300,
        colorDark: darkMode ? '#ffffff' : '#000000',
        colorLight: darkMode ? '#1a1a1a' : '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.H
      });
      setTimeout(() => {
        const canvas = container.querySelector('canvas');
        if (canvas) {
          setQrCodeUrl(canvas.toDataURL());
        } else {
          setError('Failed to generate QR code');
        }
      }, 100);
    } catch (e) {
      console.error(e);
      setError('Error generating QR code. Please try again.');
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrCodeUrl;
    link.click();
  };

  const decodeFromFile = (file: File | null) => {
    if (!file) return;

    if (!librariesLoaded || !window.jsQR) {
      setError('Decoder library is still loading. Please wait...');
      return;
    }

    setError('');
    setDecodedText('');
    setIsDecoding(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          setIsDecoding(false);
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsDecoding(false);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            setDecodedText(code.data);
            setError('');
          } else {
            setError('No QR code found in image. Please upload a clear QR code image.');
            setDecodedText('');
          }
        } catch (err) {
          setError('Error decoding QR code. Please try again.');
        }

        setIsDecoding(false);
      };

      img.onerror = () => {
        setError('Failed to load image. Please try another file.');
        setIsDecoding(false);
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      setIsDecoding(false);
    };

    reader.readAsDataURL(file);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(decodedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (!librariesLoaded) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
        }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-6 ${darkMode ? 'border-purple-500' : 'border-purple-600'
            }`}></div>
          <p className={`text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode
      ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
      : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`}>
      <div className="min-h-screen py-4 sm:py-8 px-3 sm:px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6 sm:mb-8 relative">
            <button
              onClick={toggleDarkMode}
              className={`absolute right-0 top-0 p-2 sm:p-3 rounded-full transition-all ${darkMode
                ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700'
                : 'bg-white text-slate-700 hover:bg-slate-100 shadow-md'
                }`}
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            <div className={`inline-block p-3 sm:p-4 rounded-2xl mb-3 sm:mb-4 ${darkMode ? 'bg-purple-900/50' : 'bg-white shadow-lg'
              }`}>
              <QrCode className={`w-12 h-12 sm:w-16 sm:h-16 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'
              }`}>
              QR Code Gen/Code
            </h1>
            <p className={`text-base sm:text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Generate and decode QR codes instantly
            </p>
          </div>

          <div className={`rounded-3xl overflow-hidden backdrop-blur-sm ${darkMode
            ? 'bg-slate-800/50 border border-slate-700/50 shadow-2xl'
            : 'bg-white/80 shadow-2xl border border-white'
            }`}>
            <div className="flex border-b border-slate-700/50">
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex-1 py-3 sm:py-5 px-3 sm:px-6 font-semibold transition-all text-sm sm:text-base md:text-lg ${activeTab === 'generate'
                  ? darkMode
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : darkMode
                    ? 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/50'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                Generate
              </button>
              <button
                onClick={() => setActiveTab('decode')}
                className={`flex-1 py-3 sm:py-5 px-3 sm:px-6 font-semibold transition-all text-sm sm:text-base md:text-lg ${activeTab === 'decode'
                  ? darkMode
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : darkMode
                    ? 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/50'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                Decode
              </button>
            </div>

            <div className="p-4 sm:p-6 md:p-8">
              {error && (
                <Alert className={`mb-6 ${darkMode
                  ? 'bg-red-900/30 border-red-800 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {activeTab === 'generate' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-2 sm:mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                      Enter text or URL
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="https://example.com or any text..."
                      className={`w-full px-3 sm:px-5 py-3 sm:py-4 rounded-xl transition-all resize-none text-sm sm:text-base ${darkMode
                        ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                        } border focus:outline-none`}
                      rows={4}
                    />
                  </div>

                  <button
                    onClick={generateQRCode}
                    className={`w-full py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${darkMode
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-purple-500/50'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl'
                      }`}
                  >
                    Generate QR Code
                  </button>

                  <canvas ref={qrCanvasRef} className="hidden" />

                  {qrCodeUrl && (
                    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-500">
                      <div className={`p-4 sm:p-8 rounded-2xl text-center ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'
                        }`}>
                        <img
                          src={qrCodeUrl}
                          alt="QR Code"
                          className="mx-auto rounded-xl shadow-xl max-w-full h-auto"
                        />
                      </div>
                      <button
                        onClick={downloadQRCode}
                        className={`flex items-center justify-center gap-2 sm:gap-3 w-full py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${darkMode
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl'
                          }`}
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        Download QR Code
                      </button>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'decode' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className={`border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center transition-all ${darkMode
                    ? 'border-slate-600 hover:border-purple-500 bg-slate-900/30'
                    : 'border-slate-300 hover:border-purple-400 bg-slate-50'
                    }`}>
                    <Upload className={`w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'
                      }`} />
                    <p className={`text-sm sm:text-lg mb-4 sm:mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                      Upload a QR code image to decode
                    </p>
                    <button
                      onClick={handleFileSelect}
                      disabled={isDecoding}
                      className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${darkMode
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl'
                        }`}
                    >
                      {isDecoding ? 'Decoding...' : 'Choose File'}
                    </button>
                    <p className={`text-xs sm:text-sm mt-3 sm:mt-4 ${darkMode ? 'text-slate-500' : 'text-slate-500'
                      }`}>
                      Supports: JPG, PNG, GIF, WebP
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => decodeFromFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />

                  <canvas ref={canvasRef} className="hidden" />

                  {isDecoding && (
                    <div className="text-center py-8 sm:py-12">
                      <div className={`animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-t-transparent mx-auto ${darkMode ? 'border-purple-500' : 'border-purple-600'
                        }`}></div>
                      <p className={`mt-4 sm:mt-6 text-base sm:text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                        Decoding QR code...
                      </p>
                    </div>
                  )}

                  {decodedText && !isDecoding && (
                    <div className={`rounded-2xl p-4 sm:p-6 animate-in fade-in duration-500 ${darkMode
                      ? 'bg-emerald-900/30 border border-emerald-800'
                      : 'bg-emerald-50 border border-emerald-200'
                      }`}>
                      <h3 className={`font-bold text-base sm:text-lg mb-3 sm:mb-4 ${darkMode ? 'text-emerald-300' : 'text-emerald-900'
                        }`}>
                        Decoded Content:
                      </h3>
                      <div className={`p-3 sm:p-5 rounded-xl break-all text-sm sm:text-base ${darkMode
                        ? 'bg-slate-900/50 border border-slate-700 text-slate-200'
                        : 'bg-white border border-emerald-300 text-slate-900'
                        }`}>
                        {decodedText}
                      </div>
                      <button
                        onClick={copyToClipboard}
                        className={`mt-4 sm:mt-5 flex items-center justify-center gap-2 sm:gap-3 w-full py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${darkMode
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                          }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                            Copy to Clipboard
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className={`mt-6 sm:mt-8 text-center space-y-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
            <p className="text-xs sm:text-sm">Powered by QRCode.js and jsQR libraries</p>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
              <span>Developed by</span>
              <a
                href="https://www.facebook.com/ronel.ftubio"
                target="_blank"
                rel="noopener noreferrer"
                className={`font-semibold hover:underline transition-colors ${darkMode
                  ? 'text-purple-400 hover:text-purple-300'
                  : 'text-purple-600 hover:text-purple-700'
                  }`}
              >
                Ronel Tubio
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}