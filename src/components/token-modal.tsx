import { CheckCircle2, Key, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSaveToken: (token: string) => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({ isOpen, onClose, token, onSaveToken }) => {
  const [inputToken, setInputToken] = useState(token);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    setInputToken(token);
    setStatus('idle');
    setStatusMsg('');
  }, [token, isOpen]);

  const handleTestAndSave = async (tokenToSave: string) => {
    if (!tokenToSave.trim()) {
      onSaveToken('');
      setStatus('idle');
      setStatusMsg('API token cleared.');
      setTimeout(() => onClose(), 1000);
      return;
    }

    setStatus('testing');
    setStatusMsg('Verifying Sketchfab API token...');

    try {
      const res = await fetch('/api/sketchfab/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToSave.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setStatus('success');
        setStatusMsg(
          `Token verified successfully! Connected as ${data.user?.displayName || data.user?.username || 'Sketchfab User'}.`,
        );
        onSaveToken(tokenToSave.trim());
        setTimeout(() => onClose(), 1500);
      } else {
        setStatus('error');
        setStatusMsg(data.error || 'Invalid API token. Please verify your Sketchfab key.');
      }
    } catch (_err) {
      setStatus('error');
      setStatusMsg('Failed to reach Sketchfab API server. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg w-[92vw] max-h-[85vh] overflow-y-auto bg-popover border-border text-popover-foreground p-5 sm:p-6 rounded-2xl shadow-2xl">
        {/* Dialog Header */}
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Sketchfab API Key
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Provide your Sketchfab API Key for S3 GLTF manifest inspection & direct downloads
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* API Key Input Section */}
        <div className="space-y-4 pt-2">
          <div className="bg-card border border-border p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase font-mono tracking-wider">
                Personal API Token
              </span>
              <Badge
                variant="outline"
                className="bg-primary/10 border-primary/30 text-primary text-[10px]"
              >
                Direct Access
              </Badge>
            </div>

            <Input
              type="password"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="e.g. 9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d"
              className="w-full bg-background border-border text-xs text-foreground h-10 px-3 rounded-lg focus-visible:ring-1 focus-visible:ring-primary font-mono"
            />

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Find your API key under{' '}
              <a
                href="https://sketchfab.com/settings/password"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary underline underline-offset-2 transition-colors"
              >
                Sketchfab &gt; Account Settings &gt; Password &amp; API
              </a>
              .
            </p>

            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={() => handleTestAndSave(inputToken)}
                disabled={status === 'testing'}
                className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl gap-2 shadow-md cursor-pointer"
              >
                {status === 'testing' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>Verify &amp; Save Key</span>
              </Button>

              {token && (
                <Button
                  variant="outline"
                  onClick={() => handleTestAndSave('')}
                  className="h-10 px-3 border-border text-destructive hover:text-destructive hover:bg-destructive/10 text-xs font-semibold rounded-xl gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </Button>
              )}
            </div>
          </div>

          {/* Feedback Status Alert */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : status === 'error'
                    ? 'bg-destructive/10 border-destructive/30 text-destructive'
                    : 'bg-card border-border text-muted-foreground'
              }`}
            >
              {status === 'testing' && (
                <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-primary" />
              )}
              {status === 'success' && (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              )}
              <p className="flex-1">{statusMsg}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
