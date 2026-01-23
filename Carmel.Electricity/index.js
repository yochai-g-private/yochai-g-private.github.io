/*
<script src="https://www.gstatic.com/firebasejs/8.6.8/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.6.8/firebase-database.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.6.8/firebase-auth.js"></script>
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, 
         ref, 
         query,
         orderByKey, 
         limitToLast,
         get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

//import { getDatabase, ref, query, orderByKey, limitToLast, get } from "firebase/database";

let database;
let auth;

function showLoading() {
	document.getElementById('LOADING').style.visibility = 'visible';
}

function hideLoading() {
	document.getElementById('LOADING').style.visibility = 'hidden';
}

let not_up_to_date	= false;
let is_night 		= false;
let intervalId 		= 0;
let blinkerId  		= 0;

let created_at = new Date();

const UPDATE_FREQUENCY_SECONDS 	= 20;

var refresh_frequency_seconds 	= UPDATE_FREQUENCY_SECONDS;
var up_to_date 					= true;

var localDateTimeString;

function blink()	{
	return;
	elem = document.getElementById('UPDATED_AT');
	if(elem.textContent == localDateTimeString)
	elem.textContent = 'לא עדכני';
	else
	elem.textContent = localDateTimeString;
}

function get_database_path(sub_path)	{
	return "Hashmal/" + sub_path;
}

function get_history()	{

}
function on_data_got(snapshot)
{
	hideLoading();

	if (!snapshot.exists()) 
	{
		no_data();
		return;
	}

	let val = snapshot.val();
	let LocalTime_num = val.LastSeen;

	if(LocalTime_num == null || LocalTime_num == "")
	{
		no_data();
		return;
	}

	let last_update = Number(LocalTime_num);

	last_update -= 3600 * 2;
	last_update *= 1000;

	var updated_at = new Date(last_update);

	const year    = updated_at.getFullYear();
	const month   = updated_at.getMonth() + 1; // Months are zero-based
	const day     = updated_at.getDate();
	const hours   = updated_at.getHours();
	const minutes = updated_at.getMinutes();
	const seconds = updated_at.getSeconds();

	// Create a formatted string
	localDateTimeString = `${day}-${month < 10 ? '0' : ''}${month}-${year} ${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

	let now_t = new Date().getTime();// + ((3600 * 2) * 1000);
	let upd_t = updated_at.getTime();

	let now_t_seconds 		= now_t / 1000;
	let upd_t_seconds 		= upd_t / 1000;
	let next_upd_t_seconds	= upd_t_seconds + UPDATE_FREQUENCY_SECONDS + 5;

	refresh_frequency_seconds 	= (next_upd_t_seconds - now_t_seconds);
	if(refresh_frequency_seconds < 0)
		refresh_frequency_seconds = UPDATE_FREQUENCY_SECONDS;

	const timeDifference = (now_t - upd_t) / 1000;

	console.log('timeDifference: ', timeDifference);

	let max_timeDifference  = UPDATE_FREQUENCY_SECONDS;
	max_timeDifference += max_timeDifference / 2;	// tolerance

	let not_up_to_date = (max_timeDifference < timeDifference);

	let e_UPDATED_AT = document.getElementById('UPDATED_AT');
	e_UPDATED_AT.style.color = (not_up_to_date) ? 'red' : (is_night) ? 'lightblue' : 'darkblue';
	e_UPDATED_AT.textContent = localDateTimeString;

	let e_STATUS = document.getElementById('STATUS');
	e_STATUS.style.color = (not_up_to_date) ? 'red' : (is_night) ? 'lightblue' : 'darkblue';
	e_STATUS.textContent = (not_up_to_date) ? 'הפסקת חשמל' : 'הכל תקין';
}

var first_time = true;

function _update() {
	clearInterval(blinkerId);

	let path = get_database_path("Current");

    const dataRef = ref(database, path);
    
	showLoading();

	get(dataRef).then((snapshot) => {
		refresh_frequency_seconds = UPDATE_FREQUENCY_SECONDS;
		on_data_got(snapshot);
		clearInterval(intervalId);
		intervalId = setInterval(update, refresh_frequency_seconds * 1000);

        if(first_time)
        {
            first_time = false;
        }
		});
}

function update() {
	_update();
}

function getDateAndTimeString(d)	{
	const date = d.toLocaleDateString('en-IL');
	const time = d.toLocaleTimeString('en-IL');

	const result = `${date} ${time}`;

	return result;
}

function setBackgroundColor() {
	const apiUrl = `https://api.sunrise-sunset.org/json?lat=31.424836&lng=35.182815&formatted=0&tzid=UTC`;

	// Fetch the sunset data
	fetch(apiUrl)
		.then(response => response.json())
		.then(data => {
			let sunset = new Date(data.results.sunset);
			let sunrise = new Date(data.results.sunrise);
			let now = new Date();
			//now.setHours(2, 0, 0);
			is_night = now >= sunset || now < sunrise;
			//		is_night = true;
			let sunset_s  = sunset.toLocaleTimeString('it-IT');
			let sunrise_s = sunrise.toLocaleTimeString('it-IT');

			let e_SUNSET  = document.getElementById('SUNSET');
			let e_SUNRISE = document.getElementById('SUNRISE');

			if(is_night)
			{
                e_SUNSET.style.color  = 'white';
                e_SUNRISE.style.color = 'white';
			}
			else
			{
                e_SUNSET.style.color  = 'black';
                e_SUNRISE.style.color = 'black';
			}

			e_SUNSET.textContent  = sunset_s;
			e_SUNRISE.textContent = sunrise_s;

			console.log('Sunrise time:', sunrise_s);
			console.log('Sunset time:',  sunset_s);
			console.log('NOW:', now.toLocaleTimeString());
			console.log('Is night:', is_night);
			})
		.catch(error => {
			show_error(error, 'Error fetching sunset time');
			})
		.finally(() => {
			document.body.style.backgroundColor = (is_night) ? "#404040" : "#ffffff";
			document.body.style.display = "block";

			document.getElementById('CARMEL').style.color 	  = (is_night) ? 'white' : 'black';
			document.getElementById('STATUS').style.color 	  = (not_up_to_date) ? 'red' : (is_night) ? 'lightblue' : 'darkblue';
			document.getElementById('UPDATED_AT').style.color = (not_up_to_date) ? 'red' : (is_night) ? 'lightblue' : 'darkblue';
			});
}

function show_error(error, context)
{
	const errorCode = error.code;
	const errorMessage = error.message;
	console.error(context + ': ', errorCode, errorMessage);
}

function initialize() {
	// Initialize Firebase with your configuration
	//USER=smart.glauber@gmail.com
	//PASS=Carmel/ElectricityWEB
	const firebaseConfig = {
		apiKey: "AIzaSyDt-ox1U0OzmXSE2iHT3r7IXfoB-QC2jAc",
		authDomain: "system-14f28.firebaseapp.com",
		databaseURL: "https://system-14f28-default-rtdb.europe-west1.firebasedatabase.app",
		projectId: "system-14f28",
		storageBucket: "system-14f28.firebasestorage.app",
		messagingSenderId: "465688970634",
		appId: "1:465688970634:web:43d1361db2f8afff303473",
		measurementId: "G-TWSD8BHZBC" };

    const app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    auth = getAuth(app);

    signInWithEmailAndPassword(
        auth,
        "smart.glauber@gmail.com",
        "Carmel/ElectricityWEB")
        .then((userCredential) => {
            console.log("Signed in:", userCredential.user.uid);
            fill_table();
            })
		.catch((error) => {
			show_error(error, 'Sign-in error');
		});
}

initialize();
setBackgroundColor();

clearInterval(intervalId);
update();
fill_table();

function show_balloon(id, text)	{
	elem = document.getElementById(id);
	elem.textContent   = text;
	elem.style.display = 'block';
	elem.style.width = 'auto';
	var contentWidth = elem.offsetWidth;
	elem.style.width = contentWidth + 'px';
}

function show_balloon_STATUS()	{
	text = "?";
	/*	
	switch(resolution_id)
	{
	case ResolutionID.MINUTELY: text = "ממוצע הדקה האחרונה"; 					break;
	case ResolutionID.HOURLY: 	text = "ממוצע 60 הדקות האחרונות"; 				break;
	case ResolutionID.DAILY: 	text = "ממוצע 24 השעות האחרונות"; 				break;
	case ResolutionID.WEEKLY: 	text = "ממוצע 7 היממות האחרונות"; 				break;
	case ResolutionID.MONTHLY: 	text = "ממוצע החודש האחרון מתאריך לתאריך"; 	   break;
	case ResolutionID.YEARLY: 	text = "ממוצע 12 החודשים האחרונים"; 			break;
	case ResolutionID.RECORDS:
	text = "שיאים שנמדדו החל מ-" + created_at.toLocaleDateString('en-IL');	break;
	}
	*/
	show_balloon('balloon_STATUS', text);
}

