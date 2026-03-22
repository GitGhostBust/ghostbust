import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

/* ================================================================
   STYLES
================================================================ */
const STYLE = `
  /* COMMUNITY BOARD */
  .cb-wrap { padding: 0 0 80px; }

  /* HERO */
  .cb-hero { padding: 36px 0 28px; border-bottom: 1px solid var(--border); margin-bottom: 28px; display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 20px; }
  .cb-hero-left { min-width: 0; }
  .cb-hero-eyebrow { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase; color: var(--blood); margin-bottom: 8px; }
  .cb-heading { font-family: 'Bebas Neue', sans-serif; font-size: clamp(36px, 6vw, 60px); letter-spacing: 0.03em; color: var(--paper); line-height: 0.92; margin-bottom: 12px; }
  .cb-heading em { color: var(--blood); font-style: normal; }
  .cb-hero-desc { font-family: 'Libre Baskerville', Georgia, serif; font-size: 14px; color: rgba(238,234,224,0.7); line-height: 1.7; max-width: 620px; }
  .cb-hero-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; flex-shrink: 0; }
  .cb-new-btn { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.08em; background: var(--blood); color: var(--paper); border: none; padding: 13px 28px; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
  .cb-new-btn:hover { background: #e52600; }
  .cb-region-badge { display: flex; align-items: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em; color: var(--ice); background: var(--ice-dim); border: 1px solid rgba(0,200,230,0.25); padding: 5px 10px; white-space: nowrap; }
  .cb-region-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ice); flex-shrink: 0; }
  .cb-region-change { background: none; border: none; color: rgba(0,200,230,0.5); cursor: pointer; font-size: 11px; padding: 0; line-height: 1; transition: color 0.15s; }
  .cb-region-change:hover { color: var(--ice); }
  .cb-no-region { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); }

  /* FILTER BAR */
  .cb-filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 20px; }
  .cb-topic-pill { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 12px; border: 1px solid var(--border); background: none; color: var(--ghost); cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .cb-topic-pill:hover { color: var(--paper); border-color: var(--border-hi); }
  .cb-topic-pill.active { color: var(--paper); border-color: var(--blood); background: var(--blood-dim); }
  .cb-filter-sep { width: 1px; height: 20px; background: var(--border); flex-shrink: 0; }
  .cb-region-toggle { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em; padding: 5px 12px; border: 1px solid var(--border); background: none; color: var(--ghost); cursor: pointer; transition: all 0.15s; }
  .cb-region-toggle:hover { color: var(--paper); border-color: var(--border-hi); }
  .cb-region-toggle.active { color: var(--ice); border-color: var(--ice); }
  .cb-search-input { background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 11px; padding: 5px 12px; outline: none; min-width: 160px; transition: border-color 0.2s; }
  .cb-search-input:focus { border-color: var(--border-hi); }
  .cb-search-input::placeholder { color: var(--ghost); }

  /* POST CARDS */
  .cb-feed { display: flex; flex-direction: column; gap: 12px; }
  .cb-card { background: var(--surface); border: 1px solid var(--border); padding: 20px 22px; transition: background 0.15s; cursor: pointer; }
  .cb-card:hover { background: var(--surface2); }
  .cb-card-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
  .cb-avatar { width: 38px; height: 38px; border-radius: 0; font-size: 22px; line-height: 38px; text-align: center; flex-shrink: 0; background: var(--surface2); border: 1px solid var(--border); }
  .cb-author-meta { flex: 1; min-width: 0; }
  .cb-author-name { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.06em; color: var(--paper); font-weight: 700; }
  .cb-author-line { display: flex; gap: 8px; align-items: center; margin-top: 4px; flex-wrap: wrap; }
  .cb-region-tag { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ice); padding: 2px 7px; border: 1px solid rgba(0,200,230,0.25); background: var(--ice-dim); }
  .cb-topic-tag { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 7px; }
  .cb-topic-ghostjob { background: var(--blood-dim); border: 1px solid rgba(212,34,0,0.25); color: var(--blood); }
  .cb-topic-wins { background: rgba(0,230,122,0.08); border: 1px solid rgba(0,230,122,0.2); color: var(--signal); }
  .cb-topic-advice { background: var(--bile-dim); border: 1px solid rgba(201,154,0,0.2); color: var(--bile); }
  .cb-topic-rant { background: rgba(100,80,200,0.12); border: 1px solid rgba(100,80,200,0.25); color: #a090ff; }
  .cb-topic-general { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--ghost); }
  .cb-post-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 6px; line-height: 1.15; }
  .cb-post-body { font-family: 'Libre Baskerville', Georgia, serif; font-size: 13px; color: rgba(238,234,224,0.7); line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .cb-post-photo { width: 100%; max-height: 260px; object-fit: cover; margin-top: 12px; border: 1px solid var(--border); display: block; }
  .cb-card-footer { display: flex; align-items: center; gap: 14px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); }
  .cb-like-btn { display: flex; align-items: center; gap: 5px; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.06em; color: var(--ghost); background: none; border: 1px solid var(--border); padding: 4px 10px; cursor: pointer; transition: all 0.15s; }
  .cb-like-btn:hover { color: var(--blood); border-color: var(--blood); }
  .cb-like-btn.liked { color: var(--blood); border-color: var(--blood); background: var(--blood-dim); }
  .cb-comment-count { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ghost); display: flex; align-items: center; gap: 5px; }
  .cb-timestamp { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--ghost); margin-left: auto; }

  /* LOAD MORE */
  .cb-load-more { width: 100%; margin-top: 18px; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; background: none; border: 1px solid var(--border); color: var(--ghost); padding: 12px; cursor: pointer; transition: all 0.15s; }
  .cb-load-more:hover { color: var(--paper); border-color: var(--border-hi); }
  .cb-load-more:disabled { opacity: 0.35; cursor: default; }

  /* POST DETAIL OVERLAY */
  .cb-overlay { position: fixed; inset: 0; background: rgba(7,7,9,0.92); z-index: 8000; display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: 24px 16px 60px; }
  .cb-detail { background: var(--surface); border: 1px solid var(--border-hi); max-width: 700px; width: 100%; position: relative; margin: auto; }
  .cb-detail-header { background: var(--surface2); border-bottom: 1px solid var(--border); padding: 20px 24px; display: flex; align-items: flex-start; gap: 12px; }
  .cb-detail-body { padding: 22px 24px; }
  .cb-detail-text { font-family: 'Libre Baskerville', Georgia, serif; font-size: 14px; line-height: 1.8; color: rgba(238,234,224,0.85); white-space: pre-wrap; }
  .cb-detail-photo { width: 100%; max-height: 380px; object-fit: cover; display: block; border-bottom: 1px solid var(--border); }
  .cb-detail-actions { display: flex; align-items: center; gap: 10px; padding: 14px 24px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .cb-close-btn { position: absolute; top: 12px; right: 14px; background: none; border: 1px solid var(--border); color: var(--ghost); width: 28px; height: 28px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: color 0.15s; flex-shrink: 0; }
  .cb-close-btn:hover { color: var(--paper); border-color: var(--border-hi); }

  /* COMMENTS */
  .cb-comments { padding: 0 24px 24px; }
  .cb-comments-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 14px; }
  .cb-comment { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; gap: 10px; }
  .cb-comment-avatar { font-size: 16px; line-height: 28px; text-align: center; width: 28px; height: 28px; background: var(--surface2); border: 1px solid var(--border); flex-shrink: 0; }
  .cb-comment-inner { flex: 1; min-width: 0; }
  .cb-comment-author { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--paper); font-weight: 700; margin-bottom: 4px; }
  .cb-comment-body { font-family: 'Libre Baskerville', Georgia, serif; font-size: 13px; color: rgba(238,234,224,0.75); line-height: 1.65; }
  .cb-comment-ts { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--ghost); margin-top: 4px; }
  .cb-comment-input-row { display: flex; gap: 8px; margin-top: 16px; }
  .cb-comment-input { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 11px; padding: 9px 12px; outline: none; transition: border-color 0.2s; }
  .cb-comment-input:focus { border-color: var(--border-hi); }
  .cb-comment-input::placeholder { color: var(--ghost); }
  .cb-comment-submit { font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 0.06em; background: var(--ice); color: #050a09; border: none; padding: 9px 18px; cursor: pointer; transition: background 0.15s; white-space: nowrap; flex-shrink: 0; }
  .cb-comment-submit:hover:not(:disabled) { background: #00e8ff; }
  .cb-comment-submit:disabled { opacity: 0.4; cursor: not-allowed; }
  .cb-no-comments { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--ghost); padding: 16px 0; text-align: center; }
  .cb-sign-in-prompt { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--ghost); padding: 12px 0; }
  .cb-sign-in-link { color: var(--ice); cursor: pointer; text-decoration: underline; }

  /* NEW POST MODAL */
  .cb-modal { position: fixed; inset: 0; background: rgba(7,7,9,0.92); z-index: 9000; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .cb-modal-inner { background: var(--surface); border: 1px solid var(--border-hi); border-top: 4px solid var(--blood); max-width: 560px; width: 100%; padding: 30px 28px; position: relative; max-height: 90vh; overflow-y: auto; }
  .cb-modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 0.04em; color: var(--paper); margin-bottom: 22px; }
  .cb-modal-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); margin-bottom: 6px; display: block; }
  .cb-modal-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 12px; padding: 10px 14px; outline: none; margin-bottom: 14px; transition: border-color 0.2s; }
  .cb-modal-input:focus { border-color: var(--border-hi); }
  .cb-modal-input::placeholder { color: var(--ghost); }
  .cb-modal-textarea { width: 100%; min-height: 120px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--paper); font-family: 'Libre Baskerville', Georgia, serif; font-size: 13px; line-height: 1.7; padding: 10px 14px; outline: none; resize: vertical; margin-bottom: 14px; transition: border-color 0.2s; }
  .cb-modal-textarea:focus { border-color: var(--border-hi); }
  .cb-modal-textarea::placeholder { color: var(--ghost); font-style: italic; }
  .cb-modal-select { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--paper); font-family: 'Space Mono', monospace; font-size: 11px; padding: 10px 14px; outline: none; margin-bottom: 14px; appearance: none; cursor: pointer; transition: border-color 0.2s; }
  .cb-modal-select:focus { border-color: var(--border-hi); }
  .cb-modal-select option { background: var(--surface2); }
  .cb-photo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
  .cb-photo-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ghost); cursor: pointer; border: 1px dashed var(--border); padding: 8px 14px; transition: border-color 0.15s; }
  .cb-photo-label:hover { border-color: var(--border-hi); color: var(--paper); }
  .cb-photo-preview { width: 60px; height: 60px; object-fit: cover; border: 1px solid var(--border); }
  .cb-modal-submit { width: 100%; font-family: 'Bebas Neue', sans-serif; font-size: 21px; letter-spacing: 0.08em; background: var(--blood); color: var(--paper); border: none; padding: 14px; cursor: pointer; transition: background 0.15s; margin-top: 4px; }
  .cb-modal-submit:hover:not(:disabled) { background: #e52600; }
  .cb-modal-submit:disabled { opacity: 0.4; cursor: not-allowed; }
  .cb-modal-error { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--blood); margin-bottom: 10px; }
  .cb-empty { text-align: center; padding: 60px 20px; }
  .cb-empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.35; }
  .cb-empty-title { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 0.04em; color: var(--ghost); margin-bottom: 8px; }
  .cb-empty-sub { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--ghost); line-height: 1.7; }

  @media (max-width: 600px) {
    .cb-filters { gap: 6px; }
    .cb-hero { grid-template-columns: 1fr; }
    .cb-hero-right { align-items: flex-start; flex-direction: row; flex-wrap: wrap; }
  }
`;

