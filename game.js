// === NexusGame: Age of Wars 2 Style ===
// Все изображения должны лежать в папке images/ согласно структуре

// --- Глобальные переменные ---
let canvas, ctx;
let gold = 150;
let currentAge = 1;
let enemyCurrentAge = 1;
const MAX_AGE = 3;
let gameIsOver = false;
let playerWon = false;
let gameOverMessage = "";
const playerUnits = [];
const enemyUnits = [];
const projectiles = [];
let goldDisplay, playerBaseHpDisplay, enemyBaseHpDisplay, unitButtonsContainer, ageUpButtonElement;
const images = {};
let imagesToLoadCount = 0;
let imagesLoadedCount = 0;
let allImagesLoaded = false;
const playerSpawnQueue = [];
let playerSpawnTimer = 0;
const PLAYER_SPAWN_INTERVAL = 300;
const SPAWN_POINT_OFFSET = 5;
const SPAWN_AREA_WIDTH = 40;
let enemyAgeUpTimer = 0;
const ENEMY_AGE_UP_INTERVAL = 30000;
let enemyPseudoGold = 0;
let enemySpawnTimer = 0;
const ENEMY_AI_SPAWN_INTERVAL = 8000;
let goldIncomeTimer = 0;
const GOLD_INCOME_INTERVAL = 100; // мс
const GOLD_INCOME_AMOUNT = 1;
const BASE_ATTACK_DAMAGE = 2;

// --- Конфиг эпох и юнитов ---
const AGE_CONFIG = {
  1: {
    baseHp: 100, upgradeCost: 250,
    units: {
      'barbarian': { name: 'Barbarian', cost: 50, hp: 60, attack: 10, speed: 0.8, range: 1, projectile: null, color: 'sandybrown', imgPathPlayer: 'images/barbarian_player.png', imgPathEnemy: 'images/barbarian_enemy.png', width: 52, height: 85 },
      'thrower':   { name: 'Thrower', cost: 70, hp: 35, attack: 12, speed: 0.6, range: 120, projectile: 'stone', attackSpeed: 1800, color: 'peru', imgPathPlayer: 'images/thrower_player.png', imgPathEnemy: 'images/thrower_enemy.png', width: 52, height: 85 }
    },
    baseImgPathPlayer: 'images/base_age1_player.png', baseImgPathEnemy: 'images/base_age1_enemy.png'
  },
  2: {
    baseHp: 200, upgradeCost: 500,
    units: {
      'spearman': { name: 'Spearman', cost: 80, hp: 50, attack: 18, speed: 0.7, range: 40, projectile: null, color: 'silver', imgPathPlayer: 'images/spearman_player.png', imgPathEnemy: 'images/spearman_enemy.png', width: 60, height: 94 },
      'swordsman':{ name: 'Swordsman', cost: 60, hp: 80, attack: 15, speed: 0.7, range: 1, projectile: null, color: 'lightblue', imgPathPlayer: 'images/swordsman_player.png', imgPathEnemy: 'images/swordsman_enemy.png', width: 52, height: 85 },
      'archer':   { name: 'Archer', cost: 70, hp: 45, attack: 15, speed: 0.6, range: 150, projectile: 'arrow', attackSpeed: 1500, color: 'lightgreen', imgPathPlayer: 'images/archer_player.png', imgPathEnemy: 'images/archer_enemy.png', width: 52, height: 85 }
    },
    baseImgPathPlayer: 'images/base_age2_player.png', baseImgPathEnemy: 'images/base_age2_enemy.png'
  },
  3: {
    baseHp: 300, upgradeCost: Infinity,
    units: {
      'armored':  { name: 'Armored', cost: 80, hp: 150, attack: 20, speed: 0.5, range: 1, projectile: null, color: 'dimgray', imgPathPlayer: 'images/armored_player.png', imgPathEnemy: 'images/armored_enemy.png', width: 68, height: 102 },
      'knifeman': { name: 'Knifeman', cost: 50, hp: 60, attack: 25, speed: 0.9, range: 1, projectile: null, color: 'crimson', imgPathPlayer: 'images/knifeman_player.png', imgPathEnemy: 'images/knifeman_enemy.png', width: 52, height: 85 },
      'pistoleer':{ name: 'Pistoleer', cost: 90, hp: 55, attack: 30, speed: 0.7, range: 180, projectile: 'bullet', attackSpeed: 1000, color: 'gold', imgPathPlayer: 'images/pistoleer_player.png', imgPathEnemy: 'images/pistoleer_enemy.png', width: 52, height: 85 },
      'rifleman': { name: 'Rifleman', cost: 120, hp: 70, attack: 40, speed: 0.6, range: 200, projectile: 'bullet_burst', attackSpeed: 800, color: 'olive', imgPathPlayer: 'images/rifleman_player.png', imgPathEnemy: 'images/rifleman_enemy.png', width: 52, height: 85 }
    },
    baseImgPathPlayer: 'images/base_age3_player.png', baseImgPathEnemy: 'images/base_age3_enemy.png'
  }
};
const PROJECTILE_CONFIG = {
  'stone': { speed: 4, width: 10, height: 10, color: 'rgba(120,120,120,0.6)' },
  'arrow': { speed: 6, width: 14, height: 4, color: 'rgba(60,120,220,0.6)' },
  'bullet':{ speed: 8, width: 10, height: 10, color: 'rgba(220,220,60,0.6)' },
  'bullet_burst':{ speed: 8, width: 10, height: 10, color: 'rgba(160,60,220,0.6)' }
};
const ARCHER_MAX_ALLIES_TO_SHOOT_THROUGH = 2;

