import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import CalcoBetLogo from "./CalcoBetLogo";

function Section({ title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#F59E0B" }}>{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

function Row({ label, value, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
      <div className="sm:w-48 shrink-0">
        <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
        {value && <p className="mt-0.5 text-sm text-white">{value}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "14px",
  color: "white",
  outline: "none",
};

export default function SettingsPage() {
  const { user, authLoading, logout, apiFetch } = useAuth();

  const [pwForm, setPwForm]   = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy]   = useState(false);
  const [pwMsg, setPwMsg]     = useState(null); // { type: "ok"|"err", text }

  const [portalBusy, setPortalBusy] = useState(false);
  const [portalErr, setPortalErr]   = useState("");

  if (authLoading) {
    return (
      <div className="min-h-screen font-sans flex items-center justify-center" style={{ background: "linear-gradient(135deg, #060D1A 0%, #0B1628 60%, #0D1F3C 100%)" }}>
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(245,158,11,0.4)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: "err", text: "New passwords do not match" });
      return;
    }
    if (pwForm.next.length < 8) {
      setPwMsg({ type: "err", text: "New password must be at least 8 characters" });
      return;
    }
    setPwBusy(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      setPwMsg({ type: "ok", text: "Password updated successfully" });
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwMsg({ type: "err", text: err.message });
    } finally {
      setPwBusy(false);
    }
  }

  async function openPortal() {
    setPortalErr("");
    setPortalBusy(true);
    try {
      const { url } = await apiFetch("/api/stripe/create-portal-session", { method: "POST" });
      window.location.href = url;
    } catch (err) {
      setPortalErr(err.message);
      setPortalBusy(false);
    }
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #060D1A 0%, #0B1628 60%, #0D1F3C 100%)" }}>
      <div className="top-bar h-[3px] w-full" />

      {/* Header */}
      <header className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-6xl lg:px-8 flex items-center justify-between">
          <a href="/">
            <CalcoBetLogo tileSize={36} textSize={23} taglineSize={8} gap={10} />
          </a>
          <a href="/" className="text-sm transition-opacity hover:opacity-80" style={{ color: "rgba(255,255,255,0.45)" }}>
            ← Back to dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Account Settings</h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Manage your account and subscription</p>
        </div>

        <div className="space-y-6 max-w-2xl">

          {/* Account info */}
          <Section title="Account">
            <Row label="Email address" value={user.email} />
            <Row label="Plan">
              <div className="flex items-center gap-3">
                {user.is_pro ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                    ✓ Pro Member
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    Free
                  </span>
                )}
              </div>
            </Row>
          </Section>

          {/* Subscription */}
          <Section title="Subscription">
            {user.is_pro ? (
              <>
                <Row label="Status">
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    You have an active Pro subscription. You can manage billing, update your payment method, or cancel at any time through the Stripe customer portal.
                  </p>
                </Row>
                {portalErr && (
                  <p className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#F87171" }}>{portalErr}</p>
                )}
                <button onClick={openPortal} disabled={portalBusy}
                  className="cursor-pointer rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 4px 16px rgba(245,158,11,0.25)" }}>
                  {portalBusy ? "Opening…" : "Manage Subscription →"}
                </button>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>You'll be redirected to Stripe's secure billing portal to update payment or cancel.</p>
              </>
            ) : (
              <>
                <Row label="Status">
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>You're on the free plan. Upgrade to Pro to unlock all +EV edges, daily parlay, and more.</p>
                </Row>
                <a href="/#pricing"
                  className="inline-flex cursor-pointer rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 4px 16px rgba(245,158,11,0.25)" }}>
                  Upgrade to Pro — $20/mo →
                </a>
              </>
            )}
          </Section>

          {/* Change password */}
          <Section title="Security">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Row label="Current password">
                <input type="password" required placeholder="••••••••" value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
              </Row>
              <Row label="New password">
                <input type="password" required placeholder="At least 8 characters" value={pwForm.next}
                  onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
              </Row>
              <Row label="Confirm new password">
                <input type="password" required placeholder="••••••••" value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
              </Row>

              {pwMsg && (
                <p className="rounded-lg px-4 py-3 text-sm" style={pwMsg.type === "ok"
                  ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#34D399" }
                  : { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#F87171" }}>
                  {pwMsg.text}
                </p>
              )}

              <button type="submit" disabled={pwBusy}
                className="cursor-pointer rounded-xl px-6 py-3 text-sm font-bold transition-all hover:opacity-80 disabled:opacity-60"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}>
                {pwBusy ? "Updating…" : "Update Password"}
              </button>
            </form>
          </Section>

          {/* Danger zone */}
          <Section title="Session">
            <Row label="Sign out" value="End your current session on this device.">
              <button onClick={() => { logout(); window.location.href = "/"; }}
                className="cursor-pointer rounded-xl px-6 py-3 text-sm font-bold transition-all hover:opacity-80"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>
                Sign Out
              </button>
            </Row>
          </Section>

        </div>
      </main>
    </div>
  );
}
