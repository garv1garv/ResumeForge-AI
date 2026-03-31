export async function fetchGitHubProfile(username) {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok) throw new Error(`GitHub user "${username}" not found`);
  return res.json();
}

export async function fetchGitHubRepos(username) {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=owner`
  );
  if (!res.ok) throw new Error(`Failed to fetch repos for "${username}"`);
  const repos = await res.json();

  // Sort by stars, then by recent update
  return repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.updated_at) - new Date(a.updated_at))
    .map((r) => ({
      name: r.name,
      description: r.description || "No description",
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      url: r.html_url,
      homepage: r.homepage,
      topics: r.topics || [],
      updatedAt: r.updated_at,
    }));
}

export async function fetchRepoLanguages(username, repoName) {
  const res = await fetch(`https://api.github.com/repos/${username}/${repoName}/languages`);
  if (!res.ok) return {};
  return res.json();
}
