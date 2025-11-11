const API_BASE = "http://localhost:3000/api";

const discussionsDiv = document.getElementById("discussions");
const discussionModal = document.getElementById("discussionModal");
const commentModal = document.getElementById("commentModal");
const replyModal = document.getElementById("replyModal");

const classList = document.getElementById("classList");
const currentClassTitle = document.getElementById("currentClassTitle");
const commentClassSelect = document.getElementById("commentClassSelect");

let discussions = [];
let selectedClassName = null;
let selectedDiscussionId = null;
let selectedCommentId = null;

// Fetch and render discussions
async function fetchDiscussions() {
    try {
        const res = await fetch(`${API_BASE}/classDiscussions`);
        discussions = await res.json();

        renderSidebar(discussions);
        renderClassDropdown(discussions);
        renderDiscussions(
            selectedClassName ? discussions.filter(d => d.name === selectedClassName) : discussions
        );
    } catch (err) {
        console.error("Failed to fetch discussions:", err);
    }
}

// Sidebar
function renderSidebar(discussions) {
    classList.innerHTML = `
    <li class="${!selectedClassName ? "active" : ""}" onclick="filterByClass(null)">All Classes</li>
    ${discussions
        .map(
            (d) => `
      <li class="${selectedClassName === d.name ? "active" : ""}" onclick="filterByClass('${d.name}')">
        ${d.name}
      </li>
    `
        )
        .join("")}
  `;
}

function filterByClass(className) {
    selectedClassName = className;
    currentClassTitle.textContent = className || "All Classes";
    renderSidebar(discussions);
    renderDiscussions(
        className ? discussions.filter((d) => d.name === className) : discussions
    );
}

// Class dropdown for comment modal
function renderClassDropdown(discussions) {
    commentClassSelect.innerHTML = discussions
        .map((d) => `<option value="${d.id}">${d.name}</option>`)
        .join("");
}

// Render discussions, comments, replies
function renderDiscussions(discussionsToRender) {
    discussionsDiv.innerHTML = "";

    if (!discussionsToRender.length) {
        discussionsDiv.innerHTML = `<p>No discussions yet. Start one!</p>`;
        return;
    }

    discussionsToRender.forEach((d) => {
        const div = document.createElement("div");
        div.className = "discussion";

        div.innerHTML = `
      <h3>${d.name}</h3>
      <p>${d.content || ""}</p>

      <div class="comments">
        ${(d.comments || [])
            .map(
                (c) => `
            <div class="comment">
              <strong>${c.name}</strong>
              <p>${c.content}</p>
              <div class="reply-actions">
                <span class="reply-toggle" onclick="toggleReplies(${c.id})">View Replies ▼</span>
                <button class="btn small" onclick="openReplyPrompt(${c.id})">Reply</button>
              </div>

              <div id="replies-${c.id}" class="replies">
                ${(c.replies || [])
                    .map(
                        (r) => `
                    <div class="reply">
                      <strong>${r.name}</strong>
                      <p>${r.content}</p>
                      <small>${new Date(r.date).toLocaleDateString()}</small>
                    </div>
                  `
                    )
                    .join("")}
              </div>
            </div>
          `
            )
            .join("")}
      </div>
    `;
        discussionsDiv.appendChild(div);
    });
}

// Toggle replies
function toggleReplies(commentId) {
    const container = document.getElementById(`replies-${commentId}`);
    if (!container) return;
    container.style.display = container.style.display === "block" ? "none" : "block";
}

// Create new class
document.getElementById("newDiscussionBtn").onclick = () => {
    discussionModal.style.display = "flex";
};

document.getElementById("createDiscussionBtn").onclick = async () => {
    const discussionName = document.getElementById("discussionTitle").value.trim();
    const discussionCode = document.getElementById("discussionCode").value.trim();

    if (!discussionName || !discussionCode) return alert("Please fill all fields");

    try {
        await fetch(`${API_BASE}/classDiscussions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: discussionName, class_code: discussionCode })
        });
        closeModals();
        await fetchDiscussions();
    } catch (err) {
        console.error("Error creating class:", err);
    }
};

// Add comment
document.getElementById("addCommentBtn").onclick = () => {
    commentModal.style.display = "flex";
};

document.getElementById("submitCommentBtn").onclick = async () => {
    const discussionId = commentClassSelect.value;
    const name = document.getElementById("commentAuthor").value.trim();
    const content = document.getElementById("commentContent").value.trim();

    if (!discussionId || !name || !content) return alert("Please fill all fields");

    try {
        await fetch(`${API_BASE}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, content, discussion_id: discussionId })
        });
        closeModals();
        await fetchDiscussions();
    } catch (err) {
        console.error("Error adding comment:", err);
    }
};

// Add reply
function openReplyPrompt(commentId) {
    selectedCommentId = commentId;
    replyModal.style.display = "flex";
}

document.getElementById("submitReplyBtn").onclick = async () => {
    const name = document.getElementById("replyAuthor").value.trim();
    const content = document.getElementById("replyContent").value.trim();

    if (!name || !content) return alert("Please fill all fields");

    try {
        await fetch(`${API_BASE}/replies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, content, comment_id: selectedCommentId })
        });
        closeModals();
        await fetchDiscussions();
    } catch (err) {
        console.error("Error adding reply:", err);
    }
};

// Modal handling
function closeModals() {
    document.querySelectorAll(".modal").forEach((m) => (m.style.display = "none"));
}

document.querySelectorAll(".closeModal").forEach((btn) => {
    btn.onclick = closeModals;
});

// Initialize
fetchDiscussions();








