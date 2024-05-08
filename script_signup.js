async function saveNewUser() {
    try {
        const firstname = document.getElementById('firstname').value;
        const lastname = document.getElementById('lastname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const weight = document.getElementById('weight').value;
        const age = document.getElementById('age').value;
        const dropdown = document.getElementById('gender');
        const gender = dropdown.options[dropdown.selectedIndex].value;

        const newUser = { firstname, lastname, email, password, weight, age, gender };

        // Sjekker om brukeren finnes fra før
        const emailSearchResponse = await fetch(`http://localhost:3000/api/user/profile?email=${email}`);
         if (emailSearchResponse.ok) {
            alert("Finnes allerede en bruker under dette brukernavnet, vennligst logg inn med din eksisterende bruker");
            window.location.replace('login.html');
            return;
        } else if (emailSearchResponse.status === 404) {
            // Registrer ny bruker siden de ikke finnes fra før
            const saveResponse = await fetch('http://localhost:3000/api/user/profile/save_user/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (!saveResponse.ok) {
                throw new Error('HTTP error! Status: ${saveResponse.status}');
            }

            const userData = await saveResponse.json(); 
            console.log(userData);

            const callsign='userID'
                const userID =userData.userID.userID;
                localStorage.setItem(callsign, JSON.stringify(userID))
                 window.location.replace('profil.html');

        } else {
            throw new Error('Unexpected error: ${emailSearchResponse.statusText}');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}
