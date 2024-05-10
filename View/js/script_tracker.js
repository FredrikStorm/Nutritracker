


document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.querySelector('.knapp'); //knapp for å legge til meal 
    addButton.addEventListener('click', openRecipeSelector);
    const addIngredientButton = document.querySelector('.button'); // knapp for å legge til en ingrediens 
    addIngredientButton.addEventListener('click', openIngredientPopup);
    const waterButton = document.querySelector('.vann'); // knapp for å legge til et glass med vann
    waterButton.addEventListener('click', logWaterIntake);
    loadMeals(); // laster inn måltider som allerede har blitt lagt til for denne userID 
});


function logWaterIntake() {      //funksjon som legger til et glass vann 
    const userID = parseInt(localStorage.getItem('userID'), 10);   // henter userID som er lagret i local storage 
    fetch('http://localhost:3000/api/user/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to log water intake');
        return response.json();
    })
    .then(data => {
        console.log('Water intake logged:', data);
    })
    .catch(error => {
        console.error('Error logging water intake:', error);
        alert('Failed to log water intake: ' + error.message);
    });
}


function openIngredientPopup() {  // lager popup for å legge til en enkelt ingrediens 
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="search-container">
            <input type="text" id="recipeNameField" placeholder="Enter ingredient name for recipe">
            <input type="text" id="ingredientSearchField" placeholder="Search for ingredients">
            <button onclick="searchIngredient()">Search</button>
        </div>
        <div class="ingredient-list"></div>
        <button onclick="closePopup()">Close</button>
    `;
    document.body.appendChild(popup);
}

function searchIngredient() { // gjør at man kan søke på ingredienser som brukeren skriver inn 
    const searchString = document.getElementById('ingredientSearchField').value;
    fetch(`http://localhost:3000/api/foodbank/food?search=${encodeURIComponent(searchString)}`)
        .then(response => response.json())
        .then(ingredients => displayIngredients(ingredients))
        .catch(error => console.error('Failed to fetch ingredients:', error));
}

function displayIngredients(ingredients) {   // viser ingredienser man har søkt på 
    const listContainer = document.querySelector('.ingredient-list');
    listContainer.innerHTML = ''; // tømmer gamle resultater 
    ingredients.forEach(ingredient => {
        const listItem = document.createElement('div');
        listItem.textContent = ingredient.FoodName;
        listItem.onclick = () => addIngredientAsMeal(ingredient); // gjør ingrediensene klikkbare 
        listContainer.appendChild(listItem);
    });
}

function addIngredientAsMeal(ingredient) {
    const amount = prompt("Enter the amount in grams for " + ingredient.FoodName);  // lar brukeren legge til en ingrediens og skrive inn vekten av den 
    if (!amount || isNaN(amount)) return;

    const recipeName = document.getElementById('recipeNameField').value.trim();
    if (!recipeName) {
        alert("Please enter a recipe name.");
        return;
    }

    fetchNutritionInfo(ingredient.FoodID, amount)
        .then(nutrients => createRecipe(recipeName, nutrients, amount))
        .then(recipeID => {
            // Sjekker om recipeID er gyldig før du fortsetter
            if (!recipeID) {
                throw new Error('Recipe ID was not retrieved successfully.');
            }
            const date = new Date().toISOString().split('T')[0];
            const time = getCurrentFormattedTime();  // Sørger for at du får tidspunktet
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {  // gir location 
                    const latitude = position.coords.latitude.toFixed(6);
                    const longitude = position.coords.longitude.toFixed(6);
                    const location = `${latitude},${longitude}`;
                    postMeal(date, time, location, amount, recipeID);
                }, function(error) {
                    console.error('Error getting location:', error.message);
                    postMeal(date, time, "0.0,0.0", amount, recipeID);
                });
            } else {
                console.error('Geolocation is not supported by this browser.');
                postMeal(date, time, "0.0,0.0", amount, recipeID);
            }
        })
        .catch(error => {
            console.error('Error in processing ingredient:', error);
            alert('Failed to process ingredient: ' + error.message);
        });
}



function fetchNutritionInfo(foodID, amount, recipeName) {  // henter næringsinformasjon for en ingrediens 
    const nutrientIDs = {
        calories: 356,
        fiber: 168,
        protein: 218,
        fat: 141
    };
                    // lager url for å hente næringsinformasjon 
    const urls = Object.keys(nutrientIDs).map(key => `http://localhost:3000/api/foodbank/foodParameter?foodID=${foodID}&parameterID=${nutrientIDs[key]}`);
            // henter alle næringsstoff data parallelt
    return Promise.all(urls.map(url => fetch(url).then(res => res.json())))
        .then(results => {
            // Beregner næringstoffdata utifra megnden man har satt inn med ingrediensen 
            const nutrients = {
                calories: ((results[0].ResVal / 100) * amount)/(amount/100),
                fiber: ((results[1].ResVal / 100) * amount)/(amount/100),
                protein: ((results[2].ResVal / 100) * amount)/(amount/100),
                fat: ((results[3].ResVal / 100) * amount)/(amount/100)
            };
            return nutrients;
        });
}

