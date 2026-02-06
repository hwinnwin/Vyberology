/**
 * MusicPlayer - Full music player page for Vyber browser
 * Integrates @vybe/media-engine for cross-platform audio playback
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Music,
  Search,
  Plus,
  FolderOpen,
  Youtube,
  ListMusic,
  Heart,
  MoreHorizontal,
  ChevronLeft,
  Disc3,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Shuffle,
  Repeat,
} from "lucide-react";
import { clsx } from "clsx";
import {
  usePlayerStore,
  YouTubeSource,
  LocalSource,
  openFilePicker,
  formatTime,
  type Track,
  type SourcedTrack,
  type YouTubeSearchResult,
} from "@vybe/media-engine";

type View = "library" | "search" | "queue" | "fullplayer";

// Create instances
const youtubeSource = new YouTubeSource();
const localSource = new LocalSource();

export function MusicPlayer() {
  const [view, setView] = useState<View>("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localTracks, setLocalTracks] = useState<SourcedTrack[]>([]);

  // Get all state from the store
  const {
    state: playbackState,
    currentTrack,
    queue,
    currentIndex,
    position,
    duration,
    volume,
    shuffled,
    loopMode,
    initialize,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    setLoopMode,
    playTrack,
    playTracks,
    addToQueue,
    removeFromQueue,
  } = usePlayerStore();

  // Initialize player on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Search YouTube
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await youtubeSource.search(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Play YouTube result
  const playYouTubeResult = useCallback(async (result: YouTubeSearchResult) => {
    const audioSource = await youtubeSource.getAudioSource(result.videoId);
    if (!audioSource) {
      console.error("Failed to get audio source");
      return;
    }

    const track: Track = {
      id: result.videoId,
      name: result.title,
      artists: [{ id: result.artist, name: result.artist }],
      durationMs: result.duration,
      imageUrl: result.thumbnail,
    };

    await playTrack(track);
  }, [playTrack]);

  // Add local files
  const handleAddLocalFiles = useCallback(async () => {
    try {
      const files = await openFilePicker({ multiple: true });
      if (!files) return;

      const tracks = await localSource.createTracksFromFiles(files);
      setLocalTracks(prev => [...prev, ...tracks]);
    } catch (error) {
      console.error("Failed to add local files:", error);
    }
  }, []);

  // Computed values
  const progress = useMemo(() => {
    return duration > 0 ? (position / duration) * 100 : 0;
  }, [position, duration]);

  // Render YouTube result item
  const YouTubeResultItem = ({ result }: { result: YouTubeSearchResult }) => (
    <div
      className="group flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-secondary/50 cursor-pointer"
      onClick={() => playYouTubeResult(result)}
    >
      <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/50 overflow-hidden">
        {result.thumbnail ? (
          <img src={result.thumbnail} alt={result.title} className="h-full w-full object-cover" />
        ) : (
          <Youtube className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-8 w-8 rounded-full bg-vyber-purple flex items-center justify-center">
            <Play className="h-4 w-4 text-white ml-0.5" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{result.title}</p>
        <p className="text-sm text-muted-foreground truncate">{result.artist}</p>
      </div>

      <span className="text-sm text-muted-foreground">
        {formatTime(result.duration)}
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 rounded-full hover:bg-secondary">
          <Heart className="h-4 w-4" />
        </button>
        <button className="p-2 rounded-full hover:bg-secondary">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  // Render local track item
  const TrackItem = ({ track }: { track: SourcedTrack }) => (
    <div
      className="group flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-secondary/50 cursor-pointer"
      onClick={() => playTrack(track)}
    >
      <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/50 overflow-hidden">
        {track.imageUrl ? (
          <img src={track.imageUrl} alt={track.name} className="h-full w-full object-cover" />
        ) : (
          <Music className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-8 w-8 rounded-full bg-vyber-purple flex items-center justify-center">
            <Disc3 className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{track.name}</p>
        <p className="text-sm text-muted-foreground truncate">
          {track.artists.map(a => a.name).join(", ") || "Unknown Artist"}
        </p>
      </div>

      <span className="text-sm text-muted-foreground">
        {formatTime(track.durationMs)}
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-2 rounded-full hover:bg-secondary"
          onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button className="p-2 rounded-full hover:bg-secondary">
          <Heart className="h-4 w-4" />
        </button>
        <button className="p-2 rounded-full hover:bg-secondary">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  // Render queue item
  const QueueItem = ({ track, index }: { track: SourcedTrack; index: number }) => (
    <div
      className={clsx(
        "group flex items-center gap-3 rounded-xl p-3 transition-all cursor-pointer",
        index === currentIndex ? "bg-vyber-purple/20 border border-vyber-purple/30" : "hover:bg-secondary/50"
      )}
      onClick={() => playTrack(track)}
    >
      <span className="w-6 text-center text-sm text-muted-foreground">
        {index === currentIndex ? (
          <Disc3 className="h-4 w-4 animate-spin text-vyber-purple mx-auto" />
        ) : (
          index + 1
        )}
      </span>

      <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50 overflow-hidden">
        {track.imageUrl ? (
          <img src={track.imageUrl} alt={track.name} className="h-full w-full object-cover" />
        ) : (
          <Music className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{track.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {track.artists.map(a => a.name).join(", ")}
        </p>
      </div>

      <span className="text-xs text-muted-foreground">
        {formatTime(track.durationMs)}
      </span>

      <button
        className="p-1.5 rounded-full hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); removeFromQueue(index); }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-vyber-purple via-vyber-pink to-vyber-cyan shadow-glow">
            <Music className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold">Vybe Player</h1>
            <p className="text-xs text-muted-foreground">
              {playbackState === "playing" ? "Now Playing" : "Ready to Vybe"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <button
            onClick={() => setView("library")}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              view === "library"
                ? "bg-vyber-purple text-white"
                : "hover:bg-secondary"
            )}
          >
            <ListMusic className="h-4 w-4" />
            Library
          </button>
          <button
            onClick={() => setView("search")}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              view === "search"
                ? "bg-vyber-purple text-white"
                : "hover:bg-secondary"
            )}
          >
            <Youtube className="h-4 w-4" />
            Search
          </button>
          <button
            onClick={() => setView("queue")}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              view === "queue"
                ? "bg-vyber-purple text-white"
                : "hover:bg-secondary"
            )}
          >
            <ListMusic className="h-4 w-4" />
            Queue
            {queue.length > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                {queue.length}
              </span>
            )}
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        {/* Library View */}
        {view === "library" && (
          <div className="space-y-6">
            {/* Add Files Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleAddLocalFiles}
                className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 px-6 py-4 transition-all hover:border-vyber-purple hover:bg-secondary/50"
              >
                <FolderOpen className="h-5 w-5 text-vyber-purple" />
                <span className="font-medium">Add Local Files</span>
              </button>
              <p className="text-sm text-muted-foreground">
                or search YouTube for music
              </p>
            </div>

            {/* Local Tracks */}
            {localTracks.length > 0 ? (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Your Music</h2>
                <div className="space-y-1">
                  {localTracks.map((track) => (
                    <TrackItem key={track.id} track={track} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/50">
                  <Music className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No tracks yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add local files or search YouTube to get started
                </p>
              </div>
            )}
          </div>
        )}

        {/* Search View */}
        {view === "search" && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/50 p-2 pl-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                className="flex-1 bg-transparent py-2 outline-none placeholder:text-muted-foreground"
                placeholder="Search YouTube for music..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-vyber-purple to-vyber-pink px-4 py-2 font-medium text-white transition-transform hover:scale-105 disabled:opacity-50"
              >
                {isSearching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((result) => (
                  <YouTubeResultItem key={result.videoId} result={result} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/50">
                  <Youtube className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Search YouTube</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Find any song, podcast, or audio content
                </p>
              </div>
            )}
          </div>
        )}

        {/* Queue View */}
        {view === "queue" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Queue ({queue.length})</h2>
              {queue.length > 0 && (
                <button
                  onClick={() => playTracks(queue, 0)}
                  className="flex items-center gap-2 rounded-lg bg-vyber-purple px-3 py-1.5 text-sm font-medium text-white"
                >
                  <Play className="h-4 w-4" />
                  Play All
                </button>
              )}
            </div>

            {queue.length > 0 ? (
              <div className="space-y-1">
                {queue.map((track, index) => (
                  <QueueItem key={`${track.id}-${index}`} track={track} index={index} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/50">
                  <ListMusic className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Queue is empty</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add tracks from your library or search results
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mini Player - Fixed Bottom */}
      {currentTrack && view !== "fullplayer" && (
        <div className="border-t border-border bg-secondary/30 p-3">
          <div className="flex items-center gap-4">
            {/* Track Info */}
            <div
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              onClick={() => setView("fullplayer")}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/50 overflow-hidden">
                {currentTrack.imageUrl ? (
                  <img src={currentTrack.imageUrl} alt={currentTrack.name} className="h-full w-full object-cover" />
                ) : (
                  <Music className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{currentTrack.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {currentTrack.artists.map(a => a.name).join(", ")}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleShuffle}
                className={clsx(
                  "p-2 rounded-full transition-colors",
                  shuffled ? "text-vyber-purple" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shuffle className="h-4 w-4" />
              </button>

              <button onClick={previous} className="p-2 rounded-full hover:bg-secondary">
                <SkipBack className="h-5 w-5" />
              </button>

              <button
                onClick={toggle}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-vyber-purple text-white"
              >
                {playbackState === "playing" ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </button>

              <button onClick={next} className="p-2 rounded-full hover:bg-secondary">
                <SkipForward className="h-5 w-5" />
              </button>

              <button
                onClick={() => setLoopMode(loopMode === "off" ? "all" : loopMode === "all" ? "one" : "off")}
                className={clsx(
                  "p-2 rounded-full transition-colors",
                  loopMode !== "off" ? "text-vyber-purple" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Repeat className="h-4 w-4" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 accent-vyber-purple"
              />
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatTime(position)}</span>
              <div className="w-32 h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-vyber-purple transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Full Player Overlay */}
      {view === "fullplayer" && currentTrack && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-background via-background to-vyber-purple/20">
          {/* Back Button */}
          <button
            onClick={() => setView("library")}
            className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-secondary/50 px-4 py-2 text-sm font-medium backdrop-blur-sm hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {/* Full Player Content */}
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            {/* Large Artwork */}
            <div className="mb-8 flex h-80 w-80 items-center justify-center rounded-3xl bg-secondary/50 overflow-hidden shadow-2xl">
              {currentTrack.imageUrl ? (
                <img src={currentTrack.imageUrl} alt={currentTrack.name} className="h-full w-full object-cover" />
              ) : (
                <Disc3 className="h-32 w-32 text-muted-foreground animate-spin-slow" />
              )}
            </div>

            {/* Track Info */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">{currentTrack.name}</h2>
              <p className="text-lg text-muted-foreground">
                {currentTrack.artists.map(a => a.name).join(", ")}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md mb-6">
              <input
                type="range"
                min="0"
                max={duration}
                value={position}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full accent-vyber-purple"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>{formatTime(position)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
              <button
                onClick={toggleShuffle}
                className={clsx(
                  "p-3 rounded-full transition-colors",
                  shuffled ? "text-vyber-purple" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shuffle className="h-6 w-6" />
              </button>

              <button onClick={previous} className="p-3 rounded-full hover:bg-secondary">
                <SkipBack className="h-8 w-8" />
              </button>

              <button
                onClick={toggle}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-vyber-purple to-vyber-pink text-white shadow-glow"
              >
                {playbackState === "playing" ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </button>

              <button onClick={next} className="p-3 rounded-full hover:bg-secondary">
                <SkipForward className="h-8 w-8" />
              </button>

              <button
                onClick={() => setLoopMode(loopMode === "off" ? "all" : loopMode === "all" ? "one" : "off")}
                className={clsx(
                  "p-3 rounded-full transition-colors",
                  loopMode !== "off" ? "text-vyber-purple" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Repeat className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
