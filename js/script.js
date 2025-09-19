// ゲームの状態管理
let gameState = {
    party: [],
    enemies: [],
    currentTurn: 0,
    selectedCommand: null,
    battleEnded: false,
    isProcessing: false // 新しい状態フラグ
};

// 全9人のキャラクターデータ
const allCharacterData = {
    A: { name: 'A', hp: 120, maxHp: 120, mp: 20, maxMp: 20, attack: 25, defense: 15 },
    B: { name: 'B', hp: 100, maxHp: 100, mp: 50, maxMp: 50, attack: 18, defense: 12 },
    C: { name: 'C', hp: 80, maxHp: 80, mp: 60, maxMp: 60, attack: 15, defense: 8 },
    D: { name: 'D', hp: 110, maxHp: 110, mp: 30, maxMp: 30, attack: 22, defense: 14 },
    E: { name: 'E', hp: 95, maxHp: 95, mp: 45, maxMp: 45, attack: 19, defense: 10 },
    F: { name: 'F', hp: 130, maxHp: 130, mp: 15, maxMp: 15, attack: 30, defense: 18 },
    G: { name: 'G', hp: 70, maxHp: 70, mp: 70, maxMp: 70, attack: 12, defense: 6 },
    H: { name: 'H', hp: 105, maxHp: 105, mp: 40, maxMp: 40, attack: 20, defense: 13 },
    I: { name: 'I', hp: 90, maxHp: 90, mp: 55, maxMp: 55, attack: 17, defense: 9 }
};

const spells = {
    'ファイア': { name: 'ファイア', cost: 8, damage: [20, 35] },
    'ヒール': { name: 'ヒール', cost: 6, heal: [15, 30] },
    'ライト': { name: 'ライト', cost: 12, damage: [25, 40] }
};

// ゲーム初期化
function initGame() {
    // 全てのUIを非表示にする
    document.getElementById('commandMenu').style.display = 'none';
    document.getElementById('targetSelection').style.display = 'none';
    document.getElementById('characterSelection').style.display = 'none';
    document.getElementById('enemySelection').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('messageBox').innerHTML = '';

    // 9人のキャラクターからランダムで1人を選択
    const allChars = Object.values(allCharacterData);
    const shuffledChars = allChars.sort(() => 0.5 - Math.random());
    const initialParty = shuffledChars.slice(0, 1);

    gameState.party = initialParty.map((char, index) => ({
        ...char,
        id: `p${index + 1}`
    }));

    addMessage(`君のはじめの仲間は${gameState.party[0].name}だ！`);
    
    renderBattleField();
    showEnemySelection();
}

// 次の敵選択画面を表示
function showEnemySelection() {
    const enemySelectionDiv = document.getElementById('enemySelection');
    const enemyButtonsDiv = document.getElementById('enemyButtons');
    const enemyPasswordInput = document.getElementById('enemyPassword');
    
    enemySelectionDiv.style.display = 'block';
    enemyButtonsDiv.innerHTML = '';
    enemyPasswordInput.value = '';

    // 既にパーティにいるキャラクターの名前リスト
    const partyNames = gameState.party.map(p => p.name);
    const allCharNames = Object.keys(allCharacterData);

    allCharNames.forEach(charName => {
        // パーティにいないキャラクターだけを敵候補として表示
        if (!partyNames.includes(charName)) {
            const button = document.createElement('button');
            button.className = 'command-btn';
            button.textContent = charName;
            button.onclick = () => selectNextEnemy(charName);
            enemyButtonsDiv.appendChild(button);
        }
    });
}

// 次の敵を選択（パスワードチェックあり）
function selectNextEnemy(charName) {
    const enemyPasswordInput = document.getElementById('enemyPassword');
    const password = enemyPasswordInput.value.trim().toUpperCase(); // 大文字に変換して比較

    // パスワードが敵キャラクター名と一致するかチェック
    if (password !== charName) {
        addMessage(`合言葉が違います！${charName}の合言葉は${charName}です。`);
        return;
    }

    const selectedEnemy = allCharacterData[charName];
    if (selectedEnemy) {
        // パーティの人数に応じて敵の能力値を調整
        let multiplier;
        switch (gameState.party.length) {
            case 1:
                multiplier = 0.6;
                break;
            case 2:
                multiplier = 1.7;
                break;
            case 3:
                multiplier = 2.8;
                break;
            case 4:
                multiplier = 4.0;
                break;
            default:
                multiplier = 1.0;
        }

        const adjustedHp = Math.floor(selectedEnemy.hp * multiplier);
        const adjustedAttack = Math.floor(selectedEnemy.attack * multiplier);
        // 防御力は変更しない
        const adjustedDefense = selectedEnemy.defense; 

        gameState.enemies = [
            {
                ...selectedEnemy,
                id: 'e1',
                name: selectedEnemy.name,
                isCharacter: true,
                hp: adjustedHp,
                maxHp: adjustedHp,
                attack: adjustedAttack,
                defense: adjustedDefense
            },
        ];
        
        addMessage(`${selectedEnemy.name}との戦いだ！`);

        document.getElementById('enemySelection').style.display = 'none';
        document.getElementById('commandMenu').style.display = 'grid';
        
        gameState.currentTurn = 0;
        gameState.battleEnded = false;
        
        renderBattleField();
        updateTurnDisplay();
    }
}

