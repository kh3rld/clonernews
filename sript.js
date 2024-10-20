
const postsContainer = document.getElementById('stories');
const loadMoreButton = document.getElementById('loadMore');
let currentPage = 0;
const pageSize = 10;
const currentType = 'new';  // Always load 'new' stories on "Load More"

// Cache to store posts by story type and IDs
const postsCache = {
    new: []
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
    // We're always loading 'new' stories now, so we just reset the page and clear the content
    currentPage = 0;  // Reset the page for loading new stories
    postsContainer.innerHTML = '';  // Clear previous content

    // If we have cached posts, render them immediately
    if (postsCache.new.length > 0) {
        renderPosts(postsCache.new.slice(0, pageSize));
        currentPage++;
    } else {
        await fetchPosts();  // Fetch from API if no cached posts
    }
}

async function fetchPosts() {
    try {
        const response = await fetch(`https://hacker-news.firebaseio.com/v0/newstories.json`);
        const postIds = await response.json();
        const postsToLoad = postIds.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

        const posts = await Promise.all(postsToLoad.map(id => fetchPost(id)));
        
        // Cache the fetched posts
        postsCache.new = [...postsCache.new, ...posts];
        renderPosts(posts);
        currentPage++;
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

async function fetchPost(id) {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    return response.json();
}

function renderPosts(posts) {
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';

        // Make the post title a clickable link
        const titleElement = document.createElement('h2');
        const linkElement = document.createElement('a');
        linkElement.href = post.url ? post.url : '#';  // Use the post URL or fallback to '#'
        linkElement.textContent = post.title;
        linkElement.target = '_self';  // Opens the link in the same window
        titleElement.appendChild(linkElement);
        postElement.appendChild(titleElement);

        const authorElement = document.createElement('p');
        authorElement.textContent = `by ${post.by} | ${new Date(post.time * 1000).toLocaleString()}`;
        postElement.appendChild(authorElement);

        if (post.kids) {
            const commentsContainer = document.createElement('div');
            post.kids.forEach(commentId => fetchComment(commentId, commentsContainer));
            postElement.appendChild(commentsContainer);
        }

        postsContainer.appendChild(postElement);
    });
}

async function fetchComment(id, container) {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    const comment = await response.json();

    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.innerHTML = `<strong>${comment.by}</strong>: ${comment.text}`;
    container.appendChild(commentElement);
}

const debouncedFetchPosts = debounce(fetchPosts, 5000); // 5000ms (5sec) delay to throttle requests

loadMoreButton.addEventListener('click', debouncedFetchPosts);

// Initial fetch for 'new' stories
loadStories('new');