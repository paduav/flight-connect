// schedules.js

async function loadSchedules() {
    try {
        const response = await fetch('/flights')
        const result = await response.json()
        const flights = result.data

        const tableBody = document.querySelector('#timeTable tbody')
        tableBody.innerHTML = ''

        flights.forEach(flight => {
            const row = document.createElement('tr')

            row.innerHTML = `
                <td>${flight.flight_number || 'N/A'}</td>
                <td>${flight.departure_airport || 'N/A'}</td>
                <td>${flight.arrival_airport || 'N/A'}</td>
                <td>${flight.departure_time || 'N/A'}</td>
                <td>${flight.arrival_time || 'N/A'}</td>
                <td>${flight.arrival_delay || 0}</td>
                <td>${flight.flight_status || 'unknown'}</td>
                `

            tableBody.appendChild(row)
        })
    } catch (err) {
        console.error('Failed to load schedules:', err)
    }
}

window.onload = loadSchedules
