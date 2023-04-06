window.addEventListener('DOMContentLoaded', () => {
  const visitedLinks = document.getElementById('visitedLinks');
  const clearHistoryButton = document.getElementById('clearHistory');
  const searchBar = document.getElementById('searchBar');
  const categoryInput = document.getElementById('categoryInput');
  const exportHistoryButton = document.getElementById('exportHistory');
  const importHistoryButton = document.getElementById('importHistory');

  let links = {};

  // Object to store summaries
  const summaries = {};

  function renderLinks() {
    visitedLinks.innerHTML = '';
    const searchQuery = searchBar.value.toLowerCase();
    const categoryFilter = categoryInput.value.toLowerCase();

    for (const url in links) {
      const { title, category } = links[url]; // Extract title and category

      // Filter by search query and category
      if (searchQuery && !title.toLowerCase().includes(searchQuery)) {
        continue;
      }
      if (categoryFilter && !category.toLowerCase().includes(categoryFilter)) {
        continue;
      }
      
      

      // Create list item and link elements
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = url;
      link.textContent = title;
      link.target = '_blank';

      // Show category if available
      const categoryLabel = document.createElement('span');
      categoryLabel.className = 'category-label';
      categoryLabel.textContent = category || '';

      // Create container for link and category label
      const linkContainer = document.createElement('div');
      linkContainer.className = 'link-container';
      linkContainer.appendChild(link);
      linkContainer.appendChild(categoryLabel);

      // Create icon container
      const iconContainer = document.createElement('div');
      iconContainer.className = 'icon-container';

      const tagIcon = document.createElement('i');
      tagIcon.className = 'fas fa-tag tag-icon';
      iconContainer.appendChild(tagIcon);

      const trashIcon = document.createElement('i');
      trashIcon.className = 'fas fa-trash-alt trash-icon';
      iconContainer.appendChild(trashIcon);

      // Create link-info-container to wrap link-container and icon-container
      const linkInfoContainer = document.createElement('div');
      linkInfoContainer.className = 'link-info-container';
      linkInfoContainer.appendChild(linkContainer);
      linkInfoContainer.appendChild(iconContainer);

      listItem.appendChild(linkInfoContainer);
  
      const categoryInputBox = document.createElement('input');
      categoryInputBox.type = 'text';
      categoryInputBox.style.display = 'none';
      listItem.appendChild(categoryInputBox);
      

      // Create summary div and initially hide it
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'summary';
      summaryDiv.style.display = 'none';
      listItem.appendChild(summaryDiv); // Append summary div to the list item

      // Preload summary from Wikipedia API
      const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          // Store the summary in the summaries object
          summaries[url] = data.extract || 'Summary not available.';
        })
        .catch(error => {
          console.error('Failed to fetch summary:', error);
        });

      // Display summary on hover
      link.addEventListener('mouseover', () => {
        // Populate and display summary div
        summaryDiv.textContent = summaries[url];
        summaryDiv.style.display = 'block';
      });

      // Hide summary when mouse leaves the link
      link.addEventListener('mouseout', () => {
        summaryDiv.style.display = 'none';
      });

      // Save category when input box loses focus
      categoryInputBox.addEventListener('blur', () => {
        const newCategory = categoryInputBox.value.trim();
        links[url].category = newCategory;
        chrome.storage.sync.set({ visitedWikipediaLinks: links }, () => {
          categoryLabel.textContent = newCategory;
          categoryInputBox.style.display = 'none';
        });
      });

      // Remove link when trash icon is clicked
      trashIcon.addEventListener('click', () => {
        delete links[url];
        chrome.storage.sync.set({ visitedWikipediaLinks: links }, () => {
          listItem.remove();
          console.log(`Removed ${title} (${url})`);
        });
      });

      // Show input box when tag icon is clicked
      tagIcon.addEventListener('click', () => {
        categoryInputBox.style.display = 'inline';
        categoryInputBox.focus();
      });


      // Fetch and display summary on hover
      link.addEventListener('mouseover', () => {
        // Fetch summary from Wikipedia API
        const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        fetch(apiUrl)
          .then(response => response.json())
          .then(data => {
            // Populate and display summary div
            summaryDiv.textContent = data.extract || 'Summary not available.';
            summaryDiv.style.display = 'block';
          })
          .catch(error => {
            console.error('Failed to fetch summary:', error);
          });
      });
      
      // Hide summary when mouse leaves the link
      link.addEventListener('mouseout', () => {
        summaryDiv.style.display = 'none';
      });

      // Get the "Copy Summaries" button element
      const copySummariesButton = document.getElementById('copySummaries');

      // Add event listener to the "Copy Summaries" button
      copySummariesButton.addEventListener('click', () => {
        // Concatenate all summaries
        let allSummaries = '';
        for (const url in summaries) {
          allSummaries += summaries[url] + '\n';
        }

        // Copy summaries to clipboard
        navigator.clipboard.writeText(allSummaries).then(() => {
          console.log('Summaries copied to clipboard.');
        }).catch(err => {
          console.error('Failed to copy summaries:', err);
        });
      });

      visitedLinks.appendChild(listItem);
    }
  }

  chrome.storage.sync.get('visitedWikipediaLinks', (data) => {
    links = data.visitedWikipediaLinks || {};
    renderLinks();
  });

  searchBar.addEventListener('input', renderLinks);
  categoryInput.addEventListener('input', renderLinks);

  clearHistoryButton.addEventListener('click', () => {
    chrome.storage.sync.set({ visitedWikipediaLinks: {} }, () => {
	  links = {};
	  visitedLinks.innerHTML = '';
	  console.log('Cleared history.');
	});
  });

  exportHistoryButton.addEventListener('click', () => {
    // Create an object that contains both links and summaries
    const exportData = {
      links: links,
      summaries: summaries
    };
    const jsonExport = JSON.stringify(exportData);
    const blob = new Blob([jsonExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wikipedia-history.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  importHistoryButton.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    document.body.appendChild(fileInput);
    fileInput.click();
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          // Extract links and summaries from the imported data
          links = importedData.links || {};
          summaries = importedData.summaries || {};
          chrome.storage.sync.set({ visitedWikipediaLinks: links }, () => {
            renderLinks();
            console.log('Imported history.');
          });
        } catch (error) {
          console.error('Failed to import history:', error);
        }
      };
      reader.readAsText(file);
      document.body.removeChild(fileInput);
    });
  });
});
