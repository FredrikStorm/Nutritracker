
async function login() {
    let email = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    
    let getUserApiUrl = `http://localhost:3000/api/user/profile?email=${email}`;
    let saveToSessionApiUrl=`http://localhost:3000/api/session/POST/`;

    fetch(getUserApiUrl)
        .then(response => {
            if (!response.ok) {

                //sjekker om feilkode tilsier at det ikke ble funnet noen bruker
                if (response.status === 404) {
                    window.location.replace('signup.html'); // Redirect to signup if user not found
                    alert("Ingen bruker funnet under det brukernavnet, vennligst registrer deg først");
                }
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {

            //sjekker om passordet koresponderer med 
            if (data.password === password) {

                // Sender brukerens ID til serveren for å lagre i session
                fetch(saveToSessionApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userID: data.userID })
                })
                .then(response => {
                    if (response.ok) {
                        console.log('Saved');
                        //Brukeren er nå autentisert, og sessionen er oppdatert
                        window.location.replace('dailynutri.html');
                    } else {
                        throw new Error('Failed to update session');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            }

        })
        .catch(error => {
            console.error('There has been a problem with the fetch operation:', error);
        });

}


