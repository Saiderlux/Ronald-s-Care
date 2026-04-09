// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';

/**
 * Genera y descarga un recibo PDF para efectos de deducción de impuestos
 * @param {Object} donationData Información sobre la donación
 */
export function generateTaxDeductionPDF(donationData) {
  const { donorName, donorRFC, amount, date, donationType, itemTitle, receiptId } = donationData;
  
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(218, 41, 28); // #DA291C McDonald's Red
  doc.text("Fundación Infantil Ronald McDonald", 20, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("Recibo Deducible de Impuestos", 20, 30);
  
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
  
  // Body
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  doc.text(`Fecha de emisión: ${date || new Date().toLocaleDateString()}`, 20, 45);
  doc.text(`ID de Recibo: ${receiptId || `REC-${Math.floor(Math.random() * 1000000)}`}`, 20, 52);
  
  doc.setFont(undefined, 'bold');
  doc.text("Datos del Donante:", 20, 65);
  doc.setFont(undefined, 'normal');
  doc.text(`Nombre / Razón Social: ${donorName || 'Público General'}`, 20, 72);
  doc.text(`RFC: ${donorRFC || 'XAXX010101000'}`, 20, 79);
  
  doc.setFont(undefined, 'bold');
  doc.text("Detalles de la Donación:", 20, 95);
  doc.setFont(undefined, 'normal');
  doc.text(`Tipo de Donación: ${donationType === 'inKind' ? 'Especie' : 'Monetaria'}`, 20, 102);
  doc.text(`Concepto: ${itemTitle}`, 20, 109);
  
  if (donationType === 'monetary') {
    doc.text(`Monto Donado: $${amount.toFixed(2)} MXN`, 20, 116);
  } else {
    doc.text(`Cantidad de artículos / Valor estimado unitario: ${amount} unidades`, 20, 116);
  }

  // Footer/Disclaimer
  doc.setLineWidth(0.5);
  doc.line(20, 180, 190, 180);
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  const disclaimer = "Este documento ampara una donación realizada a la Fundación Infantil Ronald McDonald AC., institución autorizada para recibir donativos deducibles en los términos de la Ley del Impuesto Sobre la Renta.";
  const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
  doc.text(splitDisclaimer, 20, 188);
  
  // Save file
  doc.save(`Recibo_Donativo_${donorName ? donorName.replace(/\s+/g, '_') : 'Anon'}.pdf`);
}
