function visaTid() {
    const nu = new Date().toLocaleTimeString();
    document.getElementById("output").textContent = "Klockan är: " + nu;
  }
  