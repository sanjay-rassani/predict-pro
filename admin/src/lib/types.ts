export type DashboardStats = {
  todaysMatches: number;
  liveMatches: number;
  publishedPredictions: number;
  pendingSignals: number;
  premiumUsers: number;
};

export type Match = {
  id: number;
  home_team: string;
  away_team: string;
  league: string;
  market: string | null;
  match_datetime: string;
  published: boolean;
  home_score?: number;
  away_score?: number;
  match_status?: string;
};

export type Prediction = {
  id: number;
  match_id: number;
  type: string;
  predicted_value: string;
  odds: number | null;
  confidence_score: number | null;
  notes: string | null;
  publish_status: string;
  approval_status: string;
  is_automated_signal: boolean;
  result_status: string;
  home_team?: string;
  away_team?: string;
  league?: string;
};

export type NewsArticle = {
  id: number;
  title: string;
  body: string;
  image_url: string | null;
  category: string;
  published: boolean;
  created_at: string;
};

export type AdminSettings = {
  notificationsEnabled: boolean;
  apiHealth: {
    apiFootballConfigured: boolean;
    apiUsage: { requestCount: number; lastRequestAt: number | null };
  };
};

export type LoginResponse = {
  token: string;
  admin: { id: number; email: string };
};

export type AppUser = {
  id: number;
  email: string;
  role: 'free' | 'premium';
  created_at: string;
};
