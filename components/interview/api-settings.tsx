'use client';

import { useState, useEffect } from 'react';
import { useInterviewStore } from '@/lib/store/interview-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LLMProvider } from '@/types';
import { PROVIDER_MODELS } from '@/types';

export function APISettings({ onComplete }: { onComplete: () => void }) {
  const { apiKeys, selectedProvider, selectedModel, setAPIKey, setProvider, setModel } = useInterviewStore();
  const [currentKey, setCurrentKey] = useState(apiKeys[selectedProvider] || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // In development, auto-populate from env vars
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    fetch('/api/dev-key')
      .then((r) => r.json())
      .then((keys) => {
        const key = keys[selectedProvider];
        if (key) {
          setAPIKey(selectedProvider, key);
          onComplete();
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!currentKey.trim()) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      console.log('🔑 Validating API key for', selectedProvider);

      // Call validation API
      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: currentKey,
        }),
      });

      const result = await response.json();

      if (result.valid) {
        console.log('✅ API key is valid!');
        setAPIKey(selectedProvider, currentKey);
        onComplete();
      } else {
        console.error('❌ API key validation failed:', result.error);
        setValidationError(result.error || 'Invalid API key');
      }
    } catch (error: any) {
      console.error('❌ Validation error:', error);
      setValidationError('Failed to validate API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const providerLabels: Record<LLMProvider, string> = {
    anthropic: 'Anthropic (Claude)',
    openai: 'OpenAI (GPT)',
    google: 'Google (Gemini)',
  };

  const providerPlaceholders: Record<LLMProvider, string> = {
    anthropic: 'sk-ant-...',
    openai: 'sk-...',
    google: 'AI...',
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>API Settings</CardTitle>
        <CardDescription>
          Enter your API key to get started. Your key is stored locally and never sent to our servers.
        </CardDescription>
        {apiKeys[selectedProvider] && (
          <div className="mt-2 text-sm text-green-600">
            ✓ API key saved for {providerLabels[selectedProvider]}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">LLM Provider</label>
          <Select
            value={selectedProvider}
            onValueChange={(value) => {
              setProvider(value as LLMProvider);
              setCurrentKey(apiKeys[value as LLMProvider] || '');
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(providerLabels) as LLMProvider[]).map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {providerLabels[provider]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Model</label>
          <Select value={selectedModel} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_MODELS[selectedProvider].map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex flex-col">
                    <span>{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">API Key</label>
          <Input
            type="password"
            placeholder={providerPlaceholders[selectedProvider]}
            value={currentKey}
            onChange={(e) => {
              setCurrentKey(e.target.value);
              setValidationError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isValidating) handleSave();
            }}
            disabled={isValidating}
          />
          <p className="text-xs text-muted-foreground">
            Get a free API key from{' '}
            {selectedProvider === 'anthropic' && (
              <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline">
                Anthropic Console
              </a>
            )}
            {selectedProvider === 'openai' && (
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
                OpenAI Platform
              </a>
            )}
            {selectedProvider === 'google' && (
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">
                Google AI Studio
              </a>
            )}
          </p>
          {validationError && (
            <p className="text-xs text-red-600">
              {validationError}
            </p>
          )}
        </div>

        <Button
          onClick={handleSave}
          className="w-full"
          disabled={!currentKey.trim() || isValidating}
        >
          {isValidating ? 'Validating...' : 'Continue'}
        </Button>
      </CardContent>
    </Card>
  );
}
