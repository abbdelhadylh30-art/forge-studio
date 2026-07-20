"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileCode, FileJson, Copy, Check, Loader2 } from "lucide-react";
import { useBuilder } from "@/lib/builder/store/builder-store";

export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const exportHTML = useBuilder((s) => s.exportHTML);
  const site = useBuilder((s) => s.site);
  const [tab, setTab] = useState<"html" | "json">("html");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async (kind: "html" | "json") => {
    setLoading(true);
    try {
      if (kind === "json") {
        const blob = new Blob([JSON.stringify(site, null, 2)], { type: "application/json" });
        downloadBlob(blob, `${site.slug}.json`);
        return;
      }
      const text = exportHTML();
      setHtml(text);
    } finally { setLoading(false); }
  };

  const copyHtml = async () => {
    if (!html) return;
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export site</DialogTitle>
          <DialogDescription>Download a standalone HTML file or the raw JSON blueprint.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="html" className="text-xs"><FileCode className="mr-1.5 h-3.5 w-3.5" /> Standalone HTML</TabsTrigger>
            <TabsTrigger value="json" className="text-xs"><FileJson className="mr-1.5 h-3.5 w-3.5" /> JSON blueprint</TabsTrigger>
          </TabsList>
          <TabsContent value="html" className="space-y-3">
            <div className="flex gap-2">
              <Button onClick={() => generate("html")} disabled={loading}>
                {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileCode className="mr-1.5 h-4 w-4" />} Generate HTML
              </Button>
              <Button variant="outline" onClick={copyHtml} disabled={!html}>
                {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />} Copy
              </Button>
              {html && (
                <Button variant="secondary" onClick={() => { const blob = new Blob([html], { type: "text/html" }); downloadBlob(blob, `${site.slug}.html`); }}>
                  <Download className="mr-1.5 h-4 w-4" /> Download .html
                </Button>
              )}
            </div>
            {html && (
              <ScrollArea className="h-[400px] rounded-md border bg-slate-50 p-3">
                <pre className="text-[11px] leading-relaxed">{html}</pre>
              </ScrollArea>
            )}
          </TabsContent>
          <TabsContent value="json" className="space-y-3">
            <p className="text-sm text-slate-500">The full site blueprint (pages, sections, theme tokens). Re-importable into Forge Studio.</p>
            <Button onClick={() => generate("json")} disabled={loading}>
              <FileJson className="mr-1.5 h-4 w-4" /> Download JSON
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
