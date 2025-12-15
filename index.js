// index.js

require('dotenv').config();
const express = require('express');
const path = require("path");
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const supabaseClient = require('@supabase/supabase-js');



// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));



// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);



// Root routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/schedules', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'schedules.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});



// Functions 
/// Fetch data from AviationStack API
async function fetchFlights() {
    const res = await fetch(''); // REMEMBER TO CHANGE FETCH URL

    const data = await res.json();
    return data.data;
}

/// Cache fetched data to Supabase
async function cacheFlights() {
    const flights = await fetchFlights();
    console.log('Fetched Flights:', flights);

    const formattedFlights = flights.map(f => ({
        flight_iata: f.flight.iata,
        flight_number: f.flight.number,
        departure_airport: f.departure.iata,
        arrival_airport: f.arrival.iata,
        departure_time: f.departure.scheduled,
        arrival_time: f.arrival.scheduled,
        arrival_delay: f.arrival.delay,
        flight_status: f.flight_status
    }));

    const { data, error } = await supabase
        .from('flights')
        .upsert(formattedFlights, { onConflict: 'flight_iata', returning: 'representation' });

    if (error) console.error('Error caching flights:', error);
    else console.log('Flights cached successfully');
}

/// Random passenger generator
function generatePassengers(flightId, count = 20) {
    const firstNames = ['Virgil', 'Samantha', 'Noah', 'Noel', 'Virginia']
    const lastNames = ['Smith', 'Johnson', 'Lee', 'Garcia', 'Brown']

    return Array.from({ length: count }).map(() => ({
        first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
        last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
        //email: `passenger${Math.floor(Math.random() * 10000)}@example.com`,
        checked_in: Math.random() > 0.5,
        flight_id: flightId
    }))
}

/// Fill passengers
async function fillPassengersForFlights() {
    const { data: flights, error } = await supabase
        .from('flights')
        .select('id')

    if (error) {
        console.error('Error fetching flights:', error)
        return
    }

    console.log('Flights found for passenger generation:', flights)

    for (const flight of flights) {
        if (!flight.id) {
            console.warn('Skipping flight with undefined ID:', flight)
            continue
        }

        const passengers = generatePassengers(flight.id, 30)

        const { data, error } = await supabase
            .from('passengers')
            .insert(passengers)

        if (error) {
            console.error('Passenger insert error:', error)
        } else {
            console.log(`Inserted ${data.length} passengers for flight ID ${flight.id}`)
        }
    }
}



// API endpoints
/// Cache flight schedules to Supabase
app.post('/cache-flights', async (req, res) => {
    try {
        await cacheFlights()
        await fillPassengersForFlights()
        res.json({ message: 'Flights cached successfully' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to cache flights' })
    }
})

/// Fill passengers for flights
app.post('/fill-passengers', async (req, res) => {
    try {
        await fillPassengersForFlights()
        res.json({ message: 'Passengers created successfully' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to create passengers' })
    }
})

///  Get flight schedules from Supabase
app.get('/flights', async (req, res) => {
    const { data, error } = await supabase
        .from('flights')
        .select();
        //.order('departure_time', { ascending: false })
        //.limit(100); // most recent 100 flights

    if (error) return res.status(400).json({ error });
    res.json({ data });
});

/// Get passengers for a specific flight
app.get('/flights/:id/passengers', async (req, res) => {
    const { id } = req.params

    const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('flight_id', id)

    if (error) return res.status(500).json({ error })
    res.json({ data })
})



/* Export app
*/
module.exports = app;



/* Local testing
app.listen(port, () => {
    console.log('App is available on port:', port);
});
*/
