import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { showFeedback } from "../components/ui/FeedbackCenter";

export async function generatePeacePdf(fileName: string) {
  const element = document.getElementById("peace-pdf-report");

  if (!element) {
    showFeedback({ kind: "error", message: "PDF report not found." });
    return;
  }

  const pages = Array.from(element.querySelectorAll<HTMLElement>(".pdf-page"));

  if (pages.length === 0) {
    showFeedback({ kind: "error", message: "PDF report pages not found." });
    return;
  }

  await document.fonts?.ready;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: "letter",
  });

  for (const [index, page] of pages.entries()) {
    const canvas = await html2canvas(page, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const imageData = canvas.toDataURL("image/jpeg", 0.86);

    if (index > 0) pdf.addPage();
    pdf.addImage(imageData, "JPEG", 0, 0, 8.5, 11, undefined, "FAST");
  }

  pdf.save(fileName);
}
