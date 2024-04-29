/*Stofskifte beregner*/
function calculateStofskifte() {
    const age = parseInt(document.getElementById('age').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const gender = document.querySelector('input[name="gender"]:checked').value;

    let stofskifte;

    switch (gender) {
        case 'female':
            if (age <= 3) {
                stofskifte = 0.244 * weight - 0.13;
            } else if (age <= 10) {
                stofskifte = 0.085 * weight + 2.03;
            } else if (age <= 18) {
                stofskifte = 0.056 * weight + 2.90;
            } else if (age <= 30) {
                stofskifte = 0.0615 * weight + 2.08;
            } else if (age <= 60) {
                stofskifte = 0.0364 * weight + 3.47;
            } else if (age <= 75) {
                stofskifte = 0.0386 * weight + 2.88;
            } else {
                stofskifte = 0.0410 * weight + 2.61;
            }
            break;
        case 'male':
            if (age <= 3) {
                stofskifte = 0.249 * weight - 0.13;
            } else if (age <= 10) {
                stofskifte = 0.095 * weight + 2.11;
            } else if (age <= 18) {
                stofskifte = 0.074 * weight + 2.75;
            } else if (age <= 30) {
                stofskifte = 0.064 * weight + 2.84;
            } else if (age <= 60) {
                stofskifte = 0.0485 * weight + 3.67;
            } else if (age <= 75) {
                stofskifte = 0.0499 * weight + 2.93;
            } else {
                stofskifte = 0.035 * weight + 3.43;
            }
            break;
    }

    const stofskiftekcal = stofskifte * 239; /*gang med 239, da det laver mj til kcal*/

    const result = document.getElementById('result');
    result.innerHTML = `Estimeret stofskifte: ${stofskiftekcal.toFixed(2)} kalorier/per dag`;
}

document.getElementById('stofskifteForm').addEventListener('submit', function(event) {
    event.preventDefault();
    calculateStofskifte();
});

/*Aktivitets beregner*/
document.getElementById('activityForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Forhindre formen i at sende data

    const activityType = document.getElementById('everydayActivities').value;
    const hours = parseFloat(document.getElementById('hoursEveryday').value);

    if (activityType === 'almindeligGang' && hours > 0) {
        const result = 215 * hours;
        document.getElementById('result2').textContent = `Resultat: Du har forbrændt ${result} kalorier.`;
    } else {
        document.getElementById('result2').textContent = "";
    }
});

