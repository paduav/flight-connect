// schedules.js

function formatTime(ts) {
    if (!ts) return 'N/A'
    return new Date(ts).toLocaleString()
}


async function loadSchedules() {
    try {
        const response = await fetch('/flights')
        const result = await response.json()
        const flights = result.data

        const tableBody = document.querySelector('#timeTable tbody')
        tableBody.innerHTML = ''

        flights.forEach(flight => {
            const row = document.createElement('tr')
            row.style.cursor = 'pointer'
            row.addEventListener('click', () => {
                loadPassengers(flight.id)
            })


            row.innerHTML = `
                <td>${flight.flight_number || 'N/A'}</td>
                <td>${flight.departure_airport || 'N/A'}</td>
                <td>${flight.arrival_airport || 'N/A'}</td>
                <td>${formatTime(flight.departure_time) || 'N/A'}</td>
                <td>${formatTime(flight.arrival_time) || 'N/A'}</td>
                <td>${flight.arrival_delay || 0}</td>
                <td>${flight.flight_status || 'unknown'}</td>
                `

            tableBody.appendChild(row)
        })
    } catch (err) {
        console.error('Failed to load schedules:', err)
    }
}

async function loadPassengers(flightId) {
    try {
        const response = await fetch(`/flights/${flightId}/passengers`)
        const result = await response.json()
        const passengers = result.data

        const container = document.getElementById('passengersContainer')
        container.innerHTML = ''

        if (passengers.length === 0) {
            container.innerHTML = '<p>No passengers for this flight.</p>'
            return
        }

        const table = document.createElement('table')
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Checked In</th>
                </tr>
            </thead>
            <tbody></tbody>
        `

        const tbody = table.querySelector('tbody')

        passengers.forEach(p => {
            const row = document.createElement('tr')
            row.innerHTML = `
                <td>${p.first_name} ${p.last_name}</td>
                <td>${p.checked_in ? 'Yes' : 'No'}</td>
            `
            tbody.appendChild(row)
        })

        container.appendChild(table)

    } catch (err) {
        console.error('Failed to load passengers:', err)
    }
}

window.onload = loadSchedules
