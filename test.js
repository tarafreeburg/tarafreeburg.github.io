const fixturesUrl = 'https://api-football-v1.p.rapidapi.com/v3/fixtures?league=39&next=10';
const apiOptions = {
    method: 'GET',
    headers: {
        'x-rapidapi-key': '921908905cmshac2cc1ffdff44bbp18a0d4jsnc0818ea7d38f',
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
    }
};

// Fetch and display fixtures along with odds
async function fetchAndDisplayData() {
    try {
        const response = await fetch(fixturesUrl, apiOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayData(data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Display fixtures and fetch/display odds for each
async function displayData(data) {
    const container = document.getElementById("data-container");
    container.innerHTML = "";

    for (const match of data.response) {

        const date = new Date(match.fixture.date); // Format date
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedDateTime = `${formattedDate} - ${formattedTime}`;
        const fixtureID = match.fixture.id;
        const homeTeam = match.teams.home.name;
        const awayTeam = match.teams.away.name;

        const matchElement = document.createElement("div");
        matchElement.classList.add("match");
        matchElement.innerHTML = `
            <hr>
            <p>${formattedDateTime}</p>
            <p><strong>${homeTeam}</strong> vs <strong>${awayTeam}</strong></p>
            <div class="odds" id="odds-${fixtureID}">Loading odds...</div>
        `;

        container.appendChild(matchElement);

        await fetchOdds(fixtureID, `odds-${fixtureID}`, homeTeam, awayTeam);
    }
}

// Fetch odds for a specific fixture
async function fetchOdds(fixtureId, elementId, homeTeam, awayTeam) {
    const oddsUrl = `https://api-football-v1.p.rapidapi.com/v3/odds?fixture=${fixtureId}&league=39&season=2024`;

    try {
        const response = await fetch(oddsUrl, apiOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const oddsData = await response.json();

        // Pull and show odds
        const oddsElement = document.getElementById(elementId);
        const bookmaker = oddsData.response[0]?.bookmakers[0]?.name || "No data";
        const odds = oddsData.response[0]?.bookmakers[0]?.bets[0]?.values || [];

        if (odds.length > 0) {
            const formattedOdds = odds.map(
                (odd) =>
                    `<button type="button" onclick="showPrompt('${odd.value}', '${odd.odd}', '${bookmaker}', '${homeTeam}', '${awayTeam}', ${fixtureId})">
                        ${odd.value}: ${odd.odd}
                    </button>`
            ).join("");
            oddsElement.innerHTML = `${formattedOdds}`;
        } else {
            oddsElement.innerHTML = "Odds not available.";
        }

    } catch (error) {
        console.error("Error fetching odds:", error);
        document.getElementById(elementId).innerHTML = "Error fetching odds.";
    }
}


function showPrompt(value, odd, bookmaker, homeTeam, awayTeam, fixtureId) {
    let userResponse;

    while (true) {
        // Step 1: Ask user for a bet with a prompt for monetary input (e.g., $100.00)
        userResponse = prompt(
            `Bookmaker: ${bookmaker}\nValue: ${value}\nOdd: ${odd}\n\nPlease enter your bet amount (up to $1,000,000, up to two decimal places):`
        );

        if (userResponse === null) {
            console.log("User canceled the input prompt.");
            return;
        }

        // Convert input to a floating-point number
        userResponse = parseFloat(userResponse);

        // Validate input: Must be a valid number, an integer or a decimal with two places, and not exceed $1,000,000
        if (!isNaN(userResponse) && userResponse > 0 && userResponse <= 1000000 && /^[0-9]+(\.[0-9]{1,2})?$/.test(userResponse.toString())) {
            break;
        } else {
            alert("Invalid input. Please enter a valid amount (e.g., 100.00) up to $1,000,000 with no more than two decimal places.");
        }
    }

    // Step 2: Calculate and format the potential winnings to two decimal places
    const potentialWinnings = (userResponse * parseFloat(odd)).toFixed(2);

    // Convert potentialWinnings to a number if needed to store it as a numeric value
    const potentialWinningsNum = parseFloat(potentialWinnings);

    const confirmation = confirm(
        `You entered $${userResponse.toFixed(2)}.\nBased on odds (${odd}), your total return on a win would be $${potentialWinningsNum.toFixed(2)}.\n\nPress OK to confirm your bet.`
    );

    if (!confirmation) {
        console.log("User canceled the confirmation prompt.");
        return;
    }

    // Step 3: Save bet to bets.json
    const betData = {
        value,
        odd: parseFloat(odd),
        betAmount: userResponse,
        potentialWinnings: potentialWinningsNum, // Save as a number with two decimal places
        homeTeam,
        awayTeam,
        fixtureId,
        active: true
    };

    saveBetToFile(betData);
}


async function saveBetToFile(betData) {
    try {
        const response = await fetch('http://localhost:3000/bets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(betData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("Bet data saved successfully.");
    } catch (error) {
        console.error("Error saving bet data:", error);
    }
}


fetchAndDisplayData();
