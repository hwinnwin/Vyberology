/**
 * Vybe Player - Mobile music player tab
 * Uses @vybe/media-engine with native audio adapter
 */

import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  initializeNativePlayer,
  useNativePlayer,
  YouTubeSource,
  formatTime,
  type YouTubeSearchResult,
  type SourcedTrack,
  type Track,
} from '@vybe/media-engine';

// Create YouTube source instance
const youtubeSource = new YouTubeSource();

type PlayerView = 'library' | 'search' | 'queue';

export default function PlayerScreen() {
  const [view, setView] = useState<PlayerView>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localTracks, setLocalTracks] = useState<SourcedTrack[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Player state from hook
  const player = useNativePlayer();

  // Initialize audio player
  useEffect(() => {
    async function init() {
      try {
        await initializeNativePlayer(Audio);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize player:', error);
      }
    }
    init();
  }, []);

  // Search YouTube
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await youtubeSource.search(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Play YouTube result
  const playYouTubeResult = useCallback(async (result: YouTubeSearchResult) => {
    const audioSource = await youtubeSource.getAudioSource(result.videoId);
    if (!audioSource) {
      console.error('Failed to get audio source');
      return;
    }

    const track: Track = {
      id: result.videoId,
      name: result.title,
      artists: [{ id: result.artist, name: result.artist }],
      durationMs: result.duration,
      imageUrl: result.thumbnail,
    };

    // Create sourced track with stream URL
    const sourcedTrack: SourcedTrack = {
      ...track,
      sourceId: result.videoId,
      sourceType: 'youtube',
      streamUrl: audioSource.url,
    };

    await player.playTrack(sourcedTrack);
  }, [player]);

  // Pick local audio files
  const handlePickFiles = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
      });

      if (result.canceled) return;

      const tracks: SourcedTrack[] = result.assets.map((asset) => ({
        id: asset.uri,
        name: asset.name.replace(/\.[^.]+$/, ''),
        artists: [{ id: 'local', name: 'Unknown Artist' }],
        durationMs: 0,
        sourceId: asset.uri,
        sourceType: 'local' as const,
        streamUrl: asset.uri,
      }));

      setLocalTracks((prev) => [...prev, ...tracks]);
    } catch (error) {
      console.error('Failed to pick files:', error);
    }
  }, []);

  // Progress percentage
  const progress = player.duration > 0 ? (player.position / player.duration) * 100 : 0;

  // Render YouTube search result
  const renderSearchResult = ({ item }: { item: YouTubeSearchResult }) => (
    <TouchableOpacity
      style={styles.trackItem}
      onPress={() => playYouTubeResult(item)}
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.thumbnail}
        defaultSource={require('@/assets/images/icon.png')}
      />
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <Text style={styles.duration}>{formatTime(item.duration)}</Text>
    </TouchableOpacity>
  );

  // Render local track
  const renderLocalTrack = ({ item }: { item: SourcedTrack }) => (
    <TouchableOpacity
      style={styles.trackItem}
      onPress={() => player.playTrack(item)}
    >
      <View style={styles.placeholderThumb}>
        <Ionicons name="musical-note" size={24} color="#9333ea" />
      </View>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.artists.map((a) => a.name).join(', ')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => player.addToQueue(item)}
      >
        <Ionicons name="add" size={24} color="#9333ea" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render queue track
  const renderQueueTrack = ({ item, index }: { item: SourcedTrack; index: number }) => (
    <TouchableOpacity
      style={[
        styles.trackItem,
        index === player.currentIndex && styles.currentTrack,
      ]}
      onPress={() => player.skipTo(index)}
    >
      <Text style={styles.queueIndex}>
        {index === player.currentIndex ? '▶' : index + 1}
      </Text>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumbnailSmall} />
      ) : (
        <View style={styles.placeholderThumbSmall}>
          <Ionicons name="musical-note" size={16} color="#9333ea" />
        </View>
      )}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.artists.map((a) => a.name).join(', ')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => player.removeFromQueue(index)}
      >
        <Ionicons name="close" size={20} color="#888" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333ea" />
          <Text style={styles.loadingText}>Initializing player...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="musical-notes" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Vybe Player</Text>
            <Text style={styles.headerSubtitle}>
              {player.isPlaying ? 'Now Playing' : 'Ready to Vybe'}
            </Text>
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        {(['library', 'search', 'queue'] as PlayerView[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.navButton, view === v && styles.navButtonActive]}
            onPress={() => setView(v)}
          >
            <Ionicons
              name={v === 'library' ? 'library' : v === 'search' ? 'search' : 'list'}
              size={18}
              color={view === v ? '#fff' : '#888'}
            />
            <Text style={[styles.navText, view === v && styles.navTextActive]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
              {v === 'queue' && player.queue.length > 0 && ` (${player.queue.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Library View */}
        {view === 'library' && (
          <>
            <TouchableOpacity style={styles.addFilesButton} onPress={handlePickFiles}>
              <Ionicons name="folder-open" size={24} color="#9333ea" />
              <Text style={styles.addFilesText}>Add Local Files</Text>
            </TouchableOpacity>

            {localTracks.length > 0 ? (
              <FlatList
                data={localTracks}
                renderItem={renderLocalTrack}
                keyExtractor={(item) => item.id}
                style={styles.list}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="musical-notes-outline" size={64} color="#444" />
                <Text style={styles.emptyTitle}>No tracks yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add local files or search YouTube
                </Text>
              </View>
            )}
          </>
        )}

        {/* Search View */}
        {view === 'search' && (
          <>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search YouTube..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>

            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.videoId}
                style={styles.list}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="logo-youtube" size={64} color="#444" />
                <Text style={styles.emptyTitle}>Search YouTube</Text>
                <Text style={styles.emptySubtitle}>
                  Find any song, podcast, or audio
                </Text>
              </View>
            )}
          </>
        )}

        {/* Queue View */}
        {view === 'queue' && (
          <>
            {player.queue.length > 0 ? (
              <FlatList
                data={player.queue}
                renderItem={renderQueueTrack}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                style={styles.list}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="list-outline" size={64} color="#444" />
                <Text style={styles.emptyTitle}>Queue is empty</Text>
                <Text style={styles.emptySubtitle}>
                  Add tracks from library or search
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Mini Player */}
      {player.currentTrack && (
        <View style={styles.miniPlayer}>
          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.miniPlayerContent}>
            {/* Track Info */}
            <View style={styles.miniPlayerInfo}>
              {player.currentTrack.imageUrl ? (
                <Image
                  source={{ uri: player.currentTrack.imageUrl }}
                  style={styles.miniPlayerThumb}
                />
              ) : (
                <View style={styles.miniPlayerThumbPlaceholder}>
                  <Ionicons name="musical-note" size={20} color="#9333ea" />
                </View>
              )}
              <View style={styles.miniPlayerText}>
                <Text style={styles.miniPlayerTitle} numberOfLines={1}>
                  {player.currentTrack.name}
                </Text>
                <Text style={styles.miniPlayerArtist} numberOfLines={1}>
                  {player.currentTrack.artists.map((a) => a.name).join(', ')}
                </Text>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity onPress={player.previous}>
                <Ionicons name="play-skip-back" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.playButton} onPress={player.toggle}>
                <Ionicons
                  name={player.isPlaying ? 'pause' : 'play'}
                  size={28}
                  color="#fff"
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={player.next}>
                <Ionicons name="play-skip-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Time */}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(player.position)}</Text>
            <Text style={styles.timeText}>{formatTime(player.duration)}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  nav: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  navButtonActive: {
    backgroundColor: '#9333ea',
  },
  navText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  navTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addFilesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#333',
    backgroundColor: '#111',
    marginBottom: 16,
  },
  addFilesText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9333ea',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#9333ea',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#111',
  },
  currentTrack: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.3)',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  thumbnailSmall: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  placeholderThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderThumbSmall: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  trackArtist: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  duration: {
    fontSize: 13,
    color: '#888',
  },
  queueIndex: {
    width: 24,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
  },
  miniPlayer: {
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#333',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9333ea',
  },
  miniPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  miniPlayerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniPlayerThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  miniPlayerThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPlayerText: {
    flex: 1,
  },
  miniPlayerTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  miniPlayerArtist: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  timeText: {
    fontSize: 11,
    color: '#888',
  },
});
