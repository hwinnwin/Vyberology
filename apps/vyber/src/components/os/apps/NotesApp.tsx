import { useState, useCallback } from "react";
import { Plus, Search, Trash2, Pin, MoreHorizontal } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  color?: string;
}

const COLORS = [
  { id: "default", value: "bg-white/5" },
  { id: "purple", value: "bg-purple-500/20" },
  { id: "pink", value: "bg-pink-500/20" },
  { id: "blue", value: "bg-blue-500/20" },
  { id: "green", value: "bg-green-500/20" },
  { id: "yellow", value: "bg-yellow-500/20" },
];

const INITIAL_NOTES: Note[] = [
  {
    id: "1",
    title: "Welcome to VybeOS Notes",
    content: "This is your personal notes app. Create, edit, and organize your thoughts.\n\n• Pin important notes\n• Color code for organization\n• Search across all notes",
    createdAt: new Date(),
    updatedAt: new Date(),
    isPinned: true,
    color: "purple",
  },
  {
    id: "2",
    title: "Sacred Frequencies",
    content: "0616 - Operating System (Reset)\n0626 - Partnership Frequency\n224 - Stewardship\n369 - Tesla's Key\n1111 - Authority\n528 - Love Frequency",
    createdAt: new Date(),
    updatedAt: new Date(),
    isPinned: false,
    color: "pink",
  },
];

export function NotesApp() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>("1");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  // Filter and sort notes
  const filteredNotes = notes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  // Create new note
  const createNote = useCallback(() => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "New Note",
      content: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  }, []);

  // Update note
  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
      )
    );
  }, []);

  // Delete note
  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNoteId === id) {
      setSelectedNoteId(notes[0]?.id || null);
    }
  }, [selectedNoteId, notes]);

  // Toggle pin
  const togglePin = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  }, []);

  // Get color class
  const getColorClass = (color?: string) => {
    return COLORS.find((c) => c.id === color)?.value || COLORS[0].value;
  };

  return (
    <div className="flex h-full bg-gray-900 text-white">
      {/* Sidebar - Notes list */}
      <div className="flex w-64 flex-col border-r border-white/10 bg-gray-900/50">
        {/* Search and new note */}
        <div className="flex items-center gap-2 border-b border-white/10 p-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
            <Search className="h-4 w-4 text-white/50" />
            <input
              type="text"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="rounded-lg bg-vyber-purple p-2 transition-colors hover:bg-vyber-purple/80"
            onClick={createNote}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredNotes.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/50">
              No notes found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotes.map((note) => (
                <button
                  key={note.id}
                  className={`w-full rounded-lg p-3 text-left transition-colors ${
                    selectedNoteId === note.id
                      ? "bg-vyber-purple/20 ring-1 ring-vyber-purple"
                      : `${getColorClass(note.color)} hover:bg-white/10`
                  }`}
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">{note.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-white/50">
                        {note.content || "No content"}
                      </p>
                    </div>
                    {note.isPinned && (
                      <Pin className="h-3 w-3 shrink-0 text-vyber-purple" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-white/30">
                    {note.updatedAt.toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Note count */}
        <div className="border-t border-white/10 px-4 py-2 text-xs text-white/40">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Main content - Note editor */}
      {selectedNote ? (
        <div className="flex flex-1 flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-2">
              {/* Color picker */}
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  className={`h-5 w-5 rounded-full ${color.value} ${
                    selectedNote.color === color.id
                      ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900"
                      : ""
                  }`}
                  onClick={() => updateNote(selectedNote.id, { color: color.id })}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                className={`rounded p-2 transition-colors hover:bg-white/10 ${
                  selectedNote.isPinned ? "text-vyber-purple" : "text-white/50"
                }`}
                onClick={() => togglePin(selectedNote.id)}
              >
                <Pin className="h-4 w-4" />
              </button>
              <button
                className="rounded p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-red-400"
                onClick={() => deleteNote(selectedNote.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button className="rounded p-2 text-white/50 transition-colors hover:bg-white/10">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Title */}
            <input
              type="text"
              className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-white/30"
              placeholder="Note title"
              value={selectedNote.title}
              onChange={(e) =>
                updateNote(selectedNote.id, { title: e.target.value })
              }
            />

            {/* Date */}
            <p className="mt-2 text-sm text-white/40">
              Last edited{" "}
              {selectedNote.updatedAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>

            {/* Content */}
            <textarea
              className="mt-4 h-full min-h-[200px] w-full resize-none bg-transparent text-white/90 outline-none placeholder:text-white/30"
              placeholder="Start writing..."
              value={selectedNote.content}
              onChange={(e) =>
                updateNote(selectedNote.id, { content: e.target.value })
              }
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-white/50">
          <div className="text-center">
            <p className="text-lg">No note selected</p>
            <button
              className="mt-4 flex items-center gap-2 rounded-lg bg-vyber-purple px-4 py-2 text-white transition-colors hover:bg-vyber-purple/80"
              onClick={createNote}
            >
              <Plus className="h-4 w-4" />
              Create Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
