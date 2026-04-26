import {
  Clue,
  GameState,
  Incident,
  IncidentType,
  InteractionOption,
  InteractionResolution,
  MeetingSpeech,
  MeetingState,
  PendingAction,
  Player,
  RoleDef,
  RoleId,
  RoomDef,
  RoomId,
  VoteRecord,
} from "./types";

const PLAYER_NAMES = ["You", "Ada", "Milo", "Tess", "Nova"];
const PERSONAS = [
  "刚进组，但很愿意干活。",
  "平时话不多，关键时刻会补一句。",
  "嘴上说稳，手上已经开始甩锅。",
  "很爱讲流程，但自己也会漏。",
  "看起来老实，其实很会带节奏。",
];
const PERSONALITIES: Array<Player["personality"]> = ["calm", "logical", "slick", "nervous", "dramatic"];
const ROLE_POOL: RoleId[] = ["frontend", "backend", "qa", "pm", "intern"];
const STANCES = ["强烈怀疑一个人", "解释自己的行动", "先修问题再投票", "先跟大部队判断"];
const CREW_ACTION_NODES = 1;
const IMPOSTOR_ACTION_NODES = 2;

export const ROOM_LAYOUT: Array<{ id: RoomId; x: number; y: number }> = [
  { id: "workspace", x: 18, y: 22 },
  { id: "meeting", x: 52, y: 18 },
  { id: "qa_lab", x: 80, y: 28 },
  { id: "release", x: 32, y: 68 },
  { id: "breakroom", x: 72, y: 74 },
];

export const ROLES: Record<RoleId, RoleDef> = {
  frontend: {
    id: "frontend",
    name: "开发",
    label: "推进快",
    description: "推进任务最快，遇到页面和交互问题也更容易顶上去。",
    stats: { task: 5, repair: 3, investigate: 2, mobility: 3, social: 2 },
    passive: "做事时更容易多推一点进度。",
    active: "快速热修：立刻补一截修复进度。",
  },
  backend: {
    id: "backend",
    name: "后端",
    label: "修问题稳",
    description: "修问题和查逻辑都比较稳，适合压关键故障。",
    stats: { task: 3, repair: 4, investigate: 4, mobility: 2, social: 2 },
    passive: "更容易查出高可信线索。",
    active: "深挖链路：额外拿一条强线索。",
  },
  qa: {
    id: "qa",
    name: "测试",
    label: "查问题准",
    description: "最会复现和排查，也更容易听出谁在瞎说。",
    stats: { task: 2, repair: 3, investigate: 5, mobility: 2, social: 3 },
    passive: "更容易识别假线索。",
    active: "补一次复测：指出一条可疑说法的问题。",
  },
  pm: {
    id: "pm",
    name: "软件经理",
    label: "控节奏强",
    description: "做活一般，但特别会控节奏，开会和对口径更有影响力。",
    stats: { task: 3, repair: 1, investigate: 3, mobility: 3, social: 5 },
    passive: "开会时你的说法更容易被跟。",
    active: "临时拉会：更容易把局势带进会议。",
  },
  intern: {
    id: "intern",
    name: "实习生",
    label: "越打越顺",
    description: "前期普通，但多做几轮后会慢慢上手。",
    stats: { task: 2, repair: 2, investigate: 2, mobility: 4, social: 2 },
    passive: "多做事会成长。",
    active: "到处问问：拿一条模糊但有用的提示。",
  },
};

export const ROLE_INTERACTIONS: Record<RoleId, InteractionOption[]> = {
  frontend: [
    { id: "refactor", label: "代码重构", description: "高风险高收益，敢大改一波。", risk: "high", successRate: 0.35, successScore: 95, failScore: 28 },
    { id: "review", label: "代码检视", description: "中风险中收益，查关键改动。", risk: "medium", successRate: 0.62, successScore: 70, failScore: 36 },
    { id: "optimize", label: "代码优化", description: "低风险低收益，稳着调细节。", risk: "low", successRate: 0.84, successScore: 48, failScore: 26 },
  ],
  backend: [
    { id: "schema", label: "链路重整", description: "高风险高收益，直接动核心链路。", risk: "high", successRate: 0.34, successScore: 94, failScore: 27 },
    { id: "trace", label: "接口排查", description: "中风险中收益，顺着日志往下追。", risk: "medium", successRate: 0.61, successScore: 72, failScore: 35 },
    { id: "guard", label: "参数兜底", description: "低风险低收益，先把常见坑堵上。", risk: "low", successRate: 0.83, successScore: 50, failScore: 25 },
  ],
  qa: [
    { id: "full_regression", label: "全量回归", description: "高风险高收益，一口气扫完整轮。", risk: "high", successRate: 0.33, successScore: 96, failScore: 26 },
    { id: "targeted_retest", label: "重点复测", description: "中风险中收益，盯住可疑点。", risk: "medium", successRate: 0.64, successScore: 71, failScore: 34 },
    { id: "spot_check", label: "抽样检查", description: "低风险低收益，先抓常见毛病。", risk: "low", successRate: 0.85, successScore: 47, failScore: 24 },
  ],
  pm: [
    { id: "all_hands", label: "拉所有人开会对齐", description: "高风险高收益，赌一次全员同步。", risk: "high", successRate: 0.31, successScore: 97, failScore: 29 },
    { id: "risk_talk", label: "找风险模块谈话", description: "中风险中收益，盯关键责任人。", risk: "medium", successRate: 0.6, successScore: 73, failScore: 36 },
    { id: "progress_check", label: "项目进度检查", description: "低风险低收益，稳住全局节奏。", risk: "low", successRate: 0.86, successScore: 46, failScore: 23 },
  ],
  intern: [
    { id: "cross_help", label: "到处帮忙补位", description: "高风险高收益，哪边缺人就往哪冲。", risk: "high", successRate: 0.32, successScore: 93, failScore: 30 },
    { id: "follow_issue", label: "跟着查一个点", description: "中风险中收益，盯住一个问题学。", risk: "medium", successRate: 0.63, successScore: 69, failScore: 35 },
    { id: "take_notes", label: "整理问题记录", description: "低风险低收益，把今天的问题记清楚。", risk: "low", successRate: 0.87, successScore: 45, failScore: 22 },
  ],
};

