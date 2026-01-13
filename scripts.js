// HerGrowth JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('HerGrowth page loaded successfully!');
    console.log('CSS and JavaScript files are connected.');

    // Handle button selection for sports section
    const sportButtons = document.querySelectorAll('.sport-buttons .pill-button');
    sportButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove selected class from all sport buttons
            sportButtons.forEach(btn => btn.classList.remove('selected'));
            // Add selected class to clicked button
            this.classList.add('selected');
        });
    });

    // Handle button selection for level section
    const levelButtons = document.querySelectorAll('.level-buttons .pill-button');
    levelButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove selected class from all level buttons
            levelButtons.forEach(btn => btn.classList.remove('selected'));
            // Add selected class to clicked button
            this.classList.add('selected');
        });
    });
});

