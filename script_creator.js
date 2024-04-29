
document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.querySelector('.knapp');
    addButton.addEventListener('click', openIngredientPopup);
});

// Opprett en global variabel for å holde oversikt over oppskriften
const recipe = [];

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
    console.log("Fetching nutrition info for FoodID:", foodID);

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
    recipe.push({ foodName, amount, nutrients }); // Legg til ingrediensen i oppskriften

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
        totalNutrients.protein += (item.nutrients.protein / 100) * item.amount;
        totalNutrients.kcal += (item.nutrients.calories / 100) * item.amount;
        totalNutrients.fat += (item.nutrients.fat / 100) * item.amount;
        totalNutrients.fiber += (item.nutrients.fiber / 100) * item.amount;
    });

    // Kalkuler næringsverdier per 100g
    const nutrientsPer100g = {
        protein: (totalNutrients.protein / totalWeight) * 100,
        kcal: (totalNutrients.kcal / totalWeight) * 100,
        fat: (totalNutrients.fat / totalWeight) * 100,
        fiber: (totalNutrients.fiber / totalWeight) * 100
    };



    const recipeName = recipeNameField.value;
    const userID = 1;  // Bruker en statisk verdi for nå
    const { protein, kcal, fat, fiber } = nutrientsPer100g;


    fetch('/api/user/recipe', {  
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipeName, userID, nutrientsPer100g})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Recipe saved, ID:', data.recipeID);
        // Oppdater UI eller gi tilbakemelding til bruker
    })
    .catch(error => {
        console.error('Error saving recipe:', error);
        alert('Failed to save recipe: ' + error.message);
    });
}



function addToRecipeSummary() {
    const summaryContainer = document.querySelector('.summary-container');
    summaryContainer.innerHTML = ''; // Nullstill oppskriftssammendraget

    const totalNutrients = {
        calories: 0,
        fiber: 0,
        protein: 0,
        fat: 0
    };

    recipe.forEach(item => {
        for (let nutrient in item.nutrients) {
            if (item.nutrients.hasOwnProperty(nutrient)) {
                totalNutrients[nutrient] += item.nutrients[nutrient];
            }
        }
    });

    const summaryList = document.createElement('ul');
    summaryList.innerHTML = '<p>Recipe Summary:</p>';
    for (let nutrient in totalNutrients) {
        if (totalNutrients.hasOwnProperty(nutrient)) {
            const newLi = document.createElement('li');
            newLi.textContent = `${nutrient}: ${totalNutrients[nutrient].toFixed(2)}`;
            summaryList.appendChild(newLi);
        }
    }

    summaryContainer.appendChild(summaryList);
}
