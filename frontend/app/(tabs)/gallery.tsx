import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import SkyBackground from '../../components/aero/SkyBackground';
import StoryboardStrip from '../../components/StoryboardStrip';
import { GLASS } from '../../constants/theme';
import { fetchGallery, Redesign } from '../../lib/redesigns';
import { getOwnerId } from '../../lib/identity';

type Tab = 'community' | 'mine';

export default function GalleryScreen() {
  const [tab, setTab] = useState<Tab>('community');
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [items, setItems] = useState<Redesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Redesign | null>(null);

  useEffect(() => {
    getOwnerId().then(setOwnerId);
  }, []);

  const load = useCallback(async () => {
    if (tab === 'mine' && !ownerId) return; // wait for ownerId before My Rooms
    setError(null);
    try {
      const data = await fetchGallery(tab === 'mine' ? ownerId! : undefined);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load gallery');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, ownerId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderItem = ({ item }: { item: Redesign }) => (
    <Pressable style={styles.card} onPress={() => setSelected(item)}>
      <Image
        source={{ uri: item.frameUrls[2] || item.frameUrls[0] }}
        style={styles.cardImg}
        resizeMode="cover"
      />
      <View style={styles.cardMeta}>
        <Text style={styles.cardStyle} numberOfLines={1}>{item.style || 'Redesign'}</Text>
        <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </Pressable>
  );

  return (
    <SkyBackground>
      <View style={styles.header}>
        <Text style={styles.title}>Gallery</Text>
        <View style={styles.toggle}>
          {(['community', 'mine'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.pill, tab === t && styles.pillActive]}
            >
              <Text style={[styles.pillTxt, tab === t && styles.pillTxtActive]}>
                {t === 'community' ? 'Community' : 'My Rooms'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={GLASS.textDark} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.muted}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => { setLoading(true); load(); }}>
            <Text style={styles.retryTxt}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GLASS.textDark} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.muted}>
                {tab === 'mine'
                  ? 'Your saved rooms will appear here.'
                  : 'No redesigns yet — be the first!'}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        {selected && <RedesignDetail redesign={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </SkyBackground>
  );
}

function RedesignDetail({ redesign, onClose }: { redesign: Redesign; onClose: () => void }) {
  const player = useVideoPlayer(redesign.videoUrl, (p) => {
    p.loop = true;
    p.play();
  });

  return (
    <View style={styles.detailRoot}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <StoryboardStrip
          frame1={redesign.frameUrls[0]}
          frame2={redesign.frameUrls[1]}
          frame3={redesign.frameUrls[2]}
        />
        <VideoView player={player} style={styles.detailVideo} contentFit="cover" />
        {!!redesign.style && <Text style={styles.detailStyle}>{redesign.style}</Text>}
        {!!redesign.description && <Text style={styles.detailDesc}>{redesign.description}</Text>}
      </ScrollView>
      <Pressable style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeTxt}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 54, paddingHorizontal: 16, paddingBottom: 8, gap: 12 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  toggle: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  pillActive: { backgroundColor: '#ffffff' },
  pillTxt: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  pillTxtActive: { color: GLASS.textDark },

  list: { padding: 14, paddingBottom: 110, gap: 12 },
  row: { gap: 12 },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: GLASS.fill,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  cardImg: { width: '100%', aspectRatio: 1 },
  cardMeta: { padding: 8 },
  cardStyle: { color: GLASS.textDark, fontWeight: '700', fontSize: 13, textTransform: 'capitalize' },
  cardDate: { color: GLASS.textDark, opacity: 0.7, fontSize: 11, marginTop: 1 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  muted: { color: GLASS.textDark, opacity: 0.8, fontSize: 13, textAlign: 'center' },
  retry: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  retryTxt: { color: GLASS.textDark, fontWeight: '700', fontSize: 13 },

  detailRoot: { flex: 1, backgroundColor: '#0B0B0F', paddingTop: 54 },
  detailVideo: { width: '100%', height: 280, marginTop: 16 },
  detailStyle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
    paddingHorizontal: 18,
    marginTop: 16,
  },
  detailDesc: { color: '#cbd5e1', fontSize: 13, lineHeight: 20, paddingHorizontal: 18, marginTop: 6 },
  closeBtn: {
    margin: 18,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  closeTxt: { color: '#0B0B0F', textAlign: 'center', fontWeight: '700' },
});
