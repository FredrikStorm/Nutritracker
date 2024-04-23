
// Legger til event listener på knappen for å åpne et popup-vindu
document.querySelector('.knapp').addEventListener('click', () => {
    // Oppretter et nytt popup-div-element
    const popup = document.createElement('div');
    popup.className = 'popup'; // Setter klassenavn på popup-diven
    // Setter inn HTML-innhold i popup-diven, inkludert input-felt og knapper
    popup.innerHTML = `
        <input type="number" id="mealWeight" placeholder="weight (g) or amount (L)">
        <input type="time" id="mealTime">
        <input type="text" id="mealtype" placeholder="meal type(drink): ">
        <select id="mealSelection"></select> <!-- Dropdown-meny for måltider -->
        <button onclick="saveMeal()">Save</button> <!-- Lagre-knapp -->
        <button onclick="clearMealSelection()">Clear Meals</button> <!-- Tømme-knapp -->
    `;
    document.body.appendChild(popup); // Legger til popup-vinduet i DOM

    // Kaller funksjonen for å laste inn måltider i dropdown-menyen
    loadMealsForSelection();
});

// Fyller dropdown-menyen med måltider fra Local Storage
function loadMealsForSelection() {
    const mealSelection = document.getElementById('mealSelection');
    const meals = JSON.parse(localStorage.getItem('meals')) || []; // Henter måltider

    meals.forEach(meal => { 
        const option = document.createElement('option'); // Oppretter et nytt option-element
        option.value = meal.name; // Setter value til måltidets navn
        option.textContent = meal.name; // Setter visningstekst til måltidets navn
        mealSelection.appendChild(option); // Legger til option-elementet i dropdown-menyen
    });
}

// Tømmer dropdown-menyen og sletter måltidsdata fra Local Storage
function clearMealSelection() {
    const mealSelection = document.getElementById('mealSelection');
    mealSelection.innerHTML = ''; // Tømmer menyen
    localStorage.setItem('meals', JSON.stringify([])); // Sletter måltider
}


function saveMeal() {
    // Henter data fra input-feltene
    const mealWeight = document.getElementById('mealWeight').value;
    const mealTime = document.getElementById('mealTime').value;
    const mealType = document.getElementById('mealtype').value;
    const mealSelection = document.getElementById('mealSelection').value;
    const meals = JSON.parse(localStorage.getItem('meals')) || [];
    const selectedMeal = meals.find(meal => meal.name === mealSelection);

    // Beregner næringsverdier
    const caloriesPer100 = selectedMeal.caloriesPer100;
    const proteinPer100 = selectedMeal.proteinPer100;
    let caloriesPerMeal = caloriesPer100 / 100 * mealWeight;
    let proteinPerMeal = proteinPer100 / 100 * mealWeight;

    // Oppretter en ny rad i tabellen
    const tableBody = document.querySelector('.meal-tracker-table tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${mealSelection}</td>
        <td>${mealType}</td>
        <td>${mealWeight}${mealType === 'drink' ? 'L' : 'g'}<br>${caloriesPerMeal.toFixed(2)} Kcal</td>
        <td>${proteinPerMeal.toFixed(2)}g</td>
        <td>${new Date().toLocaleDateString()}</td>
        <td>${mealTime}</td>
        <td><button class="sletteknapp">slett</button></td>
    `;
    tableBody.appendChild(newRow);

    // Lagrer måltidsdata
    const mealData = {
        name: mealSelection,
        type: mealType,
        weight: mealWeight,
        calories: caloriesPerMeal,
        protein: proteinPerMeal,
        date: new Date().toLocaleDateString(),
        time: mealTime
    };
    let savedMeals = JSON.parse(localStorage.getItem('savedMeals')) || [];
    savedMeals.push(mealData);
    localStorage.setItem('savedMeals', JSON.stringify(savedMeals));

    // Legger til event listener på sletteknappen
    const deleteButton = newRow.querySelector('.sletteknapp');
    deleteButton.addEventListener('click', function() {
        // Fjerner raden fra tabellen
        newRow.remove();

    // Oppdaterer localStorage ved å fjerne kun det spesifikke måltidet
        let savedMeals = JSON.parse(localStorage.getItem('savedMeals')) || [];
        savedMeals = savedMeals.filter(meal => !(meal.name === mealData.name && meal.date === mealData.date && meal.time === mealData.time));
        localStorage.setItem('savedMeals', JSON.stringify(savedMeals));
});


    // Lukker popup-vinduet
    const popup = document.querySelector('.popup');
    popup.remove();
}



function deleteMeal(mealData, rowElement) {
    // Fjerner raden fra tabellen
    rowElement.remove();

    // Oppdaterer localStorage ved å fjerne det valgte måltidet
    let savedMeals = JSON.parse(localStorage.getItem('savedMeals')) || [];
    savedMeals = savedMeals.filter(meal => meal.name !== mealData.name || meal.date !== mealData.date || meal.time !== mealData.time);
    localStorage.setItem('savedMeals', JSON.stringify(savedMeals));
}


function clearSavedMeals() {    // bare for å kunne fjerne alt som blir lagret under savedMeals i local storage enktelt 
    localStorage.removeItem('savedMeals'); // Dette vil fjerne 'savedMeals' fra localStorage
}


