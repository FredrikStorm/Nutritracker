// Tilføjer en eventlistener, der udføres, når dokumentet er indlæst
document.addEventListener('DOMContentLoaded', function() {
    // Henter brugerens ID fra lokal lagring
    const userId = parseInt(localStorage.getItem('userID'),10);
    
    // Udfører et HTTP-kald for at hente brugerens profildata
    fetch(`http://localhost:3000/api/user/profile/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
            return response.json();
        })
        .then(data => {
            // Indsætter brugerens alder, vægt og køn i HTML-inputfelterne
            document.getElementById('age').value = data.age;
            document.getElementById('weight').value = data.weight;
            document.getElementById('gender').value = data.gender;
        })
        .catch(error => {
            // Håndterer fejl
            console.error('Error fetching user profile:', error);
            document.getElementById('result').textContent = "Fejl ved indhentning af data.";
        });
});

// Funktion til beregning af stofskifte
function calculateMetabolism() {
    const age = parseInt(document.getElementById('age').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const gender = document.getElementById('gender').value.trim().toLowerCase();
    const userId = parseInt(localStorage.getItem('userID'),10);

    let metabolismRate;

    // Beregner stofskifte baseret på alder, vægt og køn
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
    // Konverterer stofskifte til kcal
    const metabolismKcal = metabolismRate * 239; // Konverter MJ til kcal
    document.getElementById('result').textContent = `Estimeret stofskifte: ${metabolismKcal.toFixed(2)} kalorier per dag`;

    // Poster stofskifte til serveren
    fetch('http://localhost:3000/api/user/metabolism', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: userId,
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

// Håndterer indsendelsen af aktivitetsformularen
document.getElementById('activityForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const activityid = document.getElementById('everydayActivities').value;
    const hours = parseFloat(document.getElementById('hoursEveryday').value);
    const userId = parseInt(localStorage.getItem('userID'), 10); // Henter brugerID fra lokal lagring

    if (isNaN(hours) || hours <= 0) {
        alert("Indtast venligst et gyldigt antal timer.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/user/Activitytable/${activityid}`);
        if (!response.ok) {
            throw new Error('Fejlede i at hente data fra serveren');
        }
        const data = await response.json();

        if (data && data.kcal && data.activityname) {
            const kcalPerHour = data.kcal;
            const totalKcalBurned = kcalPerHour * hours;
            document.getElementById('result2').textContent = `Totalt antal forbrændte kalorier: ${totalKcalBurned.toFixed(2)}`;

            // Sender resultater sammen med brugerID til serveren for at gemme det
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
                    userId
                })
            });

            if (!postResponse.ok) {
                throw new Error('Fejlede i at gemme data på serveren');
            }

            alert('Data gemt succesfuldt!');
        } else {
            document.getElementById('result2').textContent = "Ingen data fundet for valgte aktivitet.";
        }
    } catch (error) {
        document.getElementById('result2').textContent = "Fejl: " + error.message;
    }
});
