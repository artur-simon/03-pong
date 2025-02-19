let playerPaddle;
let aiPaddle;
let ball;
let playerScore = 0;
let aiScore = 0;
let gameState = 'START'; // Possible states: 'START', 'PLAYING', 'GAME_OVER'
let lastSpacePress = 0;
const SPACE_COOLDOWN = 500; // 500ms cooldown for space bar
let paddleHitSound;
let wallHitSound;
let scoreSound;
let bgMusic;
let musicStarted = false;
// E minor pentatonic scale frequencies
const SCALE = {
    E3: 164.81,
    G3: 196.00,
    A3: 220.00,
    B3: 246.94,
    D4: 293.66,
    E4: 329.63,
    G4: 392.00,
    A4: 440.00,
    B4: 493.88
};
// Convert object to array for easy access
const NOTES = Object.values(SCALE);
let melodyPattern = [];
let currentNote = 0;
let lastNoteTime = 0;
const NOTE_DURATION = 150;
const NOTE_INTERVAL = 200;
let patternLength = 16; // Length of generated pattern

function setup() {
    const canvas = createCanvas(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    canvas.parent('game-container');
    
    // Initialize game objects
    playerPaddle = {
        x: CONFIG.PADDLE_MARGIN,
        y: CONFIG.CANVAS_HEIGHT / 2,
        width: CONFIG.PADDLE_WIDTH,
        height: CONFIG.PADDLE_HEIGHT
    };
    
    aiPaddle = {
        x: CONFIG.CANVAS_WIDTH - CONFIG.PADDLE_MARGIN - CONFIG.PADDLE_WIDTH,
        y: CONFIG.CANVAS_HEIGHT / 2,
        width: CONFIG.PADDLE_WIDTH,
        height: CONFIG.PADDLE_HEIGHT
    };
    
    resetBall();
}

function preload() {
    // Create simple oscillator-based sounds
    paddleHitSound = new p5.Oscillator('square');
    wallHitSound = new p5.Oscillator('square');
    scoreSound = new p5.Oscillator('square');
    bgMusic = {
        melody: new p5.Oscillator('triangle'),
        bass: new p5.Oscillator('sine')
    };
    
    // Set initial frequencies for different sounds
    paddleHitSound.freq(400);
    wallHitSound.freq(200);
    scoreSound.freq(150);
}

function draw() {
    background(CONFIG.BACKGROUND_COLOR);
    
    switch(gameState) {
        case 'START':
            displayStartMessage();
            if (canPressSpace() && keyIsPressed && key === ' ') {
                gameState = 'PLAYING';
                lastSpacePress = millis();
            }
            break;
            
        case 'PLAYING':
            handlePlayerMovement();
            updateAI();
            updateBall();
            drawPaddles();
            drawBall();
            updateScoreDisplay();
            updateBackgroundMusic();
            checkWinCondition();
            break;
            
        case 'GAME_OVER':
            displayGameOver();
            if (canPressSpace() && keyIsPressed && key === ' ') {
                resetGame();
                lastSpacePress = millis();
            }
            break;
    }
}

function displayStartMessage() {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text('Press SPACE to start', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
}

function handlePlayerMovement() {
    if (keyIsDown(UP_ARROW)) {
        playerPaddle.y = max(0, playerPaddle.y - CONFIG.PADDLE_SPEED);
    }
    if (keyIsDown(DOWN_ARROW)) {
        playerPaddle.y = min(CONFIG.CANVAS_HEIGHT - CONFIG.PADDLE_HEIGHT, 
                            playerPaddle.y + CONFIG.PADDLE_SPEED);
    }
}

function updateAI() {
    const targetY = ball.y - CONFIG.PADDLE_HEIGHT / 2;
    const moveSpeed = CONFIG.PADDLE_SPEED * 0.85; // Make AI slightly slower than player
    
    if (aiPaddle.y < targetY) {
        aiPaddle.y = min(CONFIG.CANVAS_HEIGHT - CONFIG.PADDLE_HEIGHT, 
                         aiPaddle.y + moveSpeed);
    } else if (aiPaddle.y > targetY) {
        aiPaddle.y = max(0, aiPaddle.y - moveSpeed);
    }
}

function updateBall() {
    ball.x += ball.speedX;
    ball.y += ball.speedY;
    
    // Bounce off top and bottom
    if (ball.y <= 0 || ball.y >= CONFIG.CANVAS_HEIGHT - CONFIG.BALL_SIZE) {
        ball.speedY *= -1;
        playSound(wallHitSound);
    }
    
    // Check paddle collisions
    if (checkPaddleCollision(playerPaddle)) {
        ball.speedX *= -1.1;
        ball.speedY = (ball.y - (playerPaddle.y + CONFIG.PADDLE_HEIGHT/2)) * 0.2;
        playSound(paddleHitSound);
    } else if (checkPaddleCollision(aiPaddle)) {
        ball.speedX *= -1.1;
        ball.speedY = (ball.y - (aiPaddle.y + CONFIG.PADDLE_HEIGHT/2)) * 0.2;
        playSound(paddleHitSound);
    }
    
    // Score points
    if (ball.x <= 0 || ball.x >= CONFIG.CANVAS_WIDTH) {
        playSound(scoreSound);
        if (ball.x <= 0) {
            aiScore++;
        } else {
            playerScore++;
        }
        resetBall();
    }
}

function checkPaddleCollision(paddle) {
    return ball.x < paddle.x + paddle.width &&
           ball.x + CONFIG.BALL_SIZE > paddle.x &&
           ball.y < paddle.y + paddle.height &&
           ball.y + CONFIG.BALL_SIZE > paddle.y;
}

function drawPaddles() {
    fill(CONFIG.PADDLE_COLOR);
    rect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height);
    rect(aiPaddle.x, aiPaddle.y, aiPaddle.width, aiPaddle.height);
}

function drawBall() {
    fill(CONFIG.BALL_COLOR);
    rect(ball.x, ball.y, CONFIG.BALL_SIZE, CONFIG.BALL_SIZE);
}

function resetBall() {
    ball = {
        x: CONFIG.CANVAS_WIDTH / 2,
        y: CONFIG.CANVAS_HEIGHT / 2,
        speedX: (random() > 0.5 ? 1 : -1) * CONFIG.BALL_SPEED,
        speedY: random(-CONFIG.BALL_SPEED, CONFIG.BALL_SPEED)
    };
}

function checkWinCondition() {
    if (playerScore >= CONFIG.WINNING_SCORE || aiScore >= CONFIG.WINNING_SCORE) {
        gameState = 'GAME_OVER';
    }
}

function playSound(oscillator) {
    oscillator.start();
    oscillator.amp(0.5, 0); // Set volume to 0.5
    oscillator.amp(0, 0.1); // Fade out over 0.1 seconds
    setTimeout(() => oscillator.stop(), 100); // Stop after 100ms
}

function canPressSpace() {
    return millis() - lastSpacePress >= SPACE_COOLDOWN;
}

function resetGame() {
    playerScore = 0;
    aiScore = 0;
    resetBall();
    gameState = 'PLAYING';
}

function updateScoreDisplay() {
    document.getElementById('player-score').textContent = playerScore;
    document.getElementById('ai-score').textContent = aiScore;
}

function displayGameOver() {
    const winner = playerScore > aiScore ? 'Player' : 'AI';
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text(`${winner} wins!\nPress SPACE to restart`, 
         CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
}

function generateMelodyPattern() {
    let pattern = [];
    let baseNote = 4; // Start with E4
    
    for (let i = 0; i < patternLength; i++) {
        if (i % 8 === 0) {
            // Start of phrase, return to base note
            pattern.push(NOTES[baseNote]);
        } else if (i % 4 === 0) {
            // Every 4th note, play something from middle register
            pattern.push(NOTES[baseNote + (Math.random() > 0.5 ? 1 : -1)]);
        } else if (i % 2 === 0) {
            // Every 2nd note, wider range of notes
            let range = Math.floor(Math.random() * 5) - 2; // -2 to +2
            pattern.push(NOTES[Math.max(0, Math.min(NOTES.length - 1, baseNote + range))]);
        } else {
            // Other notes, even wider range but weighted towards center
            let range = Math.floor(Math.random() * 7) - 3; // -3 to +3
            if (Math.random() > 0.7) { // 30% chance of bigger jump
                range = range * 2;
            }
            pattern.push(NOTES[Math.max(0, Math.min(NOTES.length - 1, baseNote + range))]);
        }
    }
    return pattern;
}

function generateBassPattern(melodyPattern) {
    let pattern = [];
    // Bass follows a simpler pattern using lower octave notes
    for (let i = 0; i < melodyPattern.length; i++) {
        if (i % 8 === 0) {
            pattern.push(SCALE.E3);
        } else if (i % 8 === 4) {
            pattern.push(SCALE.A3);
        } else if (i % 4 === 2) {
            pattern.push(SCALE.G3);
        } else {
            pattern.push(0); // Rest
        }
    }
    return pattern;
}

function updateBackgroundMusic() {
    if (gameState === 'PLAYING') {
        let currentTime = millis();
        
        // Start music if not started
        if (!musicStarted) {
            bgMusic.melody.start();
            bgMusic.bass.start();
            bgMusic.melody.amp(0.1);
            bgMusic.bass.amp(0.05);
            musicStarted = true;
            melodyPattern = generateMelodyPattern();
            bassPattern = generateBassPattern(melodyPattern);
        }
        
        // Update notes
        if (currentTime - lastNoteTime >= NOTE_INTERVAL) {
            // Update melody with smooth transitions
            bgMusic.melody.freq(melodyPattern[currentNote], 0.1);
            bgMusic.melody.amp(0.1, 0.05);
            setTimeout(() => bgMusic.melody.amp(0.02, 0.1), NOTE_DURATION * 0.8);
            
            // Update bass if there's a note (not a rest)
            if (bassPattern[currentNote] > 0) {
                bgMusic.bass.freq(bassPattern[currentNote], 0.1);
                bgMusic.bass.amp(0.05, 0.05);
                setTimeout(() => bgMusic.bass.amp(0.01, 0.1), NOTE_DURATION * 0.8);
            }
            
            currentNote = (currentNote + 1) % patternLength;
            
            // Generate new patterns when current one ends
            if (currentNote === 0) {
                melodyPattern = generateMelodyPattern();
                bassPattern = generateBassPattern(melodyPattern);
            }
            
            lastNoteTime = currentTime;
        }
    } else if (musicStarted) {
        bgMusic.melody.amp(0, 0.1);
        bgMusic.bass.amp(0, 0.1);
        setTimeout(() => {
            bgMusic.melody.stop();
            bgMusic.bass.stop();
            musicStarted = false;
        }, 100);
    }
}
