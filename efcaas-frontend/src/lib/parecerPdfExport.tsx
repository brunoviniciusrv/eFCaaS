import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { ParecerReportTemplate } from '../components/ParecerReportTemplate';
import { ParecerReportData } from './parecerReportModel';
import { sanitizeParecerFilename } from './parecerHtml';

async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
}

async function captureElementToPdf(element: HTMLElement, filename: string): Promise<void> {
  await waitForImages(element);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

export async function exportParecerReportPdf(data: ParecerReportData): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    await new Promise<void>((resolve) => {
      root.render(<ParecerReportTemplate data={data} />);
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const element = container.querySelector('[data-parecer-report]') as HTMLElement | null;
    if (!element) throw new Error('Template do parecer não encontrado');

    const filename = sanitizeParecerFilename(data.title, data.referenceNumber);
    await captureElementToPdf(element, filename);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
