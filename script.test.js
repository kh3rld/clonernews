import { debounce, fetchPost, renderPosts } from "./script";

// Mocking the fetch API
global.fetch = jest.fn();

describe("App Functions", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test("debounce function calls after delay", () => {
    jest.useFakeTimers();
    const callback = jest.fn();
    const debouncedFunction = debounce(callback, 1000);

    debouncedFunction();
    expect(callback).not.toBeCalled();

    jest.runAllTimers();
    expect(callback).toBeCalled();
  });

  test("fetchPost returns post data", async () => {
    const mockPost = { id: 1, title: "Test Post" };
    fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockPost),
    });

    const post = await fetchPost(1);
    expect(post).toEqual(mockPost);
    expect(fetch).toHaveBeenCalledWith(
      "https://hacker-news.firebaseio.com/v0/item/1.json"
    );
  });

  test("renderPosts creates correct DOM elements", () => {
    document.body.innerHTML = '<div id="stories"></div>';
    const posts = [
      {
        id: 1,
        title: "Post 1",
        url: "http://example.com",
        by: "Author 1",
        time: 1622559600,
        kids: [],
      },
    ];

    renderPosts(posts);

    const postElement = document.querySelector(".post");
    expect(postElement).toBeInTheDocument();
    expect(postElement.querySelector("h2").textContent).toBe("Post 1");
  });
});
