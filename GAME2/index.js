// --- Global Game State Variables ---
    var buttonColors = ["red", "blue", "green", "yellow"]; // Available button colors
    var gamePattern = []; // Sequence generated by the game
    var userClickedPattern = []; // Sequence clicked by the user

    var level = 0; // Current game level
    var started = false; // Flag to check if the game has started
    var points = 0; // Current score for the game
    var highScore = localStorage.getItem("simonHighScore") || 0; // High score stored locally

    var sequenceSpeed = 600; // Default speed in ms (faster means harder). Used for button flash duration.
    var gameTimeout; // Variable to store setTimeout for nextSequence delay
    var isPaused = false; // Flag to indicate if the game is paused
    var isMuted = false; // Flag to indicate if sounds are muted

    // --- Tone.js Synthesizers for Sound Effects ---
    // Initialize Tone.Synth instances for each button color and wrong sound
    let synths = {};
    const notes = {
        "red": "C4",
        "green": "E4",
        "blue": "G4",
        "yellow": "A4",
        "wrong": "F#2", // A low, dissonant tone for wrong answers
        "start": "C5" // New note for start button sound
    };

    function initializeSynths() {
        for (const color in notes) {
            if (!synths[color]) {
                synths[color] = new Tone.Synth().toDestination();
            }
        }
    }

    // Call this once on document ready to create the synths
    $(document).ready(initializeSynths);

    // Play sound using Tone.js
    function playSound(name) {
        if (isMuted) return; // Do not play sound if muted

        // Tone.js requires a user gesture to start audio context
        if (Tone.context.state !== 'running') {
            Tone.start().then(() => {
                // If context was suspended, try playing again after it's running
                if (synths[name] && notes[name]) {
                    synths[name].triggerAttackRelease(notes[name], "8n");
                }
            }).catch(e => console.error("Error starting Tone.js context:", e));
        } else {
            if (synths[name] && notes[name]) {
                synths[name].triggerAttackRelease(notes[name], "8n");
            }
        }
    }


    // --- Initial Setup ---
    $(document).ready(function() {
        $("#high-score").text(highScore); // Display high score on load
        $("#medium").addClass("active"); // Set initial active difficulty to Medium
        showStartMenu(); // Show the start menu initially
    });

    // --- UI State Management ---
    function showStartMenu() {
        $("#start-menu").removeClass("hidden").addClass("flex-center");
        $("#game-area").removeClass("flex-center").addClass("hidden");
        $("#pause-button").hide();
    }

    function showGameArea() {
        $("#start-menu").removeClass("flex-center").addClass("hidden");
        $("#game-area").removeClass("hidden").addClass("flex-center");
        $("#pause-button").show();
    }

    // --- Event Listeners ---

    // Start Game button click handler
    $("#start-button").click(function() {
        if (!started) {
            playSound("start"); // Play sound on start game button click
            startGame();
        }
    });

    // Button clicks handler for game play
    $(".btn").click(function() {
        if (started && !isPaused) { // Only allow clicks if the game has started and not paused
            var userChosenColor = $(this).attr("id");
            userClickedPattern.push(userChosenColor);

            playSound(userChosenColor);
            animatePress(userChosenColor); // Visual feedback for user's click

            checkAnswer(userClickedPattern.length - 1);
        }
    });

    // Difficulty selection buttons handler
    $(".difficulty-btn").click(function() {
        // Remove 'active' class from all difficulty buttons
        $(".difficulty-btn").removeClass("active");
        // Add 'active' class to the clicked button
        $(this).addClass("active");

        var difficulty = $(this).attr("id");
        switch (difficulty) {
            case "easy":
                sequenceSpeed = 800; // Slower sequence
                break;
            case "medium":
                sequenceSpeed = 600; // Default speed
                break;
            case "hard":
                sequenceSpeed = 400; // Faster sequence
                break;
            default:
                sequenceSpeed = 600; // Fallback to medium
        }

        // If difficulty changes while game is not started, reset the main text
        if (!started) {
            $("#start-main-text").text("Boost Your Memory"); // Reset main text for start screen
        }
        startOver(); // Reset game state if difficulty changes during a game (or just to apply settings)
    });

    // Game Over Modal: Restart Button
    $("#restartButton").click(function() {
        $("#gameOverModal").hide(); // Hide the modal
        startGame(); // Start a new game
    });

    // Game Over Modal: Close Button
    $("#gameOverModal .close-button").click(function() {
        $("#gameOverModal").hide(); // Hide the modal
        startOver(); // Reset game to start menu
    });

    // Pause Button Handler
    $("#pause-button").click(function() {
        if (started) {
            togglePause();
        }
    });

    // Pause Modal: Resume Button
    $("#resumeButton").click(function() {
        togglePause(); // Resume the game
    });

    // Pause Modal: Quit Game Button
    $("#quitGameButton").click(function() {
        $("#pauseModal").hide(); // Hide the modal
        startOver(); // Quit and go to start menu
    });

    // Instructions Button Handler
    $("#instructions-button").click(function() {
        $("#instructionsModal").css("display", "flex"); // Show the instructions modal
    });

    // Instructions Modal: Close Button
    $("#instructionsModal .close-button, #closeInstructionsButton").click(function() {
        $("#instructionsModal").hide(); // Hide the instructions modal
    });

    // Mute Button Handler
    $("#mute-button").click(function() {
        isMuted = !isMuted;
        $(this).toggleClass("muted", isMuted);
        $(this).find(".icon-mute").text(isMuted ? "🔇" : "🔊"); // Change icon
    });


    // --- Game Functions ---

    // Starts the game
    function startGame() {
        started = true;
        isPaused = false;
        $("#pause-button").removeClass("paused").find(".icon-pause").text("⏸️"); // Reset pause button state
        level = 0; // Ensure level is 0 when starting a new game
        gamePattern = []; // Clear previous game pattern
        userClickedPattern = []; // Clear previous user pattern
        points = 0;
        $("#points").text(points);
        showGameArea(); // Transition to game area
        $("#main-text").text("Level " + level); // Display initial level
        $("#start-button").hide(); // Hide the start button
        $(".difficulty-selection").hide(); // Hide difficulty during gameplay

        clearTimeout(gameTimeout); // Clear any pending sequence before starting new game

        setTimeout(function() {
            nextSequence(); // Start the first sequence after a short delay
        }, 500); // Give a moment before the first sequence starts
    }

    // Generates the next sequence in the game
    function nextSequence() {
        userClickedPattern = []; // Reset user's pattern for the new level
        level++;
        $("#main-text").text("Level " + level);
        points = ((level-1) * 10);
        $("#points").text(points);

        var randomNumber = Math.floor(Math.random() * 4);
        var randomChosenColor = buttonColors[randomNumber];
        gamePattern.push(randomChosenColor);

        // Animate the button for the game sequence
        $("#" + randomChosenColor)
            .fadeIn(sequenceSpeed / 2)
            .fadeOut(sequenceSpeed / 2)
            .fadeIn(sequenceSpeed / 2);

        playSound(randomChosenColor);
    }

    // Animates a button press (for user clicks)
    function animatePress(currentColor) {
        $("#" + currentColor).addClass("pressed");
        setTimeout(function() {
            $("#" + currentColor).removeClass("pressed");
        }, 150); // Short duration for quick visual feedback
    }

    // Checks the user's answer against the game pattern
    function checkAnswer(currentLevelIndex) {
        if (gamePattern[currentLevelIndex] === userClickedPattern[currentLevelIndex]) {
            // Add correct flash effect to the clicked button
            $("#" + userClickedPattern[currentLevelIndex]).addClass("correct-flash");
            setTimeout(function() {
                $("#" + userClickedPattern[currentLevelIndex]).removeClass("correct-flash");
            }, 100);

            if (gamePattern.length === userClickedPattern.length) {
                // User completed the sequence, move to next level
                gameTimeout = setTimeout(function() {
                    nextSequence();
                }, 1000); // Delay before showing the next sequence
            }
        } else {
            playSound("wrong");

            // Apply game over visual effect to body
            $("body").addClass("gameOver");
            setTimeout(function() {
                $("body").removeClass("gameOver");
            }, 200);

            // Update high score if current points are higher
            if (points > highScore) {
                highScore = points;
                localStorage.setItem("simonHighScore", highScore);
                $("#high-score").text(highScore); // Update high score on main screen
            }

            // Display Game Over modal
            $("#finalLevel").text(level);
            $("#finalPoints").text(points);
            $("#modalHighScore").text(highScore); // Display high score in modal
            $("#gameOverModal").css("display", "flex"); // Show the modal
            started = false; // Game is over
            clearTimeout(gameTimeout); // Clear any pending sequence
        }
    }

    // Toggle Pause Functionality
    function togglePause() {
        isPaused = !isPaused;
        $("#pause-button").toggleClass("paused", isPaused);
        $("#pause-button").find(".icon-pause").text(isPaused ? "▶️" : "⏸️"); // Toggle icon

        if (isPaused) {
            $("#pauseModal").css("display", "flex"); // Show pause modal
            clearTimeout(gameTimeout); // Stop any pending sequence timer
        } else {
            $("#pauseModal").hide(); // Hide pause modal
            // If game was active, resume next sequence or wait for user input
            if (started && userClickedPattern.length < gamePattern.length) {
                // Do nothing, wait for user input
            } else if (started && userClickedPattern.length === gamePattern.length) {
                // If user just completed a sequence before pausing, trigger next sequence
                 gameTimeout = setTimeout(function() {
                    nextSequence();
                }, 1000);
            }
        }
    }


    // Resets game variables and UI to initial state, returning to start menu
    function startOver() {
        level = 0;
        gamePattern = [];
        userClickedPattern = [];
        started = false;
        isPaused = false; // Ensure game is not paused state
        $("#pause-button").removeClass("paused").hide().find(".icon-pause").text("⏸️"); // Reset pause button state and hide it
        points = 0;
        $("#points").text(points); // Reset displayed points

        clearTimeout(gameTimeout); // Clear any pending timeouts

        $("#main-text").text("Level " + level); // Reset main game text
        showStartMenu(); // Return to the start menu
        $("#start-main-text").text("Boost Your Memory"); // Reset start menu title if it changed
        $("#start-button").show(); // Ensure start button is visible on start menu
        $(".difficulty-selection").show(); // Ensure difficulty selection is visible
    }