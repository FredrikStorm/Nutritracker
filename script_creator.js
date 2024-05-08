
let recipe = [];

document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.querySelector('.knapp');
    addButton.addEventListener('click', openIngredientPopup);
    loadRecipes(); // Kall denne funksjonen for å laste oppskrifter fra databasen når siden lastes
});

function openIngredientPopup() {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="search-container">
            <input type="text" id="recipeNameField" placeholder="Enter recipe name">
            <input type="text" id="ingredientSearchField" placeholder="Search for ingredients">
            <button id="ingredientSearchButton">Search</button>
            <button id="finishMealButton" onclick="addRecipeToList()">Finish Meal</button>
        </div>
        <div class="list-container">
            <div class="søkeliste"><p>søkeliste:</p></div>
            <div class="recipe-list"><p>Oppskrift:</p></div>
        </div>
        <div class="summary-container"></div> <!-- Legg til en beholder for oppskriftssammendraget -->
    `;
    document.body.appendChild(popup);
    document.getElementById('ingredientSearchButton').addEventListener('click', searchIngredient);
}

function searchIngredient() {
    const searchString = document.getElementById('ingredientSearchField').value;
    console.log('Searching for:', searchString);
    const apiUrl = `http://localhost:3000/api/foodbank/food?search=${encodeURIComponent(searchString)}`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
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
        listItem.addEventListener('click', () => addIngredientToRecipe(item));
        list.appendChild(listItem);
    });
    container.appendChild(list);
}

function addIngredientToRecipe(item) {
    const amountInput = prompt("Enter the amount in grams for " + item.FoodName);
    if (amountInput && !isNaN(amountInput)) {
        fetchNutritionInfo(item.FoodID, amountInput, item.FoodName);
    }
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

function addToRecipeList(foodName, amount, nutrients) {
    const recipeContainer = document.querySelector('.recipe-list');
    const entry = document.createElement('div');
    entry.innerHTML = `
        <p>${amount}g of ${foodName}:</p>
        <ul class="ingredient-info" style="display: none;">
            <li class="calories">Calories: ${nutrients.calories.toFixed(2)}</li>
            <li class="fiber">Fiber: ${nutrients.fiber.toFixed(2)}g</li>
            <li class="protein">Protein: ${nutrients.protein.toFixed(2)}g</li>
            <li class="fat">Fat: ${nutrients.fat.toFixed(2)}g</li>
        </ul>
    `;
    recipe.push({ foodName, amount, nutrients });

    entry.addEventListener('click', () => {
        const infoList = entry.querySelector('.ingredient-info');
        if (infoList.style.display === 'none') {
            infoList.style.display = 'block';
        } else {
            infoList.style.display = 'none';
        }
    });

    recipeContainer.appendChild(entry);
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

    const recipeName = recipeNameField.value.trim();
    const userID = parseInt(localStorage.getItem('userID'), 10);
    console.log(typeof userID, userID);


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




function updateRecipeList(recipeName, nutrients, recipeID) {
    const recipeList = document.querySelector('.recipe-list');
    if (!recipeList) {
        console.error('Recipe list element not found');
        return;  // Avbryter funksjonen hvis elementet ikke finnes
    }

    const entry = document.createElement('div');
    entry.innerHTML = `
        <h4>${recipeName} (ID: ${recipeID})</h4>
        <p>Protein: ${nutrients.protein.toFixed(2)} g</p>
        <p>Calories: ${nutrients.kcal.toFixed(2)} kcal</p>
        <p>Fat: ${nutrients.fat.toFixed(2)} g</p>
        <p>Fiber: ${nutrients.fiber.toFixed(2)} g</p>
    `;
    recipeList.appendChild(entry);
}

function addToRecipeSummary() {
    const summaryContainer = document.querySelector('.summary-container');
    if (!summaryContainer) {
        console.error('Summary container not found');
        return;
    }

    // Tøm tidligere sammendrag
    summaryContainer.innerHTML = '';
    
    // Beregn samlede næringsstoffer fra alle ingrediensene i oppskriften
    const totalNutrients = recipe.reduce((totals, item) => {
        totals.calories += item.nutrients.calories;
        totals.fiber += item.nutrients.fiber;
        totals.protein += item.nutrients.protein;
        totals.fat += item.nutrients.fat;
        return totals;
    }, { calories: 0, fiber: 0, protein: 0, fat: 0 });

    // Opprett og fyll en liste for å vise næringsstoffer
    const summaryList = document.createElement('ul');
    summaryList.innerHTML = '<h3>Recipe Summary:</h3>';
    Object.keys(totalNutrients).forEach(key => {
        const value = totalNutrients[key].toFixed(2);
        const item = document.createElement('li');
        item.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`;
        summaryList.appendChild(item);
    });

    summaryContainer.appendChild(summaryList);
}


function loadRecipes() {
    const userID = parseInt(localStorage.getItem('userID'), 10);
    fetch(`http://localhost:3000/api/user/recipe?userID=${userID}`)
        .then(response => response.json())
        .then(recipes => {
            if(recipes && recipes.length) {
                updateRecipeTable(recipes);
            }
        })
        .catch(error => {
            console.error('Failed to load recipes:', error);
        });
}

function updateRecipeTable(recipes) {
    const tableBody = document.querySelector('.liste table tbody');
    tableBody.innerHTML = '';  // Tømmer eksisterende innhold før ny data legges til

    recipes.forEach(recipe => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${recipe.recipeName}</td>
            <td>${recipe.kcal.toFixed(2)}</td>
            <td>${recipe.protein.toFixed(2)}</td>
            <td>${recipe.fat.toFixed(2)}</td>
            <td>${recipe.fiber.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

function resetRecipe() {
    recipe = [];  // Tøm arrayet for ingredienser
    const summaryContainer = document.querySelector('.summary-container');
    if (summaryContainer) {
        summaryContainer.innerHTML = '';  // Tøm sammendraget
    }
}