const fs = require('fs');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to 4BET');
});

const FILE_PATH = 'bets.json';

app.get('/bets', (req, res) => {
    fs.readFile(FILE_PATH, (err, data) => {
        if (err) {
            return res.status(500).send('Error reading the file');
        }
        res.json(JSON.parse(data));
    });
});

app.post('/bets', (req, res) => {
    fs.readFile(FILE_PATH, (err, data) => {
        if (err) {
            return res.status(500).send('Error reading the file');
        }

        let bets = JSON.parse(data);
        bets.push(req.body);

        fs.writeFile(FILE_PATH, JSON.stringify(bets, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error writing to the file');
            }
            res.send('Bet data saved successfully');
        });
    });
});

app.get('/bets-data', (req, res) => {
    fs.readFile(FILE_PATH, (err, data) => {
        if (err) {
            return res.status(500).send('Error reading the file');
        }
        try {
            const bets = JSON.parse(data);
            res.json(bets);
        } catch (parseError) {
            res.status(500).send('Error parsing the JSON data');
        }
    });
});

app.get('/get-net-winnings', (req, res) => {
    fs.readFile('win.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file');
        }
        try {
            const jsonData = JSON.parse(data);
            res.send({ netWinnings: jsonData[0].net });
        } catch (parseError) {
            res.status(500).send('Error parsing JSON');
        }
    });
});

// Endpoint to set net winnings
app.post('/set-net-winnings', (req, res) => {
    const { netWinnings } = req.body;

    // Validate input
    if (typeof netWinnings !== 'number') {
        return res.status(400).send('Invalid input: netWinnings must be a number');
    }

    fs.readFile('win.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file');
        }
        try {
            const jsonData = JSON.parse(data);
            jsonData[0].net = netWinnings; // Update the net winnings value

            // Write the updated JSON back to the file
            fs.writeFile('win.json', JSON.stringify(jsonData, null, 2), (writeError) => {
                if (writeError) {
                    return res.status(500).send('Error writing to file');
                }
                res.send('Net winnings updated successfully');
            });
        } catch (parseError) {
            res.status(500).send('Error parsing JSON');
        }
    });
});

// Endpoint to update win.json
app.post('/update-win', (req, res) => {
    const { net } = req.body;

    fs.readFile('win.json', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading file' });
        }

        const winData = JSON.parse(data);
        winData[0].net += net;

        fs.writeFile('win.json', JSON.stringify(winData, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error writing to file' });
            }
            res.status(200).json({ message: 'File updated successfully' });
        });
    });
});

app.post('/remove-bet', (req, res) => {
    const { fixtureId } = req.body;
    const bets = require('./bets.json');

    // Filter out the bet with the specified fixtureId
    const updatedBets = bets.filter(bet => bet.fixtureId !== fixtureId);

    // Write the updated bets back to the JSON file
    fs.writeFile('./bets.json', JSON.stringify(updatedBets, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating bets file.' });
        }
        res.json({ message: `Bet with fixtureId ${fixtureId} removed successfully.` });
    });
});


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
