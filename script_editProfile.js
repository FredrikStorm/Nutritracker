
const userID = parseInt(localStorage.getItem('userID'))
console.log(userID);
const getInfoApi = `http://localhost:3000/api/user/profile/edit?userID=${userID}`;
const putInfoApi = `http://localhost:3000/api/user/profile/edit/save_changes`;
const deleteUserApi = `http://localhost:3000/api/user/profile/delete?userID=${userID}`;
document.addEventListener('DOMContentLoaded', function () {
 // Utføre GET-forespørsel med fetch
    fetch(getInfoApi, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                // Håndter feil respons
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('ageBox').value = data.age;
            document.getElementById('genderBox').value = data.gender;
            document.getElementById('weightBox').value = data.weight;
        })
        .catch(error => {
            // Logg eventuelle feil som oppstår under forespørsel eller datahåndtering
            console.error('Error fetching user info:', error);
        });
});

async function saveChanges() {
    let age = document.getElementById('ageBox').value;
    let gender = document.getElementById('genderBox').value;
    let weight = document.getElementById('weightBox').value;

    const data = { userID, age, gender, weight };

    fetch(putInfoApi, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json', // Indikerer at vi sender JSON
        },
        body: JSON.stringify(data) // Sender data som en JSON-streng
    })
        .then(response => {
            if (response.ok) {

                return response.json();
            } else {

                throw new Error('Failed to update ');
            }
        })
        .then(data => {
            console.log('Success:', data.message);
            alert('User updated successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update user');
        });

}

async function deleteProfile() {

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
                localStorage.removeItem('userID');
                return response.json();
            } else {
                throw new Error('Failed to delete User');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });

}

function logOut() {
    localStorage.removeItem('userID');
    window.location.replace('frontPage.html');
};

