import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { showFeedback } from "../components/ui/FeedbackCenter";

export async function generatePeacePdf(fileName: string) {
  const element = document.getElementById("peace-pdf-report");

  if (!element) {
    showFeedback({ kind: "error", message: "PDF report not found." });
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: "letter",
  });

  const pdfWidth = 8.5;
  const pdfHeight = 11;

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position -= pdfHeight;

    pdf.addPage();

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

    heightLeft -= pdfHeight;
  }

  pdf.save(fileName);
}
