"use client";
import React, { useState, useRef, useEffect } from 'react';
import QRCodeDecoder from "qrcode-decoder";
import parseQRCode from "qrcode-parser";
import { Upload, Download, Copy, Check, QrCode, Sun, Moon, FileText, Hash, Binary, Info, Wifi, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
        colorDark: '#000000',
        colorLight: '#ffffff',
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
      const phoneMatch = data.match(/TEL(?:;.*)?:([^\n\r]*)/i);
      const emailMatch = data.match(/EMAIL(?:;.*)?:([^\n\r]*)/i);
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
          URL.revokeObjectURL(imageUrl);
        };
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError('Error reading file. Please try again.');
      setIsDecoding(false);
      URL.revokeObjectURL(imageUrl);
    }
  };

  const getIconForType = (type: string) => {
    const iconClass = "w-5 h-5 text-primary";
    switch (type) {
      case 'URL': return <Hash className={iconClass} />;
      case 'WiFi': return <Wifi className={iconClass} />;
      case 'Contact': return <Phone className={iconClass} />;
      case 'Email': return <Mail className={iconClass} />;
      case 'Phone': return <Phone className={iconClass} />;
      case 'SMS': return <Phone className={iconClass} />;
      case 'Geo': return <MapPin className={iconClass} />;
      case 'Calendar Event': return <Calendar className={iconClass} />;
      case 'WhatsApp': return <Phone className={iconClass} />;
      default: return <FileText className={iconClass} />;
    }
  };

  const renderParsedResult = (result: any, type: string) => {
    if (!result) return null;

    switch (type) {
      case 'URL':
        return (
          <div className="space-y-2">
            <div className="break-all"><strong>URL:</strong> {result.url}</div>
            {result.domain && <div><strong>Domain:</strong> {result.domain}</div>}
            {result.path && result.path !== '/' && <div><strong>Path:</strong> {result.path}</div>}
            {result.query && <div className="break-all"><strong>Query:</strong> {result.query}</div>}
          </div>
        );
      case 'WiFi':
        return (
          <div className="space-y-2">
            <div><strong>SSID:</strong> {result.ssid}</div>
            {result.password && <div><strong>Password:</strong> {result.password}</div>}
            {result.encryption && <div><strong>Encryption:</strong> {result.encryption}</div>}
            {result.hidden !== undefined && <div><strong>Hidden:</strong> {result.hidden ? 'Yes' : 'No'}</div>}
          </div>
        );
      case 'Contact':
        return (
          <div className="space-y-2">
            <div><strong>Name:</strong> {result.name}</div>
            {result.phone && <div><strong>Phone:</strong> {result.phone}</div>}
            {result.email && <div><strong>Email:</strong> {result.email}</div>}
            {result.organization && <div><strong>Organization:</strong> {result.organization}</div>}
            {result.jobTitle && <div><strong>Job Title:</strong> {result.jobTitle}</div>}
            {result.url && <div className="break-all"><strong>URL:</strong> {result.url}</div>}
          </div>
        );
      case 'Email':
        return (
          <div className="space-y-2">
            <div><strong>Email:</strong> {result.email}</div>
            {result.subject && <div><strong>Subject:</strong> {result.subject}</div>}
            {result.body && <div className="break-all"><strong>Body:</strong> {result.body}</div>}
          </div>
        );
      case 'Phone':
        return <div><strong>Number:</strong> {result.number}</div>;
      case 'SMS':
        return (
          <div className="space-y-2">
            <div><strong>Number:</strong> {result.number}</div>
            {result.message && <div><strong>Message:</strong> {result.message}</div>}
          </div>
        );
      case 'Geo':
        return (
          <div className="space-y-2">
            <div><strong>Latitude:</strong> {result.latitude}</div>
            <div><strong>Longitude:</strong> {result.longitude}</div>
            {result.altitude && <div><strong>Altitude:</strong> {result.altitude}</div>}
          </div>
        );
      case 'Calendar Event':
        return (
          <div className="space-y-2">
            <div><strong>Summary:</strong> {result.summary || result.title}</div>
            {result.start && <div><strong>Start:</strong> {result.start}</div>}
            {result.end && <div><strong>End:</strong> {result.end}</div>}
            {result.location && <div><strong>Location:</strong> {result.location}</div>}
            {result.description && <div className="break-all"><strong>Description:</strong> {result.description}</div>}
          </div>
        );
      case 'WhatsApp':
        return (
          <div className="space-y-2">
            <div><strong>Number:</strong> {result.number}</div>
            {result.message && <div className="break-all"><strong>Message:</strong> {result.message}</div>}
          </div>
        );
      default:
        return <div className="break-all">{result.text || JSON.stringify(result)}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Modern Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-500/30 dark:to-indigo-500/30 shadow-sm ring-1 ring-blue-500/30 dark:ring-blue-500/40">
              <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-bold tracking-tight leading-none text-slate-900 dark:text-slate-100">QR Code Generator</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-none mt-0.5">Free & Secure QR Tools</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            className="relative overflow-hidden h-10 w-10 border-slate-200 dark:border-slate-800"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'generate' | 'decode')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 dark:bg-slate-900">
              <TabsTrigger value="generate" className="text-base data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                Generate
              </TabsTrigger>
              <TabsTrigger value="decode" className="text-base data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                <Upload className="mr-2 h-4 w-4" />
                Decode
              </TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mb-6 border-red-200 dark:border-red-900">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Tab */}
            <TabsContent value="generate" className="space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Create QR Code</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Enter any text or URL to generate a QR code instantly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="qr-text" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Text or URL
                    </label>
                    <Textarea
                      id="qr-text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="https://example.com or any text..."
                      rows={4}
                      className="resize-none bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <Button onClick={generateQRCode} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" size="lg">
                    Generate QR Code
                  </Button>

                  <canvas ref={qrCanvasRef} className="hidden" />

                  {qrCodeUrl && (
                    <Card className="mt-6 overflow-hidden border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-center bg-white dark:bg-white p-8 rounded-lg shadow-inner">
                          <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            className="rounded-lg shadow-xl w-64 h-64"
                          />
                        </div>
                        <Button onClick={downloadQRCode} className="w-full" variant="outline" size="lg">
                          <Download className="mr-2 h-4 w-4" />
                          Download QR Code
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Decode Tab */}
            <TabsContent value="decode" className="space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Decode QR Code</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Upload a QR code image to extract its content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-950/50"
                    onClick={handleFileSelect}>
                    <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
                    <p className="text-lg mb-4 text-slate-700 dark:text-slate-300">
                      Upload a QR code image to decode
                    </p>
                    <Button
                      disabled={isDecoding}
                      size="lg"
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      {isDecoding ? 'Decoding...' : 'Choose File'}
                    </Button>
                    <p className="text-xs mt-4 text-slate-500 dark:text-slate-500">
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
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto border-blue-600 dark:border-blue-400"></div>
                      <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
                        Decoding QR code...
                      </p>
                    </div>
                  )}

                  {qrAnalysis && !isDecoding && (
                    <Card className="mt-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            {getIconForType(qrAnalysis.parsedResultType)}
                            QR Code Analysis
                          </CardTitle>
                          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100">{qrAnalysis.parsedResultType}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                          <div className="flex items-start gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">Decoded Content</h4>
                              <div className="text-sm text-slate-900 dark:text-slate-100">
                                {renderParsedResult(qrAnalysis.parsedResult, qrAnalysis.parsedResultType)}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(qrAnalysis.rawText)}
                              className="border-slate-200 dark:border-slate-700"
                            >
                              {copied ? <Check className="h-4 w-4 text-green-600 dark:text-green-400" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>

                          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Raw Text
                            </h4>
                            <p className="text-sm break-all text-slate-900 dark:text-slate-100">{qrAnalysis.rawText}</p>
                          </div>

                          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              Metadata
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Format:</span>
                                <Badge variant="outline" className="border-slate-300 dark:border-slate-700">{qrAnalysis.qrFormat}</Badge>
                              </div>
                              {qrAnalysis.metadata.version && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-700 dark:text-slate-300">Version:</span>
                                  <span className="text-slate-900 dark:text-slate-100">{qrAnalysis.metadata.version}</span>
                                </div>
                              )}
                              {qrAnalysis.metadata.maskPattern !== undefined && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-700 dark:text-slate-300">Mask Pattern:</span>
                                  <span className="text-slate-900 dark:text-slate-100">{qrAnalysis.metadata.maskPattern}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-4">
                            <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                              <Binary className="h-4 w-4" />
                              Raw Bytes
                            </h4>
                            <p className="text-xs font-mono break-all text-slate-700 dark:text-slate-300">{qrAnalysis.rawBytes}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* SEO Content Sections */}
          <div className="mt-16 space-y-16">
            {/* Features Section */}
            <section className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Why Choose Our QR Code Generator & Decoder?
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  The fastest and most reliable free QR code tool for all your needs
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                      <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg">100% Free</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Generate and decode unlimited QR codes. No hidden fees, no premium plans, completely free forever.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                      <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-lg">No Sign-Up</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Start creating and scanning QR codes instantly. No registration, no account required.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                      <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-lg">Instant Download</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Download your QR codes as high-quality PNG images ready for print or digital use.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
                      <Upload className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-lg">Smart Decoder</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Upload any QR code image and instantly decode URLs, WiFi, contacts, and more.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  How to Use Our QR Code Tool
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Simple steps to generate or decode QR codes in seconds
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Generate QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Enter Your Content</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Type or paste any text, URL, WiFi credentials, or contact information in the input field.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Click Generate</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Press the "Generate QR Code" button and your QR code will be created instantly.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Download & Share</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Download your QR code as a PNG image and use it anywhere you need.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Decode QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Upload QR Image</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Click the upload area and select a QR code image from your device (JPG, PNG, GIF, WebP).
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Automatic Decode</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Our tool instantly analyzes and decodes the QR code content.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">View Results</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          See detailed analysis including content type, raw data, and metadata.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Frequently Asked Questions
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Everything you need to know about our QR code generator and decoder
                </p>
              </div>
              <div className="max-w-3xl mx-auto space-y-4">
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Is this QR code generator free?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-400">
                      Yes, our QR code generator and decoder is 100% free to use. There are no hidden fees, no sign-up required, and no limits on how many QR codes you can create or decode.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg">How do I generate a QR code?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-400">
                      Simply enter your text or URL in the generator tab, click "Generate QR Code", and your QR code will be created instantly. You can then download it as a PNG image.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Can I decode QR codes from images?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-400">
                      Yes! Upload any QR code image in the decoder tab, and our tool will instantly extract and display the encoded information, including URLs, text, WiFi credentials, contact information, and more.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg">What types of QR codes can I create?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-400">
                      You can create QR codes for URLs, plain text, WiFi credentials, contact cards (vCard), email addresses, phone numbers, SMS messages, geographic locations, calendar events, and WhatsApp messages.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Do I need to sign up to use this tool?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-400">
                      No sign-up is required. Our QR code generator and decoder is completely free and accessible without any registration or account creation.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Are the QR codes I create permanent?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-400">
                      Yes! The QR codes you generate are static and will work forever. Once downloaded, they contain the encoded information permanently and don't require our service to function.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Use Cases Section */}
            <section className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Popular QR Code Use Cases
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Discover how QR codes can simplify your daily tasks
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <Hash className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <CardTitle>Website URLs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Share website links, landing pages, or online portfolios. Perfect for business cards, flyers, and marketing materials.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <Wifi className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <CardTitle>WiFi Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Create QR codes for WiFi networks. Guests can scan and connect instantly without typing passwords.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <Phone className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <CardTitle>Contact Cards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Share your contact information (vCard) with a single scan. Great for networking events and conferences.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <CardTitle>Email & SMS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Generate QR codes for email addresses or SMS messages with pre-filled content for quick communication.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <CardTitle>Locations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Share geographic coordinates or addresses. Perfect for event venues, stores, and meeting points.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardHeader>
                    <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <CardTitle>Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Create calendar event QR codes with date, time, and location. Attendees can add to their calendar instantly.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>

          <Separator className="my-12 bg-slate-200 dark:bg-slate-800" />

          {/* Footer */}
          <div className="text-center space-y-2 text-slate-600 dark:text-slate-400">
            <p className="text-sm flex items-center justify-center gap-2">
              <span>Developed by</span>
              <a
                href="https://www.facebook.com/ronel.ftubio"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline transition-colors text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Ronel Tubio
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}