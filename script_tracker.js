


document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.querySelector('.knapp');
    addButton.addEventListener('click', openRecipeSelector);
    const addIngredientButton = document.querySelector('.button');
    addIngredientButton.addEventListener('click', openIngredientPopup);
    loadMeals();
});

function openIngredientPopup() {
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

function searchIngredient() {
    const searchString = document.getElementById('ingredientSearchField').value;
    fetch(`http://localhost:3000/api/foodbank/food?search=${encodeURIComponent(searchString)}`)
        .then(response => response.json())
        .then(ingredients => displayIngredients(ingredients))
        .catch(error => console.error('Failed to fetch ingredients:', error));
}

function displayIngredients(ingredients) {
    const listContainer = document.querySelector('.ingredient-list');
    listContainer.innerHTML = ''; // Clear previous results
    ingredients.forEach(ingredient => {
        const listItem = document.createElement('div');
        listItem.textContent = ingredient.FoodName;
        listItem.onclick = () => addIngredientAsMeal(ingredient);
        listContainer.appendChild(listItem);
    });
}

function addIngredientAsMeal(ingredient) {
    const amount = prompt("Enter the amount in grams for " + ingredient.FoodName);
    if (!amount || isNaN(amount)) return;

    const recipeName = document.getElementById('recipeNameField').value.trim();
    if (!recipeName) {
        alert("Please enter a recipe name.");
        return;
    }

    fetchNutritionInfo(ingredient.FoodID, amount)
        .then(nutrients => createRecipe(recipeName, nutrients, amount))
        .then(recipeID => {
            // Sjekk om recipeID er gyldig før du fortsetter
            if (!recipeID) {
                throw new Error('Recipe ID was not retrieved successfully.');
            }
            const date = new Date().toISOString().split('T')[0];
            const time = getCurrentFormattedTime();  // Sørger for at du får tidspunktet
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
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

function processIngredient(ingredient, amount, recipeName, date, time, location) {
    fetchNutritionInfo(ingredient.FoodID, amount, recipeName)
        .then(nutrients => createRecipe(recipeName, nutrients, amount))
        .then(recipeID => {
            postMeal(date, time, location, amount, recipeID);
        })
        .catch(error => console.error('Feil i behandling av ingrediens:', error));
}


function fetchNutritionInfo(foodID, amount, recipeName) {
    const nutrientIDs = {
        calories: 356,
        fiber: 168,
        protein: 218,
        fat: 141
    };

    const urls = Object.keys(nutrientIDs).map(key => `http://localhost:3000/api/foodbank/foodParameter?foodID=${foodID}&parameterID=${nutrientIDs[key]}`);

    return Promise.all(urls.map(url => fetch(url).then(res => res.json())))
        .then(results => {
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
    const userID = parseInt(localStorage.getItem('userID'), 10);
    return fetch('http://localhost:3000/api/user/recipe', {
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



function closePopup() {
    const popup = document.querySelector('.popup');
    if (popup) document.body.removeChild(popup);
}




//-------------------------------------------------------------------------------------------------------------------------------------

function openRecipeSelector() {
    const userID = parseInt(localStorage.getItem('userID'), 10);
    fetch(`http://localhost:3000/api/user/recipe?userID=${userID}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch');
            return response.json();
        })
        .then(recipes => createRecipePopup(recipes))
        .catch(error => console.error('Failed to fetch recipes:', error));
}

function createRecipePopup(recipes) {
    const popup = document.createElement('div');
    popup.className = 'popup';

    const formContainer = document.createElement('div');
    formContainer.className = 'form-container';

    const select = document.createElement('select');
    select.id = 'recipeSelect';
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Velg måltid';
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
    weightInput.placeholder = 'Vekt i gram';
    weightInput.type = 'number';
    weightInput.id = 'weightInput';

    formContainer.appendChild(select);
    formContainer.appendChild(weightInput);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Lukk';
    closeButton.onclick = () => document.body.removeChild(popup);

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Bekreft';
    confirmButton.onclick = confirmRegistration;

    popup.appendChild(formContainer);
    popup.appendChild(confirmButton);
    popup.appendChild(closeButton);
    document.body.appendChild(popup);
}



function getCurrentFormattedTime() {
    const now = new Date();
    now.setHours(now.getHours() + 2);  // Justere med 2 timer for å kompensere for tidssoneforskjell
    const time = now.toISOString().split('T')[1].slice(0, 8); // HH:mm:ss format
    return time;
}


function confirmRegistration() {
    const selectedRecipeId = document.getElementById('recipeSelect').value;
    const weight = parseFloat(document.getElementById('weightInput').value);
    const date = new Date().toISOString().split('T')[0]; // Extracts the date part
    const time = getCurrentFormattedTime();  // Henter korrigert tid

    // Først, få brukerens geolokasjon
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const latitude = position.coords.latitude.toFixed(6);
            const longitude = position.coords.longitude.toFixed(6);
            const location = latitude + ',' + longitude; // Formatterer til 6 desimaler

            // Nå som vi har lokasjonen, send forespørselen til serveren
            postMeal(date, time, location, weight, selectedRecipeId);
        }, function(error) {
            console.error('Error getting location:', error.message);
            postMeal(date, time, location, weight, selectedRecipeId); // Bruk en standardlokasjon ved feil
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
        postMeal(date, time, location, weight, selectedRecipeId); // Bruk en standardlokasjon hvis geolokasjon ikke støttes
    }
}

function postMeal(date, time, location, weight, recipeId) {
    const userID = parseInt(localStorage.getItem('userID'), 10);
    fetch('http://localhost:3000/api/user/meal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            date: date,
            time: time,
            location: location,
            weight: weight,
            userID: userID, // Example user ID
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
        document.body.removeChild(document.querySelector('.popup')); // Removes the popup
        return fetch(`http://localhost:3000/api/user/recipe/${recipeId}`); // Fetch the recipe details
    })
    .then(response => response.json())
    .then(recipe => {
        addToMealList(recipe.recipeName, weight, {
            kcal: (recipe.kcal / 100 * weight).toFixed(2),
            protein: (recipe.protein / 100 * weight).toFixed(2),
            fat: (recipe.fat / 100 * weight).toFixed(2),
            fiber: (recipe.fiber / 100 * weight).toFixed(2)
        }, `${date} ${time}`, location, mealID, recipeId ); // Adds to the meal list dynamically
        console.log(recipeId); 
    })
    .catch(error => {
        console.error('Error registering meal:', error);
        alert('Failed to register meal: ' + error.message);
    });
}




function loadMeals() {
    const userID = parseInt(localStorage.getItem('userID'), 10); // Erstatt med dynamisk bruker-ID om nødvendig
    fetch(`http://localhost:3000/api/user/meal?userID=${userID}`)
        .then(response => response.json())
        .then(meals => {
            meals.forEach(meal => {
                // Anta at meal inneholder alle nødvendige detaljer, inkludert mealID
                const { recipeID, weight, mealID } = meal;
                fetch(`http://localhost:3000/api/user/recipe/${recipeID}`)
                    .then(response => response.json())
                    .then(recipe => {
                        const formattedDate = meal.date.split('T')[0]; // YYYY-MM-DD
                        const formattedTime = meal.time.slice(0, -1); // Fjerner 'Z', viser HH:mm:ss
                        const location = meal.location; // Kan formatere videre om nødvendig
                        addToMealList(recipe.recipeName, weight, {
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

function addToMealList(recipeName, weight, nutrition, dateTime, location, mealID, recipeID) {
    const tableBody = document.querySelector('.meal-tracker-table tbody');
    const row = document.createElement('tr');
    row.setAttribute('data-meal-id', mealID);
    row.setAttribute('data-recipe-id', recipeID);  // Lagre recipeID som en data-attributt
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
            <button onclick="editMeal(this)">Rediger</button>
            <button onclick="deleteMeal(this)">Slett</button>
        </td>
    `;
    tableBody.appendChild(row);
}




function editMeal(element) {
    const row = element.closest('tr');
    const mealID = row.getAttribute('data-meal-id');
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
            return fetch(`http://localhost:3000/api/user/recipe/${recipeID}`);  // Hent oppdatert oppskriftsinformasjon
        })
        .then(response => response.json())
        .then(recipe => {
            // Oppdater vekten i tabellen
            row.cells[1].textContent = `${weight}g`;
            // Oppdater også næringsinformasjonen
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







function deleteMeal(element) {
    const row = element.closest('tr');
    const mealID = row.getAttribute('data-meal-id');
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


