
const userID = parseInt(localStorage.getItem('userID'))
console.log(userID);
const getInfoApi = `http://localhost:3000/api/user/profile/edit?userID=${userID}`;
const putInfoApi = `http://localhost:3000/api/user/profile/edit/save_changes`;
const deleteUserApi = `http://localhost:3000/api/user/profile/delete?userID=${userID}`;

document.addEventListener('DOMContentLoaded', function() {
    const userId = parseInt(localStorage.getItem('userID'), 10);
    if (!userId) {
        console.error("No user ID found in localStorage");
        return;
    }

    fetch(`http://localhost:3000/api/user/profile/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('ageBox').value = data.age;
            document.getElementById('weightBox').value = data.weight;
            document.getElementById('genderBox').value = data.gender;
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
            document.getElementById('result').textContent = "Error fetching data.";
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