function createRecipe(foodName, nutrients, amount) {
    const userID = parseInt(localStorage.getItem('userID'), 10); // henter userID 
    return fetch('http://localhost:3000/api/user/recipe', { // sender post forspørsel for å lagre ingrediensen som recipe for å få recipeID 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipeName: foodName,
            userID: userID,
            protein: nutrients.protein.toFixed(2),
            kcal: nutrients.calories.toFixed(2),
            fat: nutrients.fat.toFixed(2),
            fiber: nutrients.fiber.toFixed(2)
        })
    }).then(response => response.json())
      .then(data => {
          if (!data || !data.recipeID) {
              throw new Error('Failed to save recipe or retrieve recipe ID');
          }
          return data.recipeID; // Returnerer recipeID sikker på at det er hentet riktig
      });
}



function closePopup() {  // fjerner popup-vinduet 
    const popup = document.querySelector('.popup');
    if (popup) document.body.removeChild(popup);
}


//-------------------------------------------------------------------------------------------------------------------------------------

function openRecipeSelector() {
    const userID = parseInt(localStorage.getItem('userID'), 10); // henter user id 
    fetch(`http://localhost:3000/api/user/recipe?userID=${userID}`) // gjør et api-kall for å hente alle oppskrifter 
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch');
            return response.json();
        })
        .then(recipes => createRecipePopup(recipes)) // åpner et popup-vindu som kan vise alle recipes 
        .catch(error => console.error('Failed to fetch recipes:', error));
}

function createRecipePopup(recipes) {  // popup vindu hvor amn kan velge recipe og skrive inn vekt 
    const popup = document.createElement('div');
    popup.className = 'popup';

    const formContainer = document.createElement('div');
    formContainer.className = 'form-container';

    const select = document.createElement('select');
    select.id = 'recipeSelect';
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Choose recipe';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    recipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.recipeID;
        option.textContent = recipe.recipeName;
        select.appendChild(option);
    });

    const weightInput = document.createElement('input');
    weightInput.placeholder = 'Weight in grams';
    weightInput.type = 'number';
    weightInput.id = 'weightInput';

    formContainer.appendChild(select);
    formContainer.appendChild(weightInput);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => document.body.removeChild(popup); // fjerner popup når knapp blir trykket 

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.onclick = confirmRegistration;  // kall på funksjonen som håndterer registrering av måltid 

    popup.appendChild(formContainer);
    popup.appendChild(confirmButton);
    popup.appendChild(closeButton);
    document.body.appendChild(popup);
}



function getCurrentFormattedTime() {  // funksjon for å få tid 
    const now = new Date();
    now.setHours(now.getHours() + 2);  // Justere med 2 timer for å kompensere for tidssoneforskjell
    const time = now.toISOString().split('T')[1].slice(0, 8); // HH:mm:ss format
    return time;
}

//funksjon som bekrefter registrering av et måltid ved bruk av valgt recipe og vekt 
function confirmRegistration() {
    const selectedRecipeId = document.getElementById('recipeSelect').value; // henter recipeID fra nedtrekkslisten 
    const weight = parseFloat(document.getElementById('weightInput').value); //koverterer vekten til et tall 
    const date = new Date().toISOString().split('T')[0]; // henter dato 
    const time = getCurrentFormattedTime();  // Henter korrigert tid

    // prøve å få brukerens geolokasjon 
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const latitude = position.coords.latitude.toFixed(6);
            const longitude = position.coords.longitude.toFixed(6);
            const location = latitude + ',' + longitude; // setter sammen latitude og longitude

            // Nå som vi har lokasjonen, send forespørselen om å poste meal 
            postMeal(date, time, location, weight, selectedRecipeId);
        }, function(error) {
            console.error('Error getting location:', error.message);
            postMeal(date, time, location, weight, selectedRecipeId); // Bruker en standardlokasjon ved feil
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
        postMeal(date, time, location, weight, selectedRecipeId); // Bruker en standardlokasjon hvis geolokasjon ikke støttes
    }
}


//poster måltid til serveren
function postMeal(date, time, location, weight, recipeId) {
    const userID = parseInt(localStorage.getItem('userID'), 10); // henter brukerID 
    fetch('http://localhost:3000/api/user/meal', {  // poster meal til server
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            date: date,
            time: time,
            location: location,
            weight: weight,
            userID: userID, 
            recipeID: recipeId
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save meal');
        return response.json();
    })
    .then(data => {
        console.log('Meal registered:', data);
        mealID = data.mealID // lagrer mealID fra responsen
        document.body.removeChild(document.querySelector('.popup')); // fjerner popup
        return fetch(`http://localhost:3000/api/user/recipe/${recipeId}`); // henter detaljer for oppskriften brukt i meal 
    })
    .then(response => response.json())
    .then(recipe => {
        addToMealList(recipe.recipeName, weight, {
            kcal: (recipe.kcal / 100 * weight).toFixed(2),
            protein: (recipe.protein / 100 * weight).toFixed(2),
            fat: (recipe.fat / 100 * weight).toFixed(2),
            fiber: (recipe.fiber / 100 * weight).toFixed(2)
        }, `${date} ${time}`, location, mealID, recipeId ); // legger meal til i listen på siden dynamisk 
        console.log(recipeId); 
    })
    .catch(error => {
        console.error('Error registering meal:', error);
        alert('Failed to register meal: ' + error.message);
    });
}