export const ROOMS: RoomDef[] = [
  { id: "workspace", name: "工位区", description: "改代码、看页面、接日常活。" },
  { id: "meeting", name: "会议室", description: "对口径、开会、互相甩锅。" },
  { id: "qa_lab", name: "测试区", description: "查 bug、复现问题、过回归。" },
  { id: "release", name: "发布区", description: "盯上线、看进度、准备回滚。" },
  { id: "breakroom", name: "茶水间", description: "摸鱼、听消息、观察别人。" },
];

export const TASK_PROMPTS: Record<RoomId, string[]> = {
  workspace: ["改一个页面小问题", "补一段交互逻辑", "把一个小功能接上"],
  meeting: ["整理这轮需求", "同步一下分工", "确认现在先做什么"],
  qa_lab: ["过一遍回归点", "看一条报错复现", "确认提测结果"],
  release: ["盯发布步骤", "看上线进度", "确认回滚方案"],
  breakroom: ["问问别人刚在干嘛", "听两句八卦", "看看谁有点反常"],
};

const INCIDENT_LABELS: Record<IncidentType, string> = {
  page_error: "页面炸了",
  deploy_blocked: "发布卡住",
  bad_data: "数据不对",
  fake_done: "假修复",
};

const INCIDENT_LINES: Record<IncidentType, string[]> = {
  page_error: ["页面突然炸了，谁点都报错。", "看着像小问题，但越看越不对。"],
  deploy_blocked: ["发布卡住不动了，群里已经开始催。", "步骤看着都对，就是死活过不去。"],
  bad_data: ["接口能回，但数据明显不对。", "像是有人把错结果放上去了。"],
  fake_done: ["有人说修好了，但问题只是被糊住了。", "表面恢复正常，实际根本没修完。"],
};

const INCIDENT_ROOM_PREFERENCE: Partial<Record<RoomId, IncidentType[]>> = {
  workspace: ["page_error", "bad_data"],
  qa_lab: ["bad_data", "fake_done"],
  release: ["deploy_blocked", "fake_done"],
  meeting: ["fake_done"],
  breakroom: ["fake_done"],
};

const SPEECH_FLAVOR: Record<Player["personality"], string[]> = {
  calm: ["先别急，按时间线看。", "我只说能对上的信息。"],
  dramatic: ["这味不对，肯定有人在演。", "这锅已经开始乱飞了。"],
  logical: ["我只看证据和动作。", "先看谁的话和行为对不上。"],
  nervous: ["我不太确定，但我感觉哪里怪。", "先别票我，我把看到的都说了。"],
  slick: ["我不把话说死，但有人确实太顺了。", "最会带节奏的人不一定最吵。"],
};

const rand = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function createLog(round: number, text: string, tone: "info" | "warning" | "danger" | "success") {
  return { id: createId("log"), round, text, tone };
}

function createClue(round: number, text: string, credibility: Clue["credibility"]): Clue {
  return { id: createId("clue"), round, text, credibility };
}

function getAlivePlayers(players: Player[]) {
  return players.filter((player) => player.alive);
}

function role(player: Player) {
  return ROLES[player.roleId];
}

function updatePlayer(players: Player[], playerId: string, updater: (player: Player) => Player) {
  return players.map((player) => (player.id === playerId ? updater(player) : player));
}

function addSuspicion(players: Player[], playerId: string, amount: number) {
  return updatePlayer(players, playerId, (player) => ({
    ...player,
    suspicion: clamp(player.suspicion + amount, 0, 100),
  }));
}

function latestByCredibility(state: GameState, credibility: Clue["credibility"]) {
  return [...state.clues].reverse().find((clue) => clue.credibility === credibility);
}

