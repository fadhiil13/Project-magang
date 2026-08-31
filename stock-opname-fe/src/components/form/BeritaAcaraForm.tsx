'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Search } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Stepper from './Stepper';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SignaturePad from '@/components/signature/SignaturePad';
import { beritaAcaraSchema, BeritaAcaraFormData, step1Fields, step2Fields } from '@/lib/schemas';
import { useDebounce } from '@/hooks/useDebounce';
import api from '@/lib/api';
import { generateDocument } from '@/lib/download';
import { AsetSearchResult, BeritaAcara } from '@/types';

interface BeritaAcaraFormProps {
  mode: 'create' | 'edit';
  initialData?: BeritaAcara;
}

function emptyRow() {
  return {
    nomorInventaris: '',
    serialNumber: '',
    jenisAset: '',
    merek: '',
    // Otomatis keisi "support.kai.id" karena hampir selalu itu sumbernya —
    // biar nggak perlu ngetik ulang tiap tambah baris. Tetap bisa diedit
    // manual kalau memang beda.
    sumberData: 'support.kai.id',
    keterangan: '',
  };
}

export default function BeritaAcaraForm({ mode, initialData }: BeritaAcaraFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Tombol "Selanjutnya" dan "Simpan" ada di posisi yang sama (kanan bawah).
  // Kalau user klik dua kali cepat (nggak sengaja), klik ke-2 bisa kena
  // tombol baru yang baru aja muncul di posisi itu setelah pindah step.
  // Kunci sebentar biar itu nggak kejadian.
  useEffect(() => {
    setTransitioning(true);
    const t = setTimeout(() => setTransitioning(false), 350);
    return () => clearTimeout(t);
  }, [step]);

  const form = useForm<BeritaAcaraFormData>({
    resolver: zodResolver(beritaAcaraSchema),
    defaultValues: initialData
      ? {
          noRef: initialData.noRef,
          tanggal: initialData.tanggal?.split('T')[0] || '',
          businessArea: initialData.businessArea,
          unitKerja: initialData.unitKerja,
          tempatKedudukan: initialData.tempatKedudukan,
          analisa: initialData.analisa,
          tindakLanjut: initialData.tindakLanjut || '',
          asetRows: initialData.asetRows?.length
            ? initialData.asetRows.map((r) => ({
                nomorInventaris: r.nomorInventaris,
                serialNumber: r.serialNumber,
                jenisAset: r.jenisAset,
                merek: r.merek,
                sumberData: r.sumberData,
                keterangan: r.keterangan,
              }))
            : [emptyRow()],
          namaPimpinanUnitKerja: initialData.namaPimpinanUnitKerja || '',
          jabatanPimpinanUnitKerja: initialData.jabatanPimpinanUnitKerja || '',
          nipPimpinanUnitKerja: initialData.nipPimpinanUnitKerja || '',
          ttdPimpinanUnitKerja: initialData.ttdPimpinanUnitKerja || '',
          namaPimpinanIT: initialData.namaPimpinanIT || '',
          jabatanPimpinanIT: initialData.jabatanPimpinanIT || '',
          nipPimpinanIT: initialData.nipPimpinanIT || '',
          ttdPimpinanIT: initialData.ttdPimpinanIT || '',
          namaPetugas: initialData.namaPetugas || '',
          jabatanPetugas: initialData.jabatanPetugas || '',
          nipPetugas: initialData.nipPetugas || '',
          ttdPetugas: initialData.ttdPetugas || '',
        }
      : {
          noRef: '',
          tanggal: '',
          businessArea: '',
          unitKerja: '',
          tempatKedudukan: '',
          analisa:
            'Aset berada di Unit Operasi\n\nDetail Data Aset TI dituangkan pada lampiran yang menjadi bagian tidak terpisahkan dari Berita Acara Stock Opname Aset Teknologi Informasi ini.',
          tindakLanjut: '',
          asetRows: [emptyRow()],
          namaPimpinanUnitKerja: '',
          jabatanPimpinanUnitKerja: '',
          nipPimpinanUnitKerja: '',
          ttdPimpinanUnitKerja: '',
          namaPimpinanIT: '',
          jabatanPimpinanIT: '',
          nipPimpinanIT: '',
          ttdPimpinanIT: '',
          namaPetugas: '',
          jabatanPetugas: '',
          nipPetugas: '',
          ttdPetugas: '',
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'asetRows',
  });

  const validateStep = async (targetStep: number) => {
    if (targetStep <= step) {
      setStep(targetStep);
      return;
    }

    let fieldsToValidate: string[] = [];
    if (step === 1) fieldsToValidate = [...step1Fields];
    if (step === 2) fieldsToValidate = [...step2Fields];

    const valid = await form.trigger(fieldsToValidate as any[]);
    if (valid) setStep(targetStep);
  };

  const onSubmit = async (data: BeritaAcaraFormData) => {
    setSubmitting(true);
    try {
      let id: number;

      if (mode === 'create') {
        const res = await api.post<BeritaAcara>('/berita-acara', data);
        id = res.data.id;
      } else {
        id = initialData!.id;
        await api.patch(`/berita-acara/${id}`, data);
      }

      // Data tersimpan — tetap di halaman ini, tampilkan pilihan Generate
      // Dokumen. Nggak langsung pindah ke halaman lain sampai user
      // memutuskan (generate atau lewati).
      toast.success(
        mode === 'create' ? 'Berita Acara berhasil dibuat!' : 'Perubahan berhasil disimpan!',
      );
      setSavedId(id);
    } catch (err) {
      console.error('Submit failed', err);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        // No. Ref duplikat — arahkan user ke field yang bermasalah di Step 1
        if (status === 409) {
          form.setError('noRef', {
            type: 'manual',
            message:
              typeof message === 'string'
                ? message
                : 'No. Ref sudah dipakai, gunakan nomor lain',
          });
          setStep(1);
          toast.error('No. Ref sudah dipakai. Silakan ganti dengan nomor lain.');
          return;
        }

        // Validasi gagal di backend — message bisa berupa array
        if (status === 400) {
          const detail = Array.isArray(message) ? message.join(', ') : message;
          toast.error(detail || 'Data tidak valid. Periksa kembali isian form.');
          return;
        }

        if (status === 403) {
          toast.error('Anda tidak berhak mengubah Berita Acara ini.');
          return;
        }

        if (status === 401) {
          toast.error('Sesi berakhir. Silakan login ulang.');
          router.push('/login');
          return;
        }
      }

      toast.error('Gagal menyimpan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateNow = async () => {
    if (!savedId) return;
    setGenerating(true);
    try {
      await generateDocument(savedId);
      toast.success('Dokumen berhasil digenerate!');
    } catch {
      toast.error('Gagal generate dokumen. Coba generate ulang dari halaman detail.');
    } finally {
      setGenerating(false);
      router.push(`/berita-acara/${savedId}`);
    }
  };

  // Data sudah tersimpan — tampilkan panel konfirmasi + pilihan Generate,
  // gantikan form. Nggak pindah halaman sampai user memutuskan.
  if (savedId !== null) {
    return (
      <Card>
        <div className="text-center py-8 space-y-4">
          <p className="text-lg font-semibold text-kai-black">
            ✅ Data berhasil {mode === 'create' ? 'dibuat' : 'disimpan'}!
          </p>
          <p className="text-kai-gray-500 text-sm">
            Sekarang generate dokumen PDF & DOCX-nya, atau lewati dan lanjut ke halaman detail.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/berita-acara/${savedId}`)}
            >
              Lewati, ke Detail
            </Button>
            <Button type="button" loading={generating} onClick={handleGenerateNow}>
              Generate Dokumen
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <Stepper currentStep={step} onStepClick={(s) => validateStep(s)} />

      <Card>
        {step === 1 && <Step1 form={form} />}
        {step === 2 && <Step2 form={form} fields={fields} append={append} remove={remove} />}
        {step === 3 && <Step3 form={form} />}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-kai-gray-200">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              disabled={transitioning}
              onClick={() => setStep(step - 1)}
            >
              ← Kembali
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button type="button" disabled={transitioning} onClick={() => validateStep(step + 1)}>
              Selanjutnya →
            </Button>
          ) : (
            <Button
              type="button"
              loading={submitting}
              disabled={transitioning}
              onClick={form.handleSubmit(onSubmit)}
            >
              💾 {mode === 'create' ? 'Simpan' : 'Simpan Perubahan'}
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
}

/* ─── Step 1: Data Umum ─── */
function Step1({ form }: { form: UseFormReturn<BeritaAcaraFormData> }) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-kai-black">Step 1 dari 3: Data Umum</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="No. Ref *"
          placeholder="Contoh: 08/07/2026"
          error={errors.noRef?.message}
          {...register('noRef')}
        />
        <Input
          label="Tanggal *"
          type="date"
          error={errors.tanggal?.message}
          {...register('tanggal')}
        />
      </div>

      <Input
        label="Business Area *"
        placeholder="Contoh: B070"
        error={errors.businessArea?.message}
        {...register('businessArea')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Unit Kerja *"
          placeholder="Contoh: Operasi"
          error={errors.unitKerja?.message}
          {...register('unitKerja')}
        />
        <Input
          label="Tempat Kedudukan *"
          placeholder="Contoh: DAOP 7"
          error={errors.tempatKedudukan?.message}
          {...register('tempatKedudukan')}
        />
      </div>
    </div>
  );
}

/* ─── Step 2: Analisa & Data Aset ─── */
function Step2({
  form,
  fields,
  append,
  remove,
}: {
  form: UseFormReturn<BeritaAcaraFormData>;
  fields: any[];
  append: (val: any) => void;
  remove: (idx: number) => void;
}) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-kai-black">Step 2 dari 3: Analisa & Data Aset</h2>

      <Textarea
        label="Analisa *"
        rows={5}
        error={errors.analisa?.message}
        {...register('analisa')}
      />
      <Textarea label="Tindak Lanjut (opsional)" rows={3} {...register('tindakLanjut')} />

      {/* Aset Header */}
      <div className="flex items-center justify-between pt-4 border-t border-kai-gray-200">
        <h3 className="font-semibold text-kai-black">Data Aset Teknologi Informasi</h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append(emptyRow())}
        >
          <Plus className="w-4 h-4" /> Tambah Baris
        </Button>
      </div>

      {errors.asetRows?.message && (
        <p className="text-xs text-red-600">{errors.asetRows.message}</p>
      )}

      {/* Aset Rows */}
      {fields.map((field, idx) => (
        <AsetRowFields
          key={field.id}
          index={idx}
          form={form}
          canRemove={fields.length > 1}
          onRemove={() => remove(idx)}
        />
      ))}

      {/* Add row button (dashed) */}
      <button
        type="button"
        onClick={() => append(emptyRow())}
        className="w-full border-2 border-dashed border-kai-orange text-kai-orange rounded-lg p-3 text-sm font-medium hover:bg-kai-orange/5 transition-colors"
      >
        + Tambah Baris Aset
      </button>
    </div>
  );
}

/* ─── Single Aset Row with Smart Lookup ─── */
function AsetRowFields({
  index,
  form,
  canRemove,
  onRemove,
}: {
  index: number;
  form: UseFormReturn<BeritaAcaraFormData>;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;
  const rowErrors = errors.asetRows?.[index];

  const nomorInv = watch(`asetRows.${index}.nomorInventaris`);
  const debouncedNomor = useDebounce(nomorInv, 500);

  const [suggestion, setSuggestion] = useState<AsetSearchResult | null>(null);

  // Smart lookup
  useEffect(() => {
    if (!debouncedNomor || debouncedNomor.length < 3) {
      setSuggestion(null);
      return;
    }

    let cancelled = false;
    api
      .get('/aset/search', { params: { q: debouncedNomor } })
      .then((res) => {
        if (!cancelled && res.data?.data?.length > 0) {
          setSuggestion(res.data.data[0]);
        } else {
          setSuggestion(null);
        }
      })
      .catch(() => setSuggestion(null));

    return () => {
      cancelled = true;
    };
  }, [debouncedNomor]);

  const applySuggestion = () => {
    if (!suggestion) return;
    setValue(`asetRows.${index}.serialNumber`, suggestion.serialNumber);
    setValue(`asetRows.${index}.jenisAset`, suggestion.jenisAset);
    setValue(`asetRows.${index}.merek`, suggestion.merek);
    setSuggestion(null);
  };

  return (
    <div className="relative border border-kai-gray-200 rounded-lg p-4 bg-kai-gray-50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-kai-gray-700">Baris {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Hapus baris"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Nomor Inventaris + Lookup */}
        <div className="relative">
          <Input
            label="No. Inventaris *"
            placeholder="IT.057.0824..."
            error={rowErrors?.nomorInventaris?.message}
            {...register(`asetRows.${index}.nomorInventaris`)}
          />

          {/* Suggestion popup */}
          {suggestion && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-kai-blue shadow-lg rounded-lg p-3 text-xs">
              <div className="flex items-center gap-1 text-kai-blue font-semibold mb-1">
                <Search className="w-3 h-3" /> Ditemukan di database
              </div>
              <p>No Inv: {suggestion.nomorInventaris}</p>
              <p>Merek: {suggestion.merek}</p>
              <p>Jenis: {suggestion.jenisAset}</p>
              {suggestion.latestLocation && (
                <p className="text-kai-gray-500">
                  Terakhir: {suggestion.latestLocation.businessArea} —{' '}
                  {suggestion.latestLocation.unitKerja}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="px-2 py-1 bg-kai-blue text-white rounded text-xs font-medium hover:bg-blue-700"
                >
                  ✅ Gunakan
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  className="px-2 py-1 bg-kai-gray-100 text-kai-gray-700 rounded text-xs hover:bg-kai-gray-200"
                >
                  ✕ Tutup
                </button>
              </div>
            </div>
          )}
        </div>

        <Input
          label="Serial Number *"
          placeholder="UDR0KSD..."
          error={rowErrors?.serialNumber?.message}
          {...register(`asetRows.${index}.serialNumber`)}
        />

        <Input
          label="Jenis Aset *"
          placeholder="PC Desktop, Notebook, Printer..."
          error={rowErrors?.jenisAset?.message}
          {...register(`asetRows.${index}.jenisAset`)}
        />

        <Input
          label="Merek *"
          placeholder="Acer, Asus, HP..."
          error={rowErrors?.merek?.message}
          {...register(`asetRows.${index}.merek`)}
        />

        <Input
          label="Sumber Data"
          placeholder="Support kai.id, SAP..."
          error={rowErrors?.sumberData?.message}
          {...register(`asetRows.${index}.sumberData`)}
        />

        <Input
          label="Keterangan"
          placeholder="Kondisi baik, rusak..."
          error={rowErrors?.keterangan?.message}
          {...register(`asetRows.${index}.keterangan`)}
        />
      </div>
    </div>
  );
}

/* ─── Step 3: Tanda Tangan ─── */
function Step3({ form }: { form: UseFormReturn<BeritaAcaraFormData> }) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-kai-black">Step 3 dari 3: Tanda Tangan</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pimpinan Unit Kerja */}
        <div className="space-y-3 border border-kai-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-kai-black text-sm">Pimpinan Unit Kerja</h3>
          <Input
            label="Nama"
            placeholder="Nama pimpinan"
            {...register('namaPimpinanUnitKerja')}
          />
          <Input
            label="Jabatan"
            placeholder="Asisten Manager..."
            {...register('jabatanPimpinanUnitKerja')}
          />
          <Input label="NIP" placeholder="41379" {...register('nipPimpinanUnitKerja')} />
          <SignaturePad
            label="Tanda Tangan"
            value={watch('ttdPimpinanUnitKerja') || null}
            onChange={(val) => setValue('ttdPimpinanUnitKerja', val || '')}
            error={errors.ttdPimpinanUnitKerja?.message}
          />
        </div>

        {/* Pimpinan IT */}
        <div className="space-y-3 border border-kai-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-kai-black text-sm">Pimpinan IT</h3>
          <Input
            label="Nama"
            placeholder="Nama pengelola aset TI"
            {...register('namaPimpinanIT')}
          />
          <Input
            label="Jabatan"
            placeholder="Pengelola Aset TI..."
            {...register('jabatanPimpinanIT')}
          />
          <Input label="NIP" placeholder="41380" {...register('nipPimpinanIT')} />
          <SignaturePad
            label="Tanda Tangan"
            value={watch('ttdPimpinanIT') || null}
            onChange={(val) => setValue('ttdPimpinanIT', val || '')}
            error={errors.ttdPimpinanIT?.message}
          />
        </div>

        {/* Petugas Stock Opname */}
        <div className="space-y-3 border border-kai-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-kai-black text-sm">Petugas Stock Opname</h3>
          <Input
            label="Nama"
            placeholder="Nama petugas IT stock opname"
            {...register('namaPetugas')}
          />
          <Input
            label="Jabatan"
            placeholder="Staff IT..."
            {...register('jabatanPetugas')}
          />
          <Input label="NIP" placeholder="41381" {...register('nipPetugas')} />
          <SignaturePad
            label="Tanda Tangan"
            value={watch('ttdPetugas') || null}
            onChange={(val) => setValue('ttdPetugas', val || '')}
            error={errors.ttdPetugas?.message}
          />
        </div>
      </div>
    </div>
  );
}