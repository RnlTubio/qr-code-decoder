"use client";
import React, { useState, useRef, useEffect } from 'react';
import QRCodeDecoder from "qrcode-decoder";
import parseQRCode from "qrcode-parser";
import { Upload, Download, Copy, Check, QrCode, Sun, Moon, FileText, Hash, Binary, Info, Wifi, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

declare global {
  interface Window {
    QRCode: any;
    jsQR: any;
  }
}

interface QRCodeAnalysis {
  rawText: string;
  parsedResultType: string;
  parsedResult: any;
  rawBytes: string;
  qrFormat: string;
  metadata: {
    version?: number;
    errorCorrectionLevel?: string;
    maskPattern?: number;
    segments?: Array<{
      data: string;
      mode: string;
      chars: number;
    }>;
  };
}

export default function QRCodeApp() {
  const [activeTab, setActiveTab] = useState<'generate' | 'decode'>('generate');
  const [text, setText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [qrAnalysis, setQrAnalysis] = useState<QRCodeAnalysis | null>(null);
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
          if (window.QRCode) return resolve();
          const script1 = document.createElement('script');
          script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
          script1.onload = () => resolve();
          script1.onerror = reject;
          document.head.appendChild(script1);
        });
        await new Promise<void>((resolve, reject) => {
          if (window.jsQR) return resolve();
          const script2 = document.createElement('script');
          script2.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
          script2.onload = () => resolve();
          script2.onerror = reject;
          document.head.appendChild(script2);
        });

        setLibrariesLoaded(true);
      } catch (err) {
        console.error("Failed to load external scripts:", err);
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
      new window.QRCode(container, {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const analyzeQRContent = (data: string, jsQRResult?: any): QRCodeAnalysis => {
    let parsedResultType = 'Text';
    let parsedResult: any = null;

    const metadata = {
      version: jsQRResult && typeof jsQRResult === 'object' ? jsQRResult.version : undefined,
      errorCorrectionLevel: jsQRResult && typeof jsQRResult === 'object' && jsQRResult.data ? 'Unknown' : undefined,
      maskPattern: jsQRResult && typeof jsQRResult === 'object' ? jsQRResult.maskPattern : undefined,
      segments: []
    };

    if (/^https?:\/\//i.test(data)) {
      parsedResultType = 'URL';
      try {
        const url = new URL(data);
        parsedResult = {
          title: url.hostname,
          url: data,
          protocol: url.protocol.replace(':', ''),
          domain: url.hostname,
          path: url.pathname,
          query: url.search ? url.search.substring(1) : null
        };
      } catch (e) {
        parsedResult = { title: data, url: data };
      }
    }

    else if (/^WIFI:/i.test(data)) {
      parsedResultType = 'WiFi';
      const ssid = (data.match(/S:([^;]*)/) || [])[1] || '';
      const type = (data.match(/T:([^;]*)/) || [])[1] || '';
      const password = (data.match(/P:([^;]*)/) || [])[1] || '';
      const hidden = (data.match(/H:([^;]*)/) || [])[1] || '';
      parsedResult = {
        title: ssid,
        ssid,
        password,
        encryption: type || 'WPA/WPA2',
        hidden: hidden.toLowerCase() === 'true'
      };
    }
    else if (/BEGIN:VCARD/i.test(data)) {
      parsedResultType = 'Contact';
      const nameMatch = data.match(/FN:(.*)/i);
      const phoneMatch = data.match(/TEL(?:;.*)?:([^\\n\r]*)/i);
      const emailMatch = data.match(/EMAIL(?:;.*)?:([^\\n\r]*)/i);
      const orgMatch = data.match(/ORG:(.*)/i);
      const titleMatch = data.match(/TITLE:(.*)/i);
      const urlMatch = data.match(/URL:(.*)/i);

      parsedResult = {
        title: nameMatch ? nameMatch[1] : 'Unknown',
        name: nameMatch ? nameMatch[1] : 'Unknown',
        phone: phoneMatch ? phoneMatch[1] : null,
        email: emailMatch ? emailMatch[1] : null,
        organization: orgMatch ? orgMatch[1] : null,
        jobTitle: titleMatch ? titleMatch[1] : null,
        url: urlMatch ? urlMatch[1] : null
      };
    }
    else if (/^mailto:/i.test(data)) {
      parsedResultType = 'Email';
      const m = data.match(/^mailto:([^?]*)(?:\?(.*))?$/i);
      const email = m?.[1] || '';
      const params = new URLSearchParams(m?.[2] || '');
      parsedResult = {
        title: email,
        email,
        subject: params.get('subject') || null,
        body: params.get('body') || null
      };
    }
    else if (/^(tel|TEL):/i.test(data)) {
      parsedResultType = 'Phone';
      const number = data.replace(/^(tel|TEL):/i, '');
      parsedResult = { title: number, number };
    }
    else if (/^(smsto|SMS):/i.test(data)) {
      parsedResultType = 'SMS';
      const smsMatch = data.match(/^(?:smsto|SMS):([^:]*):?(.*)?/i);
      parsedResult = {
        title: smsMatch?.[1] || '',
        number: smsMatch?.[1] || '',
        message: smsMatch?.[2] || ''
      };
    }
    else if (/^geo:/i.test(data)) {
      parsedResultType = 'Geo';
      const g = data.match(/^geo:([^,]*),([^,]*)(?:,([^,]*))?/i) || [];
      parsedResult = {
        title: `${g[1] || ''}, ${g[2] || ''}`,
        latitude: g[1] || '',
        longitude: g[2] || '',
        altitude: g[3] || null
      };
    }
    else if (/BEGIN:VEVENT/i.test(data)) {
      parsedResultType = 'Calendar Event';
      const summaryMatch = data.match(/SUMMARY:(.*)/i);
      const startMatch = data.match(/DTSTART:(.*)/i);
      const endMatch = data.match(/DTEND:(.*)/i);
      const locationMatch = data.match(/LOCATION:(.*)/i);
      const descriptionMatch = data.match(/DESCRIPTION:(.*)/i);

      const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return null;
        if (/^\d{8}$/.test(dateStr)) {
          return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        }
        if (/^\d{8}T\d{6}Z?$/.test(dateStr)) {
          const y = dateStr.substring(0, 4), m = dateStr.substring(4, 6), d = dateStr.substring(6, 8);
          const hh = dateStr.substring(9, 11), mm = dateStr.substring(11, 13);
          return `${y}-${m}-${d} ${hh}:${mm}`;
        }
        return dateStr;
      };

      parsedResult = {
        title: summaryMatch ? summaryMatch[1] : 'No title',
        summary: summaryMatch ? summaryMatch[1] : null,
        start: startMatch ? formatDate(startMatch[1]) : null,
        end: endMatch ? formatDate(endMatch[1]) : null,
        location: locationMatch ? locationMatch[1] : null,
        description: descriptionMatch ? descriptionMatch[1] : null
      };
    }
    else if (/^https:\/\/wa\.me\//i.test(data)) {
      parsedResultType = 'WhatsApp';
      const waMatch = data.match(/https:\/\/wa\.me\/(\d+)(?:\?(.*))?/i);
      const number = waMatch?.[1] || '';
      const params = new URLSearchParams(waMatch?.[2] || '');
      parsedResult = {
        title: number,
        number,
        message: params.get('text') || params.get('message') || null
      };
    }
    else {
      parsedResult = { title: data.length > 50 ? data.substring(0, 47) + '...' : data, text: data };
    }
    const encoder = new TextEncoder();
    const rawBytesArray = encoder.encode(data);
    const rawBytes = Array.from(rawBytesArray).map(b => b.toString(16).padStart(2, '0')).join(' ');

    const qrFormat = 'QR_CODE';

    return {
      rawText: data,
      parsedResultType,
      parsedResult,
      rawBytes,
      qrFormat,
      metadata
    };
  };
  const decodeFromFile = async (file: File | null) => {
    if (!file) return;

    setError('');
    setDecodedText('');
    setQrAnalysis(null);
    setIsDecoding(true);
    const imageUrl = URL.createObjectURL(file);
    try {
      const qrDecoder = new QRCodeDecoder();
      const result = await qrDecoder.decodeFromImage(imageUrl as unknown as string);
      const rawText = result?.data || '';

      if (!rawText) throw new Error('No QR data found via qrcode-decoder');
      let parsed: any = null;
      try {
        parsed = await parseQRCode(rawText);
      } catch (e) {
        parsed = null;
      }

      const analysis = parsed && parsed.type
        ? {
          rawText,
          parsedResultType: parsed.type,
          parsedResult: parsed.data || { content: rawText },
          rawBytes: Array.from(new TextEncoder().encode(rawText)).map(b => b.toString(16).padStart(2, '0')).join(' '),
          qrFormat: 'QR_CODE',
          metadata: {}
        } as QRCodeAnalysis
        : analyzeQRContent(rawText, undefined);

      setDecodedText(rawText);
      setQrAnalysis(analysis);
      setError('');
      URL.revokeObjectURL(imageUrl);
      setIsDecoding(false);
      return;
    } catch (err) {
      console.warn("qrcode-decoder failed, falling back to jsQR:", err);

    }
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) {
            setIsDecoding(false);
            setError('Canvas not available');
            return;
          }
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setIsDecoding(false);
            setError('Canvas context not available');
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          try {
            const code = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height) : null;
            if (code && code.data) {
              const rawText = code.data;
              const parsedFromLib = null;
              const analysis = analyzeQRContent(rawText, code);
              setDecodedText(rawText);
              setQrAnalysis(analysis);
              setError('');
            } else {
              setError('No QR code found in image. Please upload a clear QR code image.');
              setDecodedText('');
              setQrAnalysis(null);
            }
          } catch (err) {
            console.error(err);
            setError('Error decoding QR code. Please try again.');
          }
          setIsDecoding(false);
          URL.revokeObjectURL(imageUrl);
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
    } catch (err) {
      console.error(err);
      setError('Failed to decode image.');
      setIsDecoding(false);
      URL.revokeObjectURL(imageUrl);
    }
  };
  const getIconForType = (type: string) => {
    switch (type) {
      case 'URL':
        return <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />;
      case 'WiFi':
        return <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />;
      case 'Contact':
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />;
      case 'Email':
        return <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />;
      case 'Phone':
        return <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />;
      case 'SMS':
        return <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />;
      case 'Geo':
        return <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />;
      case 'Calendar Event':
        return <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />;
    }
  };
  const renderParsedResult = (result: any, type: string) => {
    if (!result) return null;

    switch (type) {
      case 'URL':
        return (
          <div className="space-y-1">
            <div>{result.url}</div>
            {result.domain && <div>{result.domain}</div>}
            {result.path && <div>{result.path}</div>}
            {result.query && <div>{result.query}</div>}
          </div>
        );
      case 'WiFi':
        return (
          <div className="space-y-1">
            <div>{result.ssid}</div>
            <div>{result.encryption}</div>
            {result.password && <div>{result.password}</div>}
            <div>{result.hidden ? 'true' : 'false'}</div>
          </div>
        );
      case 'Contact':
        return (
          <div className="space-y-1">
            <div>{result.name}</div>
            {result.phone && <div>{result.phone}</div>}
            {result.email && <div>{result.email}</div>}
            {result.organization && <div>{result.organization}</div>}
            {result.jobTitle && <div>{result.jobTitle}</div>}
            {result.url && <div>{result.url}</div>}
          </div>
        );
      case 'Email':
        return (
          <div className="space-y-1">
            <div>{result.email}</div>
            {result.subject && <div>{result.subject}</div>}
            {result.body && <div>{result.body}</div>}
          </div>
        );
      case 'Phone':
        return (
          <div className="space-y-1">
            <div>{result.number}</div>
          </div>
        );
      case 'SMS':
        return (
          <div className="space-y-1">
            <div>{result.number}</div>
            {result.message && <div>{result.message}</div>}
          </div>
        );
      case 'Geo':
        return (
          <div className="space-y-1">
            <div>{result.latitude}</div>
            <div>{result.longitude}</div>
            {result.altitude && <div>{result.altitude}</div>}
          </div>
        );
      case 'Calendar Event':
        return (
          <div className="space-y-1">
            <div>{result.summary}</div>
            {result.start && <div>{result.start}</div>}
            {result.end && <div>{result.end}</div>}
            {result.location && <div>{result.location}</div>}
            {result.description && <div>{result.description}</div>}
          </div>
        );
      case 'WhatsApp':
        return (
          <div className="space-y-1">
            <div>{result.number}</div>
            {result.message && <div>{result.message}</div>}
          </div>
        );
      default:
        return (
          <div className="space-y-1">
            <div>{result.text}</div>
          </div>
        );
    }
  };
  if (!librariesLoaded) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
        }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-t-transparent mx-auto mb-4 sm:mb-6 ${darkMode ? 'border-purple-500' : 'border-purple-600'
            }`}></div>
          <p className={`text-sm sm:text-base lg:text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
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
      <nav className={`sticky top-0 z-50 w-full backdrop-blur-sm transition-colors duration-300 ${darkMode ? 'bg-slate-800/90 shadow-lg' : 'bg-white/90 shadow-md'}`}>
        <div className="max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 py-2 sm:py-3 lg:py-4 flex items-center justify-between">
          {/* Left side: QR icon + title */}
          <div className="flex items-center gap-2 xs:gap-3">
            <div className={`inline-block p-1.5 xs:p-2 sm:p-3 rounded-lg sm:rounded-xl ${darkMode ? 'bg-purple-900/40' : 'bg-white shadow-md'}`}>
              <QrCode className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-base xs:text-lg sm:text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                QR Gen/Code
              </h1>
              <p className={`text-xs xs:text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Generate & decode QR codes
              </p>
            </div>
          </div>

          {/* Right side: dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-1.5 xs:p-2 rounded-full transition-all ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-100 shadow-md'}`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4 xs:w-5 xs:h-5" /> : <Moon className="w-4 h-4 xs:w-5 xs:h-5" />}
          </button>
        </div>
      </nav>

      <div className="min-h-screen py-3 xs:py-4 sm:py-6 lg:py-8 px-2 xs:px-3 sm:px-4 lg:px-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-2xl xs:rounded-2xl overflow-hidden backdrop-blur-sm ${darkMode
            ? 'bg-slate-800/50 border border-slate-700/50 shadow-2xl'
            : 'bg-white/80 shadow-2xl border border-white'
            }`}>
            <div className="flex border-b border-slate-700/50">
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex-1 py-2 xs:py-3 sm:py-4 lg:py-5 px-2 xs:px-3 sm:px-6 font-semibold transition-all text-xs xs:text-sm sm:text-base md:text-lg ${activeTab === 'generate'
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
                className={`flex-1 py-2 xs:py-3 sm:py-4 lg:py-5 px-2 xs:px-3 sm:px-6 font-semibold transition-all text-xs xs:text-sm sm:text-base md:text-lg ${activeTab === 'decode'
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

            <div className="p-3 xs:p-4 sm:p-6 lg:p-8">
              {error && (
                <Alert className={`mb-4 xs:mb-6 ${darkMode
                  ? 'bg-red-900/30 border-red-800 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                  <AlertDescription className="text-xs xs:text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {activeTab === 'generate' && (
                <div className="space-y-3 xs:space-y-4 sm:space-y-6">
                  <div>
                    <label className={`block text-xs xs:text-sm font-semibold mb-1.5 xs:mb-2 sm:mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                      Enter text or URL
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="https://example.com or any text..."
                      className={`w-full px-2.5 xs:px-3 sm:px-5 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl transition-all resize-none text-xs xs:text-sm sm:text-base ${darkMode
                        ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                        } border focus:outline-none`}
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={generateQRCode}
                    className={`w-full py-2.5 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl font-semibold text-xs xs:text-sm sm:text-base lg:text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${darkMode
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-purple-500/50'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl'
                      }`}
                  >
                    Generate QR Code
                  </button>

                  <canvas ref={qrCanvasRef} className="hidden" />

                  {qrCodeUrl && (
                    <div className="space-y-2 xs:space-y-3 sm:space-y-4 animate-in fade-in duration-500">
                      <div className={`p-3 xs:p-4 sm:p-6 lg:p-8 rounded-lg xs:rounded-2xl text-center ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'
                        }`}>
                        <img
                          src={qrCodeUrl}
                          alt="QR Code"
                          className="mx-auto rounded-lg xs:rounded-xl shadow-xl max-w-full h-auto w-32 xs:w-40 sm:w-48 lg:w-64"
                        />
                      </div>
                      <button
                        onClick={downloadQRCode}
                        className={`flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 w-full py-2.5 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl font-semibold text-xs xs:text-sm sm:text-base lg:text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${darkMode
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl'
                          }`}
                      >
                        <Download className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                        Download QR Code
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'decode' && (
                <div className="space-y-3 xs:space-y-4 sm:space-y-6">
                  <div className={`border-2 border-dashed rounded-lg xs:rounded-2xl p-4 xs:p-6 sm:p-8 lg:p-12 text-center transition-all ${darkMode
                    ? 'border-slate-600 hover:border-purple-500 bg-slate-900/30'
                    : 'border-slate-300 hover:border-purple-400 bg-slate-50'
                    }`}>
                    <Upload className={`w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 lg:w-20 lg:h-20 mx-auto mb-3 xs:mb-4 sm:mb-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'
                      }`} />
                    <p className={`text-xs xs:text-sm sm:text-base lg:text-lg mb-3 xs:mb-4 sm:mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                      Upload a QR code image to decode
                    </p>
                    <button
                      onClick={handleFileSelect}
                      disabled={isDecoding}
                      className={`px-4 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl font-semibold text-xs xs:text-sm sm:text-base lg:text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${darkMode
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl'
                        }`}
                    >
                      {isDecoding ? 'Decoding...' : 'Choose File'}
                    </button>
                    <p className={`text-xs mt-2 xs:mt-3 sm:mt-4 ${darkMode ? 'text-slate-500' : 'text-slate-500'
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
                    <div className="text-center py-6 xs:py-8 sm:py-12">
                      <div className={`animate-spin rounded-full h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 border-4 border-t-transparent mx-auto ${darkMode ? 'border-purple-500' : 'border-purple-600'
                        }`}></div>
                      <p className={`mt-3 xs:mt-4 sm:mt-6 text-xs xs:text-sm sm:text-base lg:text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                        Decoding QR code...
                      </p>
                    </div>
                  )}

                  {qrAnalysis && !isDecoding && (
                    <div className={`rounded-lg xs:rounded-2xl p-3 xs:p-4 sm:p-6 animate-in fade-in duration-500 ${darkMode
                      ? 'bg-emerald-900/30 border border-emerald-800'
                      : 'bg-emerald-50 border border-emerald-200'
                      }`}>
                      <h3 className={`font-bold text-xs xs:text-sm sm:text-base lg:text-lg mb-2 xs:mb-3 sm:mb-4 ${darkMode ? 'text-emerald-300' : 'text-emerald-900'
                        }`}>
                        QR Code Analysis
                      </h3>

                      <div className={`rounded-lg xs:rounded-xl overflow-hidden ${darkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
                        <div className={`flex items-start gap-1.5 xs:gap-2 sm:gap-3 p-2 xs:p-3 sm:p-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                          {getIconForType(qrAnalysis.parsedResultType)}
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-xs xs:text-sm mb-1 ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
                              {qrAnalysis.parsedResultType}
                            </div>
                            <div className={`text-xs xs:text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                              {renderParsedResult(qrAnalysis.parsedResult, qrAnalysis.parsedResultType)}
                            </div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(qrAnalysis.rawText)}
                            className={`p-1 xs:p-1.5 sm:p-2 rounded-lg transition-all shrink-0 ${darkMode
                              ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            title="Copy"
                          >
                            {copied ? <Check className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" /> : <Copy className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />}
                          </button>
                        </div>
                        <div className={`flex items-start gap-1.5 xs:gap-2 sm:gap-3 p-2 xs:p-3 sm:p-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                          <FileText className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-xs xs:text-sm mb-1 ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>Raw Text</div>
                            <div className={`break-all text-xs xs:text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                              {qrAnalysis.rawText}
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-start gap-1.5 xs:gap-2 sm:gap-3 p-2 xs:p-3 sm:p-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                          <Info className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-xs xs:text-sm mb-1 ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>Metadata</div>
                            <div className={`text-xs xs:text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Format:</span>
                                  <span>{qrAnalysis.qrFormat}</span>
                                </div>
                                {qrAnalysis.metadata.version && (
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Version:</span>
                                    <span>{qrAnalysis.metadata.version}</span>
                                  </div>
                                )}
                                {qrAnalysis.metadata.maskPattern !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Mask Pattern:</span>
                                    <span>{qrAnalysis.metadata.maskPattern}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-start gap-1.5 xs:gap-2 sm:gap-3 p-2 xs:p-3 sm:p-4 ${darkMode ? '' : ''}`}>
                          <Binary className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-xs xs:text-sm mb-1 ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>Raw Bytes</div>
                            <div className={`break-all text-xs xs:text-sm font-mono ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                              {qrAnalysis.rawBytes}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={`mt-4 xs:mt-6 sm:mt-8 text-center space-y-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <div className="flex items-center justify-center gap-2 text-xs xs:text-sm">
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