function getNodeCount(player: Player) {
  return player.faction === "impostor" ? IMPOSTOR_ACTION_NODES : CREW_ACTION_NODES;
}

function resolveInteraction(player: Player, action: PendingAction, node: number): InteractionResolution | null {
  if (action.type !== "task" && action.type !== "repair") return null;
  const option = ROLE_INTERACTIONS[player.roleId].find((entry) => entry.id === action.interactionId);
  if (!option) return null;
  const success = action.interactionSuccess ?? false;
  const score = action.interactionScore ?? (success ? option.successScore : option.failScore);
  return {
    roomId: action.roomId,
    roleId: player.roleId,
    actionType: action.type,
    label: option.label,
    description: option.description,
    success,
    successRate: option.successRate,
    score,
    node,
  };
}

export function getRole(roleId: RoleId) {
  return ROLES[roleId];
}

export function getRoom(roomId: RoomId) {
  return ROOMS.find((room) => room.id === roomId)!;
}

export function getIncidentLabel(type: IncidentType) {
  return INCIDENT_LABELS[type];
}

export function getInteractionOptions(roleId: RoleId) {
  return ROLE_INTERACTIONS[roleId];
}

export function getActionNodeLabel(faction: Player["faction"]) {
  return faction === "impostor" ? "2 个操作节点" : "1 个操作节点";
}

function makeIncident(round: number, culprit: Player, roomId: RoomId, players: Player[]): Incident {
  const type = rand(
    (INCIDENT_ROOM_PREFERENCE[roomId] ?? ["page_error", "deploy_blocked", "bad_data", "fake_done"]) as IncidentType[],
  );
  const fakeTarget = players.find((player) => player.alive && player.id !== culprit.id && player.faction === "crew");
  return {
    id: createId("incident"),
    type,
    roomId,
    culpritId: culprit.id,
    fakeTargetId: fakeTarget?.id,
    severity: type === "page_error" || type === "deploy_blocked" ? "critical" : "normal",
    status: "active",
    countdown: type === "page_error" || type === "deploy_blocked" ? 2 : 3,
    progress: 0,
    publicHint: {
      page_error: "一打开页面就报错。",
      deploy_blocked: "发布流程卡在中间不动。",
      bad_data: "结果不对，像是数据出了问题。",
      fake_done: "有人说修好了，但看着不太真。",
    }[type],
    roomHint: `最早出问题的是 ${getRoom(roomId).name}。`,
    behaviorHint: {
      page_error: "像是有人改了前端逻辑但没测完。",
      deploy_blocked: "像是上线步骤被人动过。",
      bad_data: "像是接口或数据处理有问题。",
      fake_done: "像是有人急着交差，根本没真正修完。",
    }[type],
    fakeHint: type === "fake_done" ? "有人拍胸口说已经修好了。" : "有人试图把锅往别处带。",
    createdRound: round,
  };
}

export function createInitialGame(): GameState {
  const roles = shuffle(ROLE_POOL);
  const impostorIndex = rand([1, 2, 3, 4]);
  const players: Player[] = PLAYER_NAMES.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    persona: PERSONAS[index],
    personality: PERSONALITIES[index],
    roleId: roles[index],
    faction: index === impostorIndex ? "impostor" : "crew",
    alive: true,
    isHuman: index === 0,
    location: rand(ROOMS).id,
    suspicion: index === 0 ? 4 : Math.floor(Math.random() * 8),
    growth: 0,
    skillCooldown: 0,
    lastActionSummary: "等这轮开始。",
    lastPublicClaim: "我先看看。",
  }));

  return {
    phase: "action",
    round: 1,
    playerId: players[0].id,
    players,
    incidents: [],
    clues: [createClue(1, "今晚是上线前最后冲刺，谁都不想背锅。", "medium")],
    logs: [
      createLog(1, "项目进入最后冲刺。", "info"),
      createLog(1, "你和 4 个 AI 同事开始处理今晚的活。", "info"),
    ],
    votes: [],
    stability: 100,
    releaseProgress: 15,
    meeting: null,
    lastInteraction: null,
    winner: null,
    endingTitle: "",
    endingReason: "",
  };
}

export function availableIncidents(state: GameState) {
  return state.incidents.filter((incident) => incident.status === "active");
}

type DraftState = {
  players: Player[];
  incidents: Incident[];
  clues: Clue[];
  logs: ReturnType<typeof createLog>[];
  stability: number;
  releaseProgress: number;
  forceMeeting: boolean;
  lastInteraction: InteractionResolution | null;
};

function createDraft(state: GameState): DraftState {
  return {
    players: [...state.players],
    incidents: [...state.incidents],
    clues: [...state.clues],
    logs: [...state.logs],
    stability: state.stability,
    releaseProgress: state.releaseProgress,
    forceMeeting: false,
    lastInteraction: state.lastInteraction,
  };
}

