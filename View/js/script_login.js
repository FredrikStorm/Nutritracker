//Log-in.js: 
async function login() {
    let email = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    
    let getUserApiUrl = `http://localhost:3000/api/user/profile?email=${email}`;
   

    fetch(getUserApiUrl)
        .then(response => {
            if (!response.ok) {

                //sjekker om feilkode tilsier at det ikke ble funnet noen bruker
                if (response.status === 404) {
                    window.location.replace('signup.html'); // Hvis koden er forkert bliver man sat hen til signup
                    alert("Ingen bruker funnet under det brukernavnet, vennligst registrer deg først");
                }
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {

            //sjekker om passordet koresponderer med 
            if (data.password === password) {
                const callsign='userID'
                const userID =data.userID
                localStorage.setItem(callsign, JSON.stringify(userID))
                window.location.replace('frontPage.html');
                
            }
            else{
                prompt('Feil passord, prøv igjen')
            }

        })
        .catch(error => {
            console.error('There has been a problem with the fetch operation:', error);
        });
    
    }
