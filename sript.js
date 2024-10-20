//clonernews scripts

const API_BASE_URL = 'https://hacker-news.firebaseio.com/v0';

async function fetchItem(id) {
    const response = await fetch(`${API_BASE_URL}/item/${id}.json`);
    return response.json();
}
