const postsContainer = document.getElementById("stories");
const loadMoreButton = document.getElementById("loadMore");
const liveUpdateBanner = document.getElementById("liveUpdate");
let currentPage = 0;
let currentType = "top";
const pageSize = 10;
const postsCache = {};
let lastUpdateTime = Date.now();

// Debounce function to limit how often a function can be called
function debounce(func, delay) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, arguments), delay);
  };
}

// Load stories based on the selected type and reset the display
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

// Fetch posts from the API based on the current type and page
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

// Fetch a specific post by its ID
async function fetchPost(id) {
  const response = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json`
  );
  return response.json();
}

// Render a list of posts in the container
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

// Fetch comments for a specific post by its ID
async function fetchComments(postId) {
  const post = await fetchPost(postId);
  if (post.kids) {
    const comments = await Promise.all(post.kids.map(fetchComment));
    return comments;
  }
  return [];
}

// Fetch a specific comment by its ID
async function fetchComment(id) {
  try {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch comment:', error);
    throw error; // re-throw the error for further handling if needed
  }
}

// Render a list of comments in the specified container
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

// Toggle visibility of comments for a specific post
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

// Toggle visibility of replies for a specific comment
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

// Handle upvoting a post (currently just logs to console)
function upvotePost(postId) {
  console.log(`Upvoted post ${postId}`);
}

// Check for updates to the list of stories
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

// Show a notification for new stories
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
// Set interval to check for updates every 5 seconds
setInterval(checkForUpdates, 5000);
