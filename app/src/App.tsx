import { useMemo, useState } from "react";
import {
  ROOMS,
  ROOM_LAYOUT,
  availableIncidents,
  createInitialGame,
  getActionNodeLabel,
  getIncidentLabel,
  getInteractionOptions,
  getRole,
  getRoom,
  resolveRound,
  submitVote,
} from "./game";
import { ActionType, PendingAction, RoleId } from "./types";
import { ROLE_ART, ROLE_BADGE, ROLE_THEME, officeMapArt, officeMapShowcaseArt } from "./art";

const ACTION_OPTIONS: Array<{ type: ActionType; label: string; description: string }> = [
  { type: "task", label: "做事", description: "老老实实推进项目进度。" },
  { type: "investigate", label: "排查", description: "查线索，看看谁有问题。" },
  { type: "repair", label: "修问题", description: "先把眼前的坑补上。" },
  { type: "skill", label: "用技能", description: "用你的职业特长打一手节奏。" },
  { type: "call_meeting", label: "开会", description: "感觉不对就直接拉会。" },
];

const PLAYER_ACCENTS = ["player-accent-1", "player-accent-2", "player-accent-3", "player-accent-4", "player-accent-5"] as const;
const SHOWCASE_ROLES: RoleId[] = ["frontend", "backend", "qa", "pm", "intern"];

