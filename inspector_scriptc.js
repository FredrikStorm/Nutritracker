
// Funksjon for å håndtere søkeforespørsler for matvarer
function searchFood() {
    // Henter søkestrengen fra inputfeltet
    const searchString = document.getElementById('searchField').value;
    // Bygger URL for API-forespørsel basert på søkestrengen
    const apiUrl = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${encodeURIComponent(searchString)}`;

    // Utfører en GET-forespørsel til API-et
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            "X-API-Key": "171513" // API-nøkkel for autentisering
        }
    })
    .then(response => {
        // Sjekker om responsen fra serveren er OK
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json(); // Konverterer respons til JSON
    })
    .then(data => {
        // Kaller funksjonen for å oppdatere listen med søkeresultater
        updateFoodList(data);
        // Logger data til konsollen for feilsøking
        console.log('data: ', data); 
    })
    .catch(error => {
        // Logger eventuelle feil under fetch-operasjonen
        console.error('There has been a problem with your fetch operation:', error);
    });
}

// Funksjon for å oppdatere listen med søkeresultater
function updateFoodList(data) {
    // Velger container-elementet for å vise søkeresultatene
    const container = document.querySelector('.inputmat');
    container.innerHTML = ''; // Tømmer eksisterende innhold

    // Oppretter en ny liste for søkeresultatene
    const list = document.createElement('ul');
    data.forEach(item => {
        // Oppretter et nytt listeelement for hver matvare

        const listItem = document.createElement('li');
        listItem.textContent = item.foodName; // Setter tekstinnholdet til matvarens navn
        listItem.style.cursor = 'pointer'; // Endrer musepekeren til en peker
        // Legger til en event listener som håndterer klikk på matvaren

        listItem.addEventListener('click', () => handleItemClick(item));
        list.appendChild(listItem); // Legger listeelementet til listen
    });
    container.appendChild(list); // Legger listen til containeren
}




// Funksjon som håndterer klikk på en matvare
function handleItemClick(item) {
    // Logger valgt matvare til konsollen
    console.log('Valgt item:', item);
    console.log('Matvarenavn:', item.foodName); 
    console.log('Matvare-ID:', item.foodID); 

    // Setter opp headers for API-forespørsler
    const headers = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            "X-API-Key": "171513"
        }
    };

    // Bygger URL-er for å hente spesifikk ernæringsinformasjon
    const apiUrl_kcal = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${item.foodID}/BySortKey/1030`;
    const apiUrl_protein = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${item.foodID}/BySortKey/1110`;
    const apiUrl_fett = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${item.foodID}/BySortKey/1310`;
    const apiUrl_ash = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${item.foodID}/BySortKey/1520`;
    const apiUrl_fiber = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${item.foodID}/BySortKey/1240`;

    // Utfører parallelt flere API-forespørsler for å hente ernæringsinformasjon
    Promise.all([
        fetch(apiUrl_kcal, headers),
        fetch(apiUrl_protein, headers),
        fetch(apiUrl_fett, headers),
        fetch(apiUrl_ash, headers),
        fetch(apiUrl_fiber, headers)
    ])
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(data => {
        // Behandler de hentede dataene og oppdaterer infomat-div'en
        const data_kcal = data[0][0].resVal; // Henter kaloriinformasjonen fra responsen
        const data_protein = data[1][0].resVal; // Henter proteininformasjonen fra responsen
        const data_fett = data[2][0].resVal; // Henter fettinformasjonen fra responsen
        const data_ash = data[3][0].resVal; // Henter askeinformasjonen fra responsen
        const data_fiber = data[4][0].resVal; // Henter vanninformasjonen fra responsen

        // Logger ernæringsinformasjon til konsollen
        console.log('Kalorier:', data_kcal);
        console.log('Protein:', data_protein);
        console.log('Fett:', data_fett);
        console.log('Aske:', data_ash);
        console.log('fiber:', data_fiber);

        // Kaller funksjonen for å vise detaljert informasjon
        updateInfoMat(item.foodName, data_kcal, data_protein, data_fett, data_ash, data_fiber);
    })
    .catch(error => {
        // Logger eventuelle feil under henting av ernæringsinformasjon
        console.error('Problem med fetch-operasjonen:', error);
    });
}

// Funksjon for å oppdatere infomat-div'en med detaljert matvareinformasjon
function updateInfoMat(foodName, kcal, protein, fett, ash, fiber) {
    // Velger containeren for å vise detaljert informasjon
    const infoContainer = document.querySelector('.infomat');
    infoContainer.innerHTML = ''; // Tømmer eksisterende innhold

    // Oppretter og setter tittelen for den valgte matvaren
    const title = document.createElement('h3');
    title.textContent = foodName + ', gram per 100g'; // Angir matvarenavn og enhet

    // Oppretter en liste for å vise ernæringsinformasjon
    const infoList = document.createElement('ul');
    infoList.innerHTML = `
        <li>Kalorier: ${kcal}</li>
        <li>Protein: ${protein}</li>
        <li>Fett: ${fett}</li>
        <li>Aske: ${ash}</li>
        <li>Fiber: ${fiber}</li>
    `; // Setter inn data for kalorier, protein, fett, aske, og vann

    // Legger tittelen og listen til infoContainer
    infoContainer.appendChild(title);
    infoContainer.appendChild(infoList);
}

// Legger til en event listener på dokumentet som vil kjøre når det er ferdig lastet
document.addEventListener('DOMContentLoaded', () => {
    // Når dokumentet er ferdig lastet, legg til en click event listener på søkeknappen
    // Denne event listeneren vil aktivere searchFood-funksjonen når knappen klikkes
    document.getElementById('searchButton').addEventListener('click', searchFood);
});
