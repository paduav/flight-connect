// schedules.js

let allFlights = [];

function formatTime(ts) {
    if (!ts) return 'N/A'
    return new Date(ts).toLocaleString()
}

function setProgress(percent, text) {
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressText').innerText = text;
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}



async function createCache() {
    await fetch('/cache-flights', { method: 'POST' });
}


async function loadSchedules() {
    try {
        const response = await fetch('/flights');
        const result = await response.json();

        allFlights = result.data || [];
        renderFlights(allFlights);

    } catch (err) {
        console.error('Failed to load schedules:', err);
    }
}

function getDelayClass(delay) {
    if (!delay || delay === 0) return 'delay-ontime';
    if (delay < 15) return 'delay-minor';
    if (delay < 60) return 'delay-moderate';
    return 'delay-severe';
}


function renderFlights(flights) {
    const tableBody = document.querySelector('#timeTable tbody');
    tableBody.innerHTML = '';

    flights.forEach(flight => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';

        row.addEventListener('click', () => {
            document
                .querySelectorAll('#timeTable tr')
                .forEach(r => r.classList.remove('active-flight'));

            row.classList.add('active-flight');
            loadPassengers(flight.id);
        });

        row.innerHTML = `
            <td>${flight.flight_iata || 'N/A'}</td>
            <td>${flight.departure_airport || 'N/A'}</td>
            <td>${flight.arrival_airport || 'N/A'}</td>
            <td>${formatTime(flight.departure_time)}</td>
            <td>${formatTime(flight.arrival_time)}</td>
            <td class="${getDelayClass(flight.arrival_delay)}">
                ${flight.arrival_delay || 0} min
            </td>
            <td>${flight.flight_status || 'unknown'}</td>
        `;

        tableBody.appendChild(row);
    });
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

document.getElementById('flightSearch').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();

    const filteredFlights = allFlights.filter(f =>
        f.flight_iata?.toLowerCase().includes(term) ||
        f.departure_airport?.toLowerCase().includes(term) ||
        f.arrival_airport?.toLowerCase().includes(term)
    );

    renderFlights(filteredFlights);
});

document.getElementById('sortDelay').addEventListener('click', () => {
    const sorted = [...allFlights].sort(
        (a, b) => (b.arrival_delay || 0) - (a.arrival_delay || 0)
    );

    renderFlights(sorted);
});


window.onload = async () => {
    try {
        setProgress(10, 'Initializing…');

        setProgress(30, 'Loading flight data…');
        await fetch('/cache-flights', { method: 'POST' });

        setProgress(70, 'Loading passengers…');
        await new Promise(r => setTimeout(r, 400)); 

        setProgress(90, 'Loading schedules…');
        await loadSchedules();

        setProgress(100, 'Done');
        setTimeout(hideLoading, 300);

    } catch (err) {
        console.error(err);
        setProgress(100, 'Failed to load data');
    }
};


