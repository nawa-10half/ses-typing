export interface ScoreSubmission {
  playerId: string
  nickname: string
  score: number
  accuracy: number
  maxCombo: number
  totalTime: number
  rankTitle: string
}

export interface ScoreResponse {
  id: string
  globalRank: number
}

export interface RankingEntry {
  id: string
  nickname: string
  score: number
  accuracy: number
  maxCombo: number
  rankTitle: string
  createdAt: string
}

export interface RankingsResponse {
  rankings: RankingEntry[]
  total: number
}