function hide_balloon_STATUS()	{
	document.getElementById('balloon_STATUS').style.display = 'none';
}

function show_balloon_UPDATED_AT()	{
	show_balloon('balloon_UPDATED_AT', "מועד העדכון האחרון");
}

function hide_balloon_UPDATED_AT()	{
	document.getElementById('balloon_UPDATED_AT').style.display = 'none';
}

function on_table_got(snapshot)   {
	hideLoading();

    console.log("Snapshot has children?", snapshot.hasChildren());
    //?console.log("Children count:", snapshot.numChildren());

    const items = [];
    try {
        snapshot.forEach((child) => {
            items.push(child);
        });
    } catch (e) {
        console.error("Error during loop:", e);
    }

    items.reverse();

    const table = document.getElementById("LIST");
    const tbody = table.tBodies[0];

    items.forEach((child, i) => {
        const row = tbody.rows[i];
        row.cells[0].textContent = child.val().LostAt           ?? "";
        row.cells[1].textContent = child.key.replace('_', ' ')                    ?? "";
        row.cells[2].textContent = child.val().ElapsedNegative  ?? "";
        });
}

function fill_table()   {
	let path = get_database_path("History");

    //const dataRef = ref(database, path);
    
	showLoading();

    const N = 10;
/**/
    const q = query(
        ref(database, path),
        orderByKey(),
        limitToLast(N)
    );

	get(q).then((snapshot) => {
        on_table_got(snapshot);
        });
/**/
/*
const dataRef = ref(database, path); 

get(dataRef).then((snapshot) => {
        console.log("Total children found:", snapshot.size);
        on_table_got(snapshot);
    });
*/
}