// バトルフィールドの描画
function renderBattleField() {
    const partyDiv = document.getElementById('party');
    const enemiesDiv = document.getElementById('enemies');

    partyDiv.innerHTML = '';
    enemiesDiv.innerHTML = '';

    gameState.party.forEach(char => {
        partyDiv.innerHTML += createCharacterHTML(char, char.hp <= 0);
    });

    gameState.enemies.forEach(enemy => {
        enemiesDiv.innerHTML += createEnemyHTML(enemy, enemy.hp <= 0);
    });
}

function createCharacterHTML(char, isDead = false) {
    const hpPercent = (char.hp / char.maxHp) * 100;
    const mpPercent = (char.mp / char.maxMp) * 100;
    
    return `
        <div class="character ${isDead ? 'dead' : ''}" id="${char.id}">
            <div><strong>${char.name}</strong></div>
            <div>HP: ${char.hp}/${char.maxHp}</div>
            <div class="hp-bar">
                <div class="hp-fill" style="width: ${hpPercent}%"></div>
            </div>
            <div>MP: ${char.mp}/${char.maxMp}</div>
            <div class="mp-bar">
                <div class="mp-fill" style="width: ${mpPercent}%"></div>
            </div>
        </div>
    `;
}

function createEnemyHTML(enemy, isDead = false) {
    const hpPercent = (enemy.hp / enemy.maxHp) * 100;
    
    return `
        <div class="enemy ${isDead ? 'dead' : ''}" id="${enemy.id}">
            <div><strong>${enemy.name}</strong></div>
            <div>HP: ${enemy.hp}/${enemy.maxHp}</div>
            <div class="hp-bar">
                <div class="hp-fill" style="width: ${hpPercent}%"></div>
            </div>
        </div>
    `;
}

// メッセージ表示
function addMessage(message) {
    const messageBox = document.getElementById('messageBox');
    messageBox.innerHTML += message + '<br>';
    messageBox.scrollTop = messageBox.scrollHeight;
}

// ボタンの状態を切り替える
function toggleButtons(state) {
    const buttons = document.querySelectorAll('.command-btn, .target-btn');
    buttons.forEach(button => {
        button.disabled = state;
    });
}

// コマンド選択
function selectCommand(command) {
    if (gameState.isProcessing || gameState.battleEnded) return;

    gameState.selectedCommand = command;
    const currentChar = gameState.party[gameState.currentTurn];

    if (!currentChar || currentChar.hp <= 0) {
        nextTurn();
        return;
    }

    switch(command) {
        case 'attack':
            showTargetSelection('enemy');
            break;
        case 'magic':
            showMagicSelection();
            break;
        case 'defend':
            defendAction();
            break;
        case 'item':
            addMessage(`${currentChar.name}はアイテムを持っていない！`);
            nextTurn();
            break;
    }
}

// ターゲット選択表示
function showTargetSelection(type) {
    if (gameState.isProcessing) return;
    
    const targetDiv = document.getElementById('targetSelection');
    const commandMenu = document.getElementById('commandMenu');
    
    commandMenu.style.display = 'none';
    targetDiv.style.display = 'grid';
    targetDiv.innerHTML = '';

    if (type === 'enemy') {
        gameState.enemies.forEach(enemy => {
            if (enemy.hp > 0) {
                targetDiv.innerHTML += `<button class="target-btn" onclick="attackTarget('${enemy.id}')">${enemy.name}</button>`;
            }
        });
    } else if (type === 'ally') {
        gameState.party.forEach(char => {
            if (char.hp > 0) {
                targetDiv.innerHTML += `<button class="target-btn" onclick="healTarget('${char.id}')">${char.name}</button>`;
            }
        });
    }

    targetDiv.innerHTML += '<button class="target-btn" onclick="cancelSelection()">キャンセル</button>';
}

