//Stofskifte beregner
document.addEventListener('DOMContentLoaded', function() {
    const userId = parseInt(localStorage.getItem('userID'),10);  
    fetch(`http://localhost:3000/api/user/profile/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('age').value = data.age;
            document.getElementById('weight').value = data.weight;
            document.getElementById('gender').value = data.gender;
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
            document.getElementById('result').textContent = "Error fetching data.";
        });
});

function calculateMetabolism() {
    const age = parseInt(document.getElementById('age').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const gender = document.getElementById('gender').value.trim().toLowerCase();
    const userId = parseInt(localStorage.getItem('userID'),10);

    let metabolismRate;

    // Calculating metabolism rate based on age, weight, and gender
    switch (gender) {
        case 'female':
            if (age <= 3) {
                metabolismRate = 0.244 * weight - 0.13;
            } else if (age <= 10) {
                metabolismRate = 0.085 * weight + 2.03;
            } else if (age <= 18) {
                metabolismRate = 0.056 * weight + 2.90;
            } else if (age <= 30) {
                metabolismRate = 0.0615 * weight + 2.08;
            } else if (age <= 60) {
                metabolismRate = 0.0364 * weight + 3.47;
            } else if (age <= 75) {
                metabolismRate = 0.0386 * weight + 2.88;
            } else {
                metabolismRate = 0.0410 * weight + 2.61;
            }
            break;
        case 'male':
            if (age <= 3) {
                metabolismRate = 0.249 * weight - 0.13;
            } else if (age <= 10) {
                metabolismRate = 0.095 * weight + 2.11;
            } else if (age <= 18) {
                metabolismRate = 0.074 * weight + 2.75;
            } else if (age <= 30) {
                metabolismRate = 0.064 * weight + 2.84;
            } else if (age <= 60) {
                metabolismRate = 0.0485 * weight + 3.67;
            } else if (age <= 75) {
                metabolismRate = 0.0499 * weight + 2.93;
            } else {
                metabolismRate = 0.035 * weight + 3.43;
            }
            break;
    }

    // Converting metabolism rate to kcal
    const metabolismKcal = metabolismRate * 239; // Convert MJ to kcal
    document.getElementById('result').textContent = `Estimeret stofskifte: ${metabolismKcal.toFixed(2)} kalorier per dag`;

    // Post the metabolism data to the server
    fetch('http://localhost:3000/api/user/metabolism', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: userId, // Assuming userId is 2 as previously hardcoded
            metabolism: metabolismKcal
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to post metabolism data');
        }
        return response.text();
    })
    .then(data => {
        console.log('Metabolism data saved:', data);
    })
    .catch(error => {
        console.error('Error posting metabolism data:', error);
    });
}



//Activity tracker
document.getElementById('activityForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const activityid = document.getElementById('everydayActivities').value;
    const hours = parseFloat(document.getElementById('hoursEveryday').value);
    const userId = parseInt(localStorage.getItem('userID'), 10); // Fetch userId from localStorage

    if (isNaN(hours) || hours <= 0) {
        alert("Please enter a valid number of hours.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/user/Activitytable/${activityid}`);
        if (!response.ok) {
            throw new Error('Failed to fetch data from the server');
        }
        const data = await response.json();

        if (data && data.kcal && data.activityname) {
            const kcalPerHour = data.kcal;
            const totalKcalBurned = kcalPerHour * hours;
            document.getElementById('result2').textContent = `Total Calories Burned: ${totalKcalBurned.toFixed(2)}`;

            // Now, send the result along with userId to the server to save it
            const postResponse = await fetch('http://localhost:3000/api/user/Activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    activityid,
                    activityname: data.activityname,
                    totalKcalBurned,
                    hours,
                    userId  // Include userId in the POST data
                })
            });

            if (!postResponse.ok) {
                throw new Error('Failed to save data on the server');
            }

            alert('Data saved successfully!');
        } else {
            document.getElementById('result2').textContent = "No data found for selected activity.";
        }
    } catch (error) {
        document.getElementById('result2').textContent = "Error: " + error.message;
    }
});
