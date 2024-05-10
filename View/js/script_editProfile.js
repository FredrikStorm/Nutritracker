// Henter bruger-ID fra lokal lagring og logger det
const userID = parseInt(localStorage.getItem('userID'))
console.log(userID);

// Definerer URL'er til API-kald for at hente, opdatere og slette brugeroplysninger
const getInfoApi = `http://localhost:3000/api/user/profile/edit?userID=${userID}`;
const putInfoApi = `http://localhost:3000/api/user/profile/edit/save_changes`;
const deleteUserApi = `http://localhost:3000/api/user/profile/delete?userID=${userID}`;

// Afventer at hele HTML-dokumentet er indlæst før funktionen udføres
document.addEventListener('DOMContentLoaded', function() {
    const userId = parseInt(localStorage.getItem('userID'), 10);
    // Tjekker om bruger-ID findes i lokal lagring
    if (!userId) {
        console.error("Ingen bruger-ID fundet i localStorage");
        return;
    }

    // Udfører et API-kald for at hente brugerens profiloplysninger
    fetch(`http://localhost:3000/api/user/profile/${userId}`)
        .then(response => {
            // Håndterer fejl hvis respons fra serveren ikke er ok
            if (!response.ok) {
                throw new Error('Fejl ved hentning');
            }
            return response.json();
        })
        .then(data => {
            // Opdaterer formularfelterne med data hentet fra serveren
            document.getElementById('ageBox').value = data.age;
            document.getElementById('weightBox').value = data.weight;
            document.getElementById('genderBox').value = data.gender;
        })
        .catch(error => {
            // Håndterer fejl og viser error besked på websiden
            console.error('Fejl ved hentning af brugerprofil:', error);
            document.getElementById('result').textContent = "Fejl ved hentning af data.";
        });
});

// Funktion til at gemme ændringer i brugeren
async function saveChanges() {
    // Henter værdier fra formularfelterne
    let age = document.getElementById('ageBox').value;
    let gender = document.getElementById('genderBox').value;
    let weight = document.getElementById('weightBox').value;

    const data = { userID, age, gender, weight };

    // Udfører et PUT API-kald for at opdatere brugeroplysninger
    fetch(putInfoApi, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json', // Angiver indholdstypen som JSON
        },
        body: JSON.stringify(data) // Sender data som JSON-streng
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Kunne ikke opdatere');
            }
        })
        .then(data => {
            console.log('Succes:', data.message);
            alert('Bruger opdateret succesfuldt!');
        })
        .catch(error => {
            console.error('Fejl:', error);
            alert('Kunne ikke opdatere bruger');
        });

}

// Funktion til at slette brugerprofil
async function deleteProfile() {
    // Udfører et DELETE API-kald for at slette bruger
    fetch(deleteUserApi, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userID: userID })
    })
        .then(response => {
            if (response.ok) {
                window.location.replace('frontPage.html');
                localStorage.removeItem('userID'); // Fjerner bruger-ID fra lokal lagring
                return response.json();
            } else {
                throw new Error('Kunne ikke slette bruger');
            }
        })
        .catch(error => {
            console.error('Fejl:', error);
        });

}

// Funktion til at logge bruger ud og fjerne bruger-ID fra lokal lagring
function logOut() {
    localStorage.removeItem('userID');
    window.location.replace('frontPage.html');
};
