document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Fetching net winnings...');
        const response = await fetch('http://localhost:3000/get-net-winnings');
        if (!response.ok) {
            throw new Error('Failed to fetch net winnings');
        }
        const data = await response.json();
        console.log('Fetched data:', data);

        const netWinnings = data.netWinnings; // This should be 1 according to your logs.
        console.log('Net winnings:', netWinnings);

        // Check for undefined here
        if (typeof netWinnings === 'undefined') {
            throw new Error('Net winnings are undefined. Check the data structure.');
        }

        // Display the net winnings on the page
        document.getElementById('net-winnings').textContent = `$${netWinnings.toFixed(2)}`;
    } catch (error) {
        console.error('Error fetching net winnings:', error);
        document.getElementById('net-winnings').textContent = 'Error loading net winnings.';
    }
});
