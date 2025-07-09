// 게임 상태 변수들
let gameState = {
    playerCount: 0,
    currentPlayer: 1,
    currentProjectIndex: 0,
    votes: [],
    projectResults: [],
    roles: [],
    passesUsed: 0,
    gameEnded: false
};

// 인원수별 역할 설정
const roleConfigs = {
    5: ['Manager', 'Senior Developer', 'Junior Developer', 'Hacker Reader', 'Hacker'],
    6: ['Manager', 'Senior Developer', 'Junior Developer', 'Junior Developer', 'Hacker Reader', 'Hacker'],
    7: ['Manager', 'Senior Developer', 'Junior Developer', 'Junior Developer', 'Hacker Reader', 'Hacker', 'Hacker']
};

// 인원수별 프로젝트 요구 인원 (아발론 게임 룰 기반)
const projectRequirements = {
    5: [2, 3, 2, 3, 3],
    6: [2, 3, 4, 3, 4],
    7: [2, 3, 3, 4, 4]
};

// 게임 시작 함수
function startGame(playerCount) {
    gameState.playerCount = playerCount;
    gameState.roles = shuffleArray([...roleConfigs[playerCount]]);
    gameState.currentPlayer = 1;
    gameState.currentProjectIndex = 0;
    gameState.votes = [];
    gameState.projectResults = [];
    gameState.passesUsed = 0;
    gameState.gameEnded = false;

    // 화면 전환
    document.getElementById('player-selection').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    // 총 인원수 표시 업데이트
    document.getElementById('total-players').textContent = playerCount;

    // 역할 확인 버튼 이벤트 설정
    setupRoleCheckButton();
    
    // 초기 버튼 텍스트 설정
    document.getElementById('role-check-btn').textContent = '플레이어 1 역할 확인';

    // 모든 프로젝트 원을 초기화
    resetProjectCircles();
    
    // 프로젝트 원에 참여 인원 수 표시
    updateProjectCircleLabels();

    // 패스 토큰 초기화
    resetPassTokens();
    
    // 패스 섹션 제목 초기화
    updatePassSectionTitle();

    // 게임 결과 숨기기
    document.getElementById('game-result').classList.add('hidden');
}

// 배열 셔플 함수
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 역할 확인 버튼 설정
function setupRoleCheckButton() {
    const roleButton = document.getElementById('role-check-btn');
    const roleDisplay = document.getElementById('role-display');
    let currentRoleIndex = 0;
    let isShowingRole = false;

    roleButton.onclick = function() {
        if (!isShowingRole && currentRoleIndex < gameState.playerCount) {
            // 역할 표시
            const role = gameState.roles[currentRoleIndex];
            roleDisplay.innerHTML = `
                <div>플레이어 ${currentRoleIndex + 1}: <strong>${role}</strong></div>
                <button id="role-confirm-btn" class="role-confirm-btn">확인 완료</button>
            `;
            roleDisplay.classList.remove('hidden');
            
            // 역할에 따른 색상 설정
            if (role.includes('Hacker')) {
                roleDisplay.style.background = 'rgba(244, 67, 54, 0.9)';
                roleDisplay.style.color = 'white';
            } else {
                roleDisplay.style.background = 'rgba(76, 175, 80, 0.9)';
                roleDisplay.style.color = 'white';
            }
            
            isShowingRole = true;
            roleButton.textContent = '역할 확인 중...';
            roleButton.disabled = true;
            roleButton.style.opacity = '0.6';
            
            // 확인 완료 버튼 이벤트
            document.getElementById('role-confirm-btn').onclick = function() {
                // 역할 숨기기
                roleDisplay.classList.add('hidden');
                isShowingRole = false;
                currentRoleIndex++;
                
                // 다음 플레이어 준비
                if (currentRoleIndex < gameState.playerCount) {
                    roleButton.textContent = `플레이어 ${currentRoleIndex + 1} 역할 확인`;
                    roleButton.disabled = false;
                    roleButton.style.opacity = '1';
                } else {
                    roleButton.textContent = '모든 역할 확인 완료';
                    roleButton.disabled = true;
                    roleButton.style.opacity = '0.5';
                }
            };
        }
    };
}

// 투표 모달 열기
function openVoting(projectIndex) {
    if (gameState.gameEnded) return;
    
    // 이미 완료된 프로젝트는 클릭 불가
    if (gameState.projectResults[projectIndex - 1] !== undefined) return;
    
    // 순서대로만 진행 가능
    if (projectIndex - 1 !== gameState.projectResults.length) return;

    gameState.currentProjectIndex = projectIndex - 1;
    gameState.votes = [];
    gameState.currentVoteIndex = 0;
    
    // 현재 프로젝트의 참여 인원 수 설정
    gameState.requiredVoters = projectRequirements[gameState.playerCount][gameState.currentProjectIndex];

    updateVotingModal();
    document.getElementById('voting-modal').classList.remove('hidden');
}

