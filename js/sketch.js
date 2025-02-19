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
