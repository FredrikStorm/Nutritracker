async function saveNewUser() {

    // Henter og deklarer input fra bruker
    let firstname = document.getElementById('firstname').value;
    let lastname = document.getElementById('lastname').value;
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let weight = document.getElementById('weight').value;
    let age = document.getElementById('age').value;
    let dropdown = document.getElementById('gender');
    let gender = dropdown.options[dropdown.selectedIndex].value;

    // dekalrerer API og objektet som skal sendes med 
    const apiUrl = `http://localhost:3000/api/user/profile/save_user/`
    const newUser = {
        firstname,
        lastname,
        email,
        password,
        weight,
        age,
        gender
    };

    try {
        //Kaller på API
        const response = await fetch(apiUrl, {
            method: 'POST', // bruker POST ettersom at vi skal opprette nytt medlem 
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },

            //Data gjøres om til JSON-string
            body: JSON.stringify(newUser), 
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        //feilkoden som vises i konsollen dersom api-kallet var mislykket 
    } catch (error) {
        console.error('An error occurred when fetching the API', error);
    }

    //bytter ut vinduet til brukeren slik at han ikke ved et uhell logger seg ut ved å klikke tilbake 
    window.location.replace('dailynutri.html');

}
