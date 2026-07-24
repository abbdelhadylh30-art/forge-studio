"use client";

import { useState } from "react";
import { useBuilder } from "@/lib/builder/store/builder-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { History, RotateCcw, Trash2, Save } from "lucide-react";

export function VersionHistoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { versions, saveVersion, restoreVersion, deleteVersion } = useBuilder();
  const [newName, setNewName] = useState("");

  const handleSave = () => {
    saveVersion(newName.trim() || `Version ${versions.length + 1}`);
    setNewName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Version History</DialogTitle>
          <DialogDescription>Save named snapshots of your site. Restore anytime. Keeps the last 20.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* Save new version */}
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Version name (e.g. 'Before redesign')"
              className="h-8 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
            <Button size="sm" className="h-8 gap-1" onClick={handleSave}>
              <Save className="h-3 w-3" /> Save
            </Button>
          </div>
          {/* List */}
          {versions.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No saved versions yet. Save your current state to create a snapshot.</p>
          ) : (
            <div className="max-h-[300px] space-y-1.5 overflow-y-auto builder-scroll">
              {[...versions].reverse().map((v) => (
                <div key={v.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{v.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(v.timestamp).toLocaleString()} · {v.site.pages.length} page{v.site.pages.length === 1 ? "" : "s"} · {v.site.pages.reduce((a, p) => a + p.sections.length, 0)} sections
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => restoreVersion(v.id)} title="Restore"><RotateCcw className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => deleteVersion(v.id)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
