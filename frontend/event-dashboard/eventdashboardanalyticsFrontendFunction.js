//const { load } = require("mime");

//analytics function
// async function eventAnalyticsFunction(){
//     const dbResponse = await fetch("http://localhost:3000/analytics"); //fetching information from backend
//     const analyticsData = await dbResponse.json();

//     let labels, values;
//     if (!analyticsData || analyticsData.length === 0) {
//         labels = ["No Data"];
//         values = [1];
//     } else{
//         labels = analyticsData.map(row => row.category || "Unknown"); 
//         values = analyticsData.map(row => row.count || 0);
//     }

//     new Chart(document.getElementById("eventAnalyticsChart"), {
//         type: "pie",
//         data: {
//             labels: labels,
//             datasets: [{
//                 label: "Category of Events",
//                 data: values,
//                 backgroundColor: ["#583f32ff", "#525175ff","#754b5eff","#6d4949ff","#5a4a75ff"],
//             }]
//         }
//     });

    // new Chart(document.getElementById("eventChart"), {
    //     type: "doughnut",
    //     data: {
    //         labels: labels,
    //         datasets: [{
    //             label: "Category of Events",
    //             data: values,
    //             backgroundColor: ["#583f32ff", "#525175ff","#754b5eff","#6d4949ff","#5a4a75ff"],
    //         }]
    //     }
    // });

//} eventAnalyticsFunction();



// async function loadEventAnalytics(eventID){
//     const res = await fetch(`http://localhost:3000/analytics/${eventID}`);
//     const analyticsData = await res.json();

//     const labels = analyticsData.map(d => d.metric);
//     const values = analyticsData.map(d => d.value);

//     new Chart(document.getElementById("eventAnalyticsChart"), {
//         type: "bar",
//         data: {
//             labels: labels,
//             datasets: [{
//                 label: "Event Analytics",
//                 data: values,
//                 backgroundColor: "#583f32ff",
//             }]
//         }
//     });
// }

//loadEventAnalytics(eventID);

async function fetchEvents() {
    const res = await fetch("http://localhost:3000/Events");
    const events = await res.json();
    const select = document.getElementById("eventSelect");
    events.forEach(event => {
        const option = document.createElement("option");
        option.value = event.eventID;
        option.textContent = event.eventName;
        select.appendChild(option);
    });

    select.addEventListener("change", () => {
        loadTicketsIssued(select.value);
    });
}

async function loadTicketsIssued(eventID){
    const res = await fetch("http://localhost:3000/tickets-issued/${eventID}");
    const ticketsData = await res.json();

    // const labels = ticketsData.map(row => row.eventName);
    // const values = ticketsData.map(row => Number(row.total_tickets));

    const chartCanvas = document.getElementById("ticketsIssuedChart");

    if (window.ticketsChart) {
        window.ticketsChart.destroy();
    }

    window.ticketsChart = new Chart(chartCanvas, {
        type: "bar",
        data: {
            labels: [ticketsData.eventName],
            datasets: [{
                label: "Tickets Issued per Event",
                data: [Number(ticketsData.total_tickets)],
                backgroundColor: "#525175ff",
            }]
        }
    })
}
document.addEventListener("DOMContentLoaded", fetchEvents);
