import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";

const STYLE = `
  .inbox-backdrop {
    position: fixed; inset: 0; z-index: 1099;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(2px);
    animation: ib-fade-in 0.2s ease;
  }
  @keyframes ib-fade-in { from { opacity: 0; } to { opacity: 1; } }

  .inbox-drawer {
    position: fixed; top: 0; right: 0; bottom: 0;
    width: 700px; max-width: 96vw;
    background: var(--void);
    border-left: 1px solid var(--border-md);
    box-shadow: -8px 0 40px rgba(0,0,0,0.6);
    z-index: 1100;
    display: flex; flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
  }
  .inbox-drawer.open { transform: translateX(0); }

  /* ---- header ---- */
  .inbox-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px; height: 52px;
    background: var(--surface);
    border-bottom: 1px solid var(--border-md);
    flex-shrink: 0;
  }
  .inbox-header-title {
    font-family: "Bebas Neue", sans-serif;
    font-size: 20px; letter-spacing: 0.08em; color: var(--paper);
  }
  .inbox-header-actions { display: flex; gap: 6px; align-items: center; }
  .inbox-icon-btn {
    background: none; border: 1px solid transparent; color: var(--ghost);
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px; border-radius: 2px;
    transition: color 0.15s, border-color 0.15s;
  }
  .inbox-icon-btn:hover { color: var(--paper); border-color: var(--border); }
  .inbox-icon-btn.close:hover { color: #ff4422; }

  /* ---- new message bar ---- */
  .inbox-new-bar {
    padding: 12px 20px;
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    position: relative;
  }
  .inbox-new-bar-label {
    font-family: "Space Mono", monospace; font-size: 9px;
    letter-spacing: 0.2em; text-transform: uppercase; color: var(--ghost); margin-bottom: 8px;
  }
  .inbox-new-row { display: flex; gap: 8px; align-items: center; }
  .inbox-new-input {
    flex: 1; background: rgba(255,255,255,0.04); border: 1px solid var(--border);
    color: var(--paper); font-family: "Libre Baskerville", Georgia, serif; font-size: 13px;
    padding: 8px 12px; outline: none; border-radius: 2px;
    transition: border-color 0.2s;
  }
  .inbox-new-input:focus { border-color: var(--border-md); }
  .inbox-new-input::placeholder { color: var(--ghost); }
  .inbox-new-err {
    font-family: "Space Mono", monospace; font-size: 10px;
    color: #ff4422; margin-top: 6px; letter-spacing: 0.05em;
  }

  /* ---- typeahead dropdown ---- */
  .inbox-search-wrap { flex: 1; position: relative; }
  .inbox-dropdown {
    position: absolute; top: calc(100% + 4px); left: 0; right: 0;
    background: var(--surface2); border: 1px solid var(--border-md);
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    z-index: 10; max-height: 220px; overflow-y: auto;
  }
  .inbox-dropdown::-webkit-scrollbar { width: 4px; }
  .inbox-dropdown::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 2px; }
  .inbox-dropdown-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; cursor: pointer; width: 100%; background: none; border: none;
    text-align: left; transition: background 0.12s; border-bottom: 1px solid var(--border);
  }
  .inbox-dropdown-item:last-child { border-bottom: none; }
  .inbox-dropdown-item:hover, .inbox-dropdown-item.focused { background: rgba(255,255,255,0.05); }
  .inbox-dropdown-username {
    font-family: "Space Mono", monospace; font-size: 11px;
    color: var(--paper); letter-spacing: 0.04em;
  }
  .inbox-dropdown-name {
    font-size: 11px; color: var(--ghost); margin-top: 1px;
  }
  .inbox-dropdown-empty {
    padding: 12px; font-family: "Space Mono", monospace; font-size: 10px;
    color: var(--ghost); letter-spacing: 0.1em; text-align: center;
  }
  .inbox-dropdown-searching {
    padding: 12px; font-family: "Space Mono", monospace; font-size: 10px;
    color: var(--ghost); letter-spacing: 0.1em; text-align: center;
    animation: ib-pulse 1s ease-in-out infinite;
  }
  @keyframes ib-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

  /* ---- main body (list + thread side by side) ---- */
  .inbox-body {
    display: flex; flex: 1; overflow: hidden;
  }

  /* ---- conversation list ---- */
  .inbox-conv-list {
    width: 240px; flex-shrink: 0;
    border-right: 1px solid var(--border);
    overflow-y: auto; display: flex; flex-direction: column;
  }
  .inbox-conv-list::-webkit-scrollbar { width: 4px; }
  .inbox-conv-list::-webkit-scrollbar-track { background: transparent; }
  .inbox-conv-list::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 2px; }

  .inbox-conv-empty {
    font-family: "Space Mono", monospace; font-size: 10px;
    color: var(--ghost); letter-spacing: 0.12em; text-align: center;
    padding: 40px 20px; line-height: 2;
  }

  .inbox-conv-item {
    width: 100%; background: none; border: none; border-bottom: 1px solid var(--border);
    padding: 12px 14px; cursor: pointer; display: flex; gap: 10px; align-items: flex-start;
    text-align: left; transition: background 0.12s;
  }
  .inbox-conv-item:hover { background: rgba(255,255,255,0.03); }
  .inbox-conv-item.active { background: rgba(255,255,255,0.05); }

  .inbox-conv-info { flex: 1; min-width: 0; }
  .inbox-conv-name-row {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 3px;
  }
  .inbox-conv-name {
    font-family: "Space Mono", monospace; font-size: 11px;
    color: var(--paper); letter-spacing: 0.04em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .inbox-conv-time {
    font-family: "Space Mono", monospace; font-size: 9px;
    color: var(--ghost); flex-shrink: 0; margin-left: 4px;
  }
  .inbox-conv-preview-row {
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
  }
  .inbox-conv-preview {
    font-size: 12px; color: var(--ghost);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
  }
  .inbox-unread-badge {
    background: var(--blood); color: var(--paper);
    font-family: "Space Mono", monospace; font-size: 9px; font-weight: 700;
    min-width: 18px; height: 18px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 5px; flex-shrink: 0;
  }

  /* ---- thread panel ---- */
  .inbox-thread {
    flex: 1; display: flex; flex-direction: column; overflow: hidden;
  }

  .inbox-thread-placeholder {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-family: "Space Mono", monospace; font-size: 10px;
    color: var(--ghost); letter-spacing: 0.15em; text-transform: uppercase;
  }

  .inbox-thread-header {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px; border-bottom: 1px solid var(--border);
    background: var(--surface); flex-shrink: 0;
  }
  .inbox-thread-username {
    font-family: "Space Mono", monospace; font-size: 12px;
    color: var(--paper); letter-spacing: 0.04em;
  }

  .inbox-messages {
    flex: 1; overflow-y: auto; padding: 16px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .inbox-messages::-webkit-scrollbar { width: 4px; }
  .inbox-messages::-webkit-scrollbar-track { background: transparent; }
  .inbox-messages::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 2px; }

  /* ---- message bubbles ---- */
  .inbox-msg-group { display: flex; flex-direction: column; margin-bottom: 8px; }

  .inbox-msg {
    display: flex; align-items: flex-start; gap: 8px;
    max-width: 78%;
  }
  .inbox-msg.mine { align-self: flex-end; flex-direction: row-reverse; }
  .inbox-msg.reply { max-width: 100%; }

  .inbox-msg-content { display: flex; flex-direction: column; min-width: 0; }

  .inbox-msg-bubble {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 2px 10px 10px 10px;
    padding: 8px 12px; font-size: 13px; color: var(--paper);
    line-height: 1.55; word-break: break-word;
  }
  .inbox-msg.mine .inbox-msg-bubble {
    background: var(--blood); border-color: transparent;
    border-radius: 10px 2px 10px 10px;
  }
  .inbox-msg-bubble.reply { font-size: 12px; padding: 6px 10px; }

  .inbox-msg-meta {
    display: flex; align-items: center; gap: 8px; margin-top: 4px;
    font-family: "Space Mono", monospace; font-size: 9px; color: var(--ghost);
    letter-spacing: 0.04em;
  }
  .inbox-msg.mine .inbox-msg-meta { justify-content: flex-end; }

  .inbox-reply-btn {
    background: none; border: none; cursor: pointer;
    font-family: "Space Mono", monospace; font-size: 9px;
    color: var(--ghost); letter-spacing: 0.08em; text-transform: uppercase;
    padding: 0; transition: color 0.15s;
  }
  .inbox-reply-btn:hover { color: var(--paper); }

  /* ---- reply thread toggle + replies ---- */
  .inbox-replies { padding-left: 32px; display: flex; flex-direction: column; gap: 4px; }
  .inbox-replies.mine { padding-left: 0; padding-right: 32px; }

  .inbox-thread-toggle {
    background: none; border: none; cursor: pointer;
    font-family: "Space Mono", monospace; font-size: 9px;
    color: var(--muted); letter-spacing: 0.08em;
    padding: 4px 0; text-align: left; transition: color 0.15s;
  }
  .inbox-thread-toggle:hover { color: var(--paper); }

  /* ---- inline reply input ---- */
  .inbox-inline-reply {
    display: flex; gap: 6px; align-items: center; margin-top: 6px;
  }
  .inbox-reply-input {
    flex: 1; background: rgba(255,255,255,0.04); border: 1px solid var(--border-md);
    color: var(--paper); font-family: "Libre Baskerville", Georgia, serif; font-size: 13px;
    padding: 6px 10px; outline: none; border-radius: 2px;
    transition: border-color 0.2s;
  }
  .inbox-reply-input:focus { border-color: var(--border-hi); }
  .inbox-reply-input::placeholder { color: var(--ghost); }

  /* ---- main input row ---- */
  .inbox-input-row {
    display: flex; gap: 8px; align-items: center;
    padding: 12px 16px; border-top: 1px solid var(--border);
    background: var(--surface); flex-shrink: 0;
  }
  .inbox-main-input {
    flex: 1; background: rgba(255,255,255,0.04); border: 1px solid var(--border);
    color: var(--paper); font-family: "Libre Baskerville", Georgia, serif; font-size: 14px;
    padding: 9px 14px; outline: none; border-radius: 2px;
    transition: border-color 0.2s;
  }
  .inbox-main-input:focus { border-color: var(--border-md); }
  .inbox-main-input::placeholder { color: var(--ghost); }

  .inbox-send-btn {
    background: var(--blood); color: var(--paper); border: none; cursor: pointer;
    font-family: "Space Mono", monospace; font-size: 16px; font-weight: 700;
    width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
    border-radius: 2px; transition: background 0.15s; flex-shrink: 0;
  }
  .inbox-send-btn:hover:not(:disabled) { background: #e02600; }
  .inbox-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .inbox-send-btn.small { width: 30px; height: 30px; font-size: 14px; }

  .inbox-cancel-btn {
    background: none; border: 1px solid var(--border); color: var(--ghost);
    font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.08em;
    padding: 8px 14px; cursor: pointer; border-radius: 2px; transition: color 0.15s, border-color 0.15s;
  }
  .inbox-cancel-btn:hover { color: var(--paper); border-color: var(--border-hi); }

  .inbox-start-btn {
    background: var(--blood); color: var(--paper); border: none; cursor: pointer;
    font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.08em;
    padding: 8px 14px; border-radius: 2px; transition: background 0.15s;
  }
  .inbox-start-btn:hover { background: #e02600; }

  @media (max-width: 600px) {
    .inbox-drawer { width: 100vw; }
    .inbox-conv-list { width: 200px; }
  }
`;

