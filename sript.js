//clonernews scripts

const API_BASE_URL = 'https://hacker-news.firebaseio.com/v0';

async function fetchItems(id) {
    const response = await fetch(`${API_BASE_URL}/item/${id}.json`);
    return response.json();
}

async function fetchStories(type) {
    const response = await fetch(`${API_BASE_URL}/${type}stories.json`);
    return response.json();
}