
function goToSection(index) {
  for (var i = 1; i <= 3; i++) {
    document.getElementById("sect" + i).className = (index == i ? "" : (i == 1 ? "bnw" : "off"));
    document.getElementById("desc" + i).className = (index == i ? "" : "off");
  }
}
