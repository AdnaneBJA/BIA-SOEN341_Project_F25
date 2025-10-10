function TicketAnalytics({analytics}){
    const ticketsFree = analytics?.ticketsFree ?? 0; //use ?. to avoid getting errors if smt is undefined
    const ticketsPaid = analytics?.ticketsPaid ?? 0;

    return (
        <div>
            <p>Free Tickets: {ticketsFree}</p>
            <p>Paid Tickets: {ticketsPaid}</p>
        </div>

    );
}

export default TicketAnalytics; //in case we need it somewhere else