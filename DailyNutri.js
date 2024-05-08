document.addEventListener('DOMContentLoaded', function() {
    fetchMealsData();

    async function fetchMealsData() {
        try {
            const response = await fetch('http://localhost:3000/api/user/meals/2');
            if (!response.ok) {
                throw new Error('Failed to fetch meals');
            }
            const data = await response.json();  // This will receive the array of hourly data
            updateMealsTable(data);
        } catch (error) {
            console.error('Error fetching meals:', error);
            updateMealsTable([]);  // Update the table even if there's an error to show empty data
        }
    }

    function updateMealsTable(meals) {
        const tbody = document.getElementById('DNBody');
        tbody.innerHTML = '';  // Clear existing table data
        meals.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.hour}:00</td> <!-- Display the hour -->
                <td>${entry.totalKcal.toFixed(2)} kcal</td>
                <td></td> <!-- Placeholder for water intake -->
                <td>${entry.hourlyBurn.toFixed(2)} kcal/h</td>
                <td>${(entry.totalKcal - entry.hourlyBurn).toFixed(2)} kcal</td> <!-- Calorie deficit/surplus -->
            `;
            tbody.appendChild(row);
        });
    }
});