// 랜덤하게 프로젝트 참여자 선택
function selectRandomParticipants(count) {
    const players = Array.from({length: gameState.playerCount}, (_, i) => i + 1);
    const shuffled = shuffleArray([...players]);
    return shuffled.slice(0, count);
}

// 투표 모달 업데이트
function updateVotingModal() {
    const currentProjectParticipants = projectRequirements[gameState.playerCount][gameState.currentProjectIndex];
    
    // 현재 투표 순서 표시 (1부터 시작)
    const voteNumber = gameState.currentVoteIndex + 1;
    document.getElementById('current-voter').textContent = `${voteNumber}번째 투표`;
    
    // 투표 카운트 업데이트
    document.getElementById('vote-count').textContent = gameState.votes.length;
    document.getElementById('total-players').textContent = currentProjectParticipants;
    
    // 프로젝트 정보 업데이트
    const modalTitle = document.querySelector('#voting-modal h3');
    let titleText = `프로젝트 ${gameState.currentProjectIndex + 1} (${currentProjectParticipants}명 참여)`;
    
    // 7인 게임 4번째 프로젝트 특별 룰 안내
    if (gameState.playerCount === 7 && gameState.currentProjectIndex === 3) {
        titleText += ' - 특별 룰: 2명 이상 실패해야 실패';
    }
    
    modalTitle.textContent = titleText;
}

// 투표 제출
function submitVote(vote) {
    gameState.votes.push(vote);
    gameState.currentVoteIndex++;

    if (gameState.currentVoteIndex < gameState.requiredVoters) {
        updateVotingModal();
    } else {
        // 모든 투표 완료
        processVoteResults();
        document.getElementById('voting-modal').classList.add('hidden');
    }
}

// 투표 결과 처리
function processVoteResults() {
    const failVotes = gameState.votes.filter(vote => vote === 'fail').length;
    let success;
    
    // 7인 게임 4번째 프로젝트(인덱스 3)에서는 2명 이상이 실패해야 실패
    if (gameState.playerCount === 7 && gameState.currentProjectIndex === 3) {
        success = failVotes < 2; // 2명 미만이 실패하면 성공
    } else {
        success = failVotes === 0; // 기본 룰: 1명이라도 실패하면 실패
    }
    
    gameState.projectResults.push(success);
    
    const circle = document.getElementById(`circle-${gameState.currentProjectIndex + 1}`);
    
    if (success) {
        circle.classList.add('success');
        circle.classList.add('disabled');
    } else {
        circle.classList.add('fail');
        circle.classList.add('disabled');
    }

    // 승리 조건 확인
    setTimeout(() => {
        checkWinCondition();
    }, 500);
}

// 승리 조건 확인
function checkWinCondition() {
    const successCount = gameState.projectResults.filter(result => result === true).length;
    const failCount = gameState.projectResults.filter(result => result === false).length;

    if (failCount >= 3) {
        endGame('해커 승리!', 'fail');
    } else if (successCount >= 3) {
        endGame('개발자 승리!', 'success');
    }
}

// 게임 종료
function endGame(message, type) {
    gameState.gameEnded = true;
    
    const resultDiv = document.getElementById('game-result');
    const resultText = document.getElementById('result-text');
    
    resultText.textContent = message;
    
    if (type === 'success') {
        resultText.style.color = '#4CAF50';
    } else {
        resultText.style.color = '#f44336';
    }
    
    resultDiv.classList.remove('hidden');
    
    // 모든 원을 비활성화
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`circle-${i}`).classList.add('disabled');
    }
}

// 패스 사용
function usePass(passIndex) {
    const passToken = document.getElementById(`pass-${passIndex}`);
    
    if (!passToken.classList.contains('used')) {
        passToken.classList.add('used');
        passToken.textContent = '사용됨';
        gameState.passesUsed++;

        // 패스 섹션 제목 업데이트
        updatePassSectionTitle();

        // 패스를 5개 모두 사용했는지 확인
        if (gameState.passesUsed >= 5) {
            endGame('패스 5회 소진! 해커 승리!', 'fail');
        }
    }
}

