chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "repairSignal",
    title: "Repair Signal — verify this claim",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "repairSignal" && info.selectionText) {
    chrome.storage.local.set({ 
      pendingClaim: info.selectionText.trim().slice(0, 500)
    });
    chrome.action.openPopup();
  }
});
