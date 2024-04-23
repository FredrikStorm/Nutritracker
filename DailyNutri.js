document.addEventListener('DOMContentLoaded', function () {
    let mealCount = 0;
    let kcalCount = 0;
    let drinkCount = 0;
    let timeArr = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
    const table = document.getElementById('DNTable').getElementsByTagName('tbody')[0];

    for (let i = 0; i < 24; i++) {
        mealCount = 0;
        kcalCount = 0;
        drinkCount = 0;

        for (let j = 0; j < localStorage.length; j++) {
            //henter object fra localstorage 
            let mealKey = localStorage.key(j);
            let mealInfo = JSON.parse(localStorage.getItem(mealKey));
            // sjekker som meal er oprettet i går (datoen i dag- et døgn)
            if (mealInfo.date == new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toLocaleDateString('en-GB')) {
                //Isolerer sifferene som angir timer for å sikre at man kun får med meals, som er oprettet de siste 24 timer
                if (mealKey.toString().slice(-8, -6) > new Date().getHours()) {
                    // sjekke tidspunktet med tanke på hvilken rekke dataen skal i
                    if (mealKey.toString().slice(-8, -6) == timeArr[i]) {
                        //Sjekker om det er et glass vann
                        if (mealKey.toString().slice(0, -19) == 'drinkCount') {
                            drinkCount += 0.25;
                        }
                        //Meal
                        else {
                            mealCount += 1;
                            kcalCount += parseFloat(Math.round(mealInfo.parameters[3]));
                           
                        }
                    }
                }
            }
            //sjekker om meal er oprettet i dag 
            else if (mealInfo.date == new Date().toLocaleDateString('en-GB')) {

                // sjekke tidspunktet
                if (mealKey.toString().slice(-8, -6) == timeArr[i]) {

                    //Sjekker om det er et glass vann
                    if (mealKey.toString().slice(0, -19) == 'drinkCount') {
                        drinkCount += 0.25;
                    }
                    //Meal
                    else {
                        mealCount += 1;
                        kcalCount += parseFloat(Math.round(mealInfo.parameters[3]));
                    }
                }
 
            }
            //Setter først inn data i tabellen når den har sjekket alle ojektene 
            if (j == (localStorage.length - 1)) {
                if (drinkCount > 0 || mealCount > 0) {
                    //definerer funksjonen som setter inn en ny rad 
                    let newRow = table.insertRow();

                    // definerer nye celler som settes inn på den nye raden 
                    let timeCell = newRow.insertCell(0);
                    let mealCell = newRow.insertCell(1);
                    let waterCell = newRow.insertCell(2);
                    let kcalCell = newRow.insertCell(3);

                    //Insetter den relevante dataen i hver av cellene 
                    timeCell.textContent = timeArr[i] + ' - ' + timeArr[i + 1];
                    mealCell.textContent = mealCount;
                    waterCell.textContent = drinkCount;
                    kcalCell.textContent = kcalCount;
                }
            }
        }
    }
})