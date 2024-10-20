const postsContainer = document.getElementById('stories');
const loadMoreButton = document.getElementById('loadMore');
let currentPage = 0;
const pageSize = 10;
let currentType = 'new';  // Default to loading 'new' stories

// Cache to store posts by story type and IDs
const postsCache = {
    new: [],
    top: [],
    best: [],
    ask: [],
    show: [],
    job: []
};

// Debounce function to limit the rate at which `loadPosts` is called
function debounce(func, delay) {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), delay);
    };
}

async function loadStories(type) {
    currentType = type;  // Set the current story type based on the button clicked
    currentPage = 0;  // Reset the page number to 0
    postsContainer.innerHTML = '';  // Clear the container

    // Clear the cache for the selected type to fetch fresh data
    postsCache[currentType] = [];

    // If we have cached posts for the selected type, render them immediately
    if (postsCache[currentType].length > 0) {
        renderPosts(postsCache[currentType].slice(0, pageSize));
        currentPage++;
    } else {
        await fetchPosts();  // Fetch from API if no cached posts for the selected type
    }
}

// Fetches posts from the API
async function fetchPosts() {
    try {
        const response = await fetch(`https://hacker-news.firebaseio.com/v0/${currentType}stories.json?print=pretty`);
        const postIds = await response.json();  // Get the list of post IDs
        const postsToLoad = postIds.slice(currentPage * pageSize, (currentPage + 1) * pageSize);  // Get posts for the current page

        const posts = await Promise.all(postsToLoad.map(id => fetchPost(id)));  // Fetch the full post details

        // Cache the fetched posts
        postsCache[currentType] = [...postsCache[currentType], ...posts];  // Append the new posts to the cache
        renderPosts(posts);  // Render the fetched posts
        currentPage++;  // Move to the next page
    } catch (error) {
        console.error('Error fetching posts:', error);  // Log any error that occurs
    }
}

// Fetch a specific post by its ID
async function fetchPost(id) {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`);
    return response.json();  // Return the post details
}

// Renders a list of posts
function renderPosts(posts) {
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';  // Add the 'post' class to the post element

        // Make the post title a clickable link
        const titleElement = document.createElement('h2');
        const linkElement = document.createElement('a');
        linkElement.href = post.url ? post.url : '#';  // Use the post URL or fallback to '#'
        linkElement.textContent = post.title;  // Set the post title
        linkElement.target = '_self';  // Open the link in the same window
        titleElement.appendChild(linkElement);  // Append the link to the title
        postElement.appendChild(titleElement);  // Append the title to the post element

        const authorElement = document.createElement('p');
        authorElement.textContent = `by ${post.by} | ${new Date(post.time * 1000).toLocaleString()}`;
        postElement.appendChild(authorElement);  // Append the author and time to the post

        // If the post has comments, fetch and render them
        if (post.kids) {
            const commentsContainer = document.createElement('div');
            post.kids.forEach(commentId => fetchComment(commentId, commentsContainer));  // Fetch and render each comment
            postElement.appendChild(commentsContainer);  // Append the comments to the post
        }

        postsContainer.appendChild(postElement);  // App end the post to the container
    });
}

// Fetch and render a comment by its ID
async function fetchComment(id, container) {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`);
    const comment = await response.json();  // Fetch the comment details

    const commentElement = document.createElement('div');
    commentElement.className = 'comment';  // Add the 'comment' class to the comment
    commentElement.innerHTML = `<strong>${comment.by}</strong>: ${comment.text}`;
    container.appendChild(commentElement);  // Append the comment to the container
}

const debouncedFetchPosts = debounce(fetchPosts, 500); // 500ms delay to throttle requests

loadMoreButton.addEventListener('click', debouncedFetchPosts);  // Trigger the fetchPosts function on "Load More"

// Initial fetch for 'new' stories
loadStories('new');