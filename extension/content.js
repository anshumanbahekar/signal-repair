// Listen for text selection and store it
document.addEventListener('mouseup', () => {
  const selected = window.getSelection()?.toString().trim();
  if (selected && selected.length > 10) {
    chrome.storage.local.set({ selectedText: selected.slice(0, 500) });
  }
});