const GhostIcon = ({ size = 32, color = "#e8e4da" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
    <path d="M16 5 C10 5 7 9 7 14 L7 26 L10 23 L13 26 L16 23 L19 26 L22 23 L25 26 L25 14 C25 9 22 5 16 5 Z" fill={color} opacity="0.9"/>
    <circle cx="13" cy="14" r="2" fill="#d42200"/>
    <circle cx="19" cy="14" r="2" fill="#d42200"/>
  </svg>
);

function Avatar({ profile, size = 32 }) {
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        alt=""
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: profile?.avatar_color || "#1c1c22",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <GhostIcon size={size * 0.68} color={profile?.ghost_color || "#e8e4da"} />
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InboxDrawer({ session, myProfile, open, onClose, onUnreadChange }) {
  const uid = session?.user?.id;

  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [profiles, setProfiles] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState({});
  const [sending, setSending] = useState(false);
  const [newMsgMode, setNewMsgMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchState, setSearchState] = useState("idle"); // "idle" | "searching" | "done"
  const [focusedIdx, setFocusedIdx] = useState(-1);

  const searchTimerRef = useRef(null);
  const selectedConvIdRef = useRef(null); // ref so realtime callback always sees current value

  const messagesEndRef = useRef(null);
  const mainInputRef = useRef(null);

  // keep ref in sync with state
  useEffect(() => { selectedConvIdRef.current = selectedConvId; }, [selectedConvId]);

  // ── load conversations ──────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!uid) return;
    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${uid},participant_2.eq.${uid}`)
      .order("last_message_at", { ascending: false });

    if (!convs) return;

    // fetch missing profiles
    const otherIds = [...new Set(
      convs.map(c => c.participant_1 === uid ? c.participant_2 : c.participant_1)
    )];
    if (otherIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, avatar_color, ghost_color")
        .in("id", otherIds);
      if (profs) {
        const map = {};
        profs.forEach(p => { map[p.id] = p; });
        setProfiles(prev => ({ ...prev, ...map }));
      }
    }

    // enrich with latest message + unread count
    const enriched = await Promise.all(convs.map(async c => {
      const [latest, unread] = await Promise.all([
        supabase.from("messages")
          .select("body, sender_id, created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("is_read", false)
          .neq("sender_id", uid),
      ]);
      return { ...c, latestMsg: latest.data || null, unreadCount: unread.count || 0 };
    }));

    setConversations(enriched);
    const total = enriched.reduce((s, c) => s + c.unreadCount, 0);
    onUnreadChange?.(total);
  }, [uid, onUnreadChange]);

  // ── open / close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (open && uid) loadConversations();
    if (!open) { setSelectedConvId(null); closeNewMsg(); }
  }, [open, uid]);

  // ── initial unread count (badge even when drawer is closed) ─────────────
  useEffect(() => {
    if (!uid) return;
    (async () => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
        .neq("sender_id", uid)
        .in("conversation_id",
          (await supabase.from("conversations")
            .select("id")
            .or(`participant_1.eq.${uid},participant_2.eq.${uid}`))
            .data?.map(c => c.id) || []
        );
      onUnreadChange?.(count || 0);
    })();
  }, [uid]);

  // ── realtime: conversations list ────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const ch = supabase.channel(`gb-convs-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations",
          filter: `participant_1=eq.${uid}` }, loadConversations)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations",
          filter: `participant_2=eq.${uid}` }, loadConversations)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [uid, loadConversations]);

  // ── load messages for selected conversation ─────────────────────────────
  useEffect(() => {
    if (!selectedConvId || !uid) return;
    setMessages([]);
    setReplyTo(null);
    setExpandedThreads({});

    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConvId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      scrollToBottom();
    })();

    // mark as read
    (async () => {
      await supabase.from("messages")
        .update({ is_read: true })
        .eq("conversation_id", selectedConvId)
        .neq("sender_id", uid)
        .eq("is_read", false);
      setConversations(prev => prev.map(c =>
        c.id === selectedConvId ? { ...c, unreadCount: 0 } : c
      ));
      loadConversations();
    })();
  }, [selectedConvId, uid]);

  // ── realtime: all messages for this user ────────────────────────────────
  // One stable channel per uid — no server-side filter, no per-conversation
  // churn. RLS ensures only messages the user can read arrive.
  // selectedConvIdRef lets the callback see the current conversation without
  // being stale from the closure captured at subscription time.
  useEffect(() => {
    if (!uid) return;
    const ch = supabase.channel(`gb-msgs-${uid}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
      }, (payload) => {
        const msg = payload.new;
        // Update the open thread only if this message belongs to it
        if (msg.conversation_id === selectedConvIdRef.current) {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_id !== uid) {
            supabase.from("messages").update({ is_read: true }).eq("id", msg.id);
          }
          scrollToBottom();
        }
        // Always refresh the conversation list so previews + unread counts update
        loadConversations();
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [uid, loadConversations]);

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }

  // ── send message ────────────────────────────────────────────────────────
  async function sendMessage(parentId = null) {
    if (!input.trim() || !selectedConvId || sending) return;
    setSending(true);
    const body = input.trim();
    setInput("");
    setReplyTo(null);

    const { data: msg, error } = await supabase.from("messages").insert({
      conversation_id: selectedConvId,
      sender_id: uid,
      body,
      parent_message_id: parentId || null,
    }).select().single();

    if (!error && msg) {
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      await supabase.from("conversations")
        .update({ last_message_at: msg.created_at })
        .eq("id", selectedConvId);
      loadConversations();
      scrollToBottom();
    }
    setSending(false);
    mainInputRef.current?.focus();
  }

  // ── typeahead search ────────────────────────────────────────────────────
  function handleSearchInput(e) {
    const q = e.target.value;
    setSearchQuery(q);
    setFocusedIdx(-1);

    clearTimeout(searchTimerRef.current);

    if (!q.trim()) {
      setSearchResults([]);
      setSearchState("idle");
      return;
    }

    setSearchState("searching");
    searchTimerRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, avatar_color, ghost_color")
        .ilike("username", `${q.trim()}%`)
        .neq("id", uid)
        .limit(8);
      setSearchResults(data || []);
      setSearchState("done");
    }, 220);
  }

  function handleSearchKeyDown(e) {
    if (!searchResults.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusedIdx >= 0) {
      e.preventDefault();
      openConversationWith(searchResults[focusedIdx]);
    }
  }

  function closeNewMsg() {
    setNewMsgMode(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchState("idle");
    setFocusedIdx(-1);
    clearTimeout(searchTimerRef.current);
  }

  // ── open or create conversation with a profile ──────────────────────────
  async function openConversationWith(target) {
    closeNewMsg();
    setProfiles(prev => ({ ...prev, [target.id]: target }));

    const lo = [uid, target.id].sort()[0];
    const hi = [uid, target.id].sort()[1];
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(participant_1.eq.${lo},participant_2.eq.${hi}),and(participant_1.eq.${hi},participant_2.eq.${lo})`)
      .maybeSingle();

    if (existing) {
      setSelectedConvId(existing.id);
    } else {
      const { data: conv } = await supabase
        .from("conversations")
        .insert({ participant_1: uid, participant_2: target.id })
        .select().single();
      if (conv) {
        await loadConversations();
        setSelectedConvId(conv.id);
      }
    }
  }

  // ── helpers ─────────────────────────────────────────────────────────────
  function otherOf(conv) {
    const otherId = conv.participant_1 === uid ? conv.participant_2 : conv.participant_1;
    return profiles[otherId] || { id: otherId };
  }

  const selectedConv = conversations.find(c => c.id === selectedConvId);
  const otherProf = selectedConv ? profiles[otherOf(selectedConv).id] : null;

  const topMessages = messages.filter(m => !m.parent_message_id);
  const repliesMap = {};
  messages.filter(m => m.parent_message_id).forEach(m => {
    if (!repliesMap[m.parent_message_id]) repliesMap[m.parent_message_id] = [];
    repliesMap[m.parent_message_id].push(m);
  });

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLE}</style>

      {open && <div className="inbox-backdrop" onClick={onClose} />}

      <div className={`inbox-drawer${open ? " open" : ""}`}>

        {/* Header */}
        <div className="inbox-header">
          <span className="inbox-header-title">Inbox</span>
          <div className="inbox-header-actions">
            <button
              className="inbox-icon-btn"
              title="New message"
              onClick={() => setNewMsgMode(v => !v)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 13L5 9M13 1L9 5M9 5L5 9M9 5L7 7M5 9L7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="10" y="1" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5"/>
              </svg>
              ✏
            </button>
            <button className="inbox-icon-btn close" onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        {/* New message bar */}
        {newMsgMode && (
          <div className="inbox-new-bar">
            <div className="inbox-new-bar-label">New Conversation</div>
            <div className="inbox-new-row">
              <div className="inbox-search-wrap">
                <input
                  className="inbox-new-input"
                  placeholder="Search by username…"
                  value={searchQuery}
                  autoFocus
                  autoComplete="off"
                  onChange={handleSearchInput}
                  onKeyDown={handleSearchKeyDown}
                />
                {(searchState === "searching" || searchState === "done") && (
                  <div className="inbox-dropdown">
                    {searchState === "searching" && (
                      <div className="inbox-dropdown-searching">Searching…</div>
                    )}
                    {searchState === "done" && searchResults.length === 0 && (
                      <div className="inbox-dropdown-empty">No users found</div>
                    )}
                    {searchState === "done" && searchResults.map((r, i) => (
                      <button
                        key={r.id}
                        className={`inbox-dropdown-item${i === focusedIdx ? " focused" : ""}`}
                        onMouseDown={() => openConversationWith(r)}
                        onMouseEnter={() => setFocusedIdx(i)}
                      >
                        <Avatar profile={r} size={30} />
                        <div>
                          <div className="inbox-dropdown-username">@{r.username}</div>
                          {r.full_name && <div className="inbox-dropdown-name">{r.full_name}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="inbox-cancel-btn" onClick={closeNewMsg}>✕</button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="inbox-body">

          {/* Conversation list */}
          <div className="inbox-conv-list">
            {conversations.length === 0 ? (
              <div className="inbox-conv-empty">No conversations yet.<br />Press ✏ to start one.</div>
            ) : conversations.map(conv => {
              const other = otherOf(conv);
              const prof = profiles[other.id];
              const active = conv.id === selectedConvId;
              return (
                <button
                  key={conv.id}
                  className={`inbox-conv-item${active ? " active" : ""}`}
                  onClick={() => setSelectedConvId(conv.id)}
                >
                  <Avatar profile={prof} size={36} />
                  <div className="inbox-conv-info">
                    <div className="inbox-conv-name-row">
                      <span className="inbox-conv-name">@{prof?.username || "…"}</span>
                      <span className="inbox-conv-time">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <div className="inbox-conv-preview-row">
                      <span className="inbox-conv-preview">
                        {conv.latestMsg
                          ? (conv.latestMsg.sender_id === uid ? "You: " : "") + conv.latestMsg.body
                          : "No messages yet"}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="inbox-unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Message thread */}
          <div className="inbox-thread">
            {!selectedConvId ? (
              <div className="inbox-thread-placeholder">Select a conversation</div>
            ) : (
              <>
                {/* Thread header */}
                <div className="inbox-thread-header">
                  <Avatar profile={otherProf} size={28} />
                  <span className="inbox-thread-username">@{otherProf?.username || "…"}</span>
                </div>

                {/* Messages */}
                <div className="inbox-messages">
                  {topMessages.map(msg => {
                    const mine = msg.sender_id === uid;
                    const senderProf = mine ? myProfile : otherProf;
                    const msgReplies = repliesMap[msg.id] || [];
                    const expanded = !!expandedThreads[msg.id];

                    return (
                      <div key={msg.id} className="inbox-msg-group">
                        <div className={`inbox-msg${mine ? " mine" : ""}`}>
                          {!mine && <Avatar profile={senderProf} size={24} />}
                          <div className="inbox-msg-content">
                            <div className="inbox-msg-bubble">{msg.body}</div>
                            <div className="inbox-msg-meta">
                              <span>{formatTime(msg.created_at)}</span>
                              <button
                                className="inbox-reply-btn"
                                onClick={() => {
                                  setReplyTo(prev => prev === msg.id ? null : msg.id);
                                  setInput("");
                                }}
                              >reply</button>
                            </div>

                            {/* inline reply input */}
                            {replyTo === msg.id && (
                              <div className="inbox-inline-reply">
                                <input
                                  className="inbox-reply-input"
                                  placeholder="Reply…"
                                  value={input}
                                  autoFocus
                                  onChange={e => setInput(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(msg.id); }
                                    if (e.key === "Escape") { setReplyTo(null); setInput(""); }
                                  }}
                                />
                                <button className="inbox-send-btn small" onClick={() => sendMessage(msg.id)} disabled={sending || !input.trim()}>↑</button>
                              </div>
                            )}
                          </div>
                          {mine && <Avatar profile={senderProf} size={24} />}
                        </div>

                        {/* reply thread */}
                        {msgReplies.length > 0 && (
                          <div className={`inbox-replies${mine ? " mine" : ""}`}>
                            <button
                              className="inbox-thread-toggle"
                              onClick={() => setExpandedThreads(p => ({ ...p, [msg.id]: !p[msg.id] }))}
                            >
                              {expanded ? "▲" : "▼"} {msgReplies.length} {msgReplies.length === 1 ? "reply" : "replies"}
                            </button>
                            {expanded && msgReplies.map(r => {
                              const rMine = r.sender_id === uid;
                              const rProf = rMine ? myProfile : otherProf;
                              return (
                                <div key={r.id} className={`inbox-msg reply${rMine ? " mine" : ""}`}>
                                  {!rMine && <Avatar profile={rProf} size={20} />}
                                  <div className="inbox-msg-content">
                                    <div className="inbox-msg-bubble reply">{r.body}</div>
                                    <div className="inbox-msg-meta">
                                      <span>{formatTime(r.created_at)}</span>
                                    </div>
                                  </div>
                                  {rMine && <Avatar profile={rProf} size={20} />}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Main input (only when not replying inline) */}
                {!replyTo && (
                  <div className="inbox-input-row">
                    <input
                      ref={mainInputRef}
                      className="inbox-main-input"
                      placeholder="Message…"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                      }}
                    />
                    <button
                      className="inbox-send-btn"
                      onClick={() => sendMessage()}
                      disabled={sending || !input.trim()}
                    >↑</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
