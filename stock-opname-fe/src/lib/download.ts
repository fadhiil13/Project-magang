import api from './api';

export async function downloadDocument(baId: number, format: 'pdf' | 'docx') {
  const response = await api.get(`/berita-acara/${baId}/download/${format}`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download =
    response.headers['content-disposition']
      ?.split('filename=')[1]
      ?.replace(/"/g, '') || `BA-${baId}.${format}`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function printDocument(baId: number) {
  const response = await api.get(`/berita-acara/${baId}/download/pdf`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  }
}

export async function generateDocument(baId: number) {
  await api.post(`/berita-acara/${baId}/generate`);
}