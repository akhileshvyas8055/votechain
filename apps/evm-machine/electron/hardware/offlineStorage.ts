export interface OfflineVote {
  id: string;
  payload: any;
  timestamp: string;
  synced: boolean;
}

export class OfflineStorageManager {
  private memoryStore: OfflineVote[] = [];

  async saveOfflineVote(voteData: any): Promise<void> {
    const record: OfflineVote = {
      id: Math.random().toString(36).substring(7),
      payload: voteData,
      timestamp: new Date().toISOString(),
      synced: false,
    };
    this.memoryStore.push(record);
    console.log('Vote stored in secure offline memory buffer:', record.id);
  }

  async getPendingVotes(): Promise<OfflineVote[]> {
    return this.memoryStore.filter((v) => !v.synced);
  }

  async markAsSynced(id: string): Promise<void> {
    const item = this.memoryStore.find((v) => v.id === id);
    if (item) item.synced = true;
  }
}
