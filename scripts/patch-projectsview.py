#!/usr/bin/env python3
"""Replace the 5-button action row in ProjectsView cards with Open + ⋯ menu + Delete."""
from pathlib import Path

path = Path("/home/z/my-project/src/components/sites/projects/ProjectsView.tsx")
lines = path.read_text(encoding="utf-8").splitlines(keepends=False)

# Lines are 1-indexed in my inspection: 290..317 hold the 4 icon buttons
# (copy / open published / duplicate / delete). Keep 287-289 (Open button),
# replace 290-317 with the new dropdown + delete block.
assert "Copy published link for" in lines[295], lines[295]  # sanity: aria-label (sed line 296)
assert lines[285].strip().startswith('<div className="flex gap-1 border-t'), lines[285]
assert lines[287].strip().endswith("Open"), lines[287]
assert lines[317].strip() == "</div>", lines[317]

NEW = '''                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="lf-focus h-7 w-7 gap-1 border-zinc-800 bg-transparent p-0 text-[11px] text-zinc-400 hover:border-violet-500/50 hover:text-zinc-100"
                            aria-label={`More actions for ${p.name}`}
                            title="More actions — open published page, copy link, duplicate"
                            disabled={busyThis}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 border-zinc-800 bg-zinc-900">
                          <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => openPublished(p)}>
                            <ExternalLink className="h-3.5 w-3.5 text-zinc-300" />
                            <span className="flex-1">Open published</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => void copyPublishedLink(p)}>
                            <Link2 className="h-3.5 w-3.5 text-zinc-300" /> Copy published link
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => duplicate(p)}>
                            <Copy className="h-3.5 w-3.5 text-zinc-300" /> Duplicate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="outline"
                        size="sm"
                        className="lf-focus h-7 w-7 gap-1 border-zinc-800 bg-transparent p-0 text-[11px] text-zinc-400 hover:border-rose-500/50 hover:text-rose-300"
                        onClick={() => setDeleteTarget(p)}
                        disabled={busyThis}
                        aria-label={`Delete ${p.name}`}
                        title="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>'''.splitlines()

# also add lf-focus to the Open button (sed line 287, idx 286)
lines[286] = lines[286].replace('className="h-7 flex-1', 'className="lf-focus h-7 flex-1')

out = lines[:289] + NEW + lines[317:]
path.write_text("\n".join(out) + "\n", encoding="utf-8")
print("spliced OK — new line count:", len(out))
