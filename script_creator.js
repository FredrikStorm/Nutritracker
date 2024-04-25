/*
//popup vindu
document.addEventListener('DOMContentLoaded', () => {
    // Referanse til '+'-knappen
    const addButton = document.querySelector('.knapp');

    // Event listener for å åpne popup-vinduet
    addButton.addEventListener('click', () => {
        openIngredientPopup();
    });
});

// Funksjon for å åpne popup-vinduet for ingredienser
function openIngredientPopup() {
    // Opprett et popup-element
    const popup = document.createElement('div');
    popup.className = 'popup'; 

    // HTML-innhold med flex-container for søkefelt og knapper
    popup.innerHTML = `
    <input type="text" id="mealNameField" placeholder="Enter meal name">
    <div class="search-container">
        <input type="text" id="ingredientSearchField" placeholder="Search for ingredients">
        <button id="ingredientSearchButton">Search</button>
        <button id="completeMealButton">Fullfør Måltid</button>
    </div>
    <div class="list-container">
        <div class="søkeliste"><p>søkeliste:</p></div>
        <div class="ingredienser"><p>ingredienser:</p></div>
    </div>
`;

    // Legg til popup-en i DOM
    document.body.appendChild(popup);

    // Event listener for søkeknappen
    document.getElementById('ingredientSearchButton').addEventListener('click', () => {
        searchIngredient();
    });

    // Event listener for fullfør måltid-knappen
    document.getElementById('completeMealButton').addEventListener('click', () => {
        completeMeal();
    });
}



//søking av ingredienser 

// Funksjon for å søke etter ingredienser
function searchIngredient() {
    // Hent søkestrengen og utfør søk
    const searchString = document.getElementById('ingredientSearchField').value;
    console.log('Søk etter:', searchString);

    const apiUrl = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${encodeURIComponent(searchString)}`;

    // Utfører en GET-forespørsel til API-et
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            "X-API-Key": "171513" // API-nøkkel for autentisering
        }
    })
    .then(response => {
        // Sjekker om responsen fra serveren er OK
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json(); // Konverterer respons til JSON
    })
    .then(data => {
        // Kaller funksjonen for å oppdatere listen med søkeresultater
        updateFoodList(data);
        // Logger data til konsollen for feilsøking
        console.log('data: ', data); 
    })
    .catch(error => {
        // Logger eventuelle feil under fetch-operasjonen
        console.error('There has been a problem with your fetch operation:', error);
    });
}

// Funksjon for å oppdatere listen med søkeresultater
function updateFoodList(data) {
    // Velger container-elementet for å vise søkeresultatene
    const container = document.querySelector('.søkeliste');
    container.innerHTML = '<p>søkeliste:</p>'; // Tømmer eksisterende innhold

    // Oppretter en ny liste for søkeresultatene
    const list = document.createElement('ul');
    data.forEach(item => {
        // Oppretter et nytt listeelement for hver matvare
        const listItem = document.createElement('li');
        listItem.textContent = item.foodName; // Setter tekstinnholdet til matvarens navn
        listItem.style.cursor = 'pointer'; // Endrer musepekeren til en peker
        // Legger til en event listener som håndterer klikk på matvaren
        listItem.addEventListener('click', () => handleItemClick(item));
        list.appendChild(listItem); // Legger listeelementet til listen
    });
    container.appendChild(list); // Legger listen til containeren
}
    



// Global variabel for å holde på valgte ingredienser
let selectedIngredients = [];

// Funksjon som håndterer klikk på en matvare
function handleItemClick(item) {
    // Logger valgt matvare til konsollen
    console.log('Valgt item:', item);
    console.log('Matvarenavn:', item.foodName); 
    console.log('Matvare-ID:', item.foodID); 

    // Legger til valgt ingrediens i listen over valgte ingredienser
    selectedIngredients.push(item);
    updateSelectedIngredientsList();

    // Henter ernæringsinformasjon for den valgte ingrediensen
    fetchNutritionalInfo(item.foodID);
}

let totalKcal = 0;
let totalProtein = 0;
let totalFett = 0;
let totalAske = 0;
let totalfiber = 0;


// Funksjon for å hente ernæringsinformasjon basert på matvare-ID
function fetchNutritionalInfo(foodID) {
    // Setter opp headers for API-forespørsler
    const headers = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            "X-API-Key": "171513"
        }
    };

    // URL-er for å hente spesifikk ernæringsinformasjon
    const apiUrl_kcal = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/1030`;
    const apiUrl_protein = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/1110`;
    const apiUrl_fett = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/1310`;
    const apiUrl_ash = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/1520`;
    const apiUrl_fiber = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/1240`;

    // Utfører parallelt flere API-forespørsler for å hente ernæringsinformasjon
    Promise.all([
        fetch(apiUrl_kcal, headers),
        fetch(apiUrl_protein, headers),
        fetch(apiUrl_fett, headers),
        fetch(apiUrl_ash, headers),
        fetch(apiUrl_fiber, headers)
    ])
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(data => {
        // Behandler de hentede dataene og legger dem til i de globale variablene
        totalKcal += parseFloat(data[0][0].resVal);
        totalProtein += parseFloat(data[1][0].resVal);
        totalFett += parseFloat(data[2][0].resVal);
        totalAske += parseFloat(data[3][0].resVal);
        totalfiber += parseFloat(data[4][0].resVal);

        // Logger de samlede ernæringsinformasjonene til konsollen
        console.log('Totalt Kalorier:', totalKcal);
        console.log('Totalt Protein:', totalProtein);
        console.log('Totalt Fett:', totalFett);
        console.log('Totalt Aske:', totalAske);
        console.log('Totalt Fiber:', totalfiber);

        // Her kan du implementere videre behandling av ernæringsinformasjonen
    })
    .catch(error => {
        // Logger eventuelle feil under henting av ernæringsinformasjon
        console.error('Problem med fetch-operasjonen:', error);
    });
}


// Funksjon for å oppdatere listen over valgte ingredienser i 'ingredienser'-diven
function updateSelectedIngredientsList() {
    const container = document.querySelector('.ingredienser');
    container.innerHTML = '<p>ingredienser:</p>'; // Tømmer eksisterende innhold

    const list = document.createElement('ul');
    selectedIngredients.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = item.foodName; // Navnet på ingrediensen
        list.appendChild(listItem);
    });
    container.appendChild(list);
}





// Funksjon for å fullføre måltidet og legge det til i listen
function completeMeal() {
    // Hent måltidets navn fra inputfeltet
    const mealName = document.getElementById('mealNameField').value;

    // Beregn antall ingredienser
    const numberOfIngredients = selectedIngredients.length;

    let kcalper100 = totalKcal/numberOfIngredients;  //gjøre om til per 100g 
    let proteinper100 = totalProtein/numberOfIngredients; 
    let fettPer100 = totalFett/numberOfIngredients; 
    let fiberPer100 = totalfiber/numberOfIngredients; 

    //funksjon for å lagre data til local sotrage 
    saveMealToLocalStorage(mealName, kcalper100, proteinper100, fettPer100, fiberPer100, selectedIngredients.length); // for å lagre i local storage sånn at man kan bruke på meal tracker 

    // Oppretter en ny rad i tabellen
    const tableBody = document.querySelector('.liste tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${mealName}</td>
        <td>${kcalper100.toFixed(2)}</td>
        <td>${proteinper100.toFixed(2)}</td>
        <td>${numberOfIngredients}</td>
        <td>${fettPer100.toFixed(2)}</td>
        <td>${fiberPer100.toFixed(2)}</td>
    `;

    // Legger den nye raden til i tabellen
    tableBody.appendChild(newRow);

    // Nullstill de samlede næringsstoffene og inputfeltene
    resetMealCreation();

    // Fjern popup-vinduet
    const popup = document.querySelector('.popup');
    if (popup) {
        popup.remove();
    }
}

function resetMealCreation() {
    // Nullstill de samlede næringsstoffene
    totalKcal = 0;
    totalProtein = 0;
    totalFett = 0;
    totalAske = 0;
    totalVann = 0;

    // Nullstill inputfeltet for måltidets navn
    document.getElementById('mealNameField').value = '';

    // Nullstill listen over valgte ingredienser
    selectedIngredients = [];
    updateSelectedIngredientsList();
}

//lagrer det man trenger for å fullføre de andre sider 
function saveMealToLocalStorage(mealName, kcalper100, proteinper100, fettPer100, vannPer100, numberOfIngredients) {
    let meals = JSON.parse(localStorage.getItem('meals')) || [];
    meals.push({ name: mealName, caloriesPer100: kcalper100, proteinPer100: proteinper100, fatPer100: fettPer100, waterPer100: vannPer100, ingredients: numberOfIngredients });
    localStorage.setItem('meals', JSON.stringify(meals));
}

*/



