/* messages.js — a simple two-pane messaging page.
   Conversations are stored in data.json; sending a message appends to it.
   There is no real-time delivery — this is a coursework prototype. */
document.addEventListener("DOMContentLoaded", async function () {
  await Store.init();
  if (!requireAuth()) return;

  const me = Store.currentUser();
  const convs = Store.getConversations(me.id);
  const $list = document.getElementById("conv-list");
  const $search = document.getElementById("conv-search");
  const $chat = document.getElementById("chat-pane");

  // the person on the other side of a conversation
  function otherUser(conv) {
    return Store.getUser(conv.userA === me.id ? conv.userB : conv.userA);
  }

  // no conversations yet
  if (convs.length === 0) {
    $list.innerHTML = '<p class="text-muted small p-2 mb-0">No conversations yet.</p>';
    $chat.innerHTML = '<div class="p-5 text-center text-muted">Your messages will appear here.</div>';
    return;
  }

  let activeId = convs[0].id;   // show the first conversation by default

  /* ---------- left: conversation list ---------- */
  function renderList() {
    const term = $search.value.trim().toLowerCase();
    $list.innerHTML = convs
      .filter(c => otherUser(c).name.toLowerCase().includes(term))
      .map(c => {
        const other = otherUser(c);
        const last = c.messages[c.messages.length - 1];
        return `
        <div class="nl-msg-item ${c.id === activeId ? "active" : ""}" data-id="${c.id}">
          ${nlAvatar(other)}
          <div class="flex-grow-1 overflow-hidden">
            <div class="d-flex justify-content-between">
              <span class="who">${nlEscape(other.name)}</span>
              <span class="small text-muted">${last ? nlEscape(last.time) : ""}</span>
            </div>
            <div class="snippet text-truncate">${last ? nlEscape(last.text) : ""}</div>
          </div>
        </div>`;
      }).join("");

    $list.querySelectorAll(".nl-msg-item").forEach(item =>
      item.addEventListener("click", () => {
        activeId = parseInt(item.dataset.id, 10);
        renderList();
        renderChat();
      }));
  }

  /* ---------- right: active conversation ---------- */
  function renderChat() {
    const conv = Store.getConversation(activeId);
    const other = otherUser(conv);

    const bubbles = conv.messages.map(m => {
      const mine = m.senderId === me.id;
      return `
        <div class="nl-msg-row ${mine ? "out" : "in"}">
          <div class="nl-msg-bubble ${mine ? "out" : "in"}">${nlEscape(m.text)}</div>
          <div class="nl-msg-time">${nlEscape(m.time)}</div>
        </div>`;
    }).join("");

    $chat.innerHTML = `
      <div class="p-3 border-bottom d-flex align-items-center gap-2">
        ${nlAvatar(other)}<h5 class="mb-0">${nlEscape(other.name)}</h5>
      </div>
      <div class="nl-msg-thread" id="msg-thread">${bubbles}</div>
      <form class="nl-msg-composer" id="msg-form">
        <i class="bi bi-paperclip fs-5 text-muted"></i>
        <i class="bi bi-camera fs-5 text-muted"></i>
        <input id="msg-input" class="form-control" placeholder="Message ${nlEscape(other.name)}…" autocomplete="off">
        <button class="btn btn-nl" type="submit"><i class="bi bi-send"></i></button>
      </form>`;

    // scroll to the newest message
    const thread = document.getElementById("msg-thread");
    thread.scrollTop = thread.scrollHeight;

    // send a message
    document.getElementById("msg-form").addEventListener("submit", async function (e) {
      e.preventDefault();
      const input = document.getElementById("msg-input");
      const text = input.value.trim();
      if (!text) return;
      await Store.sendMessage(activeId, me.id, text);
      input.value = "";
      renderChat();   // redraw the thread with the new bubble
      renderList();   // update the snippet on the left
    });
  }

  $search.addEventListener("input", renderList);
  renderList();
  renderChat();
});