function applyHumanActionNode(state: GameState, action: PendingAction, draft: DraftState, node: number) {
  const player = draft.players.find((entry) => entry.id === state.playerId)!;
  const promptList = TASK_PROMPTS[action.roomId];
  const prompt = promptList[(state.round + promptList.length - 1) % promptList.length];
  const interaction = resolveInteraction(player, action, node);

  draft.players = updatePlayer(draft.players, player.id, (entry) => ({ ...entry, location: action.roomId }));

  if (action.type === "task") {
    const gain = 10 + role(player).stats.task * 2 + player.growth + Math.round((interaction?.score ?? 40) / 12);
    draft.releaseProgress = clamp(draft.releaseProgress + gain, 0, 100);
    draft.players = updatePlayer(draft.players, player.id, (entry) => ({
      ...entry,
      growth: entry.roleId === "intern" ? entry.growth + 1 : entry.growth,
      lastActionSummary: `在${getRoom(action.roomId).name}推进了任务。`,
      lastPublicClaim: `我刚在${getRoom(action.roomId).name}干活。`,
    }));
    if (interaction) {
      draft.logs.push(
        createLog(
          state.round,
          `你在 ${getRoom(action.roomId).name} 用“${interaction.label}”处理“${prompt}”，${interaction.success ? "成功" : "翻车"}，拿到 ${interaction.score} 分。`,
          interaction.success ? "success" : "warning",
        ),
      );
      draft.lastInteraction = interaction;
    } else {
      draft.logs.push(createLog(state.round, `你在 ${getRoom(action.roomId).name} 推进了进度。`, "success"));
    }
  }

  if (action.type === "investigate") {
    const incident = draft.incidents.find((entry) => entry.status === "active" && entry.roomId === action.roomId);
    if (incident) {
      const credibility = player.roleId === "qa" || player.roleId === "backend" ? "high" : "medium";
      draft.clues.push(createClue(state.round, `${getRoom(action.roomId).name} 的排查结果：${incident.behaviorHint}`, credibility));
      draft.players = addSuspicion(draft.players, incident.culpritId, credibility === "high" ? 14 : 8);
      draft.logs.push(createLog(state.round, `你在 ${getRoom(action.roomId).name} 找到了一条线索。`, "info"));
    } else {
      draft.clues.push(createClue(state.round, `你在 ${getRoom(action.roomId).name} 没找到硬证据。`, "low"));
      draft.logs.push(createLog(state.round, `你在 ${getRoom(action.roomId).name} 暂时没查出东西。`, "info"));
    }
    draft.players = updatePlayer(draft.players, player.id, (entry) => ({
      ...entry,
      lastActionSummary: `在${getRoom(action.roomId).name}查问题。`,
      lastPublicClaim: `我刚在${getRoom(action.roomId).name}排查。`,
    }));
  }

  if (action.type === "repair") {
    const incident = draft.incidents.find((entry) => entry.id === action.incidentId && entry.status === "active");
    if (incident) {
      draft.players = updatePlayer(draft.players, player.id, (entry) => ({ ...entry, location: incident.roomId }));
      const amount = 18 + role(player).stats.repair * 9 + Math.round((interaction?.score ?? 40) / 10);
      draft.incidents = draft.incidents.map((entry) => (entry.id === incident.id ? { ...entry, progress: entry.progress + amount } : entry));
      draft.players = updatePlayer(draft.players, player.id, (entry) => ({
        ...entry,
        lastActionSummary: `参与修复 ${getIncidentLabel(incident.type)}。`,
        lastPublicClaim: `我刚在处理 ${getIncidentLabel(incident.type)}。`,
      }));
      draft.players = addSuspicion(draft.players, player.id, -4);
      if (interaction) {
        draft.logs.push(
          createLog(
            state.round,
            `你在 ${getRoom(incident.roomId).name} 用“${interaction.label}”修 ${getIncidentLabel(incident.type)}，${interaction.success ? "成功" : "没顶住"}，拿到 ${interaction.score} 分。`,
            interaction.success ? "success" : "warning",
          ),
        );
        draft.lastInteraction = { ...interaction, roomId: incident.roomId };
      } else {
        draft.logs.push(createLog(state.round, `你参与处理了“${getIncidentLabel(incident.type)}”。`, "success"));
      }
    }
  }

  if (action.type === "skill") {
    if (player.skillCooldown > 0) {
      draft.logs.push(createLog(state.round, `${role(player).name} 的技能还在冷却。`, "warning"));
      return;
    }
    const activeIncident = draft.incidents.find((entry) => entry.status === "active");
    if (player.roleId === "frontend") {
      if (activeIncident && activeIncident.type === "page_error") {
        draft.incidents = draft.incidents.map((entry) => (entry.id === activeIncident.id ? { ...entry, progress: entry.progress + 35 } : entry));
      } else {
        draft.releaseProgress = clamp(draft.releaseProgress + 8, 0, 100);
      }
      draft.logs.push(createLog(state.round, "你快速补了一手。", "success"));
    }
    if (player.roleId === "backend" && activeIncident) {
      draft.clues.push(createClue(state.round, `深挖结果：${activeIncident.behaviorHint}`, "high"));
      draft.players = addSuspicion(draft.players, activeIncident.culpritId, 12);
      draft.logs.push(createLog(state.round, "你深挖出了一条强线索。", "info"));
    }
    if (player.roleId === "qa") {
      const lowClue = latestByCredibility(state, "low");
      draft.clues.push(
        createClue(
          state.round,
          lowClue ? `复测后发现，这条说法不太站得住：${lowClue.text}` : "你复测了一轮，暂时没发现明显假话。",
          lowClue ? "high" : "medium",
        ),
      );
      draft.logs.push(createLog(state.round, "你补了一次复测。", "info"));
    }
    if (player.roleId === "pm") {
      draft.clues.push(createClue(state.round, "你整理了大家这轮都在做什么。", "medium"));
      draft.forceMeeting = true;
      draft.logs.push(createLog(state.round, "你顺手准备开会。", "info"));
    }
    if (player.roleId === "intern") {
      draft.clues.push(createClue(state.round, `你打听到：${getRoom(action.roomId).name} 那边有人说辞不一致。`, "medium"));
      draft.players = updatePlayer(draft.players, player.id, (entry) => ({ ...entry, growth: entry.growth + 1 }));
      draft.logs.push(createLog(state.round, "你东问西问拿到了一点消息。", "info"));
    }
    draft.players = updatePlayer(draft.players, player.id, (entry) => ({
      ...entry,
      skillCooldown: player.roleId === "intern" ? 1 : 2,
      lastActionSummary: `用了技能：${role(player).active}`,
      lastPublicClaim: "我刚用了技能。",
    }));
  }

  if (action.type === "sabotage" && player.faction === "impostor") {
    const incident = makeIncident(state.round, player, action.roomId, draft.players);
    draft.incidents.push(incident);
    draft.clues.push(createClue(state.round, incident.publicHint, "medium"));
    draft.clues.push(createClue(state.round, incident.roomHint, "medium"));
    if (incident.fakeHint) draft.clues.push(createClue(state.round, incident.fakeHint, "low"));
    draft.logs.push(createLog(state.round, INCIDENT_LINES[incident.type][state.round % 2], "danger"));
  }

  if (action.type === "call_meeting") {
    draft.forceMeeting = true;
    draft.logs.push(createLog(state.round, "你主动要求大家先开会。", "warning"));
  }
}

