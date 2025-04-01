const inlägg = [
  {
    rubrik: "Start i Småland",
    text: "Vi lämnade hemmet tidigt på morgonen och körde mot Jönköping. Kaffet var varmt och vädret var perfekt.",
    bild: "bilder/smaland.jpg"
  },
  {
    rubrik: "Midnattssol i Kiruna kul",
    text: "Aldrig varit med om något liknande – solen vägrade gå ner. Vi stod på en höjd med utsikt över hela staden.",
    bild: "bilder/kiruna.jpg"
  }
];

const bloggContainer = document.getElementById("bloggInnehåll    ");

inlägg.forEach(post => {
  const article = document.createElement("article");
  article.innerHTML = `
    <h3>${post.rubrik}</h3>
    <p>${post.text}</p>
    <img src="${post.bild}" alt="${post.rubrik}" style="max-width: 100%; margin-bottom: 20px;">
  `;
  bloggContainer.appendChild(article);
});
