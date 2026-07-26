import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, ShieldCheck, X, ExternalLink, RefreshCw, Zap, Settings, Lock } from 'lucide-react';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSaveToken: (newToken: string) => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({
  isOpen,
  onClose,
  token,
  onSaveToken
}) => {
  const [activeTab, setActiveTab] = useState<'oauth' | 'manual'>('oauth');
  const [inputToken, setInputToken] = useState(token);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [username, setUsername] = useState<string | null>(null);

  // Custom OAuth Settings State
  const [showOAuthSettings, setShowOAuthSettings] = useState(false);
  const [customClientId, setCustomClientId] = useState('');
  const [customClientSecret, setCustomClientSecret] = useState('');

  // Sync token prop when modal opens
  useEffect(() => {
    setInputToken(token);
  }, [token, isOpen]);

  // Handle postMessage for popup-based OAuth
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const receivedToken = event.data.token;
        const user = event.data.user;
        if (receivedToken) {
          setInputToken(receivedToken);
          onSaveToken(receivedToken);
          setStatus('success');
          setUsername(user?.username || 'Sketchfab User');
          setStatusMsg(`Successfully connected as ${user?.username || 'Sketchfab User'} via OAuth!`);
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else if (event.data?.type === 'OAUTH_CODE_RECEIVED') {
        // Exchange code if client-side custom credentials were used
        const code = event.data.code;
        const redirectUri = event.data.redirectUri;
        try {
          setStatus('testing');
          setStatusMsg('Exchanging OAuth authorization code...');
          const exRes = await fetch('/api/auth/sketchfab/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              clientId: customClientId,
              clientSecret: customClientSecret,
              redirectUri
            })
          });

          const exData = await exRes.json();
          if (exRes.ok && exData.token) {
            setInputToken(exData.token);
            onSaveToken(exData.token);
            setStatus('success');
            setUsername(exData.user?.username || 'Sketchfab User');
            setStatusMsg(`Successfully connected as ${exData.user?.username || 'Sketchfab User'} via OAuth!`);
            setTimeout(() => {
              onClose();
            }, 1500);
          } else {
            setStatus('error');
            setStatusMsg(exData.details || exData.error || 'OAuth token exchange failed');
          }
        } catch (err: any) {
          setStatus('error');
          setStatusMsg(`Exchange failed: ${err.message}`);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [customClientId, customClientSecret, onSaveToken, onClose]);

  if (!isOpen) return null;

  const handleOAuthConnect = async () => {
    setStatus('testing');
    setStatusMsg('Opening Sketchfab authorization window...');

    try {
      const urlQuery = customClientId ? `?client_id=${encodeURIComponent(customClientId)}` : '';
      const res = await fetch(`/api/auth/sketchfab/url${urlQuery}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'NO_CLIENT_ID') {
          setStatus('error');
          setStatusMsg('Sketchfab OAuth Client ID is not configured. Please enter your Client ID in OAuth Settings below or use manual API Token.');
          setShowOAuthSettings(true);
          return;
        }
        throw new Error(data.message || 'Failed to generate OAuth URL');
      }

      const authWindow = window.open(
        data.url,
        'sketchfab_oauth',
        'width=600,height=700,scrollbars=yes,status=yes'
      );

      if (!authWindow) {
        setStatus('error');
        setStatusMsg('Popup blocked. Please allow popups for this site to complete Sketchfab login.');
      } else {
        setStatus('testing');
        setStatusMsg('Awaiting authorization in popup window...');
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(err.message || 'Could not initiate Sketchfab OAuth flow');
    }
  };

  const handleManualVerifyAndSave = async () => {
    const raw = inputToken.trim();
    if (!raw) {
      onSaveToken('');
      setStatus('idle');
      setStatusMsg('');
      onClose();
      return;
    }

    setStatus('testing');
    setStatusMsg('Verifying Sketchfab token via server proxy...');

    try {
      const res = await fetch('/api/sketchfab/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: raw })
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        const cleanedToken = data.token;
        setStatus('success');
        setUsername(data.user?.username || 'Sketchfab User');
        setStatusMsg(`Authenticated as @${data.user?.username || 'User'} (${data.authType} format verified)!`);
        onSaveToken(cleanedToken);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatus('error');
        setStatusMsg(data.error || 'Invalid Sketchfab token. Please check your API key.');
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(`Verification request failed: ${err.message}`);
    }
  };

  const devCallbackUrl = `${window.location.origin}/auth/callback`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0A0A0B] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Sketchfab Integration & Authentication</h3>
            <p className="text-xs text-zinc-400">Authenticate via OAuth or API Key for GLTF S3 inspection & downloads</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-[#111113] p-1 rounded-xl border border-zinc-800 mb-5">
          <button
            onClick={() => { setActiveTab('oauth'); setStatus('idle'); setStatusMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'oauth'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Sketchfab OAuth (Recommended)</span>
          </button>
          <button
            onClick={() => { setActiveTab('manual'); setStatus('idle'); setStatusMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Manual API Key / Bearer</span>
          </button>
        </div>

        {activeTab === 'oauth' ? (
          <div className="space-y-4">
            <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-300 space-y-2">
              <p className="leading-relaxed">
                Connect directly with your Sketchfab account in one click. No need to copy or paste API keys.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-medium pt-1">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Unlocks model download links &amp; high-precision GLTF manifest range inspection</span>
              </div>
            </div>

            <button
              onClick={handleOAuthConnect}
              disabled={status === 'testing'}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {status === 'testing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting with Sketchfab...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Connect with Sketchfab Account</span>
                </>
              )}
            </button>

            {/* Expandable OAuth Config Settings */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowOAuthSettings(!showOAuthSettings)}
                className="text-xs text-zinc-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{showOAuthSettings ? 'Hide OAuth App Configuration' : 'Configure Custom OAuth App Credentials'}</span>
              </button>

              {showOAuthSettings && (
                <div className="mt-3 p-3.5 bg-[#111113] border border-zinc-800 rounded-xl space-y-3 text-xs animate-in fade-in">
                  <p className="text-zinc-400 text-[11px]">
                    If you created your own Sketchfab OAuth app at <a href="https://sketchfab.com/settings/password" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">sketchfab.com/settings/password</a>, enter your Client ID & Secret below:
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">Client ID</label>
                    <input
                      type="text"
                      value={customClientId}
                      onChange={(e) => setCustomClientId(e.target.value)}
                      placeholder="e.g. 7k39a..."
                      className="w-full bg-[#0A0A0B] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">Client Secret</label>
                    <input
                      type="password"
                      value={customClientSecret}
                      onChange={(e) => setCustomClientSecret(e.target.value)}
                      placeholder="e.g. 9f82a..."
                      className="w-full bg-[#0A0A0B] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Redirect URI to register on Sketchfab:</label>
                    <code className="block bg-[#0A0A0B] border border-zinc-800/80 p-2 rounded text-[11px] text-indigo-300 select-all font-mono break-all">
                      {devCallbackUrl}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Paste your Sketchfab Personal API Token or Bearer Token below. Supports both raw key string and <code className="text-indigo-300 bg-zinc-900 px-1 py-0.5 rounded">Bearer ...</code> / <code className="text-indigo-300 bg-zinc-900 px-1 py-0.5 rounded">Token ...</code> prefixed strings.
            </p>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase font-mono tracking-wider">
                Sketchfab API Token / Bearer Key
              </label>
              <input
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="e.g. 8f92a10b4c5d6e... or Bearer 8f92a10b..."
                className="w-full bg-[#111113] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <a
                href="https://sketchfab.com/settings/password"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline text-xs"
              >
                Get your API Token on Sketchfab
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <button
              onClick={handleManualVerifyAndSave}
              disabled={status === 'testing'}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {status === 'testing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Token...</span>
                </>
              ) : (
                <span>Verify & Save Token</span>
              )}
            </button>
          </div>
        )}

        {/* Status Message Display */}
        {statusMsg && (
          <div className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
            status === 'success' ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-300' :
            status === 'error' ? 'bg-rose-950/50 border-rose-800/50 text-rose-300' :
            'bg-indigo-950/50 border-indigo-800/50 text-indigo-300'
          }`}>
            {status === 'testing' && <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
            {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted local session storage</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
