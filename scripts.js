
function modal(text) {
  var popup = document.getElementById('details');
  popup.style.display = 'inline';
  popup.innerHTML = text;
}

function hideModal() {
  document.getElementById('details').style.display = 'none';
}
