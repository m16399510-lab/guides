const VERSION_POLL_MS = 60 * 1000;
const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const VERSION_FILE = `${BASE_URL}version.json`;
const RELOAD_MARK = "__yuyanjia_build";
const UPDATE_TOAST_ID = "yuyanjia-update-toast";

function currentBuildId() {
  const meta = document.querySelector('meta[name="app-build-id"]');
  return String(meta?.getAttribute("content") || "").trim();
}

function cleanupReloadMark() {
  const url = new URL(window.location.href);
  const currentMark = url.searchParams.get(RELOAD_MARK);
  const localBuildId = currentBuildId();

  if (localBuildId && currentMark === localBuildId) {
    url.searchParams.delete(RELOAD_MARK);
    window.history.replaceState({}, "", url.toString());
  }
}

function showUpdateToast(version) {
  if (document.getElementById(UPDATE_TOAST_ID)) return;

  const toast = document.createElement("div");
  toast.id = UPDATE_TOAST_ID;
  toast.textContent = version
    ? `教程站已更新到 v${version}，正在刷新页面...`
    : "教程站已更新，正在刷新页面...";

  Object.assign(toast.style, {
    position: "fixed",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "9999",
    maxWidth: "calc(100vw - 28px)",
    padding: "10px 16px",
    border: "1px solid rgba(239, 199, 119, 0.42)",
    borderRadius: "999px",
    background: "rgba(9, 18, 34, 0.86)",
    color: "#fff7e9",
    fontSize: "14px",
    fontWeight: "800",
    lineHeight: "1.4",
    boxShadow: "0 18px 46px rgba(0, 0, 0, 0.32)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    backdropFilter: "blur(14px)"
  });

  document.body.appendChild(toast);
}

function triggerHardRefresh(nextBuildId, nextVersion) {
  showUpdateToast(nextVersion);

  window.setTimeout(() => {
    const url = new URL(window.location.href);
    url.searchParams.set(RELOAD_MARK, nextBuildId);
    window.location.replace(url.toString());
  }, 800);
}

async function fetchRemoteBuildMeta() {
  const response = await fetch(`${VERSION_FILE}?t=${Date.now()}`, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache"
    }
  });

  if (!response.ok) return null;
  return response.json();
}

export function startAutoRefreshOnUpdate() {
  if (!import.meta.env.PROD || typeof window === "undefined") {
    return () => {};
  }

  cleanupReloadMark();

  let refreshing = false;

  const checkForUpdate = async () => {
    if (refreshing || document.visibilityState === "hidden") return;

    try {
      const localBuildId = currentBuildId();
      if (!localBuildId) return;

      const remoteBuild = await fetchRemoteBuildMeta();
      if (!remoteBuild?.buildId) return;

      if (remoteBuild.buildId !== localBuildId) {
        refreshing = true;
        triggerHardRefresh(remoteBuild.buildId, remoteBuild.version);
      }
    } catch (error) {
      console.warn("[YuyanjiaDocs] 检查前端更新失败:", error);
    }
  };

  const intervalId = window.setInterval(() => {
    void checkForUpdate();
  }, VERSION_POLL_MS);

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      void checkForUpdate();
    }
  };

  const handleFocus = () => {
    void checkForUpdate();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", handleFocus);
  void checkForUpdate();

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleFocus);
  };
}