// 魔法選択
function showMagicSelection() {
    if (gameState.isProcessing) return;

    const targetDiv = document.getElementById('targetSelection');
    const commandMenu = document.getElementById('commandMenu');
    
    commandMenu.style.display = 'none';
    targetDiv.style.display = 'grid';
    targetDiv.innerHTML = '';

    Object.keys(spells).forEach(spellName => {
        const spell = spells[spellName];
        const currentChar = gameState.party[gameState.currentTurn];
        const canCast = currentChar.mp >= spell.cost;
        
        targetDiv.innerHTML += `
            <button class="target-btn ${!canCast ? 'disabled' : ''}" 
                    onclick="selectSpellAction('${spellName}')" 
                    ${!canCast ? 'disabled' : ''}>
                ${spell.name} (${spell.cost}MP)
            </button>
        `;
    });

    targetDiv.innerHTML += '<button class="target-btn" onclick="cancelSelection()">キャンセル</button>';
}

// 魔法が選択された後の処理
function selectSpellAction(spellName) {
    if (gameState.isProcessing) return;
    
    gameState.selectedSpell = spellName;
    const spell = spells[spellName];
    
    if (spell.heal) {
        showTargetSelection('ally'); 
    } else {
        showTargetSelection('enemy'); 
    }
}

// 攻撃実行
function attackTarget(targetId) {
    if (gameState.isProcessing) return;
    gameState.isProcessing = true;
    toggleButtons(true);
    
    const attacker = gameState.party[gameState.currentTurn];
    const target = gameState.enemies.find(e => e.id === targetId);
    
    if (!target || target.hp <= 0) {
        gameState.isProcessing = false;
        toggleButtons(false);
        nextTurn();
        return;
    }

    const damage = Math.max(1, attacker.attack + Math.floor(Math.random() * 10) - target.defense);
    target.hp = Math.max(0, target.hp - damage);
    
    addMessage(`${attacker.name}の攻撃！ ${target.name}に${damage}のダメージ！`);
    
    if (target.hp <= 0) {
        addMessage(`${target.name}を倒した！`);
    }

    hideTargetSelection();
    renderBattleField();
    
    setTimeout(() => {
        gameState.isProcessing = false;
        toggleButtons(false);
        if (checkBattleEnd()) return;
        nextTurn();
    }, 1000);
}

// 回復魔法実行
function healTarget(targetId) {
    if (gameState.isProcessing) return;
    gameState.isProcessing = true;
    toggleButtons(true);

    const caster = gameState.party[gameState.currentTurn];
    const target = gameState.party.find(p => p.id === targetId);
    const spell = spells[gameState.selectedSpell];
    
    if (caster.mp < spell.cost) {
        addMessage(`${caster.name}はMPが足りない！`);
        hideTargetSelection();
        gameState.isProcessing = false;
        toggleButtons(false);
        nextTurn(); 
        return;
    }

    caster.mp -= spell.cost;
    const healAmount = spell.heal[0] + Math.floor(Math.random() * (spell.heal[1] - spell.heal[0] + 1));
    const actualHeal = Math.min(healAmount, target.maxHp - target.hp);
    target.hp += actualHeal;
    
    addMessage(`${caster.name}は${spell.name}を唱えた！ ${target.name}のHPが${actualHeal}回復！`);
    
    hideTargetSelection();
    renderBattleField();
    
    setTimeout(() => {
        gameState.isProcessing = false;
        toggleButtons(false);
        nextTurn();
    }, 1000);
}

// 攻撃魔法実行
function castDamageSpell(targetId) {
    if (gameState.isProcessing) return;
    gameState.isProcessing = true;
    toggleButtons(true);

    const caster = gameState.party[gameState.currentTurn];
    const target = gameState.enemies.find(e => e.id === targetId);
    const spell = spells[gameState.selectedSpell];

    if (caster.mp < spell.cost) {
        addMessage(`${caster.name}はMPが足りない！`);
        hideTargetSelection();
        gameState.isProcessing = false;
        toggleButtons(false);
        nextTurn();
        return;
    }

    caster.mp -= spell.cost;
    const damage = Math.max(1, spell.damage[0] + Math.floor(Math.random() * (spell.damage[1] - spell.damage[0] + 1)) - target.defense);
    target.hp = Math.max(0, target.hp - damage);

    addMessage(`${caster.name}は${spell.name}を唱えた！ ${target.name}に${damage}のダメージ！`);
    if (target.hp <= 0) {
        addMessage(`${target.name}を倒した！`);
    }

    hideTargetSelection();
    renderBattleField();

    setTimeout(() => {
        gameState.isProcessing = false;
        toggleButtons(false);
        if (checkBattleEnd()) return;
        nextTurn();
    }, 1000);
}

