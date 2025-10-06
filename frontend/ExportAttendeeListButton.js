import React from 'react';

function ExportAttendeeListButton({ onExport }) { 
    return (
        //onExport is called when the button is clicked (need to define it)
        <button onClick = {onExport}> 
            Export Attendee List
        </button>
    );
}

export default ExportAttendeeListButton;