function chooseCrewAction(player: Player, incidents: Incident[]): PendingAction {
  const critical = incidents.find((incident) => incident.status === "active" && incident.severity === "critical");
  const active = incidents.find((incident) => incident.status === "active");
  if (critical && role(player).stats.repair >= 3) return { type: "repair", roomId: critical.roomId, incidentId: critical.id };
  if (active && role(player).stats.investigate >= 4 && Math.random() > 0.45) return { type: "investigate", roomId: active.roomId };
  if (active && role(player).stats.repair >= 3 && Math.random() > 0.5) return { type: "repair", roomId: active.roomId, incidentId: active.id };
  if (player.skillCooldown === 0 && Math.random() > 0.74) return { type: "skill", roomId: player.location };
  return { type: "task", roomId: rand(ROOMS).id };
}

function chooseImpostorAction(player: Player, incidents: Incident[], players: Player[]): PendingAction {
  if (!incidents.some((incident) => incident.severity === "critical") && Math.random() > 0.38) {
    return { type: "sabotage", roomId: rand(ROOMS.filter((room) => room.id !== "meeting")).id };
  }
  if (incidents.length > 0 && Math.random() > 0.58) {
    const target = rand(incidents);
    return { type: "repair", roomId: target.roomId, incidentId: target.id };
  }
  if (role(player).stats.social >= 4 && Math.random() > 0.72) {
    return { type: "call_meeting", roomId: "meeting" };
  }
  return {
    type: Math.random() > 0.55 ? "task" : "investigate",
    roomId: rand(players.filter((entry) => entry.alive && entry.faction === "crew")).location,
  };
}