function App() {
  const [started, setStarted] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [game, setGame] = useState(createInitialGame);
  const [selectedAction, setSelectedAction] = useState<ActionType>("task");
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0].id);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | undefined>();
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [selectedStance, setSelectedStance] = useState("解释自己的行动");
  const [selectedInteractionId, setSelectedInteractionId] = useState<string>("");
  const [soundHint, setSoundHint] = useState("准备开干。");

  const me = game.players.find((player) => player.id === game.playerId)!;
  const meRole = getRole(me.roleId);
  const activeIncidents = availableIncidents(game);
  const selectedIncident = selectedIncidentId ? activeIncidents.find((incident) => incident.id === selectedIncidentId) : undefined;
  const interactionOptions = useMemo(() => getInteractionOptions(me.roleId), [me.roleId]);
  const selectedInteraction = interactionOptions.find((item) => item.id === selectedInteractionId) ?? interactionOptions[0];

  const actionOptions = me.faction === "impostor"
    ? [...ACTION_OPTIONS.slice(0, 4), { type: "sabotage" as ActionType, label: "搞事", description: "偷偷再埋一个坑。" }, ACTION_OPTIONS[4]]
    : ACTION_OPTIONS;

  const objectiveText = useMemo(() => {
    if (game.phase === "ended") return game.endingReason;
    if (me.faction === "crew") {
      return activeIncidents.some((incident) => incident.severity === "critical")
        ? "先修最急的问题，再看谁最像搞事的人。"
        : "一边推进进度，一边盯紧最可疑的人。";
    }
    return activeIncidents.length === 0
      ? "你是搞事的人。优先找机会埋坑，再把锅带走。"
      : "你是搞事的人。别让问题修太快，也别让自己太跳。";
  }, [activeIncidents, game.endingReason, game.phase, me.faction]);

  const roomHeat = useMemo(() => {
    return ROOMS.map((room) => {
      const playersHere = game.players.filter((player) => player.alive && player.location === room.id).length;
      const incidentsHere = game.incidents.filter((incident) => incident.status === "active" && incident.roomId === room.id).length;
      return { room, playersHere, incidentsHere, score: playersHere + incidentsHere * 2 };
    }).sort((left, right) => right.score - left.score);
  }, [game.incidents, game.players]);

  const playerAccentMap = useMemo(() => {
    return new Map(game.players.map((player, index) => [player.id, PLAYER_ACCENTS[index % PLAYER_ACCENTS.length]]));
  }, [game.players]);

  const currentTaskPrompt = useMemo(() => {
    const prompts = {
      workspace: ["改一个页面小问题", "补一段交互逻辑", "把一个小功能接上"],
      meeting: ["整理这轮需求", "同步一下分工", "确认现在先做什么"],
      qa_lab: ["过一遍回归点", "看一条报错复现", "确认提测结果"],
      release: ["盯发布步骤", "看上线进度", "确认回滚方案"],
      breakroom: ["问问别人刚在干嘛", "听两句八卦", "看看谁有点反常"],
    } as const;
    const roomPrompts = prompts[selectedRoom];
    return roomPrompts[(game.round + roomPrompts.length - 1) % roomPrompts.length];
  }, [game.round, selectedRoom]);

  const canUseSkill = me.skillCooldown === 0;
  const needsInteraction = selectedAction === "task" || selectedAction === "repair";
  const actionDisabled =
    (selectedAction === "repair" && !selectedIncidentId) ||
    (selectedAction === "skill" && !canUseSkill) ||
    (needsInteraction && !selectedInteraction);

  const submitAction = () => {
    const success = needsInteraction && selectedInteraction ? Math.random() < selectedInteraction.successRate : undefined;
    const score =
      needsInteraction && selectedInteraction && success !== undefined
        ? success
          ? selectedInteraction.successScore
          : selectedInteraction.failScore
        : undefined;

    const action: PendingAction = {
      type: selectedAction,
      roomId: selectedAction === "repair" && selectedIncident ? selectedIncident.roomId : selectedRoom,
      incidentId: selectedAction === "repair" ? selectedIncidentId : undefined,
      interactionId: needsInteraction ? selectedInteraction?.id : undefined,
      interactionLabel: needsInteraction ? selectedInteraction?.label : undefined,
      interactionSuccess: success,
      interactionScore: score,
    };

    const next = resolveRound(game, action);
    setGame(next);
    if (needsInteraction && selectedInteraction && success !== undefined) {
      setSoundHint(`这次你选了“${selectedInteraction.label}”，${success ? "成了" : "没成"}，拿到 ${score} 分。`);
    } else if (selectedAction === "sabotage") {
      setSoundHint("坑已经埋下。");
    } else if (selectedAction === "call_meeting") {
      setSoundHint("大家准备开会。");
    } else {
      setSoundHint("这轮动作已记录。");
    }
    setSelectedIncidentId(undefined);
    if (next.meeting) {
      setSelectedVote(next.meeting.recommendedTargets[0] ?? null);
      setSelectedStance(next.meeting.stanceOptions[1] ?? next.meeting.stanceOptions[0]);
    }
  };

  const submitMeeting = () => {
    setGame((current) => submitVote(current, selectedVote, selectedStance));
  };

  const restart = () => {
    setStarted(false);
    setShowGuide(true);
    setGame(createInitialGame());
    setSelectedAction("task");
    setSelectedRoom(ROOMS[0].id);
    setSelectedIncidentId(undefined);
    setSelectedVote(null);
    setSelectedStance("解释自己的行动");
    setSelectedInteractionId("");
    setSoundHint("准备开干。");
  };

  return (
    <div className="app-shell">
      {!started ? (
        <section className="landing-screen">
          <div className="landing-panel">
            <p className="eyebrow">Project Deduction Game</p>
            <h1>谁动了生产环境</h1>
            <p className="hero-copy">
              这是一个 1 人 + 4 AI 的单人推理局。你们要在项目上线前把活做完、把问题修住，同时找出那个一直在暗中搞事的人。
            </p>
            <div className="quick-start">
              <span>5 人局</span>
              <span>5 个房间</span>
              <span>角色专属互动</span>
            </div>
            <div className="identity-card">
              <h3>开局先知道</h3>
              <ul className="clean-list">
                <li>正常阵营每轮都是 1 个操作节点。</li>
                <li>内鬼阵营每轮都是 2 个操作节点。</li>
                <li>做事和修问题时，你都要从角色专属的 3 个互动里选 1 个。</li>
                <li>互动不能重来，结果当场随机结算。</li>
                <li>越高风险，成功率越低，但成功分越高。</li>
              </ul>
            </div>
            <section className="showcase-panel">
              <div className="showcase-copy">
                <div className="panel-header">
                  <h2>Showcase</h2>
                  <span>Map + Roles</span>
                </div>
                <div className="showcase-map-card">
                  <img className="showcase-map-image" src={officeMapShowcaseArt} alt="showcase office map" />
                </div>
              </div>
              <div className="showcase-role-grid">
                {SHOWCASE_ROLES.map((roleId) => {
                  const role = getRole(roleId);
                  return (
                    <article key={roleId} className={`showcase-role-card ${ROLE_THEME[roleId]}`}>
                      <span className="role-badge showcase-role-badge">{ROLE_BADGE[roleId]}</span>
                      <img className="showcase-role-art" src={ROLE_ART[roleId]} alt={role.name} />
                      <div className="showcase-role-copy">
                        <strong>{role.name}</strong>
                        <span>{role.label}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
            <button className="primary-button" onClick={() => { setStarted(true); setShowGuide(true); }} type="button">
              开始这一局
            </button>
          </div>
        </section>
      ) : null}

      {started ? (
        <>
          <header className="hero">
            <div>
              <p className="eyebrow">Single Player</p>
              <h1>谁动了生产环境</h1>
              <p className="hero-copy">
                今晚是项目上线前最后冲刺。你会随机拿到一个职业和一个隐藏身份。正常队友要把项目稳住，搞事的人要想办法让场面失控。
              </p>
              <div className="quick-start">
                <span>{getActionNodeLabel(me.faction)}</span>
                <span>每个角色 3 个互动事件</span>
                <span>互动不能重来</span>
              </div>
              <div className="sound-bar">{soundHint}</div>
            </div>
            <div className={`hero-card ${me.faction} ${ROLE_THEME[me.roleId]}`}>
              <img className="hero-role-art" src={ROLE_ART[me.roleId]} alt={meRole.name} />
              <span className="role-badge hero-role-badge">{ROLE_BADGE[me.roleId]}</span>
              <p>你的职业</p>
              <strong>{meRole.name}</strong>
              <span>{meRole.label}</span>
              <p className="faction-chip">隐藏身份：{me.faction === "crew" ? "正常队友" : "搞事的人"}</p>
            </div>
          </header>

          {showGuide ? (
            <section className="panel" style={{ marginBottom: 16 }}>
              <div className="panel-header">
                <h2>规则和引导</h2>
                <button className="action-pill active" onClick={() => setShowGuide(false)} type="button">
                  <strong>知道了</strong>
                  <span>关闭这段说明</span>
                </button>
              </div>
              <div className="status-grid">
                <div className="identity-card">
                  <h3>目标</h3>
                  <ul className="clean-list">
                    <li>正常队友：把进度推到 100%，或者投出搞事的人。</li>
                    <li>搞事的人：让稳定度掉光，或者活到场上人数追平。</li>
                  </ul>
                </div>
                <div className="identity-card">
                  <h3>每轮怎么操作</h3>
                  <ul className="clean-list">
                    <li>1. 先选动作和房间。</li>
                    <li>2. 如果是做事或修问题，再选 1 个角色专属互动。</li>
                    <li>3. 互动结果随机结算，不能重来。</li>
                    <li>4. 看 AI 行动和新事件，必要时开会投票。</li>
                  </ul>
                </div>
                <div className="identity-card">
                  <h3>新手建议</h3>
                  <ul className="clean-list">
                    <li>没出问题时优先做事。</li>
                    <li>一旦有红色问题，先修问题。</li>
                    <li>线索不够时多排查。</li>
                    <li>高风险互动别乱点，它可能高分，也可能翻车。</li>
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          <main className="layout">
            <section className="panel left-rail">
              <div className="panel-header">
                <h2>行动</h2>
                <span>第 {game.round} 轮</span>
              </div>

              <div className="status-grid">
                <div className="meter-card">
                  <label>稳定度</label>
                  <strong>{game.stability}</strong>
                  <div className="meter"><div className="fill stability" style={{ width: `${game.stability}%` }} /></div>
                </div>
                <div className="meter-card">
                  <label>项目进度</label>
                  <strong>{game.releaseProgress}%</strong>
                  <div className="meter"><div className="fill release" style={{ width: `${game.releaseProgress}%` }} /></div>
                </div>
              </div>

              <div className="identity-card">
                <h3>{meRole.name}</h3>
                <p>{meRole.description}</p>
                <ul className="clean-list">
                  <li>被动：{meRole.passive}</li>
                  <li>主动：{meRole.active}</li>
                  <li>当前节点：{getActionNodeLabel(me.faction)}</li>
                  <li>当前目标：{objectiveText}</li>
                </ul>
              </div>

              {game.phase === "action" ? (
                <div className="action-builder">
                  <div className="field">
                    <label>选动作</label>
                    <div className="action-list">
                      {actionOptions.map((option) => (
                        <button
                          key={option.type}
                          className={selectedAction === option.type ? "action-pill active" : "action-pill"}
                          onClick={() => { setSelectedAction(option.type); if (option.type !== "repair") setSelectedIncidentId(undefined); }}
                          type="button"
                          disabled={option.type === "skill" && !canUseSkill}
                        >
                          <strong>{option.label}</strong>
                          <span>{option.type === "skill" && !canUseSkill ? `技能冷却中，还要 ${me.skillCooldown} 轮` : option.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <label>选房间</label>
                    <select value={selectedRoom} onChange={(event) => setSelectedRoom(event.target.value as typeof selectedRoom)}>
                      {ROOMS.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                    </select>
                    <p className="hint">{getRoom(selectedRoom).description}</p>
                  </div>

                  {selectedAction === "repair" ? (
                    <div className="field">
                      <label>选要修的问题</label>
                      <select value={selectedIncidentId ?? ""} onChange={(event) => setSelectedIncidentId(event.target.value || undefined)}>
                        <option value="">请选择</option>
                        {activeIncidents.map((incident) => (
                          <option key={incident.id} value={incident.id}>{getIncidentLabel(incident.type)} / {getRoom(incident.roomId).name}</option>
                        ))}
                      </select>
                      <p className="hint">{activeIncidents.length > 0 ? "优先修最急的问题。" : "当前没有活动问题。"}</p>
                      {selectedIncident ? <p className="hint">会自动前往：{getRoom(selectedIncident.roomId).name} / {selectedIncident.publicHint}</p> : null}
                    </div>
                  ) : null}

                  {needsInteraction ? (
                    <div className="field interaction-card">
                      <label>这轮互动</label>
                      <p className="hint">当前场景：{selectedAction === "repair" && selectedIncident ? selectedIncident.publicHint : currentTaskPrompt}</p>
                      <p className="hint">你有 3 个角色专属互动可选，只能选 1 个，不能重来。</p>
                      <div className="action-list">
                        {interactionOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className={(selectedInteraction?.id ?? "") === option.id ? "action-pill active" : "action-pill"}
                            onClick={() => setSelectedInteractionId(option.id)}
                          >
                            <strong>{option.label}</strong>
                            <span>{option.description}</span>
                            <span>成功率：{Math.round(option.successRate * 100)}% / 成功分：{option.successScore} / 失败分：{option.failScore}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <button className="primary-button" disabled={actionDisabled} onClick={submitAction} type="button">
                    结束这轮行动
                  </button>
                </div>
              ) : null}

              {game.phase === "meeting" && game.meeting ? (
                <div className="meeting-card">
                  <div className="panel-header">
                    <h3>开会</h3>
                    <span>系统建议怀疑：{game.meeting.recommendedTargets.map((id) => game.players.find((player) => player.id === id)?.name).filter(Boolean).join("、") || "暂无"}</span>
                  </div>
                  <ul className="clean-list">
                    {game.meeting.summary.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                  <div className="field">
                    <label>你这轮怎么说</label>
                    <select value={selectedStance} onChange={(event) => setSelectedStance(event.target.value)}>
                      {game.meeting.stanceOptions.map((stance) => <option key={stance} value={stance}>{stance}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>你要投谁</label>
                    <select value={selectedVote ?? ""} onChange={(event) => setSelectedVote(event.target.value || null)}>
                      <option value="">跳过</option>
                      {game.players.filter((player) => player.alive && !player.isHuman).map((player) => (
                        <option key={player.id} value={player.id}>{player.name} / {getRole(player.roleId).name}</option>
                      ))}
                    </select>
                  </div>
                  <button className="primary-button" onClick={submitMeeting} type="button">提交发言和投票</button>
                </div>
              ) : null}

              {game.phase === "ended" ? (
                <div className="ending-card report-card">
                  <h3>{game.endingTitle}</h3>
                  <p>{game.endingReason}</p>
                  <div className="identity-card">
                    <h3>这局结论</h3>
                    <ul className="clean-list">
                      <li>稳定度最终值：{game.stability}</li>
                      <li>项目进度最终值：{game.releaseProgress}%</li>
                      <li>结果：{game.winner === "crew" ? "项目被保住了" : "项目被搞崩了"}</li>
                    </ul>
                  </div>
                  <button className="primary-button" onClick={restart} type="button">再开一局</button>
                </div>
              ) : null}
            </section>

            <section className="panel center-stage">
              <div className="panel-header"><h2>地图</h2><span>5 个房间</span></div>
              <div className="station-map">
                <img className="station-map-image" src={officeMapArt} alt="office map" />
                {roomHeat.map(({ room, playersHere, incidentsHere }) => {
                  const point = ROOM_LAYOUT.find((item) => item.id === room.id)!;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      className={`map-room ${selectedRoom === room.id ? "selected" : ""} ${incidentsHere > 0 ? "danger pulse" : ""}`}
                      style={{ left: `${point.x}%`, top: `${point.y}%` }}
                      onClick={() => setSelectedRoom(room.id)}
                    >
                      <strong>{room.name}</strong>
                      <span>{playersHere} 人 / {incidentsHere} 问题</span>
                    </button>
                  );
                })}
              </div>

              <div className="panel-header">
                <h2>事件时间线</h2>
                <span>{game.phase === "action" ? "行动阶段" : game.phase === "meeting" ? "会议阶段" : "结算阶段"}</span>
              </div>
              <div className="transition-banner">
                {game.phase === "action"
                  ? "大家都在忙，但也可能有人在偷偷搞事。"
                  : game.phase === "meeting"
                    ? "现在每句话都可能是证据，也可能是甩锅。"
                    : "这局结束了，回看一下到底是怎么翻车或翻盘的。"}
              </div>
              <div className="timeline">
                {game.logs.slice().reverse().map((log) => (
                  <article key={log.id} className={`timeline-item ${log.tone}`}>
                    <span className="round-tag">R{log.round}</span>
                    <p>{log.text}</p>
                  </article>
                ))}
              </div>

              <div className="panel-header"><h2>线索</h2><span>最近情报</span></div>
              <div className="clue-grid">
                {game.clues.slice().reverse().map((clue) => (
                  <article key={clue.id} className={`clue-card ${clue.credibility}`}>
                    <strong>{clue.credibility === "high" ? "高可信" : clue.credibility === "medium" ? "中可信" : "低可信"}</strong>
                    <p>{clue.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel right-rail">
              <div className="panel-header"><h2>角色状态</h2><span>5 人局</span></div>
              <div className="player-list">
                {game.players.map((player) => {
                  const playerRole = getRole(player.roleId);
                  const accentClass = playerAccentMap.get(player.id) ?? PLAYER_ACCENTS[0];
                  return (
                    <article key={player.id} className={`${player.alive ? "player-card" : "player-card eliminated"} ${accentClass} ${ROLE_THEME[player.roleId]}`}>
                      <div className="player-portrait-shell">
                        <img className="player-portrait" src={ROLE_ART[player.roleId]} alt={playerRole.name} />
                      </div>
                      <div className="player-topline">
                        <div>
                          <div className="player-title-row">
                            <h3>{player.name}</h3>
                            <span className="role-badge player-role-badge">{ROLE_BADGE[player.roleId]}</span>
                          </div>
                          <p>{playerRole.name}</p>
                        </div>
                        <span className={player.alive ? "alive-chip" : "out-chip"}>{player.alive ? "还在场" : "出局了"}</span>
                      </div>
                      <p className="meta">位置：{getRoom(player.location).name}{player.isHuman ? " / 你" : " / AI"}</p>
                      <p className="meta">{player.persona}</p>
                      <div className="suspicion-meter">
                        <label>嫌疑值 {player.suspicion}</label>
                        <div className="meter"><div className="fill suspicion" style={{ width: `${player.suspicion}%` }} /></div>
                      </div>
                      <p className="claim">{player.lastPublicClaim}</p>
                      {game.phase === "ended" ? <p className={`reveal ${player.faction}`}>真实身份：{player.faction === "crew" ? "正常队友" : "搞事的人"}</p> : null}
                    </article>
                  );
                })}
              </div>

              <div className="panel-header"><h2>房间热度</h2><span>哪里最乱</span></div>
              <div className="incident-list">
                {roomHeat.map(({ room, playersHere, incidentsHere, score }) => (
                  <article key={room.id} className="incident-card normal">
                    <strong>{room.name}</strong>
                    <p>{room.description}</p>
                    <p>房间人数：{playersHere}</p>
                    <p>活动问题：{incidentsHere}</p>
                    <p>热度：{score}</p>
                  </article>
                ))}
              </div>

              <div className="panel-header"><h2>活动问题</h2><span>{activeIncidents.length} 个</span></div>
              <div className="incident-list">
                {activeIncidents.length === 0 ? <p className="empty-state">当前没有活动问题，适合先做事。</p> : null}
                {activeIncidents.map((incident) => (
                  <article key={incident.id} className={`incident-card ${incident.severity}`}>
                    <strong>{getIncidentLabel(incident.type)}</strong>
                    <p>{incident.publicHint}</p>
                    <p>位置：{getRoom(incident.roomId).name}</p>
                    <p>倒计时：{incident.countdown}</p>
                    <div className="meter"><div className="fill repair" style={{ width: `${Math.min(incident.progress, 100)}%` }} /></div>
                  </article>
                ))}
              </div>

              {game.phase === "meeting" && game.meeting ? (
                <>
                  <div className="panel-header"><h2>AI 发言</h2><span>会议速记</span></div>
                  <div className="speech-list">
                    {game.meeting.speeches.map((speech) => (
                      <article key={speech.playerId} className={`speech-card ${playerAccentMap.get(speech.playerId) ?? PLAYER_ACCENTS[0]}`}>
                        {speech.targetId ? <p className="meta">指向：{game.players.find((player) => player.id === speech.targetId)?.name}</p> : null}
                        <p>{speech.text}</p>
                      </article>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
          </main>
        </>
      ) : null}
    </div>
  );
}

export default App;
