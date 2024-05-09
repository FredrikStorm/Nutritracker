document.addEventListener('DOMContentLoaded', function() {
    const userId = parseInt(localStorage.getItem('userID'), 10);
    const headerTime = document.querySelector('#DNTable th:first-child'); // Selecting the first <th> element

    async function fetchMealsData(viewType = 'daily') {
        try {
            const response = await fetch(`http://localhost:3000/api/user/meals/${userId}?viewType=${viewType}`);
            if (!response.ok) {
                throw new Error('Failed to fetch meals');
            }
            const data = await response.json();
            updateMealsTable(data, viewType);
        } catch (error) {
            console.error('Error fetching meals:', error);
            updateMealsTable([], viewType);
        }
    }

    function updateMealsTable(meals, viewType) {
        const tbody = document.getElementById('DNBody');
        tbody.innerHTML = '';
        let totalKcal = 0, totalWaterIntake = 0, totalBurn = 0, totalActivityKcal = 0, totalNetKcal = 0;

        meals.forEach(entry => {
            const { totalKcal: totalKcalValue = 0, waterIntake: waterIntakeValue = 0, hourlyBurn: hourlyBurnValue = 0, totalActivityKcal: activityKcalValue = 0 } = entry;
            totalKcal += totalKcalValue;
            totalWaterIntake += waterIntakeValue;
            totalBurn += hourlyBurnValue + activityKcalValue;
            totalActivityKcal += activityKcalValue;
            totalNetKcal += totalKcalValue - (hourlyBurnValue + activityKcalValue);

            // Adjust displayTime based on the viewType
            let displayTime = viewType === 'daily' ? `${entry.timeGroup}:00` : entry.timeGroup;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${displayTime}</td>
                <td>${totalKcalValue.toFixed(2)} kcal</td>
                <td>${waterIntakeValue} ml</td>
                <td>${(hourlyBurnValue + activityKcalValue).toFixed(2)} kcal</td>
                <td>${(totalKcalValue - (hourlyBurnValue + activityKcalValue)).toFixed(2)} kcal</td>
            `;
            tbody.appendChild(row);
        });

        const summaryRow = document.createElement('tr');
        summaryRow.innerHTML = `
            <td>Total</td>
            <td>${totalKcal.toFixed(2)} kcal</td>
            <td>${totalWaterIntake} ml</td>
            <td>${totalBurn.toFixed(2)} kcal</td>
            <td>${totalNetKcal.toFixed(2)} kcal</td>
        `;
        summaryRow.style.fontWeight = 'bold';
        tbody.appendChild(summaryRow);
    }

    document.getElementById('toggleView').addEventListener('click', function() {
        const currentView = this.textContent.includes('Monthly') ? 'monthly' : 'daily';
        headerTime.textContent = currentView === 'monthly' ? 'Day' : 'Time'; // Update header based on view type
        fetchMealsData(currentView);
        this.textContent = currentView === 'monthly' ? 'Switch to 24 Hour View' : 'Switch to Monthly View';
    });

    fetchMealsData(); // Fetch daily data initially
});
