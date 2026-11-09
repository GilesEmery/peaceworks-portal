"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Download, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";

import { supabase } from "../../lib/supabase";
import { dashboardLoginHref } from "../../lib/navigation";
import styles from "./PdfFlipbookReader.module.css";

type PdfDocument = Awaited<ReturnType<(typeof import("pdfjs-dist"))["getDocument"]>>["promise"] extends Promise<infer T> ? T : never;
type ViewState = "loading" | "ready" | "denied" | "missing" | "failed";

export default function PdfFlipbookReader({ resourceId }: { resourceId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<ViewState>("loading");
  const [title, setTitle] = useState("PeaceWorks Publication");
  const [pageRatio, setPageRatio] = useState(612 / 792);
  const [errorMessage, setErrorMessage] = useState("");
  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [wide, setWide] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [motionKey, setMotionKey] = useState(0);
  const shellRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const [linkAnnotations, setLinkAnnotations] = useState<Array<{ page: number; url: string; left: number; top: number; width: number; height: number }>>([]);

  useEffect(() => {
    const watcher = window.matchMedia("(min-width: 880px)");
    const update = () => setWide(watcher.matches);
    update();
    watcher.addEventListener("change", update);
    return () => watcher.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    let loadingTaskToDestroy: { destroy: () => Promise<void> } | null = null;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) {
        router.replace(dashboardLoginHref(`/resources/flipbook/${resourceId}`));
        return;
      }
      try {
        const response = await fetch(`/api/member/resources/${encodeURIComponent(resourceId)}/pdf`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        if (cancelled) return;
        if (response.status === 401) {
          router.replace(dashboardLoginHref(`/resources/flipbook/${resourceId}`));
          return;
        }
        if (response.status === 403) {
          setStatus("denied");
          return;
        }
        if (response.status === 404) {
          setStatus("missing");
          return;
        }
        if (!response.ok) throw Error("The PDF could not be loaded.");
        const encodedTitle = response.headers.get("X-PeaceWorks-Resource-Title");
        if (encodedTitle) {
          try { setTitle(decodeURIComponent(encodedTitle)); } catch { /* Keep default title. */ }
        }
        const bytes = await response.arrayBuffer();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        const loading = pdfjs.getDocument({ data: new Uint8Array(bytes), disableAutoFetch: true });
        const doc = await loading.promise;
        loadingTaskToDestroy = loading;
        const firstPage = await doc.getPage(1);
        const firstViewport = firstPage.getViewport({ scale: 1 });
        setPageRatio(firstViewport.width / firstViewport.height);
        if (cancelled) {
          await loading.destroy();
          return;
        }
        setPdfUrl(objectUrl);
        setPdf(doc);
        setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load PDF.");
          setStatus("failed");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (loadingTaskToDestroy) void loadingTaskToDestroy.destroy();
    };
  }, [resourceId, router]);

  useEffect(() => {
    if (status === "ready") document.title = `${title} | PeaceWorks`;
  }, [status, title]);

  const maxPage = pdf?.numPages || 1;
  const visiblePage = wide ? (page === 1 ? 1 : page % 2 === 0 ? page : page - 1) : page;
  const nextPage = wide ? (visiblePage === 1 ? 2 : visiblePage + 2) : visiblePage + 1;
  const prevPage = wide ? (visiblePage <= 2 ? 1 : visiblePage - 2) : visiblePage - 1;

  useEffect(() => {
    if (!pdf || status !== "ready") return;
    let cancelled = false;
    const renderTasks: Array<{ cancel: () => void; promise: Promise<unknown> }> = [];
    async function renderOne(number: number, canvas: HTMLCanvasElement | null) {
      if (!canvas) return;
      if (number > maxPage || number < 1) {
        canvas.width = 0; canvas.height = 0;
        return;
      }
      const pdfPage = await pdf!.getPage(number);
      if (cancelled) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement?.getBoundingClientRect();
      const viewportBase = pdfPage.getViewport({ scale: 1 });
      const containerWidth = rect?.width || 550;
      const scale = Math.max(.2, Math.min(3.7, containerWidth / viewportBase.width)) * pixelRatio;
      const viewport = pdfPage.getViewport({ scale });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      const context = canvas.getContext("2d");
      if (!context) return;
      const task = pdfPage.render({ canvas, canvasContext: context, viewport });
      renderTasks.push(task);
      try { await task.promise; } catch (e) { if (!cancelled) console.error("PDF page rendering failed", e); }
      if (cancelled) return;
      // Independent link overlays are placed only after the canvas has rendered.
      const annotations = await pdfPage.getAnnotations({ intent: "display" });
      if (cancelled) return;
      const pageLinks = annotations.filter(a => a.subtype === "Link" && a.url && a.rect).map(a => {
        const rectangle = transformRect(a.rect, viewportBase.transform);
        return {
          page: number,
          url: a.url!,
          left: Math.min(rectangle[0], rectangle[2]) / viewportBase.width * 100,
          top: Math.min(rectangle[1], rectangle[3]) / viewportBase.height * 100,
          width: Math.abs(rectangle[2] - rectangle[0]) / viewportBase.width * 100,
          height: Math.abs(rectangle[3] - rectangle[1]) / viewportBase.height * 100,
        };
      });
      setLinkAnnotations(current => [...current.filter(x => x.page !== number), ...pageLinks]);
    }
    void (async () => {
      await Promise.all([
        renderOne(visiblePage, leftRef.current),
        renderOne(wide && visiblePage !== 1 ? visiblePage + 1 : 0, rightRef.current),
      ]);
    })();
    return () => {
      cancelled = true;
      for (const task of renderTasks) task.cancel();
    };
  }, [pdf, visiblePage, wide, zoom, maxPage, status]);

  const go = (next: number) => {
    if (next < 1 || next > maxPage) return;
    setPage(next);
    setMotionKey(value => value + 1);
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") go(nextPage);
      if (event.key === "ArrowLeft") go(prevPage);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  const makeDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "PeaceWorks-Resource.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  const toggleFullscreen = async () => {
    if (!shellRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setFullscreen(false);
      } else {
        await shellRef.current.requestFullscreen();
        setFullscreen(true);
      }
    } catch { /* Fullscreen not available on some browsers. */ }
  };

  return (
    <section className={styles.shell} ref={shellRef}>
      <header className={styles.head}>
        <div>
          <span className="eyebrow">PeaceWorks · Member Resource</span>
          <h1>{title}</h1>
          <p>Use the arrows or keyboard to turn pages. Choose Download for the original PDF.</p>
        </div>
        <Link href="/my-dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </header>
      {status === "loading" && <div className={styles.message} role="status">Opening publication…</div>}
      {status === "denied" && <div className={styles.message} role="alert"><h2>Access restricted</h2><p>This resource is not assigned to your account.</p></div>}
      {status === "missing" && <div className={styles.message} role="alert"><h2>Resource unavailable</h2><p>The publication could not be found.</p></div>}
      {status === "failed" && <div className={styles.message} role="alert"><h2>Unable to open</h2><p>{errorMessage}</p></div>}
      {status === "ready" && pdf && (
        <>
          <div className={styles.toolbar}>
            <button type="button" aria-label="Previous page" onClick={() => go(prevPage)} disabled={visiblePage <= 1}><ArrowLeft size={19} /> Previous</button>
            <span className={styles.counter}>Page {visiblePage}{wide && visiblePage > 1 && visiblePage + 1 <= maxPage ? `–${visiblePage + 1}` : ""} of {maxPage}</span>
            <button type="button" aria-label="Next page" onClick={() => go(nextPage)} disabled={nextPage > maxPage}>Next <ArrowRight size={19} /></button>
            <span className={styles.spacer} />
            <button type="button" aria-label="Zoom out" onClick={() => setZoom(v => Math.max(.7, +(v - .15).toFixed(2)))} disabled={zoom <= .7}><ZoomOut size={19} /></button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Zoom in" onClick={() => setZoom(v => Math.min(2, +(v + .15).toFixed(2)))} disabled={zoom >= 2}><ZoomIn size={19} /></button>
            <button type="button" aria-label="Toggle fullscreen" onClick={toggleFullscreen}>{fullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}</button>
            <button type="button" onClick={makeDownload}><Download size={19} /> <span className={styles.downloadText}>Download PDF</span></button>
          </div>
          <div className={styles.stage}>
            <div key={motionKey} className={styles.spread} style={{ "--flipbook-zoom": zoom, "--pdf-page-ratio": pageRatio } as React.CSSProperties}>
              <div className={styles.sheet}>
                <canvas ref={leftRef} aria-label={`PDF page ${visiblePage}`} role="img" />
                <div className={styles.links}>
                  {linkAnnotations.filter(a => a.page === visiblePage).map((a,i) => <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" aria-label="Open link on PDF page" style={{left: `${a.left}%`, top: `${a.top}%`, width: `${a.width}%`,height: `${a.height}%`}} />)}
                </div>
              </div>
              {wide && visiblePage !== 1 && visiblePage < maxPage && <div className={styles.sheet}>
                <canvas ref={rightRef} aria-label={`PDF page ${visiblePage + 1}`} role="img" />
                <div className={styles.links}>
                  {linkAnnotations.filter(a => a.page === visiblePage+1).map((a,i) => <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" aria-label="Open link on PDF page" style={{left: `${a.left}%`, top: `${a.top}%`, width: `${a.width}%`,height: `${a.height}%`}} />)}
                </div>
              </div>}
            </div>
          </div>
          <div className={styles.bottomNav}>
            <button type="button" disabled={visiblePage <= 1} onClick={() => go(prevPage)}>← Previous</button>
            <input type="range" aria-label="Jump to page" min="1" max={maxPage} value={page} onChange={e => go(Number(e.target.value))} />
            <button type="button" disabled={nextPage > maxPage} onClick={() => go(nextPage)}>Next →</button>
          </div>
        </>
      )}
    </section>
  );
}

function transformRect(rect: number[], transform: number[]): number[] {
 const point = (x: number, y: number) => [transform[0] * x + transform[2] * y + transform[4], transform[1] * x + transform[3] * y + transform[5]];
 return [...point(rect[0], rect[1]), ...point(rect[2], rect[3])];
}
