
const userID = localStorage.getItem('userID')
console.log(userID);
const getInfoApi=`http://localhost:3000/api/user/profile/edit?userID=${userID}`;
const putInfoApi=`http://localhost:3000/api/user/profile/edit/save_changes`;
document.addEventListener('DOMContentLoaded', function () {
   
    fetch(getInfoApi)
    .then(response => {
        if (response.ok) {
           
            return response.json();
        } else {
            
            throw new Error('Failed to get data');
        }
    })
    .then(data => {
        
        console.log(data);  // Logger JSON-dataene til konsollen
        document.getElementById('ageBox').value = data.age;
        document.getElementById('genderBox').value = data.gender;
        document.getElementById('weightBox').value = data.weight;
    })
    .catch(error => {
        console.error('Error:', error);
    });



});

async function saveChanges(){
   let newAge=document.getElementById('ageBox').value;
   let newGender=document.getElementById('genderBox').value;
   let newWeight=document.getElementById('weightBox').value;

   const data = { userID, newAge, newGender, newWeight};
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
    .then(data=>{
        console.log('Success:', data.message);
        alert('User updated successfully!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to update user');
    });

}