// --- Загрузка изображений ---
function loadImage(path, key) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      images[key] = img;
      imagesLoadedCount++;
      if (imagesLoadedCount === imagesToLoadCount) allImagesLoaded = true;
      resolve();
    };
    img.onerror = () => {
      imagesLoadedCount++;
      if (imagesLoadedCount === imagesToLoadCount) allImagesLoaded = true;
      resolve();
    };
    img.src = path;
  });
}
async function loadAllGameImages() {
  const uniqueImagePaths = new Set();
  for (const ageKey in AGE_CONFIG) {
    const ageData = AGE_CONFIG[ageKey];
    if (ageData.baseImgPathPlayer) uniqueImagePaths.add(ageData.baseImgPathPlayer);
    if (ageData.baseImgPathEnemy) uniqueImagePaths.add(ageData.baseImgPathEnemy);
    for (const unitType in ageData.units) {
      const unitData = ageData.units[unitType];
      if (unitData.imgPathPlayer) uniqueImagePaths.add(unitData.imgPathPlayer);
      if (unitData.imgPathEnemy) uniqueImagePaths.add(unitData.imgPathEnemy);
    }
  }
  imagesToLoadCount = uniqueImagePaths.size;
  imagesLoadedCount = 0;
  allImagesLoaded = false;
  if (imagesToLoadCount === 0) { allImagesLoaded = true; return; }
  await Promise.all(Array.from(uniqueImagePaths).map(path => loadImage(path, path)));
}