// 패스 섹션 제목 업데이트
function updatePassSectionTitle() {
    const passTitle = document.querySelector('.pass-section h3');
    const remainingPasses = 5 - gameState.passesUsed;
    passTitle.textContent = `패스 기회 (남은 횟수: ${remainingPasses})`;
}

// 프로젝트 원 초기화
function resetProjectCircles() {
    for (let i = 1; i <= 5; i++) {
        const circle = document.getElementById(`circle-${i}`);
        circle.classList.remove('success', 'fail', 'disabled');
    }
}

// 프로젝트 원에 참여 인원 수 표시
function updateProjectCircleLabels() {
    const requirements = projectRequirements[gameState.playerCount];
    for (let i = 1; i <= 5; i++) {
        const circle = document.getElementById(`circle-${i}`);
        const span = circle.querySelector('span');
        let labelText = `프로젝트 ${i}<br/>${requirements[i-1]}명`;
        
        // 7인 게임 4번째 프로젝트 특별 룰 표시
        if (gameState.playerCount === 7 && i === 4) {
            labelText += '<br/><small>특별룰</small>';
        }
        
        span.innerHTML = labelText;
    }
}

// 패스 토큰 초기화
function resetPassTokens() {
    for (let i = 1; i <= 5; i++) {
        const passToken = document.getElementById(`pass-${i}`);
        passToken.classList.remove('used');
        passToken.textContent = `패스 ${i}`;
    }
}

// 게임 리셋
function resetGame() {
    // 게임 화면 숨기기
    document.getElementById('game-screen').classList.add('hidden');
    
    // 인원 선택 화면 보이기
    document.getElementById('player-selection').classList.remove('hidden');
    
    // 게임 상태 초기화
    gameState = {
        playerCount: 0,
        currentPlayer: 1,
        currentProjectIndex: 0,
        votes: [],
        projectResults: [],
        roles: [],
        passesUsed: 0,
        gameEnded: false
    };
}

// 모달 외부 클릭시 닫기 방지 (게임 진행을 위해)
document.getElementById('voting-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        // 모달 외부 클릭시에도 닫지 않음 (투표 완료까지 대기)
        e.preventDefault();
    }
});

// 터치 이벤트 최적화 (아이패드 지원)
document.addEventListener('DOMContentLoaded', function() {
    // 터치 이벤트가 있는 기기에서 hover 효과 최적화
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
    
    // 아이패드 Safari에서 확대/축소 방지
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });
    
    // 더블탭 확대 방지
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});

// 키보드 단축키 (선택사항)
document.addEventListener('keydown', function(e) {
    // ESC 키로 게임 리셋 (개발용)
    if (e.key === 'Escape' && e.ctrlKey) {
        resetGame();
    }
});

// 게임 규칙 설명 함수 (콘솔에서 확인 가능)
function showGameRules() {
    console.log(`
    === 개발자 vs 해커 게임 규칙 ===
    
    역할:
    - Manager: 프로젝트를 성공시켜야 함
    - Senior Developer: 프로젝트를 성공시켜야 함  
    - Junior Developer: 프로젝트를 성공시켜야 함
    - Hacker Reader: 프로젝트를 실패시켜야 함 (다른 해커 정체 알 수 있음)
    - Hacker: 프로젝트를 실패시켜야 함
    
    프로젝트별 참여 인원:
    - 5인 게임: 2, 3, 2, 3, 3명
    - 6인 게임: 2, 3, 4, 3, 4명
    - 7인 게임: 2, 3, 3, 4, 4명
    
    게임 진행:
    1. 각자 역할을 확인
    2. 프로젝트 원을 순서대로 클릭하여 투표
    3. 모든 플레이어가 성공/실패 투표
    4. 실패 조건:
       - 기본: 실패 투표가 하나라도 있으면 프로젝트 실패
       - 특별: 7인 게임 4번째 프로젝트는 2명 이상이 실패해야 실패
    5. 모두 성공 투표하면 프로젝트 성공 (파란색)
    
    승리 조건:
    - 해커팀 승리 조건:
      * 프로젝트 3개 실패
      * 또는 패스 기회 5회 모두 소진
    - 개발팀 승리 조건:
      * 프로젝트 3개 성공
    
    패스 기회:
    - 총 5번의 패스 기회가 있음 (게임 진행자가 수동으로 사용)
    - 주의: 5회 모두 소진시 해커팀 즉시 승리!
    `);
}

// 게임 초기화시 규칙 표시
console.log('개발자 vs 해커 게임에 오신 것을 환영합니다!');
console.log('게임 규칙을 보려면 showGameRules()를 콘솔에서 실행하세요.'); 