'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Upload, Pencil, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface SignaturePadProps {
  label?: string;
  value: string | null;
  onChange: (base64: string | null) => void;
  error?: string;
}

export default function SignaturePad({ label, value, onChange, error }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'draw'>('upload');

  // If there's already a value (edit mode), show preview
  const hasValue = !!value;

  const handleClear = useCallback(() => {
    sigRef.current?.clear();
    onChange(null);
    if (fileRef.current) fileRef.current.value = '';
  }, [onChange]);

  const handleDrawEnd = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onChange(sigRef.current.toDataURL('image/png'));
    }
  }, [onChange]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  // When switching mode, clear current value
  const switchMode = (newMode: 'upload' | 'draw') => {
    if (newMode !== mode) {
      handleClear();
      setMode(newMode);
    }
  };

  return (
    <div className="w-full">
      {label && <p className="text-sm font-medium text-kai-gray-700 mb-2">{label}</p>}

      {/* Preview existing value */}
      {hasValue ? (
        <div className="space-y-2">
          <div className="border border-kai-gray-200 rounded-lg p-3 bg-white h-[240px] flex items-center justify-center">
            <img src={value!} alt="Tanda tangan" className="max-h-full max-w-full object-contain" />
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleClear}>
            <Trash2 className="w-3.5 h-3.5" /> Ganti
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mode toggle */}
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name={`sig-mode-${label}`}
                checked={mode === 'upload'}
                onChange={() => switchMode('upload')}
                className="accent-kai-orange"
              />
              <Upload className="w-3.5 h-3.5" />
              Upload Gambar
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name={`sig-mode-${label}`}
                checked={mode === 'draw'}
                onChange={() => switchMode('draw')}
                className="accent-kai-orange"
              />
              <Pencil className="w-3.5 h-3.5" />
              Gambar di Layar
            </label>
          </div>

          {/* Upload mode */}
          {mode === 'upload' && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="block w-full text-sm text-kai-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-kai-orange/10 file:text-kai-orange hover:file:bg-kai-orange/20 cursor-pointer"
              />
            </div>
          )}

          {/* Draw mode */}
          {mode === 'draw' && (
            <div className="space-y-2">
              <div
                className={`border-2 border-dashed rounded-lg bg-white ${
                  error ? 'border-red-500' : 'border-kai-gray-200'
                }`}
                style={{ touchAction: 'none' }}
              >
                <SignatureCanvas
                  ref={sigRef}
                  canvasProps={{
                    className: 'w-full rounded-lg',
                    style: { width: '100%', height: '240px' },
                  }}
                  penColor="black"
                  minWidth={1.5}
                  maxWidth={2.5}
                  onEnd={handleDrawEnd}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleClear}>
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}