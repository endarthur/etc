// ═══════════════════════════════════════════
// ENTER DESKTOP — enhanced
// ═══════════════════════════════════════════
const _origEnterDesktop = enterDesktop;
enterDesktop = function() {
  _origEnterDesktop();
  // Post-desktop setup
  setTimeout(async () => {
    renderRoutingSettings();
    refreshSkillsPanel();
    refreshDesktopIcons();
    refreshFileBrowser();
    refreshMemoryViewer();
    updateToolsInspector();
    updateRoutingViewer();
    if (STATE.wsHandle) {
      document.getElementById('trash-icon').style.display = '';
      refreshTrashView();
    }
    await loadDynamicSkills();
    refreshSkillsPanel();
    // Auto-start Telegram if token is set
    if (STATE.tgToken) startTgPolling();
    await initScheduler();
    // Stats & About
    STATE.stats.bootTime = Date.now();
    refreshAboutWindow();
    setInterval(refreshAboutWindow, 30000);
    // Desktop pet
    if (STATE.safety.petEnabled) spawnPet();
  }, 200);
};

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
updateDock();
boot();