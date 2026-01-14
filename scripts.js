// HerGrowth JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('HerGrowth page loaded successfully!');
    console.log('CSS and JavaScript files are connected.');

    const goButton = document.getElementById('goButton');
    const sportButtons = document.querySelectorAll('.sport-buttons .pill-button');
    const levelButtons = document.querySelectorAll('.level-buttons .pill-button');

    // Function to check if both selections are made and enable/disable Go button
    function checkSelections() {
        const sportSelected = Array.from(sportButtons).some(btn => btn.classList.contains('selected'));
        const levelSelected = Array.from(levelButtons).some(btn => btn.classList.contains('selected'));

        if (sportSelected && levelSelected) {
            // Enable Go button
            goButton.disabled = false;
            goButton.classList.remove('bg-gray-300', 'text-gray-500', 'opacity-50', 'cursor-not-allowed');
            goButton.classList.add('bg-gradient-to-r', 'from-green-600', 'to-emerald-600', 'text-white', 'hover:from-green-700', 'hover:to-emerald-700', 'hover:shadow-2xl', 'transform', 'hover:scale-105', 'cursor-pointer', 'opacity-100', 'shadow-xl');
        } else {
            // Disable Go button
            goButton.disabled = true;
            goButton.classList.remove('bg-gradient-to-r', 'from-green-600', 'to-emerald-600', 'text-white', 'hover:from-green-700', 'hover:to-emerald-700', 'hover:shadow-2xl', 'transform', 'hover:scale-105', 'cursor-pointer', 'opacity-100', 'shadow-xl');
            goButton.classList.add('bg-gray-300', 'text-gray-500', 'opacity-50', 'cursor-not-allowed');
        }
    }

    // Handle button selection for sports section
    sportButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove selected class from all sport buttons
            sportButtons.forEach(btn => btn.classList.remove('selected'));
            // Add selected class to clicked button
            this.classList.add('selected');
            // Check if Go button should be enabled
            checkSelections();
        });
    });

    // Handle button selection for level section
    levelButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove selected class from all level buttons
            levelButtons.forEach(btn => btn.classList.remove('selected'));
            // Add selected class to clicked button
            this.classList.add('selected');
            // Check if Go button should be enabled
            checkSelections();
        });
    });

    // Handle Go button click - navigate based on selections
    goButton.addEventListener('click', function() {
        if (goButton.disabled) return;

        // Get selected sport
        const selectedSport = Array.from(sportButtons).find(btn => btn.classList.contains('selected'));
        const selectedLevel = Array.from(levelButtons).find(btn => btn.classList.contains('selected'));

        if (selectedSport && selectedLevel) {
            const sportText = selectedSport.textContent.trim();
            const levelText = selectedLevel.textContent.trim();

            // Navigate based on selections
            if (sportText === 'Soccer' && levelText === 'Professional') {
                window.location.href = 'soccer-pro.html';
            }
            // Add more routes here as needed
        }
    });
});

