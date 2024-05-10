async function saveNewUser() {
    try {
        // Henter brugeroplysninger fra formularfelter
        const firstname = document.getElementById('firstname').value;
        const lastname = document.getElementById('lastname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const weight = document.getElementById('weight').value;
        const age = document.getElementById('age').value;
        const dropdown = document.getElementById('gender');
        const gender = dropdown.options[dropdown.selectedIndex].value;

        // Samler brugerdata i et objekt
        const newUser = { firstname, lastname, email, password, weight, age, gender };

        // Kontrollerer om der allerede findes en bruger med samme mail
        const emailSearchResponse = await fetch(`http://localhost:3000/api/user/profile?email=${email}`);
        if (emailSearchResponse.ok) {
            // Hvis brugeren allerede findes bliver kommer denne besked op og man får at vide man skal lave en bruger
            alert("Finnes allerede en bruker under dette brukernavnet, vennligst logg inn med din eksisterende bruker");
            window.location.replace('login.html');
            return;
        } else if (emailSearchResponse.status === 404) {
            // Hvis brugeren ikke findes, forsøges den at oprette en ny bruger
            const saveResponse = await fetch('http://localhost:3000/api/user/profile/save_user/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser) // Sender brugerdata som JSON
            });

            if (!saveResponse.ok) {
                // Håndterer fejl, hvis brugeren ikke kan oprettes
                throw new Error(`HTTP error! Status: ${saveResponse.status}`);
            }

            // Håndtere respons og gemmer brugerens ID i localStorage
            const userData = await saveResponse.json(); 
            console.log(userData);
            const callsign = 'userID'
            const userID = userData.userID.userID;
            localStorage.setItem(callsign, JSON.stringify(userID));
            // Omdirigerer brugeren til profilside efter oprettelse
            window.location.replace('profil.html');

        } else {
            throw new Error(`Unexpected error: ${emailSearchResponse.statusText}`);
        }
    } catch (error) {
        // Logger eventuelle fejl under processen
        console.error('Error:', error.message);
    }
}

