import React from 'react';

function ExportAttendeeListButton({ onExport }) { //onExport is a function (can change the name later)
    return (
        //onExport is called when the button is clicked (need to define it)
        <button onClick={onExport}> 
        Export Attendee List
        </button>
    );
}

export default ExportAttendeeListButton;
