function isWikipediaArticle() {
  const contentText = document.getElementById('content');
  return contentText !== null;
}

if (isWikipediaArticle()) {
  const pageTitle = document.title.replace(/ - Wikipedia$/, '');
  const pageUrl = window.location.href;
  const category = ''; // Default category (empty string)

  chrome.storage.sync.get('visitedWikipediaLinks', (data) => {
    const visitedLinks = data.visitedWikipediaLinks || {};
    visitedLinks[pageUrl] = { title: pageTitle, category: category };

    chrome.storage.sync.set({ visitedWikipediaLinks: visitedLinks }, () => {
      console.log(`Stored ${pageTitle} (${pageUrl})`);
    });
  });
}