// --- Классы ---
class Base {
  constructor(x, y, hp, isPlayer) {
    this.x = x;
    this.y = y - 136; // 80 * 1.7
    this.hp = hp;
    this.maxHp = hp;
    this.isPlayer = isPlayer;
    this.width = 136; // 80 * 1.7
    this.height = 136; // 80 * 1.7
    this.age = isPlayer ? currentAge : enemyCurrentAge;
    this.imgPath = isPlayer ? AGE_CONFIG[this.age].baseImgPathPlayer : AGE_CONFIG[this.age].baseImgPathEnemy;
    this.image = images[this.imgPath];
  }
  setHpForAge(age) {
    this.hp = AGE_CONFIG[age].baseHp;
    this.maxHp = AGE_CONFIG[age].baseHp;
    this.age = age;
    this.imgPath = this.isPlayer ? AGE_CONFIG[age].baseImgPathPlayer : AGE_CONFIG[age].baseImgPathEnemy;
    this.image = images[this.imgPath];
  }
  draw() {
    if (this.image) ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    else {
      ctx.fillStyle = this.isPlayer ? '#4a4' : '#a44';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.hp} / ${this.maxHp}`, this.x + this.width/2, this.y + this.height + 20);
  }
}
class Unit {
  constructor(typeKey, isPlayer, x, y) {
    const age = isPlayer ? currentAge : enemyCurrentAge;
    const data = AGE_CONFIG[age].units[typeKey];
    this.typeKey = typeKey;
    this.isPlayer = isPlayer;
    this.x = x;
    this.y = y;
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.attack = data.attack;
    this.speed = data.speed;
    this.range = data.range;
    this.projectile = data.projectile;
    this.attackSpeed = data.attackSpeed || 1200;
    this.color = data.color;
    this.width = data.width;
    this.height = data.height;
    this.imgPath = isPlayer ? data.imgPathPlayer : data.imgPathEnemy;
    this.image = images[this.imgPath];
    this.target = null;
    this.lastAttackTime = 0;
    this.isAlive = true;
    this.isAttackingBase = false;
  }
  draw() {
    if (this.image) {
      if (!this.isPlayer) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y - this.height / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
      } else {
        ctx.drawImage(this.image, this.x, this.y - this.height, this.width, this.height);
      }
    } else {
      if (!this.isPlayer) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y - this.height / 2);
        ctx.scale(-1, 1);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
      } else {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
      }
    }
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.hp, this.x + this.width/2, this.y - this.height - 4);
  }
}
class Projectile {
  constructor(type, x, y, dir, target, isPlayer, damage) {
    const cfg = PROJECTILE_CONFIG[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.target = target;
    this.isPlayer = isPlayer;
    this.width = cfg.width;
    this.height = cfg.height;
    this.color = cfg.color;
    this.isAlive = true;
    this.damage = damage;
    this.speed = cfg.speed * (isPlayer ? 1 : -1);
  }
  update() {
    this.x += this.speed;
    if (this.target && Math.abs(this.x - this.target.x) < 20) {
      this.isAlive = false;
      this.target.hp -= this.damage;
    }
    if (this.x < 0 || this.x > canvas.width) this.isAlive = false;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = this.color;
    ctx.strokeStyle = 'transparent';
    ctx.lineWidth = 0;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }
}

// --- UI и управление ---
function updateUnitButtons() {
  unitButtonsContainer.innerHTML = '';
  const units = AGE_CONFIG[currentAge].units;
  for (const typeKey in units) {
    const data = units[typeKey];
    const btn = document.createElement('button');
    btn.textContent = `${data.name} (${data.cost})`;
    btn.dataset.unitType = typeKey;
    if (gold < data.cost) {
      btn.style.opacity = '0.6';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
    unitButtonsContainer.appendChild(btn);
  }
}
function updateAgeUpButtonText() {
  if (currentAge < MAX_AGE) {
    ageUpButtonElement.textContent = `Advance to Age ${currentAge+1} (${AGE_CONFIG[currentAge].upgradeCost} gold)`;
    if (gold < AGE_CONFIG[currentAge].upgradeCost) {
      ageUpButtonElement.style.opacity = '0.6';
      ageUpButtonElement.style.cursor = 'not-allowed';
    } else {
      ageUpButtonElement.style.opacity = '1';
      ageUpButtonElement.style.cursor = 'pointer';
    }
  } else {
    ageUpButtonElement.textContent = 'Max Age Reached';
    ageUpButtonElement.style.opacity = '0.6';
    ageUpButtonElement.style.cursor = 'not-allowed';
  }
}
function setupAgeUpButton() {
  ageUpButtonElement.disabled = false;
  if (!ageUpButtonElement) {
    alert('Age up button (id="ageUpButton") not found in DOM!');
    return;
  }
  ageUpButtonElement.onclick = () => {
    if (currentAge < MAX_AGE && gold >= AGE_CONFIG[currentAge].upgradeCost) {
      gold -= AGE_CONFIG[currentAge].upgradeCost;
      currentAge++;
      playerBase.setHpForAge(currentAge);
      updateUnitButtons();
      updateAgeUpButtonText();
      playerBase.imgPath = AGE_CONFIG[currentAge].baseImgPathPlayer;
      playerBase.image = images[playerBase.imgPath];
      playerSpawnQueue.length = 0;
      for (const unit of playerUnits) {
        const data = AGE_CONFIG[currentAge].units[unit.typeKey];
        if (data) {
          unit.imgPath = data.imgPathPlayer;
          unit.image = images[unit.imgPath];
        }
      }
    } else if (currentAge < MAX_AGE && gold < AGE_CONFIG[currentAge].upgradeCost) {
      alert('Not enough gold to advance to the next age!');
    }
  };
  updateAgeUpButtonText();
}
function addUnitToPlayerQueue(typeKey) {
  const unitData = AGE_CONFIG[currentAge].units[typeKey];
  if (gold >= unitData.cost) {
    gold -= unitData.cost;
    playerSpawnQueue.push(typeKey);
  } else {
    alert('Not enough gold to hire!');
  }
}
function isSpawnPointClear(spawnX, unitWidth, existingUnits) {
  return !existingUnits.some(u => Math.abs(u.x - spawnX) < unitWidth + 5);
}
function spawnUnit(typeKey, isPlayer, spawnX) {
  const y = canvas.height - 10;
  const unit = new Unit(typeKey, isPlayer, spawnX, y);
  (isPlayer ? playerUnits : enemyUnits).push(unit);
}
function processPlayerSpawnQueue(deltaTime) {
  if (playerSpawnQueue.length === 0) return;
  playerSpawnTimer += deltaTime;
  if (playerSpawnTimer >= PLAYER_SPAWN_INTERVAL) {
    const typeKey = playerSpawnQueue.shift();
    const unitData = AGE_CONFIG[currentAge].units[typeKey];
    const spawnX = SPAWN_POINT_OFFSET + Math.random() * SPAWN_AREA_WIDTH;
    if (isSpawnPointClear(spawnX, unitData.width, playerUnits)) {
      spawnUnit(typeKey, true, spawnX);
      playerSpawnTimer = 0;
    } else {
      playerSpawnQueue.unshift(typeKey);
      playerSpawnTimer = 0;
    }
  }
}
function updateEnemyAI(deltaTime) {
  enemyPseudoGold += deltaTime * (10 + enemyCurrentAge * 2) / 1000;
  if (enemyCurrentAge < MAX_AGE) {
    if (enemyPseudoGold >= AGE_CONFIG[enemyCurrentAge].upgradeCost) {
      enemyPseudoGold -= AGE_CONFIG[enemyCurrentAge].upgradeCost;
      enemyCurrentAge++;
      enemyBase.setHpForAge(enemyCurrentAge);
    }
  }
  enemySpawnTimer += deltaTime;
  if (enemySpawnTimer >= ENEMY_AI_SPAWN_INTERVAL) {
    const units = Object.keys(AGE_CONFIG[enemyCurrentAge].units);
    const typeKey = units[Math.floor(Math.random() * units.length)];
    const unitData = AGE_CONFIG[enemyCurrentAge].units[typeKey];
    if (enemyPseudoGold >= unitData.cost) {
      const spawnX = canvas.width - SPAWN_POINT_OFFSET - Math.random() * SPAWN_AREA_WIDTH - unitData.width;
      if (isSpawnPointClear(spawnX, unitData.width, enemyUnits)) {
        spawnUnit(typeKey, false, spawnX);
        enemyPseudoGold -= unitData.cost;
        enemySpawnTimer = 0;
      }
    }
  }
}
function updateGame(deltaTime) {
  processPlayerSpawnQueue(deltaTime);
  updateEnemyAI(deltaTime);
  // Units move and attack
  for (const arr of [playerUnits, enemyUnits]) {
    for (let i = 0; i < arr.length; i++) {
      const unit = arr[i];
      if (!unit.isAlive) continue;
      const enemies = unit.isPlayer ? enemyUnits : playerUnits;
      let target = null;
      for (const e of enemies) {
        if (!e.isAlive) continue;
        if (unit.range <= 2) {
          // Ближний бой: прямое пересечение спрайтов
          if (unit.x < e.x + e.width && unit.x + unit.width > e.x) {
            target = e; break;
          }
        } else {
          // Дальний бой: по range
          if (Math.abs(unit.x - e.x) < unit.range && Math.abs(unit.y - e.y) < 40) {
            target = e; break;
          }
        }
      }
      if (!target) {
        // Check base
        const base = unit.isPlayer ? enemyBase : playerBase;
        if (Math.abs(unit.x - base.x) < unit.range + base.width && Math.abs(unit.y - (base.y + base.height/2)) < 60) {
          unit.isAttackingBase = true;
          target = base;
        } else {
          unit.isAttackingBase = false;
        }
      }
      if (target) {
        // Attack
        if (Date.now() - unit.lastAttackTime > (unit.attackSpeed || 1200)) {
          if (unit.projectile) {
            // Дальний бой — создаём снаряд
            projectiles.push(new Projectile(
              unit.projectile,
              unit.x + (unit.isPlayer ? unit.width : -10),
              unit.y - unit.height / 2,
              unit.isPlayer ? 1 : -1,
              target,
              unit.isPlayer,
              unit.attack
            ));
          } else {
            // Ближний бой
            if (target instanceof Base) {
              target.hp -= BASE_ATTACK_DAMAGE;
            } else {
              target.hp -= unit.attack;
            }
          }
          unit.lastAttackTime = Date.now();
        }
      } else {
        // Move
        let canMove = true;
        // Проверка на столкновение с ближайшим врагом
        const enemyArr = unit.isPlayer ? enemyUnits : playerUnits;
        for (let j = 0; j < enemyArr.length; j++) {
          const enemy = enemyArr[j];
          if (!enemy.isAlive) continue;
          // Проверяем пересечение по X
          if (
            unit.x < enemy.x + enemy.width &&
            unit.x + unit.width > enemy.x
          ) {
            // Если юнит движется вправо (игрок) и враг справа, или наоборот
            if (unit.isPlayer && enemy.x > unit.x) {
              canMove = false; break;
            }
            if (!unit.isPlayer && enemy.x < unit.x) {
              canMove = false; break;
            }
          }
        }
        // Проверка на упор в вражескую базу (но не в свою!)
        if (unit.isPlayer && unit.x + unit.width >= enemyBase.x) {
          canMove = false;
        }
        if (!unit.isPlayer && unit.x < playerBase.x + playerBase.width) {
          canMove = false;
        }
        if (canMove) {
          unit.x += unit.speed * (unit.isPlayer ? 1 : -1) * deltaTime * 0.12;
          // Для игрока: не даём зайти в вражескую базу
          if (unit.isPlayer && unit.x + unit.width > enemyBase.x) unit.x = enemyBase.x - unit.width;
          // Для врага: не даём зайти в базу игрока
          if (!unit.isPlayer && unit.x < playerBase.x + playerBase.width) unit.x = playerBase.x + playerBase.width;
          // Не даём выйти за пределы карты
          if (unit.x < 0) unit.x = 0;
          if (unit.x > canvas.width - unit.width) unit.x = canvas.width - unit.width;
        }
      }
      if (unit.hp <= 0) unit.isAlive = false;
    }
  }
    // Projectiles
    for (const p of projectiles) p.update();
    for (let i = projectiles.length - 1; i >= 0; i--) {
      if (!projectiles[i].isAlive) projectiles.splice(i, 1);
    }
  // Remove dead units
  for (const arr of [playerUnits, enemyUnits]) {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (!arr[i].isAlive) arr.splice(i, 1);
    }
  }

  // Check base HP
  if (playerBase.hp <= 0 && !gameIsOver) {
    gameOver(false);
  }
  if (enemyBase.hp <= 0 && !gameIsOver) {
    gameOver(true);
  }
  // Gold income
  goldIncomeTimer += deltaTime;
  while (goldIncomeTimer >= GOLD_INCOME_INTERVAL) {
    gold += GOLD_INCOME_AMOUNT;
    goldIncomeTimer -= GOLD_INCOME_INTERVAL;
  }
}
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw bases
  playerBase.draw();
  enemyBase.draw();
  projectiles.forEach(p => p.draw());
  // Draw units
  [...playerUnits, ...enemyUnits].forEach(u => u.draw());
  // UI overlays
  ctx.fillStyle = 'white';
  ctx.font = '18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Queue: ' + playerSpawnQueue.length, 10, 28);
  ctx.fillText(`Age: ${currentAge}`, canvas.width - 110, 28);
  if (gameIsOver) {
    ctx.fillStyle = playerWon ? '#4f4' : '#f44';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(gameOverMessage, canvas.width/2, canvas.height/2);
  }
}
function gameOver(playerWin) {
  gameIsOver = true;
  playerWon = playerWin;
  gameOverMessage = playerWin ? 'Victory!' : 'Defeat!';
  // Показываем кнопку Play Again
  const replayBtn = document.getElementById('replayButton');
  if (replayBtn) replayBtn.style.display = 'block';
}
let lastTime = 0;
function gameLoop(ts) {
  const deltaTime = (ts - lastTime) || (1000/60);
  lastTime = ts;
  if (goldDisplay) goldDisplay.textContent = Math.floor(gold);
  if (playerBase && playerBaseHpDisplay) playerBaseHpDisplay.textContent = playerBase.hp;
  if (enemyBase && enemyBaseHpDisplay) enemyBaseHpDisplay.textContent = enemyBase.hp;
  if (allImagesLoaded) {
    if (!gameIsOver) updateGame(deltaTime);
    render();
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.font = '20px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`Загрузка изображений: ${imagesLoadedCount}/${imagesToLoadCount}...`, canvas.width/2, canvas.height/2);
  }
  requestAnimationFrame(gameLoop);
}
async function initGame() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  goldDisplay = document.getElementById('goldDisplay');
  playerBaseHpDisplay = document.getElementById('playerBaseHpDisplay');
  enemyBaseHpDisplay = document.getElementById('enemyBaseHpDisplay');
  unitButtonsContainer = document.getElementById('unit-buttons-container');
  ageUpButtonElement = document.getElementById('ageUpButton');
  // Скрываем кнопку Play Again при старте
  const replayBtn = document.getElementById('replayButton');
  if (replayBtn) replayBtn.style.display = 'none';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white'; ctx.font = '24px Arial'; ctx.textAlign = 'center';
  ctx.fillText('Loading game...', canvas.width/2, canvas.height/2);
  await loadAllGameImages();
  playerBase = new Base(0, canvas.height, AGE_CONFIG[currentAge].baseHp, true);
  enemyBase = new Base(canvas.width - 136, canvas.height, AGE_CONFIG[enemyCurrentAge].baseHp, false);
  updateUnitButtons();
  setupAgeUpButton();
  unitButtonsContainer.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
      const unitTypeKey = event.target.dataset.unitType;
      addUnitToPlayerQueue(unitTypeKey);
    }
  });
  // Обработчик для Play Again
  if (replayBtn) {
    replayBtn.onclick = () => {
      location.reload();
    };
  }
  requestAnimationFrame(gameLoop);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