function loadMeals() { //laster inn måltider som er lagret i systemet 
    const userID = parseInt(localStorage.getItem('userID'), 10); // henter userID 
    fetch(`http://localhost:3000/api/user/meal?userID=${userID}`) //henter alle meals som er lagret på den aktive userID 
        .then(response => response.json())
        .then(meals => {
            meals.forEach(meal => {
                const { recipeID, weight, mealID } = meal;
                fetch(`http://localhost:3000/api/user/recipe/${recipeID}`) // henter all næringsinformasjon for den recipe mealen er laget av 
                    .then(response => response.json())
                    .then(recipe => {
                        const formattedDate = meal.date.split('T')[0]; 
                        const formattedTime = meal.time.slice(0, -1); 
                        const location = meal.location; 
                        addToMealList(recipe.recipeName, weight, { // sender samlet informasjon til addToMealList 
                            kcal: (recipe.kcal / 100 * weight).toFixed(2),
                            protein: (recipe.protein / 100 * weight).toFixed(2),
                            fat: (recipe.fat / 100 * weight).toFixed(2),
                            fiber: (recipe.fiber / 100 * weight).toFixed(2)
                        }, `${formattedDate} ${formattedTime}`, location, mealID, recipeID);
                    })
                    .catch(error => console.error('Failed to fetch recipe details:', error));
            });
        })
        .catch(error => console.error('Failed to load meals:', error));
}

function addToMealList(recipeName, weight, nutrition, dateTime, location, mealID, recipeID) {   //legger til meal i listen på siden 
    const tableBody = document.querySelector('.meal-tracker-table tbody');
    const row = document.createElement('tr');
    row.setAttribute('data-meal-id', mealID);      //lagrer mealID som en data-attributt så man kan redgigere/slette 
    row.setAttribute('data-recipe-id', recipeID);  // Lagrer recipeID som en data-attributt så man kan redigere/slette 
    row.innerHTML = `
        <td>${recipeName}</td>
        <td>${weight}g</td>
        <td>${nutrition.kcal} kcal</td>
        <td>${nutrition.protein} g</td>
        <td>${nutrition.fat} g</td>
        <td>${nutrition.fiber} g</td>
        <td>${dateTime}</td>
        <td>${location}</td>
        <td>
            <button onclick="editMeal(this)">Edit</button>
            <button onclick="deleteMeal(this)">Delete</button>
        </td>
    `;
    tableBody.appendChild(row);
}




function editMeal(element) {   //funksjon for å kunne endre vekten av et meal 
    const row = element.closest('tr');
    const mealID = row.getAttribute('data-meal-id');  // henter mealID fra data-attributt 
    const recipeID = row.getAttribute('data-recipe-id'); // Hent recipeID fra data-attributt
    const weight = prompt("Enter the new weight in grams:");
    if (weight && !isNaN(weight)) {
        fetch(`http://localhost:3000/api/user/meal/${mealID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weight: parseFloat(weight) })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update meal');
            }
            return response.json();
        })
        .then(data => {
            console.log('Meal updated:', data);
            return fetch(`http://localhost:3000/api/user/recipe/${recipeID}`);  // Henter recipe informasjon 
        })
        .then(response => response.json())
        .then(recipe => {
            // Oppdaterer vekten i tabellen
            row.cells[1].textContent = `${weight}g`;
            // Oppdaterer også næringsinformasjonen
            row.cells[2].textContent = `${(recipe.kcal / 100 * weight).toFixed(2)} kcal`;
            row.cells[3].textContent = `${(recipe.protein / 100 * weight).toFixed(2)} g`;
            row.cells[4].textContent = `${(recipe.fat / 100 * weight).toFixed(2)} g`;
            row.cells[5].textContent = `${(recipe.fiber / 100 * weight).toFixed(2)} g`;
        })
        .catch(error => {
            console.error('Failed to update meal:', error);
            alert('Failed to update meal: ' + error.message);
        });
    }
}




function deleteMeal(element) {  // funksjon for å slette meals 
    const row = element.closest('tr');
    const mealID = row.getAttribute('data-meal-id'); // henter mealID fra data-attributt 
    console.log("Deleting meal with ID:", mealID);
    fetch(`http://localhost:3000/api/user/meal/${mealID}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete meal');
        }
        console.log('Meal deleted successfully');
        row.remove();
    })
    .catch(error => {
        console.error('Error deleting meal:', error);
    });
}