// 防御
function defendAction() {
    if (gameState.isProcessing) return;
    gameState.isProcessing = true;
    toggleButtons(true);

    const defender = gameState.party[gameState.currentTurn];
    addMessage(`${defender.name}は身を守っている...`);
    
    setTimeout(() => {
        gameState.isProcessing = false;
        toggleButtons(false);
        nextTurn();
    }, 1000);
}

// ターゲット選択をキャンセル
function cancelSelection() {
    hideTargetSelection();
}

function hideTargetSelection() {
    document.getElementById('targetSelection').style.display = 'none';
    document.getElementById('commandMenu').style.display = 'grid';
}

// 次のターン
function nextTurn() {
    if (gameState.battleEnded) return;
    
    gameState.isProcessing = true;
    toggleButtons(true);

    do {
        gameState.currentTurn = (gameState.currentTurn + 1) % gameState.party.length;
    } while (gameState.party[gameState.currentTurn].hp <= 0 && gameState.party.some(p => p.hp > 0));

    if (gameState.currentTurn === 0) {
        setTimeout(enemyTurn, 1000); // 敵ターンへ
    } else {
        gameState.isProcessing = false;
        toggleButtons(false);
        updateTurnDisplay();
    }
}

// 敵のターン
function enemyTurn() {
    const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
    const aliveParty = gameState.party.filter(p => p.hp > 0);
    
    if (aliveEnemies.length === 0 || aliveParty.length === 0) {
        checkBattleEnd();
        return;
    }

    let delay = 0;
    aliveEnemies.forEach(enemy => {
        setTimeout(() => {
            if (aliveParty.length === 0) return;
            
            const target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
            const damage = Math.max(1, enemy.attack + Math.floor(Math.random() * 8) - target.defense);
            target.hp = Math.max(0, target.hp - damage);
            
            addMessage(`${enemy.name}の攻撃！ ${target.name}に${damage}のダメージ！`);
            
            if (target.hp <= 0) {
                addMessage(`${target.name}は倒れた...`);
            }
            
            renderBattleField();
            
            if (enemy === aliveEnemies[aliveEnemies.length - 1]) {
                setTimeout(() => {
                    gameState.isProcessing = false;
                    toggleButtons(false);
                    if (checkBattleEnd()) return;
                    updateTurnDisplay();
                }, 1000);
            }
        }, delay);
        delay += 1500;
    });
}

// ターン表示更新
function updateTurnDisplay() {
    const currentChar = gameState.party[gameState.currentTurn];
    if (currentChar && currentChar.hp > 0) {
        addMessage(`--- ${currentChar.name}のターン ---`);
    }
}

// 戦闘終了チェック
function checkBattleEnd() {
    const aliveParty = gameState.party.filter(p => p.hp > 0);
    const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
    
    if (aliveParty.length === 0) {
        addMessage('全滅してしまった...');
        showGameOver(false);
        return true;
    } else if (aliveEnemies.length === 0) {
        const defeatedEnemy = gameState.enemies[0];
        addMessage(`${defeatedEnemy.name}を倒した！`);
        
        // パーティが4人未満なら敵を仲間にする
        if (gameState.party.length < 4) {
            // HPとMPを全回復させてから仲間に加える
            const newPartyMember = { 
                ...defeatedEnemy, 
                id: `p${gameState.party.length + 1}`,
                hp: defeatedEnemy.maxHp,
                mp: defeatedEnemy.maxMp
            };
            gameState.party.push(newPartyMember);
            addMessage(`${defeatedEnemy.name}が仲間に加わった！`);
            renderBattleField();
            setTimeout(() => {
                showEnemySelection();
                gameState.isProcessing = false;
            }, 2000); // 2秒後に次の敵選択フェーズへ
        } else {
            addMessage('パーティは満員だ！');
            showGameOver(true);
        }
        return true;
    }
    
    return false;
}

// ゲーム終了画面
function showGameOver(victory) {
    gameState.battleEnded = true;
    const gameOverScreen = document.getElementById('gameOverScreen');
    const commandMenu = document.getElementById('commandMenu');
    
    commandMenu.style.display = 'none';
    gameOverScreen.style.display = 'block';
    
    if (victory) {
        gameOverScreen.innerHTML = `
            <div class="game-over victory">🎉 勝利！ 🎉</div>
            <button class="restart-btn" onclick="restartGame()">もう一度戦う</button>
        `;
    } else {
        gameOverScreen.innerHTML = `
            <div class="game-over">💀 全滅 💀</div>
            <button class="restart-btn" onclick="restartGame()">もう一度戦う</button>
        `;
    }
}

// ゲーム再開
function restartGame() {
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('commandMenu').style.display = 'grid';
    document.getElementById('messageBox').innerHTML = '';
    hideTargetSelection();
    
    initGame();
}

// ゲーム開始
initGame();