function applyAiActionNode(state: GameState, player: Player, action: PendingAction, draft: DraftState) {
  draft.players = updatePlayer(draft.players, player.id, (entry) => ({ ...entry, location: action.roomId }));
  if (action.type === "task") {
    draft.releaseProgress = clamp(draft.releaseProgress + 4 + role(player).stats.task * 2, 0, 100);
    draft.logs.push(createLog(state.round, `${player.name} 在推进任务。`, "info"));
    draft.players = updatePlayer(draft.players, player.id, (entry) => ({
      ...entry,
      lastActionSummary: `在${getRoom(action.roomId).name}推进任务。`,
      lastPublicClaim: `我刚在${getRoom(action.roomId).name}做事。`,
    }));
    return;
  }
  if (action.type === "investigate") {
    const incident = draft.incidents.find((entry) => entry.status === "active" && entry.roomId === action.roomId);
    if (incident && player.faction === "crew") {
      draft.players = addSuspicion(draft.players, incident.culpritId, role(player).stats.investigate >= 4 ? 10 : 5);
      if (Math.random() > 0.45) {
        draft.clues.push(createClue(state.round, `${player.name} 说：${incident.behaviorHint}`, role(player).stats.investigate >= 4 ? "high" : "medium"));
      }
    }
    draft.logs.push(createLog(state.round, `${player.name} 做了排查。`, "info"));
    draft.players = updatePlayer(draft.players, player.id, (entry) => ({
      ...entry,
      lastActionSummary: `在${getRoom(action.roomId).name}排查。`,
      lastPublicClaim: `我刚在${getRoom(action.roomId).name}排查。`,
    }));
    return;
  }
  if (action.type === "repair") {
    const incident = draft.incidents.find((entry) => entry.id === action.incidentId && entry.status === "active");
    if (incident) {
      draft.players = updatePlayer(draft.players, player.id, (entry) => ({ ...entry, location: incident.roomId }));
      draft.incidents = draft.incidents.map((entry) =>
        entry.id === incident.id ? { ...entry, progress: entry.progress + (player.faction === "impostor" ? 10 : 16) + role(player).stats.repair * 8 } : entry,
      );
      if (player.faction === "crew") draft.players = addSuspicion(draft.players, player.id, -3);
      draft.logs.push(createLog(state.round, `${player.name} 参与了修复。`, "success"));
      draft.players = updatePlayer(draft.players, player.id, (entry) => ({
        ...entry,
        lastActionSummary: `参与修复 ${getIncidentLabel(incident.type)}。`,
        lastPublicClaim: `我刚在处理 ${getIncidentLabel(incident.type)}。`,
      }));
    }
    return;
  }
  if (action.type === "skill") {
    if (player.skillCooldown > 0) return;
    if (player.roleId === "pm" && Math.random() > 0.5) draft.forceMeeting = true;
    draft.players = updatePlayer(draft.players, player.id, (entry) => ({
      ...entry,
      skillCooldown: player.roleId === "intern" ? 1 : 2,
      lastActionSummary: `用了技能：${role(player).active}`,
      lastPublicClaim: "我刚用了技能。",
    }));
    draft.logs.push(createLog(state.round, `${player.name} 用了技能。`, "info"));
    return;
  }
  if (action.type === "sabotage" && player.faction === "impostor") {
    const incident = makeIncident(state.round, player, action.roomId, draft.players);
    draft.incidents.push(incident);
    draft.clues.push(createClue(state.round, incident.publicHint, "medium"));
    draft.clues.push(createClue(state.round, incident.roomHint, "medium"));
    if (incident.fakeHint) draft.clues.push(createClue(state.round, incident.fakeHint, "low"));
    draft.logs.push(createLog(state.round, `${getRoom(action.roomId).name} 突然出了问题。`, "danger"));
    draft.players = updatePlayer(draft.players, player.id, (entry) => ({
      ...entry,
      lastActionSummary: `在${getRoom(action.roomId).name}埋了坑。`,
      lastPublicClaim: `我刚在${getRoom(action.roomId).name}转了一圈。`,
    }));
    return;
  }
  if (action.type === "call_meeting") {
    draft.forceMeeting = true;
    draft.logs.push(createLog(state.round, `${player.name} 提议立刻开会。`, "warning"));
    draft.players = updatePlayer(draft.players, player.id, (entry) => ({
      ...entry,
      lastActionSummary: "主动拉会。",
      lastPublicClaim: "我觉得该开会了。",
    }));
  }
}

function resolveIncidents(round: number, players: Player[], incidents: Incident[], logs: ReturnType<typeof createLog>[]) {
  let stabilityLoss = 0;
  const nextIncidents = incidents.map((incident) => {
    if (incident.status !== "active") return incident;
    if (incident.progress >= 100) {
      logs.push(createLog(round, `${getIncidentLabel(incident.type)} 已经压住了。`, "success"));
      return { ...incident, status: "resolved" as const };
    }
    stabilityLoss += incident.severity === "critical" ? 14 : 7;
    return { ...incident, countdown: incident.countdown - 1 };
  });
  nextIncidents.filter((incident) => incident.status === "active").forEach((incident) => {
    players.forEach((player) => {
      if (!player.alive) return;
      if (player.location === incident.roomId) player.suspicion = clamp(player.suspicion + (player.id === incident.culpritId ? 9 : 3), 0, 100);
      if (player.id === incident.fakeTargetId) player.suspicion = clamp(player.suspicion + 6, 0, 100);
    });
  });
  return {
    incidents: nextIncidents,
    stabilityLoss,
    criticalFailure: nextIncidents.some((incident) => incident.status === "active" && incident.severity === "critical" && incident.countdown < 0),
  };
}

