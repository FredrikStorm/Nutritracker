
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
    
    // Assume you have a function to calculate and save recipe
    const name = ingredient.foodName; 
    calculateAndSaveRecipe(ingredient, amount);
}

function calculateAndSaveRecipe(ingredient, amount) {
    fetchNutritionInfo(ingredient.FoodID, amount, foodName)
        .then(nutrients => createRecipe(ingredient.FoodName, nutrients, amount))
        .then(recipeID => registerMeal(recipeID, amount))
        .catch(error => console.error('Error in processing ingredient:', error));
}

function fetchNutritionInfo(foodID, amount, foodName) {
    const nutrientIDs = {
        calories: 356,
        fiber: 168,
        protein: 218,
        fat: 141
    };

    const urls = Object.keys(nutrientIDs).map(key => `http://localhost:3000/api/foodbank/foodParameter?foodID=${foodID}&parameterID=${nutrientIDs[key]}`);

    Promise.all(urls.map(url => fetch(url).then(res => res.json())))
        .then(results => {
            const nutrients = {
                calories: results[0].ResVal,
                fiber: results[1].ResVal,
                protein: results[2].ResVal,
                fat: results[3].ResVal
            };
            const nutrientValues = {
                calories: (nutrients.calories / 100) * amount,
                fiber: (nutrients.fiber / 100) * amount,
                protein: (nutrients.protein / 100) * amount,
                fat: (nutrients.fat / 100) * amount
            };
            addToRecipeList(foodName, amount, nutrientValues);
            addToRecipeSummary(); // Oppdater oppskriftssammendraget
        })
        .catch(error => console.error('Error fetching nutritional information:', error));
}

function addRecipeToList() {
    const recipeNameField = document.getElementById('recipeNameField');
    if (!recipeNameField.value) {
        alert('Please enter a recipe name.');
        return;
    }

    const totalNutrients = {
        protein: 0,
        kcal: 0,
        fat: 0,
        fiber: 0
    };

    let totalWeight = 0;

    // Beregn total verdi for hver næringsparameter og samlet vekt
    recipe.forEach(item => {
        totalWeight += parseFloat(item.amount);
        totalNutrients.protein += item.nutrients.protein;
        totalNutrients.kcal += item.nutrients.calories;
        totalNutrients.fat += item.nutrients.fat;
        totalNutrients.fiber += item.nutrients.fiber;
    });

    // Beregn næringsverdier per 100g hvis totalWeight er større enn 0 for å unngå divisjon med 0
    const nutrientsPer100g = {
        protein: totalWeight > 0 ? (totalNutrients.protein / totalWeight) * 100 : 0,
        kcal: totalWeight > 0 ? (totalNutrients.kcal / totalWeight) * 100 : 0,
        fat: totalWeight > 0 ? (totalNutrients.fat / totalWeight) * 100 : 0,
        fiber: totalWeight > 0 ? (totalNutrients.fiber / totalWeight) * 100 : 0
    };

    const recipeName = name;
    const userID = 2;  // Bruker en statisk verdi for nå

    fetch('http://localhost:3000/api/user/recipe', {  
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            recipeName,
            userID,
            protein: nutrientsPer100g.protein,
            kcal: nutrientsPer100g.kcal,
            fat: nutrientsPer100g.fat,
            fiber: nutrientsPer100g.fiber
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(recipe => {
        console.log('Recipe saved:', recipe);
        document.body.removeChild(document.querySelector('.popup'));
        loadRecipes();  // Oppdaterer hele listen etter å ha lagt til en ny oppskrift
        resetRecipe();  // Nullstill oppskriften og sammendraget
    })
    .catch(error => {
        console.error('Error saving recipe:', error);
        alert('Failed to save recipe: ' + error.message);
    });
}


function registerMeal(recipeID, amount) {
    // Now that you have a recipeID, you can register it as a meal
    fetch('http://localhost:3000/api/user/meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date: new Date().toISOString(),
            recipeID,
            userID: 2,
            weight: amount
        })
    }).then(res => res.json()).then(data => {
        console.log('Meal registered:', data);
        closePopup();
    });
}

function closePopup() {
    const popup = document.querySelector('.popup');
    if (popup) document.body.removeChild(popup);
}



//-------------------------------------------------------------------------------------------------------------------------------------

function openRecipeSelector() {
    fetch(`http://localhost:3000/api/user/recipe?userID=2`)
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
            postMeal(date, time, "0.0,0.0", weight, selectedRecipeId); // Bruk en standardlokasjon ved feil
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
        postMeal(date, time, "0.0,0.0", weight, selectedRecipeId); // Bruk en standardlokasjon hvis geolokasjon ikke støttes
    }
}

function postMeal(date, time, location, weight, recipeId) {
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
            userID: 2, // Example user ID
            recipeID: recipeId
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save meal');
        return response.json();
    })
    .then(data => {
        console.log('Meal registered:', data);
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
        }, `${date} ${time}`, location); // Adds to the meal list dynamically
    })
    .catch(error => {
        console.error('Error registering meal:', error);
        alert('Failed to register meal: ' + error.message);
    });
}





function loadMeals() {
    const userID = 2;  // Erstatt med dynamisk bruker-ID om nødvendig
    fetch(`http://localhost:3000/api/user/meal?userID=${userID}`)
        .then(response => response.json())
        .then(meals => {
            meals.forEach(meal => {
                // Hent tilleggsinformasjon for hvert måltid
                fetch(`http://localhost:3000/api/user/recipe/${meal.recipeID}`)
                    .then(response => response.json())
                    .then(recipe => {
                        const formattedDate = meal.date.split('T')[0]; // YYYY-MM-DD
                        const formattedTime = meal.time.slice(0, -1); // Fjerner 'Z', viser HH:mm:ss
                        const location = meal.location; // Kan formatere videre om nødvendig

                        addToMealList(recipe.recipeName, meal.weight, {
                            kcal: (recipe.kcal / 100 * meal.weight).toFixed(2),
                            protein: (recipe.protein / 100 * meal.weight).toFixed(2),
                            fat: (recipe.fat / 100 * meal.weight).toFixed(2),
                            fiber: (recipe.fiber / 100 * meal.weight).toFixed(2)
                        }, `${formattedDate} ${formattedTime}`, location);
                    })
                    .catch(error => console.error('Failed to fetch recipe details:', error));
            });
        })
        .catch(error => console.error('Failed to load meals:', error));
}


function addToMealList(recipeName, weight, nutrition, dateTime, location) {
    const tableBody = document.querySelector('.meal-tracker-table tbody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${recipeName}</td>
        <td>${weight}g</td>
        <td>${nutrition.kcal} kcal</td>
        <td>${nutrition.protein} g</td>
        <td>${nutrition.fat} g</td>
        <td>${nutrition.fiber} g</td>
        <td>${dateTime}</td>
        <td>${location}</td>
        <td><button onclick="editMeal(this)">Rediger</button></td>
    `;
    tableBody.appendChild(row);
}