// meal-creator.js
document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.querySelector('.knapp');
    addButton.addEventListener('click', openIngredientPopup);
});

function openIngredientPopup() {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
    <div class="search-container">
        <input type="text" id="ingredientSearchField" placeholder="Search for ingredients">
        <button id="ingredientSearchButton">Search</button>
    </div>
    <div class="list-container">
        <div class="søkeliste"><p>søkeliste:</p></div>
    </div>
    `;
    document.body.appendChild(popup);
    document.getElementById('ingredientSearchButton').addEventListener('click', searchIngredient);
}

function searchIngredient() {
    const searchString = document.getElementById('ingredientSearchField').value;
    console.log('Searching for:', searchString);
    const apiUrl = `http://localhost:3000/api/foodbank/food?search=${encodeURIComponent(searchString)}`;

    fetch(apiUrl)
    .then(response => response.json())
    .then(data => updateFoodList(data))
    .catch(error => console.error('Problem with fetch operation:', error));
}

function updateFoodList(data) {
    const container = document.querySelector('.søkeliste');
    container.innerHTML = '<p>søkeliste:</p>';
    const list = document.createElement('ul');
    data.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = item.FoodName;
        listItem.style.cursor = 'pointer';
        list.appendChild(listItem);
    });
    container.appendChild(list);
}