function makeSpeech(player: Player, state: GameState) {
  const topSuspicion = getAlivePlayers(state.players).filter((entry) => entry.id !== player.id).sort((left, right) => right.suspicion - left.suspicion)[0];
  const incident = state.incidents.find((entry) => entry.status === "active");
  const flavor = SPEECH_FLAVOR[player.personality][state.round % SPEECH_FLAVOR[player.personality].length];
  if (player.faction === "impostor") {
    if (topSuspicion) return `${player.name}：${flavor} 我现在最怀疑 ${topSuspicion.name}。`;
    return `${player.name}：${flavor} 先别急着乱票。`;
  }
  if (player.roleId === "qa") {
    const lowClue = latestByCredibility(state, "low");
    if (lowClue) return `${player.name}：${flavor} 那条“${lowClue.text}”我不太信。`;
  }
  if (topSuspicion) return `${player.name}：${flavor} 我这轮最怀疑 ${topSuspicion.name}。`;
  if (incident) return `${player.name}：${flavor} 这次 ${getIncidentLabel(incident.type)} 不像自然发生的。`;
  return `${player.name}：${flavor} 我这边还没有定论。`;
}

function buildMeeting(state: GameState): MeetingState {
  const alivePlayers = getAlivePlayers(state.players);
  const activeIncidentNames = state.incidents.filter((incident) => incident.status === "active").map((incident) => getIncidentLabel(incident.type));
  const speeches: MeetingSpeech[] = alivePlayers.filter((player) => !player.isHuman).map((player) => {
    const target = alivePlayers.filter((candidate) => candidate.id !== player.id).sort((left, right) => right.suspicion - left.suspicion)[0];
    return {
      playerId: player.id,
      targetId: target?.id,
      text: target ? `${makeSpeech(player, state)} 我这句主要冲着 ${target.name}。` : makeSpeech(player, state),
    };
  });
  return {
    round: state.round,
    summary: [
      `当前还在影响项目的问题：${activeIncidentNames.length > 0 ? activeIncidentNames.join("、") : "暂时没有"}`,
      `当前稳定度 ${state.stability}，项目进度 ${state.releaseProgress}%`,
      state.lastInteraction
        ? `你刚刚在 ${getRoom(state.lastInteraction.roomId).name} 选了“${state.lastInteraction.label}”，结果${state.lastInteraction.success ? "成功" : "失败"}，得分 ${state.lastInteraction.score}`
        : "你这轮没有触发可结算的互动记录。",
      `最近线索：${state.clues.slice(-2).map((clue) => clue.text).join(" / ")}`,
    ],
    speeches,
    recommendedTargets: alivePlayers.filter((player) => !player.isHuman).sort((left, right) => right.suspicion - left.suspicion).slice(0, 2).map((player) => player.id),
    stanceOptions: STANCES,
  };
}

function determineWinner(state: GameState, criticalFailure: boolean): Pick<GameState, "winner" | "endingTitle" | "endingReason"> | null {
  const alivePlayers = getAlivePlayers(state.players);
  const aliveImpostors = alivePlayers.filter((player) => player.faction === "impostor");
  const aliveCrew = alivePlayers.filter((player) => player.faction === "crew");
  if (aliveImpostors.length === 0) return { winner: "crew", endingTitle: "你们赢了", endingReason: "搞事的人已经被踢出去，项目保住了。" };
  if (state.stability <= 0 || criticalFailure) return { winner: "impostor", endingTitle: "搞事的人赢了", endingReason: "问题彻底炸开，项目直接崩了。" };
  if (aliveImpostors.length >= aliveCrew.length) return { winner: "impostor", endingTitle: "搞事的人赢了", endingReason: "场上已经没人能稳住局面了。" };
  if (state.releaseProgress >= 100 && !state.incidents.some((incident) => incident.status === "active")) {
    return { winner: "crew", endingTitle: "你们赢了", endingReason: "项目顺利上线，而且场上没有活动问题。" };
  }
  if (state.round > 5) {
    return state.stability >= 60
      ? { winner: "crew", endingTitle: "你们险胜", endingReason: "虽然拖到了最后，但项目总算稳住了。" }
      : { winner: "impostor", endingTitle: "搞事的人险胜", endingReason: "你们拖太久了，最后还是没稳住。" };
  }
  return null;
}

