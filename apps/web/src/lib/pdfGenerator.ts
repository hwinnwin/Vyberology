import type { jsPDF } from "jspdf";

/**
 * Generates a branded PDF from a DOM element using html2canvas + jsPDF.
 * Only available for Full VYBE ($19) tier.
 */
export async function generateReadingPdf(
  element: HTMLElement,
  fullName: string
): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDFConstructor }] =
    await Promise.all([import("html2canvas"), import("jspdf")]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f5f0e8", // vy-parchment
    logging: false,
  });

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  const pdf: jsPDF = new jsPDFConstructor("p", "mm", "a4");

  // If content is taller than one page, split across pages
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // Footer on last page
  const lastPage = pdf.getNumberOfPages();
  pdf.setPage(lastPage);
  pdf.setFontSize(8);
  pdf.setTextColor(160, 150, 135);
  pdf.text("vyberology.com", 105, 290, { align: "center" });

  const safeName = fullName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  pdf.save(`vyberology-${safeName}-reading.pdf`);
}
