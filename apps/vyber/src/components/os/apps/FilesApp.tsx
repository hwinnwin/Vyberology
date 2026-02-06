import { useState, useCallback } from "react";
import {
  Folder,
  File,
  Image,
  Music,
  Video,
  FileText,
  Code,
  Archive,
  ChevronRight,
  ChevronDown,
  Home,
  Star,
  Clock,
  Trash2,
  HardDrive,
  Cloud,
  Grid,
  List,
  Search,
  Plus,
  Upload,
} from "lucide-react";

// File types
type FileType = "folder" | "file" | "image" | "music" | "video" | "document" | "code" | "archive";

interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size?: number;
  modifiedAt: Date;
  children?: FileItem[];
  icon?: string;
}

// Mock file system
const MOCK_FILES: FileItem[] = [
  {
    id: "1",
    name: "Documents",
    type: "folder",
    modifiedAt: new Date(),
    children: [
      { id: "1-1", name: "Resume.pdf", type: "document", size: 245000, modifiedAt: new Date() },
      { id: "1-2", name: "Notes.md", type: "document", size: 12000, modifiedAt: new Date() },
      {
        id: "1-3",
        name: "Projects",
        type: "folder",
        modifiedAt: new Date(),
        children: [
          { id: "1-3-1", name: "vyber-app", type: "folder", modifiedAt: new Date(), children: [] },
          { id: "1-3-2", name: "design-system", type: "folder", modifiedAt: new Date(), children: [] },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Pictures",
    type: "folder",
    modifiedAt: new Date(),
    children: [
      { id: "2-1", name: "vacation.jpg", type: "image", size: 3200000, modifiedAt: new Date() },
      { id: "2-2", name: "profile.png", type: "image", size: 520000, modifiedAt: new Date() },
      { id: "2-3", name: "Screenshots", type: "folder", modifiedAt: new Date(), children: [] },
    ],
  },
  {
    id: "3",
    name: "Music",
    type: "folder",
    modifiedAt: new Date(),
    children: [
      { id: "3-1", name: "Favorites", type: "folder", modifiedAt: new Date(), children: [] },
      { id: "3-2", name: "track01.mp3", type: "music", size: 8500000, modifiedAt: new Date() },
    ],
  },
  {
    id: "4",
    name: "Downloads",
    type: "folder",
    modifiedAt: new Date(),
    children: [
      { id: "4-1", name: "installer.dmg", type: "archive", size: 125000000, modifiedAt: new Date() },
      { id: "4-2", name: "data.zip", type: "archive", size: 45000000, modifiedAt: new Date() },
    ],
  },
  {
    id: "5",
    name: "Code",
    type: "folder",
    modifiedAt: new Date(),
    children: [
      { id: "5-1", name: "index.ts", type: "code", size: 4500, modifiedAt: new Date() },
      { id: "5-2", name: "App.tsx", type: "code", size: 8200, modifiedAt: new Date() },
      { id: "5-3", name: "styles.css", type: "code", size: 2100, modifiedAt: new Date() },
    ],
  },
];

// Get icon for file type
function getFileIcon(type: FileType) {
  switch (type) {
    case "folder":
      return <Folder className="h-5 w-5 text-blue-400" />;
    case "image":
      return <Image className="h-5 w-5 text-pink-400" />;
    case "music":
      return <Music className="h-5 w-5 text-purple-400" />;
    case "video":
      return <Video className="h-5 w-5 text-red-400" />;
    case "document":
      return <FileText className="h-5 w-5 text-orange-400" />;
    case "code":
      return <Code className="h-5 w-5 text-green-400" />;
    case "archive":
      return <Archive className="h-5 w-5 text-yellow-400" />;
    default:
      return <File className="h-5 w-5 text-gray-400" />;
  }
}

// Format file size
function formatSize(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, isActive, onClick }: SidebarItemProps) {
  return (
    <button
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
        isActive
          ? "bg-vyber-purple/20 text-vyber-purple"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

interface FileRowProps {
  file: FileItem;
  isSelected: boolean;
  viewMode: "grid" | "list";
  onSelect: () => void;
  onOpen: () => void;
}

function FileRow({ file, isSelected, viewMode, onSelect, onOpen }: FileRowProps) {
  if (viewMode === "grid") {
    return (
      <button
        className={`flex flex-col items-center gap-2 rounded-xl p-4 transition-colors ${
          isSelected
            ? "bg-vyber-purple/20 ring-2 ring-vyber-purple"
            : "hover:bg-white/10"
        }`}
        onClick={onSelect}
        onDoubleClick={onOpen}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/5">
          {file.type === "folder" ? (
            <Folder className="h-10 w-10 text-blue-400" />
          ) : (
            getFileIcon(file.type)
          )}
        </div>
        <span className="line-clamp-2 text-center text-xs font-medium">
          {file.name}
        </span>
      </button>
    );
  }

  return (
    <button
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        isSelected
          ? "bg-vyber-purple/20"
          : "hover:bg-white/10"
      }`}
      onClick={onSelect}
      onDoubleClick={onOpen}
    >
      {getFileIcon(file.type)}
      <span className="flex-1 text-left text-sm">{file.name}</span>
      <span className="text-xs text-white/50">{formatSize(file.size)}</span>
      <span className="text-xs text-white/50">
        {file.modifiedAt.toLocaleDateString()}
      </span>
    </button>
  );
}

export function FilesApp() {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["1"]));

  // Get current folder contents
  const getCurrentFolder = useCallback((): FileItem[] => {
    if (currentPath.length === 0) return MOCK_FILES;

    let current: FileItem[] = MOCK_FILES;
    for (const segment of currentPath) {
      const folder = current.find((f) => f.name === segment);
      if (folder?.children) {
        current = folder.children;
      } else {
        return [];
      }
    }
    return current;
  }, [currentPath]);

  const currentFiles = getCurrentFolder();

  // Filter files by search
  const filteredFiles = searchQuery
    ? currentFiles.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentFiles;

  // Handle navigation
  const navigateToFolder = useCallback((folderName: string) => {
    setCurrentPath((prev) => [...prev, folderName]);
    setSelectedFile(null);
  }, []);

  const navigateUp = useCallback(() => {
    setCurrentPath((prev) => prev.slice(0, -1));
    setSelectedFile(null);
  }, []);

  const navigateToRoot = useCallback(() => {
    setCurrentPath([]);
    setSelectedFile(null);
  }, []);

  // Handle file open
  const handleOpenFile = useCallback(
    (file: FileItem) => {
      if (file.type === "folder") {
        navigateToFolder(file.name);
      } else {
        // TODO: Open file with appropriate app
        console.log("Open file:", file.name);
      }
    },
    [navigateToFolder]
  );

  // Toggle folder in sidebar
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Render sidebar folder tree
  const renderFolderTree = (items: FileItem[], depth = 0) => {
    return items
      .filter((item) => item.type === "folder")
      .map((folder) => (
        <div key={folder.id}>
          <button
            className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => {
              if (folder.children && folder.children.length > 0) {
                toggleFolder(folder.id);
              }
            }}
            onDoubleClick={() => {
              setCurrentPath([folder.name]);
              setSelectedFile(null);
            }}
          >
            {folder.children && folder.children.some((c) => c.type === "folder") ? (
              expandedFolders.has(folder.id) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : (
              <span className="w-3" />
            )}
            <Folder className="h-4 w-4 text-blue-400" />
            <span className="truncate">{folder.name}</span>
          </button>
          {expandedFolders.has(folder.id) &&
            folder.children &&
            renderFolderTree(folder.children, depth + 1)}
        </div>
      ));
  };

  return (
    <div className="flex h-full bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="flex w-48 flex-col border-r border-white/10 bg-gray-900/50">
        {/* Favorites */}
        <div className="p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-white/40">
            Favorites
          </p>
          <div className="space-y-0.5">
            <SidebarItem
              icon={<Home className="h-4 w-4" />}
              label="Home"
              isActive={currentPath.length === 0}
              onClick={navigateToRoot}
            />
            <SidebarItem
              icon={<Star className="h-4 w-4 text-yellow-400" />}
              label="Favorites"
            />
            <SidebarItem
              icon={<Clock className="h-4 w-4" />}
              label="Recent"
            />
            <SidebarItem
              icon={<Trash2 className="h-4 w-4" />}
              label="Trash"
            />
          </div>
        </div>

        {/* Locations */}
        <div className="p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-white/40">
            Locations
          </p>
          <div className="space-y-0.5">
            <SidebarItem
              icon={<HardDrive className="h-4 w-4" />}
              label="Local"
            />
            <SidebarItem
              icon={<Cloud className="h-4 w-4 text-cyan-400" />}
              label="Cloud"
            />
          </div>
        </div>

        {/* Folders */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-white/40">
            Folders
          </p>
          <div className="space-y-0.5">{renderFolderTree(MOCK_FILES)}</div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-gray-800/50 px-4 py-2">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              className="rounded p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
              onClick={navigateUp}
              disabled={currentPath.length === 0}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
            <button
              className="rounded p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
              disabled
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm">
            <button
              className="rounded px-2 py-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              onClick={navigateToRoot}
            >
              Home
            </button>
            {currentPath.map((segment, index) => (
              <div key={index} className="flex items-center">
                <ChevronRight className="h-4 w-4 text-white/30" />
                <button
                  className="rounded px-2 py-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                >
                  {segment}
                </button>
              </div>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
            <Search className="h-4 w-4 text-white/50" />
            <input
              type="text"
              className="w-32 bg-transparent text-sm outline-none placeholder:text-white/30"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View mode */}
          <div className="flex items-center rounded-lg bg-white/10 p-0.5">
            <button
              className={`rounded p-1.5 transition-colors ${
                viewMode === "list" ? "bg-white/20" : "hover:bg-white/10"
              }`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              className={`rounded p-1.5 transition-colors ${
                viewMode === "grid" ? "bg-white/20" : "hover:bg-white/10"
              }`}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          <button className="rounded p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
            <Plus className="h-4 w-4" />
          </button>
          <button className="rounded p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
            <Upload className="h-4 w-4" />
          </button>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredFiles.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-white/50">
              <Folder className="mb-4 h-16 w-16 opacity-30" />
              <p>This folder is empty</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
              {filteredFiles.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  isSelected={selectedFile === file.id}
                  viewMode={viewMode}
                  onSelect={() => setSelectedFile(file.id)}
                  onOpen={() => handleOpenFile(file)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              {/* Header */}
              <div className="flex items-center gap-3 px-3 py-1 text-xs font-medium text-white/40">
                <span className="w-5" />
                <span className="flex-1">Name</span>
                <span className="w-20 text-right">Size</span>
                <span className="w-24 text-right">Modified</span>
              </div>
              {filteredFiles.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  isSelected={selectedFile === file.id}
                  viewMode={viewMode}
                  onSelect={() => setSelectedFile(file.id)}
                  onOpen={() => handleOpenFile(file)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-white/10 bg-gray-800/50 px-4 py-1 text-xs text-white/50">
          <span>{filteredFiles.length} items</span>
          {selectedFile && (
            <span>
              {filteredFiles.find((f) => f.id === selectedFile)?.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