/* ================================================================
   HELPERS
================================================================ */
const TOPICS = [
  { key: "all",       label: "All" },
  { key: "ghostjob",  label: "Ghost Jobs" },
  { key: "wins",      label: "Wins" },
  { key: "advice",    label: "Advice" },
  { key: "rant",      label: "Rant" },
  { key: "general",   label: "General" },
];

const TOPIC_CLASS = {
  ghostjob: "cb-topic-ghostjob",
  wins:     "cb-topic-wins",
  advice:   "cb-topic-advice",
  rant:     "cb-topic-rant",
  general:  "cb-topic-general",
};

function topicLabel(key) {
  var t = TOPICS.find(function(t){ return t.key === key; });
  return t ? t.label : key;
}

function timeAgo(ts) {
  var d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return Math.floor(d/60) + "m ago";
  if (d < 86400) return Math.floor(d/3600) + "h ago";
  return Math.floor(d/86400) + "d ago";
}

function ghostEmoji(color) {
  // Return ghost with a tint based on the stored color or a default
  return color || "👻";
}

/* ================================================================
   NEW POST MODAL
================================================================ */
function NewPostModal({ session, userRegion, onClose, onPosted }) {
  var [title, setTitle] = useState("");
  var [body, setBody] = useState("");
  var [topic, setTopic] = useState("general");
  var [region, setRegion] = useState(userRegion || "");
  var [photoFile, setPhotoFile] = useState(null);
  var [photoPreview, setPhotoPreview] = useState(null);
  var [submitting, setSubmitting] = useState(false);
  var [error, setError] = useState(null);
  var fileRef = useRef();

  function handlePhoto(e) {
    var f = e.target.files[0];
    if (!f) return;
    setPhotoFile(f);
    var reader = new FileReader();
    reader.onload = function(ev) { setPhotoPreview(ev.target.result); };
    reader.readAsDataURL(f);
  }

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) { setError("Title and body are required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      var photoUrl = null;
      if (photoFile) {
        var ext = photoFile.name.split(".").pop();
        var path = session.user.id + "/" + Date.now() + "." + ext;
        var up = await supabase.storage.from("post-photos").upload(path, photoFile, { upsert: true });
        if (up.error) throw up.error;
        var pub = supabase.storage.from("post-photos").getPublicUrl(path);
        photoUrl = pub.data.publicUrl;
      }
      var res = await supabase.from("posts").insert({
        user_id: session.user.id,
        title: title.trim(),
        body: body.trim(),
        topic: topic,
        region: region.trim() || null,
        photo_url: photoUrl,
      }).select().single();
      if (res.error) throw res.error;
      onPosted(res.data);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to post.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cb-modal" onClick={function(e){ if(e.target===e.currentTarget) onClose(); }}>
      <div className="cb-modal-inner">
        <button className="cb-close-btn" onClick={onClose}>✕</button>
        <div className="cb-modal-title">New Post</div>

        {error && <div className="cb-modal-error">{error}</div>}

        <label className="cb-modal-label">Title</label>
        <input className="cb-modal-input" placeholder="What's happening in your job search?" value={title} onChange={function(e){ setTitle(e.target.value); }} maxLength={120} />

        <label className="cb-modal-label">Body</label>
        <textarea className="cb-modal-textarea" placeholder="Share your experience, question, or story..." value={body} onChange={function(e){ setBody(e.target.value); }} />

        <label className="cb-modal-label">Topic</label>
        <select className="cb-modal-select" value={topic} onChange={function(e){ setTopic(e.target.value); }}>
          <option value="general">General</option>
          <option value="ghostjob">Ghost Job Experience</option>
          <option value="wins">Wins & Offers</option>
          <option value="advice">Advice & Tips</option>
          <option value="rant">Rant</option>
        </select>

        <label className="cb-modal-label">Your Region (optional)</label>
        <input className="cb-modal-input" placeholder="e.g. NYC, Remote, London..." value={region} onChange={function(e){ setRegion(e.target.value); }} maxLength={80} />

        <div className="cb-photo-row">
          <label className="cb-photo-label" onClick={function(){ fileRef.current.click(); }}>
            📷 Attach Photo
          </label>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto} />
          {photoPreview && <img src={photoPreview} className="cb-photo-preview" alt="preview" />}
          {photoPreview && <button style={{background:"none",border:"none",color:"var(--ghost)",cursor:"pointer",fontSize:12}} onClick={function(){ setPhotoFile(null); setPhotoPreview(null); }}>✕ Remove</button>}
        </div>

        <button className="cb-modal-submit" onClick={handleSubmit} disabled={submitting || !title.trim() || !body.trim()}>
          {submitting ? "Posting..." : "Post to Community"}
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   POST DETAIL / COMMENTS OVERLAY
================================================================ */
function PostDetail({ post: initialPost, session, onClose, onLikeToggle }) {
  var [post, setPost] = useState(initialPost);
  var [comments, setComments] = useState([]);
  var [loadingComments, setLoadingComments] = useState(true);
  var [commentBody, setCommentBody] = useState("");
  var [submitting, setSubmitting] = useState(false);
  var [likedByMe, setLikedByMe] = useState(false);
  var [profiles, setProfiles] = useState({});

  useEffect(function() {
    loadComments();
    if (session) checkLike();
  }, []);

  async function loadComments() {
    setLoadingComments(true);
    var res = await supabase.from("comments").select("*").eq("post_id", post.id).order("created_at", { ascending: true });
    var commentData = res.data || [];
    setComments(commentData);
    setLoadingComments(false);
    // load profiles for commenters
    var ids = [...new Set(commentData.map(function(c){ return c.user_id; }))];
    if (ids.length > 0) {
      var pr = await supabase.from("profiles").select("id,username,avatar_emoji,avatar_color").in("id", ids);
      var map = {};
      (pr.data || []).forEach(function(p){ map[p.id] = p; });
      setProfiles(function(prev){ return Object.assign({}, prev, map); });
    }
  }

  async function checkLike() {
    if (!session) return;
    var res = await supabase.from("post_likes").select("post_id").eq("post_id", post.id).eq("user_id", session.user.id).maybeSingle();
    setLikedByMe(!!res.data);
  }

  async function handleLike(e) {
    e.stopPropagation();
    if (!session) return;
    var newLiked = !likedByMe;
    var newCount = post.likes_count + (newLiked ? 1 : -1);
    setLikedByMe(newLiked);
    setPost(function(p){ return Object.assign({}, p, { likes_count: newCount }); });
    onLikeToggle(post.id, newLiked, newCount);
    if (newLiked) {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: session.user.id });
    } else {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", session.user.id);
    }
  }

  async function handleComment() {
    if (!session || !commentBody.trim()) return;
    setSubmitting(true);
    var res = await supabase.from("comments").insert({ post_id: post.id, user_id: session.user.id, body: commentBody.trim() }).select().single();
    if (!res.error) {
      setComments(function(prev){ return prev.concat([res.data]); });
      setPost(function(p){ return Object.assign({}, p, { comments_count: p.comments_count + 1 }); });
      setCommentBody("");
    }
    setSubmitting(false);
  }

  var authorProfile = profiles[post.user_id] || post._profile;

  return (
    <div className="cb-overlay" onClick={function(e){ if(e.target===e.currentTarget) onClose(); }}>
      <div className="cb-detail">
        <button className="cb-close-btn" onClick={onClose}>✕</button>

        {post.photo_url && <img src={post.photo_url} className="cb-detail-photo" alt="post" />}

        <div className="cb-detail-header">
          <div className="cb-avatar">{authorProfile ? (authorProfile.avatar_emoji || "👻") : "👻"}</div>
          <div className="cb-author-meta">
            <div className="cb-author-name">{authorProfile ? (authorProfile.username || "Anonymous") : "Anonymous"}</div>
            <div className="cb-author-line">
              {post.region && <span className="cb-region-tag">{post.region}</span>}
              <span className={"cb-topic-tag " + (TOPIC_CLASS[post.topic] || "cb-topic-general")}>{topicLabel(post.topic)}</span>
            </div>
          </div>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"var(--ghost)",marginLeft:"auto",marginTop:2,flexShrink:0}}>{timeAgo(post.created_at)}</span>
        </div>

        <div className="cb-detail-body">
          <div className="cb-post-title">{post.title}</div>
          <div className="cb-detail-text">{post.body}</div>
        </div>

        <div className="cb-detail-actions">
          <button className={"cb-like-btn"+(likedByMe?" liked":"")} onClick={handleLike} disabled={!session}>
            ♥ {post.likes_count}
          </button>
          <span className="cb-comment-count">💬 {post.comments_count}</span>
          <span className="cb-timestamp" style={{marginLeft:"auto"}}>{timeAgo(post.created_at)}</span>
        </div>

        <div className="cb-comments">
          <div className="cb-comments-title">Comments</div>
          {loadingComments ? (
            <div className="cb-no-comments">Loading...</div>
          ) : comments.length === 0 ? (
            <div className="cb-no-comments">No comments yet. Be the first.</div>
          ) : (
            comments.map(function(c) {
              var cp = profiles[c.user_id];
              return (
                <div key={c.id} className="cb-comment">
                  <div className="cb-comment-avatar">{cp ? (cp.avatar_emoji || "👻") : "👻"}</div>
                  <div className="cb-comment-inner">
                    <div className="cb-comment-author">{cp ? (cp.username || "Anonymous") : "Anonymous"}</div>
                    <div className="cb-comment-body">{c.body}</div>
                    <div className="cb-comment-ts">{timeAgo(c.created_at)}</div>
                  </div>
                </div>
              );
            })
          )}
          {session ? (
            <div className="cb-comment-input-row">
              <input
                className="cb-comment-input"
                placeholder="Add a comment..."
                value={commentBody}
                onChange={function(e){ setCommentBody(e.target.value); }}
                onKeyDown={function(e){ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); handleComment(); } }}
              />
              <button className="cb-comment-submit" onClick={handleComment} disabled={submitting || !commentBody.trim()}>
                POST
              </button>
            </div>
          ) : (
            <div className="cb-sign-in-prompt">
              <span className="cb-sign-in-link" onClick={function(){ onClose(); }}>Sign in</span> to leave a comment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   POST CARD
================================================================ */
function PostCard({ post, session, onOpen, onLikeToggle, likedByMe }) {
  var profile = post._profile;

  function handleLike(e) {
    e.stopPropagation();
    if (!session) return;
    onLikeToggle(post.id, !likedByMe, post.likes_count + (!likedByMe ? 1 : -1));
    if (!likedByMe) {
      supabase.from("post_likes").insert({ post_id: post.id, user_id: session.user.id });
    } else {
      supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", session.user.id);
    }
  }

  return (
    <div className="cb-card" onClick={function(){ onOpen(post); }}>
      <div className="cb-card-top">
        <div className="cb-avatar">{profile ? (profile.avatar_emoji || "👻") : "👻"}</div>
        <div className="cb-author-meta">
          <div className="cb-author-name">{profile ? (profile.username || "Anonymous") : "Anonymous"}</div>
          <div className="cb-author-line">
            {post.region && <span className="cb-region-tag">{post.region}</span>}
            <span className={"cb-topic-tag " + (TOPIC_CLASS[post.topic] || "cb-topic-general")}>{topicLabel(post.topic)}</span>
          </div>
        </div>
      </div>

      <div className="cb-post-title">{post.title}</div>
      <div className="cb-post-body">{post.body}</div>
      {post.photo_url && <img src={post.photo_url} className="cb-post-photo" alt="post" />}

      <div className="cb-card-footer">
        <button className={"cb-like-btn"+(likedByMe?" liked":"")} onClick={handleLike} disabled={!session} title={session?"Like":"Sign in to like"}>
          ♥ {post.likes_count}
        </button>
        <span className="cb-comment-count">💬 {post.comments_count}</span>
        <span className="cb-timestamp">{timeAgo(post.created_at)}</span>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT
================================================================ */
const PAGE_SIZE = 15;

export default function CommunityBoard({ session, userRegion, onRequestSignIn }) {
  var [posts, setPosts] = useState([]);
  var [loading, setLoading] = useState(true);
  var [hasMore, setHasMore] = useState(false);
  var [topicFilter, setTopicFilter] = useState("all");
  var [myRegionOnly, setMyRegionOnly] = useState(false);
  var [searchText, setSearchText] = useState("");
  var [likedSet, setLikedSet] = useState({});
  var [showNewPost, setShowNewPost] = useState(false);
  var [openPost, setOpenPost] = useState(null);
  var offsetRef = useRef(0);

  useEffect(function() {
    offsetRef.current = 0;
    setPosts([]);
    loadPosts(true);
  }, [topicFilter, myRegionOnly, searchText]);

  useEffect(function() {
    if (session) loadMyLikes();
  }, [session]);

  async function loadMyLikes() {
    var res = await supabase.from("post_likes").select("post_id").eq("user_id", session.user.id);
    var map = {};
    (res.data || []).forEach(function(r){ map[r.post_id] = true; });
    setLikedSet(map);
  }

  async function loadPosts(reset) {
    setLoading(true);
    var query = supabase.from("posts").select("*").order("created_at", { ascending: false }).range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1);
    if (topicFilter !== "all") query = query.eq("topic", topicFilter);
    if (myRegionOnly && userRegion) query = query.eq("region", userRegion);
    if (searchText.trim()) query = query.ilike("title", "%" + searchText.trim() + "%");
    var res = await query;
    var data = res.data || [];
    setHasMore(data.length === PAGE_SIZE);
    offsetRef.current = offsetRef.current + data.length;

    // attach profiles
    var ids = [...new Set(data.map(function(p){ return p.user_id; }))];
    var profileMap = {};
    if (ids.length > 0) {
      var pr = await supabase.from("profiles").select("id,username,avatar_emoji,avatar_color").in("id", ids);
      (pr.data || []).forEach(function(p){ profileMap[p.id] = p; });
    }
    var enriched = data.map(function(p){ return Object.assign({}, p, { _profile: profileMap[p.user_id] || null }); });

    if (reset) {
      setPosts(enriched);
    } else {
      setPosts(function(prev){ return prev.concat(enriched); });
    }
    setLoading(false);
  }

  function handleLikeToggle(postId, newLiked, newCount) {
    setLikedSet(function(prev){
      var next = Object.assign({}, prev);
      if (newLiked) next[postId] = true; else delete next[postId];
      return next;
    });
    setPosts(function(prev){ return prev.map(function(p){ return p.id===postId ? Object.assign({},p,{likes_count:newCount}) : p; }); });
    if (openPost && openPost.id === postId) {
      setOpenPost(function(p){ return Object.assign({},p,{likes_count:newCount}); });
    }
  }

  function handlePosted(newPost) {
    var enriched = Object.assign({}, newPost, { _profile: null, likes_count: 0, comments_count: 0 });
    setPosts(function(prev){ return [enriched].concat(prev); });
  }

  return (
    <div className="cb-wrap">
      <style>{STYLE}</style>

      <div className="cb-hero">
        <div className="cb-hero-left">
          <div className="cb-hero-eyebrow">GhostBust · Community Board</div>
          <div className="cb-heading">The Ghost<em>Bust</em><br/>Community</div>
          <p className="cb-hero-desc">Real talk from real job seekers. Share ghost job alerts, company reviews, wins, and advice. No recruiters. No corporate speak. Just people fighting back against a broken hiring market.</p>
        </div>
        <div className="cb-hero-right">
          {session ? (
            <button className="cb-new-btn" onClick={function(){ setShowNewPost(true); }}>+ New Post</button>
          ) : (
            <button className="cb-new-btn" onClick={onRequestSignIn}>Sign In to Post</button>
          )}
          {userRegion ? (
            <div className="cb-region-badge">
              <span className="cb-region-badge-dot" />
              {userRegion}
              <button className="cb-region-change" title="Toggle region filter" onClick={function(){ setMyRegionOnly(function(v){ return !v; }); }}>
                {myRegionOnly ? "✕" : "⇄"}
              </button>
            </div>
          ) : (
            <span className="cb-no-region">🌐 Global feed</span>
          )}
        </div>
      </div>

      <div className="cb-filters">
        {TOPICS.map(function(t){
          return (
            <button key={t.key} className={"cb-topic-pill"+(topicFilter===t.key?" active":"")} onClick={function(){ setTopicFilter(t.key); }}>
              {t.label}
            </button>
          );
        })}
        {userRegion && (
          <>
            <div className="cb-filter-sep" />
            <button className={"cb-region-toggle"+(myRegionOnly?" active":"")} onClick={function(){ setMyRegionOnly(function(v){ return !v; }); }}>
              {myRegionOnly ? "📍 " + userRegion : "📍 My Region"}
            </button>
          </>
        )}
        <div className="cb-filter-sep" />
        <input className="cb-search-input" placeholder="Search posts..." value={searchText} onChange={function(e){ setSearchText(e.target.value); }} />
      </div>

      {loading && posts.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Space Mono',monospace",fontSize:11,color:"var(--ghost)"}}>Loading...</div>
      ) : posts.length === 0 ? (
        <div className="cb-empty">
          <div className="cb-empty-icon">👻</div>
          <div className="cb-empty-title">No Posts Yet</div>
          <div className="cb-empty-sub">{session ? "Be the first to post." : "Sign in to join the conversation."}</div>
        </div>
      ) : (
        <div className="cb-feed">
          {posts.map(function(p){
            return (
              <PostCard
                key={p.id}
                post={p}
                session={session}
                onOpen={setOpenPost}
                onLikeToggle={handleLikeToggle}
                likedByMe={!!likedSet[p.id]}
              />
            );
          })}
          {hasMore && (
            <button className="cb-load-more" onClick={function(){ loadPosts(false); }} disabled={loading}>
              {loading ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      )}

      {showNewPost && session && (
        <NewPostModal
          session={session}
          userRegion={userRegion}
          onClose={function(){ setShowNewPost(false); }}
          onPosted={handlePosted}
        />
      )}

      {openPost && (
        <PostDetail
          post={openPost}
          session={session}
          onClose={function(){ setOpenPost(null); }}
          onLikeToggle={handleLikeToggle}
        />
      )}
    </div>
  );
}
