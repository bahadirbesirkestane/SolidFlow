function syncSidebarGroupState(pageName) {
  const activeButton = document.querySelector(`.sidebar-link[data-page-link="${pageName}"]`);
  const activeGroup = activeButton ? activeButton.closest(".sidebar-group") : null;

  document.querySelectorAll(".sidebar-group").forEach((group) => {
    if (group === activeGroup) {
      group.open = true;
    }
  });
}

window.syncSidebarGroupState = syncSidebarGroupState;
