
function saveInfo() {
    console.log('1')
    let name = document.getElementById('name').value;
    let email = document.getElementById('email').value;
    let weigth = document.getElementById('weigth').value;
    let age = document.getElementById('age').value;
    let dropdown = document.getElementById('gender');
    let gender = dropdown.options[dropdown.selectedIndex].value; // Her kan du bruge .value for at få værdien, eller .text for at få den viste tekst

    const apiUrl = `http://localhost:3100/api/user/profile/save_user/`

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => updateFoodList(data))
        .catch(error => console.error('Problem with fetch operation:', error));


}

