export type Faction = "crew" | "impostor";

export type Phase = "action" | "meeting" | "ended";

export type RoleId = "frontend" | "backend" | "qa" | "pm" | "intern";

export type RoomId = "workspace" | "meeting" | "qa_lab" | "release" | "breakroom";

export type IncidentType =
  | "page_error"
  | "deploy_blocked"
  | "bad_data"
  | "fake_done";

export type ActionType =
  | "task"
  | "investigate"
  | "repair"
  | "skill"
  | "sabotage"
  | "call_meeting";

export type InteractionRisk = "high" | "medium" | "low";

export interface RoleDef {
  id: RoleId;
  name: string;
  label: string;
  description: string;
  stats: {
    task: number;
    repair: number;
    investigate: number;
    mobility: number;
    social: number;
  };
  passive: string;
  active: string;
}

export interface InteractionOption {
  id: string;
  label: string;
  description: string;
  risk: InteractionRisk;
  successRate: number;
  successScore: number;
  failScore: number;
}

export interface InteractionResolution {
  roomId: RoomId;
  roleId: RoleId;
  actionType: ActionType;
  label: string;
  description: string;
  success: boolean;
  successRate: number;
  score: number;
  node: number;
}

export interface RoomDef {
  id: RoomId;
  name: string;
  description: string;
}

export interface Player {
  id: string;
  name: string;
  persona: string;
  personality: "calm" | "dramatic" | "logical" | "nervous" | "slick";
  roleId: RoleId;
  faction: Faction;
  alive: boolean;
  isHuman: boolean;
  location: RoomId;
  suspicion: number;
  growth: number;
  skillCooldown: number;
  lastActionSummary: string;
  lastPublicClaim: string;
}

export interface Clue {
  id: string;
  text: string;
  credibility: "high" | "medium" | "low";
  round: number;
}

export interface Incident {
  id: string;
  type: IncidentType;
  roomId: RoomId;
  culpritId: string;
  fakeTargetId?: string;
  severity: "normal" | "critical";
  status: "active" | "resolved";
  countdown: number;
  progress: number;
  publicHint: string;
  roomHint: string;
  behaviorHint: string;
  fakeHint?: string;
  createdRound: number;
}

export interface VoteRecord {
  voterId: string;
  targetId: string | null;
}

export interface MeetingSpeech {
  playerId: string;
  text: string;
  targetId?: string;
}

export interface MeetingState {
  round: number;
  summary: string[];
  speeches: MeetingSpeech[];
  stanceOptions: string[];
  recommendedTargets: string[];
}

export interface LogEntry {
  id: string;
  round: number;
  text: string;
  tone: "info" | "warning" | "danger" | "success";
}

export interface PendingAction {
  type: ActionType;
  roomId: RoomId;
  incidentId?: string;
  interactionId?: string;
  interactionLabel?: string;
  interactionSuccess?: boolean;
  interactionScore?: number;
}

export interface GameState {
  phase: Phase;
  round: number;
  playerId: string;
  players: Player[];
  incidents: Incident[];
  clues: Clue[];
  logs: LogEntry[];
  votes: VoteRecord[];
  stability: number;
  releaseProgress: number;
  meeting: MeetingState | null;
  lastInteraction: InteractionResolution | null;
  winner: Faction | null;
  endingTitle: string;
  endingReason: string;
}
