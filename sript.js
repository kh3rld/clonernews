const postsContainer = document.getElementById("stories");
const loadMoreButton = document.getElementById("loadMore");
const liveUpdateBanner = document.getElementById("liveUpdate");
let currentPage = 0;
let currentType = "top";
const pageSize = 10;
const postsCache = {};
let lastUpdateTime = Date.now();

function debounce(func, delay) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, arguments), delay);
  };
}

async function loadStories(type) {
  currentType = type;
  currentPage = 0;
  postsContainer.innerHTML = "";
  document
    .querySelectorAll(".tab-button")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelector(`.tab-button[onclick="loadStories('${type}')"]`)
    .classList.add("active");
  await fetchPosts();
}

async function fetchPosts() {
  try {
    const response = await fetch(
      `https://hacker-news.firebaseio.com/v0/${currentType}stories.json`
    );
    const postIds = await response.json();
    const postsToLoad = postIds.slice(
      currentPage * pageSize,
      (currentPage + 1) * pageSize
    );
    const posts = await Promise.all(postsToLoad.map((id) => fetchPost(id)));
    renderPosts(posts);
    currentPage++;
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
}

async function fetchPost(id) {
  const response = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json`
  );
  return response.json();
}

function renderPosts(posts) {
  posts.forEach((post) => {
    const postElement = document.createElement("div");
    postElement.className = "post";
    postElement.innerHTML = `
            <h2><a href="${post.url || "#"}" target="_blank">${
      post.title
    }</a></h2>
            <div class="post-meta">
                <button class="upvote-button" onclick="upvotePost(${
                  post.id
                })">▲</button>
                by ${post.by} | ${new Date(
      post.time * 1000
    ).toLocaleString()} | 
                <button class="comment-toggle" onclick="toggleComments(${
                  post.id
                })">
                    ${post.kids ? post.kids.length : 0} comments
                </button>
            </div>
            <div id="comments-${post.id}" style="display: none;"></div>
        `;
    postsContainer.appendChild(postElement);
  });
}

async function fetchComments(postId) {
  const post = await fetchPost(postId);
  if (post.kids) {
    const comments = await Promise.all(post.kids.map(fetchComment));
    return comments;
  }
  return [];
}

async function fetchComment(id) {
  const response = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json`
  );
  return response.json();
}

function renderComments(comments, container, level = 0) {
  comments.forEach((comment) => {
    if (comment.deleted) return;
    const commentElement = document.createElement("div");
    commentElement.className = "comment";
    commentElement.style.marginLeft = `${level * 20}px`;
    commentElement.innerHTML = `
            <p><strong>${comment.by}</strong>: ${comment.text}</p>
            ${
              comment.kids
                ? `<button class="comment-toggle" onclick="toggleReplies(${comment.id})">Show Replies</button>`
                : ""
            }
            <div id="replies-${comment.id}" style="display: none;"></div>
        `;
    container.appendChild(commentElement);
  });
}

async function toggleComments(postId) {
  const commentsContainer = document.getElementById(`comments-${postId}`);
  if (commentsContainer.style.display === "none") {
    commentsContainer.style.display = "block";
    if (commentsContainer.children.length === 0) {
      const comments = await fetchComments(postId);
      renderComments(comments, commentsContainer);
    }
  } else {
    commentsContainer.style.display = "none";
  }
}

async function toggleReplies(commentId) {
  const repliesContainer = document.getElementById(`replies-${commentId}`);
  if (repliesContainer.style.display === "none") {
    repliesContainer.style.display = "block";
    if (repliesContainer.children.length === 0) {
      const comment = await fetchComment(commentId);
      if (comment.kids) {
        const replies = await Promise.all(comment.kids.map(fetchComment));
        renderComments(replies, repliesContainer, 1);
      }
    }
  } else {
    repliesContainer.style.display = "none";
  }
}

function upvotePost(postId) {
  console.log(`Upvoted post ${postId}`);
  // Here you would typically send a request to your backend to handle the upvote
}

function checkForUpdates() {
  fetch(`https://hacker-news.firebaseio.com/v0/${currentType}stories.json`)
    .then((response) => response.json())
    .then((newIds) => {
      const firstNewId = newIds[0];
      if (
        firstNewId &&
        !document.querySelector(`.post[data-id="${firstNewId}"]`)
      ) {
        showUpdateNotification();
      }
    });
}

function showUpdateNotification() {
  liveUpdateBanner.textContent =
    "New stories available! Refresh to see the latest.";
  liveUpdateBanner.style.display = "block";
  setTimeout(() => {
    liveUpdateBanner.style.display = "none";
  }, 5000);
}

const debouncedFetchPosts = debounce(fetchPosts, 500);

loadMoreButton.addEventListener("click", debouncedFetchPosts);

loadStories("top");

setInterval(checkForUpdates, 5000);
