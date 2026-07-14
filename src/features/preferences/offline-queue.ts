import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import type { OfflinePreferenceAction } from '@/features/preferences/types';
import { isEnvConfigured } from '@/lib/env';
import { applyShowLessFeedback, hideCreator, unhideCreator } from '@/services/preferences';
import { blockCreator, unblockCreator } from '@/services/social';

const QUEUE_KEY = 'taste:preference-offline-queue';

export async function enqueuePreferenceAction(action: OfflinePreferenceAction): Promise<void> {
  const current = await readQueue();
  current.push(action);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(current));
}

export async function readQueue(): Promise<OfflinePreferenceAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as OfflinePreferenceAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(actions: OfflinePreferenceAction[]): Promise<void> {
  if (actions.length === 0) {
    await AsyncStorage.removeItem(QUEUE_KEY);
    return;
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(actions));
}

export async function flushPreferenceQueue(): Promise<number> {
  if (!isEnvConfigured()) {
    return 0;
  }
  const net = await NetInfo.fetch();
  if (!(net.isConnected && net.isInternetReachable !== false)) {
    return 0;
  }

  const queue = await readQueue();
  if (queue.length === 0) {
    return 0;
  }

  const remaining: OfflinePreferenceAction[] = [];
  let flushed = 0;

  for (const action of queue) {
    try {
      switch (action.kind) {
        case 'show_less':
          await applyShowLessFeedback(action.payload);
          break;
        case 'hide_creator':
          await hideCreator(action.creatorId);
          break;
        case 'unhide_creator':
          await unhideCreator(action.creatorId);
          break;
        case 'block_creator':
          await blockCreator(action.creatorId);
          break;
        case 'unblock_creator':
          await unblockCreator(action.creatorId);
          break;
        default:
          break;
      }
      flushed += 1;
    } catch {
      remaining.push(action);
    }
  }

  await writeQueue(remaining);
  return flushed;
}
