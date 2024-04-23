document.addEventListener('DOMContentLoaded', updateDashboard);

function updateDashboard() {
    const today = new Date().toLocaleDateString();
    const savedMeals = JSON.parse(localStorage.getItem('savedMeals')) || [];

    let totalMeals = 0;
    let totalCalories = 0;
    let totalDrinkVolume = 0;
    let totalProtein = 0;

    savedMeals.forEach(meal => {
        if (meal.date.includes(today)) {
            if (meal.type !== 'drink') {   // hvis det er drink så skal ikke meals få + 1
                totalMeals += 1;
                totalCalories += meal.calories;
                totalProtein += meal.protein;
            } else {
                totalDrinkVolume += parseFloat(meal.weight);
            }
        }
    });

    document.querySelector('.mealsinfo h2').textContent = totalMeals;
    document.querySelector('.energyinfo h2').textContent = `${totalCalories.toFixed(2)} kcal`;
    document.querySelector('.waterinfo h2').textContent = `${totalDrinkVolume.toFixed(2)}L`;
    document.querySelector('.proteininfo h2').textContent = `${totalProtein.toFixed(2)}g`;
}
