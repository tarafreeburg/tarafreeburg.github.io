async function fetchBets() {
    try {
        const response = await fetch('http://localhost:3000/bets-data');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const bets = await response.json();
        displayBets(bets);
    } catch (error) {
        console.error("Error fetching bets:", error);
        document.getElementById('bets-container').innerHTML = 'Error loading bets.';
    }
}

function displayBets(bets) {
    const container = document.getElementById('bets-container');
    if (bets.length === 0) {
        container.innerHTML = 'No bets available.';
        return;
    }

    const betsHTML = bets.map(bet => `
                    <div>
                        <hr>
                        <p>${bet.homeTeam} (H) vs ${bet.awayTeam} (A) </p>
                        <p>$${bet.betAmount} on ${bet.value} @ x${bet.odd} to win $${bet.potentialWinnings}</p>
                        <button onclick="checkGameResult(${bet.fixtureId})">Check Result</button>
                    </div>
                `).join('');

    container.innerHTML = betsHTML;
}

async function checkGameResult(fixtureId) {
    try {
        const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?id=${fixtureId}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '921908905cmshac2cc1ffdff44bbp18a0d4jsnc0818ea7d38f',
                'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const resultData = await response.json();
        const matchDetails = resultData.response[0];

        if (!matchDetails) {
            alert('No match details available for this fixture.');
            return;
        }

        const matchStatus = matchDetails.fixture.status.long;
        const homeScore = matchDetails.score.fulltime.home;
        const awayScore = matchDetails.score.fulltime.away;
        const homeTeam = matchDetails.teams.home.name;
        const awayTeam = matchDetails.teams.away.name;

        let message = `Match Status: ${matchStatus}`;

        if (matchStatus === "Match Finished") {
            message += `\nScore: ${homeTeam} ${homeScore} - ${awayTeam} ${awayScore}`;

            // Retrieve the bet data
            const bets = await fetchBetsFromLocal();
            const bet = bets.find(b => b.fixtureId === fixtureId);

            if (bet) {
                const isHomeTeamWin = homeScore > awayScore;
                const isAwayTeamWin = awayScore > homeScore;

                // Determine if the bet won or lost
                let result = "lost";
                if ((bet.value === "Home" && isHomeTeamWin) ||
                    (bet.value === "Away" && isAwayTeamWin) ||
                    (bet.value === "Draw" && homeScore === awayScore)) {
                    result = "won";
                }

                if (result === "won") {
                    message += `\nThis bet has ${result}! $${bet.potentialWinnings} has been added to your winnings.`;

                    // Add the potential winnings if won
                    await updateWinFile(bet.potentialWinnings);
                } else {
                    message += `\nThis bet has ${result}. You have lost $${bet.betAmount}.`;

                    // Subtract the bet amount if lost
                    await updateWinFile(-bet.betAmount);
                }

                // Remove the bet entry after processing to keep the existing bet page simple
                await removeBetFromFile(fixtureId);
                // Refresh data to hide paid bets
                fetchBets();
            } else {
                message += `\nNo matching bet found for this fixture.`;
            }
        }

        alert(message);
    } catch (error) {
        console.error("Error fetching game result:", error);
        alert('Error fetching match result.');
    }
}

async function removeBetFromFile(fixtureId) {
    try {
        const response = await fetch('http://localhost:3000/remove-bet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fixtureId: fixtureId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result.message);
    } catch (error) {
        console.error("Error removing bet from file:", error);
    }
}


async function updateWinFile(netChange) {
    try {
        const response = await fetch('http://localhost:3000/update-win', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ net: netChange })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result.message);
    } catch (error) {
        console.error("Error updating win file:", error);
    }
}

// Example function to fetch bet data locally
async function fetchBetsFromLocal() {
    const response = await fetch('http://localhost:3000/bets-data');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

fetchBets();