export function resolveRound(state: GameState, action: PendingAction): GameState {
  const draft = createDraft(state);
  const human = draft.players.find((player) => player.id === state.playerId)!;

  for (let node = 1; node <= getNodeCount(human); node += 1) {
    applyHumanActionNode(state, action, draft, node);
  }

  getAlivePlayers(draft.players).filter((player) => !player.isHuman).forEach((player) => {
    for (let node = 1; node <= getNodeCount(player); node += 1) {
      const livePlayer = draft.players.find((entry) => entry.id === player.id)!;
      const aiAction =
        livePlayer.faction === "impostor"
          ? chooseImpostorAction(livePlayer, draft.incidents.filter((incident) => incident.status === "active"), draft.players)
          : chooseCrewAction(livePlayer, draft.incidents.filter((incident) => incident.status === "active"));
      applyAiActionNode(state, livePlayer, aiAction, draft);
    }
  });

  draft.players = draft.players.map((player) => ({ ...player, skillCooldown: Math.max(0, player.skillCooldown - 1) }));
  const incidentResult = resolveIncidents(state.round, draft.players, draft.incidents, draft.logs);
  const nextState: GameState = {
    ...state,
    phase: draft.forceMeeting || incidentResult.incidents.some((incident) => incident.status === "active") ? "meeting" : "action",
    players: draft.players,
    incidents: incidentResult.incidents,
    clues: draft.clues.slice(-12),
    logs: draft.logs.slice(-18),
    stability: clamp(draft.stability - incidentResult.stabilityLoss, 0, 100),
    releaseProgress: draft.releaseProgress,
    meeting: null,
    lastInteraction: draft.lastInteraction,
    votes: [],
    winner: null,
    endingTitle: "",
    endingReason: "",
  };
  const winner = determineWinner(nextState, incidentResult.criticalFailure);
  if (winner) return { ...nextState, phase: "ended", ...winner };
  if (nextState.phase === "action") return { ...nextState, round: nextState.round + 1 };
  return { ...nextState, meeting: buildMeeting(nextState) };
}

function applyStanceEffect(state: GameState, stance: string, voteTargetId: string | null): GameState {
  let players = [...state.players];
  const human = players.find((player) => player.isHuman)!;
  if (stance === "强烈怀疑一个人" && voteTargetId) {
    players = addSuspicion(players, voteTargetId, role(human).stats.social >= 4 ? 14 : 10);
    players = addSuspicion(players, human.id, -2);
  }
  if (stance === "解释自己的行动") players = addSuspicion(players, human.id, -8);
  if (stance === "先修问题再投票") return { ...state, players, stability: clamp(state.stability + 4, 0, 100) };
  if (stance === "先跟大部队判断" && voteTargetId) players = addSuspicion(players, voteTargetId, 6);
  return { ...state, players };
}

export function submitVote(state: GameState, voteTargetId: string | null, stance: string): GameState {
  const nextState = applyStanceEffect(state, stance, voteTargetId);
  const alivePlayers = getAlivePlayers(nextState.players);
  const human = nextState.players.find((player) => player.id === nextState.playerId)!;
  const votes: VoteRecord[] = [{ voterId: nextState.playerId, targetId: voteTargetId }];
  alivePlayers.filter((player) => !player.isHuman).forEach((player) => {
    const sorted = alivePlayers.filter((entry) => entry.id !== player.id).sort((left, right) => right.suspicion - left.suspicion);
    let target: Player | null = sorted[0] ?? null;
    if (player.faction === "impostor") target = sorted.find((entry) => entry.faction === "crew") ?? target;
    if (player.faction === "crew" && sorted[0] && sorted[0].suspicion < 20 && Math.random() > 0.6) target = null;
    votes.push({ voterId: player.id, targetId: target?.id ?? null });
  });
  const tally = new Map<string, number>();
  votes.forEach((vote) => vote.targetId && tally.set(vote.targetId, (tally.get(vote.targetId) ?? 0) + 1));
  let eliminatedId: string | null = null;
  let topCount = 0;
  let tie = false;
  tally.forEach((count, targetId) => {
    if (count > topCount) {
      topCount = count;
      eliminatedId = targetId;
      tie = false;
    } else if (count === topCount) {
      tie = true;
    }
  });
  let players = [...nextState.players];
  const logs = [...nextState.logs];
  if (eliminatedId && !tie) {
    const eliminated = players.find((player) => player.id === eliminatedId);
    if (eliminated) {
      players = updatePlayer(players, eliminatedId, (player) => ({ ...player, alive: false }));
      logs.push(createLog(nextState.round, `${eliminated.name} 被投出去了。身份公开：${eliminated.faction === "impostor" ? "搞事的人" : "正常队友"}`, eliminated.faction === "impostor" ? "success" : "warning"));
      if (eliminated.id === human.id) {
        return {
          ...nextState,
          phase: "ended",
          players,
          votes,
          logs: logs.slice(-18),
          meeting: null,
          winner: human.faction === "impostor" ? "crew" : "impostor",
          endingTitle: "你被投出去了",
          endingReason: human.faction === "impostor" ? "你作为搞事的人被集火投出，本局直接结束。" : "你作为正常队友被投出，后续不能继续行动，本局直接结束。",
        };
      }
    }
  } else {
    logs.push(createLog(nextState.round, "这轮没投出人，大家决定继续观察。", "warning"));
  }
  const advancedState: GameState = { ...nextState, phase: "action", round: nextState.round + 1, players, votes, logs: logs.slice(-18), meeting: null };
  const winner = determineWinner(advancedState, false);
  return winner ? { ...advancedState, phase: "ended", ...winner } : advancedState;
}
