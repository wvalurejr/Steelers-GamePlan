// Admin Panel Controller for Steelers GamePlan
class AdminPanel {
    constructor() {
        this.firebaseService = null;
        this.currentSeason = 2025;
        this.adminPassword = 'SteelersChampions2025!'; // Default password - should be changed
        this.isAuthenticated = false;
        this.currentTab = 'season';
        this.games = [];
        this.players = [];
        this.teams = [];
        this.contentData = {};
        this.settings = {};
        this.archivedSeasons = [];

        this.init();
    }

    init() {
        console.log('AdminPanel initializing...');

        // Get Firebase service instance
        this.firebaseService = FirebaseService.getInstance();

        this.setupEventListeners();
        this.setupTheme();
        this.loadStoredPassword();
        this.showLoginModal();

        console.log('AdminPanel initialized successfully');
    }

    setupEventListeners() {
        // Login functionality
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('admin-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Season Management
        document.getElementById('update-season').addEventListener('click', () => this.updateSeasonInfo());

        // Schedule Management
        document.getElementById('add-game').addEventListener('click', () => this.showGameModal());
        document.getElementById('save-game').addEventListener('click', (e) => {
            e.preventDefault();
            this.saveGame();
        });
        document.getElementById('cancel-game').addEventListener('click', () => this.hideGameModal());
        document.getElementById('game-status').addEventListener('change', (e) => this.toggleScoreSection(e.target.value));

        // Player Management
        document.getElementById('add-player').addEventListener('click', () => this.showPlayerModal());
        document.getElementById('cancel-player').addEventListener('click', () => this.hidePlayerModal());
        document.getElementById('player-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePlayer();
        });

        // Teams Management
        document.getElementById('add-east-team').addEventListener('click', () => this.showTeamModal('East Side'));
        document.getElementById('add-west-team').addEventListener('click', () => this.showTeamModal('West Side'));
        document.getElementById('cancel-team').addEventListener('click', () => this.hideTeamModal());
        document.getElementById('team-form').addEventListener('submit', (e) => {
            console.log('Team form submitted');
            e.preventDefault();
            this.saveTeam();
        });

        // Content Management
        document.getElementById('add-feature-card').addEventListener('click', () => this.addFeatureCard());
        document.getElementById('update-content').addEventListener('click', () => this.updateContent());

        // Settings
        document.getElementById('change-password').addEventListener('click', () => this.changePassword());
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('backup-data').addEventListener('click', () => this.createBackup());
        document.getElementById('clear-cache').addEventListener('click', () => this.clearCache());
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());

        // Archive System
        document.getElementById('archive-season').addEventListener('click', () => this.archiveSeason());
    }

    setupTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const currentTheme = localStorage.getItem('theme') || 'dark';

        document.documentElement.setAttribute('data-theme', currentTheme);
        themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        });
    }

    loadStoredPassword() {
        // Check if custom password is stored
        const storedPassword = localStorage.getItem('adminPassword');
        if (storedPassword) {
            this.adminPassword = storedPassword;
        }
    }

    showLoginModal() {
        console.log('Showing login modal...');
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            console.log('Login modal should be visible');
        } else {
            console.error('Login modal element not found!');
        }

        // Focus on password input
        setTimeout(() => {
            const passwordInput = document.getElementById('admin-password');
            if (passwordInput) {
                passwordInput.focus();
            }
        }, 300);
    }

    hideLoginModal() {
        const modal = document.getElementById('login-modal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    handleLogin() {
        const passwordInput = document.getElementById('admin-password');
        const errorDiv = document.getElementById('login-error');
        const password = passwordInput.value;

        if (password === this.adminPassword) {
            this.isAuthenticated = true;
            this.hideLoginModal();
            document.getElementById('admin-content').style.display = 'block';
            this.loadAdminData();
        } else {
            errorDiv.style.display = 'block';
            passwordInput.value = '';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    async loadAdminData() {
        try {
            await Promise.all([
                this.loadSeasonData(),
                this.loadGames(),
                this.loadPlayers(),
                this.loadTeams(),
                this.loadContentData(),
                this.loadSettings(),
                this.loadArchivedSeasons()
            ]);

            this.updateUI();

            // Calculate and update season stats
            this.updateSeasonStats();
            this.updateHomePageStats();
        } catch (error) {
            console.error('Error loading admin data:', error);
            this.showNotification('Error loading admin data', 'error');
        }
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'season':
                await this.loadSeasonData();
                break;
            case 'schedule':
                await this.loadGames();
                this.renderGames();
                break;
            case 'teams':
                await this.loadTeams();
                this.renderTeams();
                break;
            case 'players':
                await this.loadPlayers();
                this.renderPlayers();
                break;
            case 'content':
                await this.loadContentData();
                this.populateContentForm();
                break;
            case 'settings':
                await this.loadSettings();
                this.populateSettingsForm();
                break;
            case 'archive':
                await this.loadArchivedSeasons();
                this.renderArchivedSeasons();
                this.updateArchiveStats();
                break;
        }
    }

    // Season Management
    async loadSeasonData() {
        try {
            let seasonData = {};

            if (this.firebaseService && this.firebaseService.isInitialized()) {
                const data = await this.firebaseService.getSettings();
                seasonData = data.seasonData || {};
            } else {
                seasonData = JSON.parse(localStorage.getItem('seasonData') || '{}');
            }

            // Populate form with current data
            document.getElementById('season-year').value = seasonData.year || 2025;
            document.getElementById('season-wins').value = seasonData.wins || 2;
            document.getElementById('season-losses').value = seasonData.losses || 0;
            document.getElementById('division-standing').value = seasonData.standing || '1st Place - Bayou Division';
            document.getElementById('team-motto').value = seasonData.motto || 'Steel Strong, Houma Proud!';
        } catch (error) {
            console.error('Error loading season data:', error);
        }
    }

    async updateSeasonInfo() {
        try {
            const seasonData = {
                year: parseInt(document.getElementById('season-year').value),
                wins: parseInt(document.getElementById('season-wins').value),
                losses: parseInt(document.getElementById('season-losses').value),
                standing: document.getElementById('division-standing').value,
                motto: document.getElementById('team-motto').value,
                lastUpdated: new Date().toISOString()
            };

            if (this.firebaseService && this.firebaseService.isInitialized()) {
                await this.firebaseService.saveSettings({ seasonData });
            } else {
                localStorage.setItem('seasonData', JSON.stringify(seasonData));
            }

            this.showNotification('Season information updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating season:', error);
            this.showNotification('Error updating season information', 'error');
        }
    }

    // Schedule Management
    async loadGames() {
        try {
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                const settings = await this.firebaseService.getSettings();
                this.games = settings.games || [];
            } else {
                this.games = JSON.parse(localStorage.getItem('teamGames') || '[]');
            }
        } catch (error) {
            console.error('Error loading games:', error);
            this.games = [];
        }
    }

    renderGames() {
        const gamesList = document.getElementById('games-list');
        gamesList.innerHTML = '';

        if (this.games.length === 0) {
            gamesList.innerHTML = '<p class="no-data">No games scheduled yet. Click "Add New Game" to get started.</p>';
            return;
        }

        this.games.forEach((game, index) => {
            const gameItem = document.createElement('div');
            gameItem.className = 'game-item';
            gameItem.innerHTML = `
                <div class="game-info">
                    <h4>${game.week} vs ${game.opponent}</h4>
                    <p><strong>Date:</strong> ${new Date(game.date).toLocaleDateString()}</p>
                    <p><strong>Location:</strong> ${game.location} ${game.time ? `• Time: ${game.time}` : ''}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${game.status}">${game.status}</span></p>
                    ${game.statistics && game.status === 'completed' ?
                    `<p><strong>Stats:</strong> 
                            ${game.statistics.complete ?
                        '<span class="stats-complete">✅ Complete</span>' :
                        '<span class="stats-incomplete">⏳ Incomplete</span>'
                    }
                        </p>` : ''
                }
                    ${game.highlights ? `<p><strong>Notes:</strong> ${game.highlights}</p>` : ''}
                </div>
                <div class="game-score">
                    ${game.status === 'completed' ?
                    `<span>${game.steelersScore || 0} - ${game.opponentScore || 0}</span>
                         <span class="score-visibility">${game.showScore ? '👁️' : '🚫'}</span>` :
                    '<span>TBD</span>'
                }
                </div>
                <div class="game-actions">
                    <button class="btn btn-secondary btn-small" onclick="adminPanel.editGame(${index})">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="adminPanel.deleteGame(${index})">Delete</button>
                </div>
            `;
            gamesList.appendChild(gameItem);
        });
    }

    showGameModal(gameIndex = null) {
        const modal = document.getElementById('game-modal');
        const form = document.getElementById('game-form');
        const title = document.getElementById('game-modal-title');

        form.reset();

        if (gameIndex !== null) {
            title.textContent = 'Edit Game';
            const game = this.games[gameIndex];
            document.getElementById('game-week').value = game.week;
            document.getElementById('game-date').value = game.date;
            document.getElementById('game-opponent').value = game.opponent;
            document.getElementById('game-location').value = game.location;
            document.getElementById('game-time').value = game.time || '';
            document.getElementById('game-status').value = game.status;
            document.getElementById('steelers-score').value = game.steelersScore || '';
            document.getElementById('opponent-score').value = game.opponentScore || '';
            document.getElementById('game-highlights').value = game.highlights || '';
            document.getElementById('show-score').checked = game.showScore !== false;

            // Populate statistics if they exist
            if (game.statistics) {
                document.getElementById('stats-complete').checked = game.statistics.complete || false;
                document.getElementById('total-yards').value = game.statistics.offense.totalYards || '';
                document.getElementById('passing-yards').value = game.statistics.offense.passingYards || '';
                document.getElementById('rushing-yards').value = game.statistics.offense.rushingYards || '';
                document.getElementById('touchdowns').value = game.statistics.offense.touchdowns || '';
                document.getElementById('tackles').value = game.statistics.defense.tackles || '';
                document.getElementById('interceptions').value = game.statistics.defense.interceptions || '';
                document.getElementById('fumble-recoveries').value = game.statistics.defense.fumbleRecoveries || '';
                document.getElementById('sacks').value = game.statistics.defense.sacks || '';
            }

            // Show score section if completed
            if (game.status === 'completed') {
                document.querySelector('.score-section').style.display = 'block';
                document.querySelector('.stats-section').style.display = 'block';
            }

            form.dataset.editIndex = gameIndex;
        } else {
            title.textContent = 'Add New Game';
            document.getElementById('show-score').checked = true;
            delete form.dataset.editIndex;
        }

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    hideGameModal() {
        const modal = document.getElementById('game-modal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    editGame(index) {
        this.showGameModal(index);
    }

    async deleteGame(index) {
        if (confirm('Are you sure you want to delete this game?')) {
            this.games.splice(index, 1);
            await this.saveGames();
            this.renderGames();
            this.showNotification('Game deleted successfully!', 'success');

            // Update season stats after deleting a game
            this.updateSeasonStats();
            this.updateHomePageStats();
        }
    }

    // Season Statistics Calculation Methods
    updateSeasonStats() {
        const completedGames = this.games.filter(game => game.status === 'completed' && game.steelersScore !== undefined && game.opponentScore !== undefined);

        let wins = 0;
        let losses = 0;
        let totalOffenseStats = {
            totalYards: 0,
            passingYards: 0,
            rushingYards: 0,
            touchdowns: 0
        };
        let totalDefenseStats = {
            tackles: 0,
            interceptions: 0,
            fumbleRecoveries: 0,
            sacks: 0
        };
        let gamesWithStats = 0;

        completedGames.forEach(game => {
            // Calculate wins/losses
            if (game.steelersScore > game.opponentScore) {
                wins++;
            } else if (game.steelersScore < game.opponentScore) {
                losses++;
            }

            // Aggregate statistics
            if (game.statistics && game.statistics.complete) {
                gamesWithStats++;
                totalOffenseStats.totalYards += game.statistics.offense.totalYards || 0;
                totalOffenseStats.passingYards += game.statistics.offense.passingYards || 0;
                totalOffenseStats.rushingYards += game.statistics.offense.rushingYards || 0;
                totalOffenseStats.touchdowns += game.statistics.offense.touchdowns || 0;

                totalDefenseStats.tackles += game.statistics.defense.tackles || 0;
                totalDefenseStats.interceptions += game.statistics.defense.interceptions || 0;
                totalDefenseStats.fumbleRecoveries += game.statistics.defense.fumbleRecoveries || 0;
                totalDefenseStats.sacks += game.statistics.defense.sacks || 0;
            }
        });

        // Update season info form
        document.getElementById('season-wins').value = wins;
        document.getElementById('season-losses').value = losses;

        // Store aggregated stats for home page
        this.seasonStats = {
            wins,
            losses,
            winPercentage: completedGames.length > 0 ? Math.round((wins / completedGames.length) * 100) : 0,
            totalGames: completedGames.length,
            gamesWithStats,
            offense: totalOffenseStats,
            defense: totalDefenseStats
        };

        // Save to localStorage and Firebase
        localStorage.setItem('seasonStats', JSON.stringify(this.seasonStats));
        this.firebaseService.saveSeasonData({ ...this.seasonStats, updatedAt: new Date().toISOString() }).catch(console.error);
    }

    updateHomePageStats() {
        // This will be called by the main app to update the home page display
        // Store stats in a format the main app can use
        const homePageData = {
            currentSeason: {
                year: this.currentSeason,
                wins: this.seasonStats.wins,
                losses: this.seasonStats.losses,
                winPercentage: this.seasonStats.winPercentage
            },
            recentGames: this.games
                .filter(game => game.status === 'completed')
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5)
                .map(game => ({
                    id: game.id,
                    week: game.week,
                    opponent: game.opponent,
                    location: game.location,
                    steelersScore: game.steelersScore,
                    opponentScore: game.opponentScore,
                    result: game.steelersScore > game.opponentScore ? 'W' : 'L',
                    showScore: game.showScore,
                    highlights: game.highlights,
                    date: game.date,
                    statsComplete: game.statistics ? game.statistics.complete : false
                })),
            upcomingGames: this.games
                .filter(game => game.status === 'upcoming')
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 3)
                .map(game => ({
                    id: game.id,
                    week: game.week,
                    opponent: game.opponent,
                    location: game.location,
                    date: game.date,
                    time: game.time
                }))
        };

        localStorage.setItem('homePageData', JSON.stringify(homePageData));
        this.firebaseService.saveContentData({ homePageData, updatedAt: new Date().toISOString() }).catch(console.error);
    }

    toggleScoreSection(status) {
        const scoreSection = document.querySelector('.score-section');
        const statsSection = document.querySelector('.stats-section');

        if (status === 'completed') {
            scoreSection.style.display = 'block';
            statsSection.style.display = 'block';
        } else {
            scoreSection.style.display = 'none';
            statsSection.style.display = 'none';
        }
    }

    async saveGame() {
        try {
            const form = document.getElementById('game-form');
            const gameData = {
                id: form.dataset.editId || 'game_' + Date.now(),
                week: document.getElementById('game-week').value,
                date: document.getElementById('game-date').value,
                opponent: document.getElementById('game-opponent').value,
                location: document.getElementById('game-location').value,
                time: document.getElementById('game-time').value,
                status: document.getElementById('game-status').value,
                highlights: document.getElementById('game-highlights').value,
                showScore: document.getElementById('show-score').checked,
                createdAt: form.dataset.editId ? undefined : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Add scores and statistics if completed
            if (gameData.status === 'completed') {
                gameData.steelersScore = parseInt(document.getElementById('steelers-score').value) || 0;
                gameData.opponentScore = parseInt(document.getElementById('opponent-score').value) || 0;

                // Add statistics
                gameData.statistics = {
                    complete: document.getElementById('stats-complete').checked,
                    offense: {
                        totalYards: parseInt(document.getElementById('total-yards').value) || 0,
                        passingYards: parseInt(document.getElementById('passing-yards').value) || 0,
                        rushingYards: parseInt(document.getElementById('rushing-yards').value) || 0,
                        touchdowns: parseInt(document.getElementById('touchdowns').value) || 0
                    },
                    defense: {
                        tackles: parseInt(document.getElementById('tackles').value) || 0,
                        interceptions: parseInt(document.getElementById('interceptions').value) || 0,
                        fumbleRecoveries: parseInt(document.getElementById('fumble-recoveries').value) || 0,
                        sacks: parseInt(document.getElementById('sacks').value) || 0
                    }
                };
            }

            const editIndex = form.dataset.editIndex;

            if (editIndex !== undefined) {
                this.games[editIndex] = gameData;
            } else {
                this.games.push(gameData);
            }

            await this.saveGames();
            this.renderGames();
            this.hideGameModal();

            // Update season stats and home page
            this.updateSeasonStats();
            this.updateHomePageStats();
            this.showNotification('Game saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving game:', error);
            this.showNotification('Error saving game', 'error');
        }
    }

    async saveGames() {
        try {
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                const settings = await this.firebaseService.getSettings();
                settings.games = this.games;
                await this.firebaseService.saveSettings(settings);
            } else {
                localStorage.setItem('teamGames', JSON.stringify(this.games));
            }
        } catch (error) {
            console.error('Error saving games:', error);
            throw error;
        }
    }

    // Player Management
    async loadPlayers() {
        try {
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                const settings = await this.firebaseService.getSettings();
                this.players = settings.players || [];
            } else {
                this.players = JSON.parse(localStorage.getItem('teamPlayers') || '[]');
            }
        } catch (error) {
            console.error('Error loading players:', error);
            this.players = [];
        }
    }

    renderPlayers() {
        const playersGrid = document.getElementById('players-grid');
        playersGrid.innerHTML = '';

        if (this.players.length === 0) {
            playersGrid.innerHTML = '<div class="no-data" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">No players added yet. Click "Add Player" to get started.</div>';
            return;
        }

        this.players.forEach((player, index) => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.innerHTML = `
                <div class="player-header">
                    <span class="player-name">${player.name}</span>
                    <span class="player-number">#${player.number}</span>
                </div>
                <div class="player-info">
                    <p><strong>Position:</strong> ${player.position || 'N/A'}</p>
                    <p><strong>Grade:</strong> ${player.grade || 'N/A'}</p>
                </div>
                <div class="player-stats">
                    <div class="stat-item">
                        <div class="stat-value">${player.touchdowns || 0}</div>
                        <div class="stat-label">TDs</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.yards || 0}</div>
                        <div class="stat-label">Yards</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.tackles || 0}</div>
                        <div class="stat-label">Tackles</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.interceptions || 0}</div>
                        <div class="stat-label">INTs</div>
                    </div>
                </div>
                <div class="player-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.editPlayer(${index})">Edit</button>
                    <button class="btn btn-danger" onclick="adminPanel.deletePlayer(${index})">Delete</button>
                </div>
            `;
            playersGrid.appendChild(playerCard);
        });
    }

    showPlayerModal(playerIndex = null) {
        const modal = document.getElementById('player-modal');
        const form = document.getElementById('player-form');
        const title = document.getElementById('player-modal-title');

        form.reset();

        if (playerIndex !== null) {
            title.textContent = 'Edit Player';
            const player = this.players[playerIndex];
            document.getElementById('player-name').value = player.name;
            document.getElementById('player-number').value = player.number;
            document.getElementById('player-position').value = player.position || '';
            document.getElementById('player-grade').value = player.grade || '6th';
            document.getElementById('player-tds').value = player.touchdowns || 0;
            document.getElementById('player-yards').value = player.yards || 0;
            document.getElementById('player-tackles').value = player.tackles || 0;
            document.getElementById('player-ints').value = player.interceptions || 0;

            form.dataset.editIndex = playerIndex;
        } else {
            title.textContent = 'Add Player';
            delete form.dataset.editIndex;
        }

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    hidePlayerModal() {
        const modal = document.getElementById('player-modal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    editPlayer(index) {
        this.showPlayerModal(index);
    }

    async deletePlayer(index) {
        if (confirm('Are you sure you want to delete this player?')) {
            this.players.splice(index, 1);
            await this.savePlayers();
            this.renderPlayers();
            this.showNotification('Player deleted successfully!', 'success');
        }
    }

    async savePlayer() {
        try {
            const form = document.getElementById('player-form');
            const playerData = {
                name: document.getElementById('player-name').value,
                number: parseInt(document.getElementById('player-number').value),
                position: document.getElementById('player-position').value,
                grade: document.getElementById('player-grade').value,
                touchdowns: parseInt(document.getElementById('player-tds').value) || 0,
                yards: parseInt(document.getElementById('player-yards').value) || 0,
                tackles: parseInt(document.getElementById('player-tackles').value) || 0,
                interceptions: parseInt(document.getElementById('player-ints').value) || 0
            };

            const editIndex = form.dataset.editIndex;

            if (editIndex !== undefined) {
                this.players[editIndex] = playerData;
            } else {
                this.players.push(playerData);
            }

            await this.savePlayers();
            this.renderPlayers();
            this.hidePlayerModal();
            this.showNotification('Player saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving player:', error);
            this.showNotification('Error saving player', 'error');
        }
    }

    async savePlayers() {
        try {
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                const settings = await this.firebaseService.getSettings();
                settings.players = this.players;
                await this.firebaseService.saveSettings(settings);
            } else {
                localStorage.setItem('teamPlayers', JSON.stringify(this.players));
            }
        } catch (error) {
            console.error('Error saving players:', error);
            throw error;
        }
    }

    // Content Management
    async loadContentData() {
        try {
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                const settings = await this.firebaseService.getSettings();
                this.contentData = settings.contentData || {};
            } else {
                this.contentData = JSON.parse(localStorage.getItem('contentData') || '{}');
            }
        } catch (error) {
            console.error('Error loading content data:', error);
            this.contentData = {};
        }
    }

    populateContentForm() {
        document.getElementById('hero-title').value = this.contentData.heroTitle || '🏆 Welcome Steelers! 🏆';
        document.getElementById('hero-subtitle').value = this.contentData.heroSubtitle || 'The Steelers organization believes that collaboration makes all things better. This GamePlan tool empowers our coaching staff to design, share, and perfect plays together - because great teams are built on great teamwork.';
        document.getElementById('coach-greeting').value = this.contentData.coachGreeting || 'Let\'s create championship plays together! 🥇';
        document.getElementById('season-highlights').value = this.contentData.seasonHighlights || '';

        this.renderFeatureCardsEditor();
    }

    renderFeatureCardsEditor() {
        const container = document.getElementById('feature-cards-editor');
        container.innerHTML = '';

        const featureCards = this.contentData.featureCards || [
            { icon: '📊', title: 'Dynamic Play Charting', description: 'Create and edit plays with our interactive canvas system' },
            { icon: '📚', title: 'Play Library', description: 'Organize and manage all your team\'s plays in one place' },
            { icon: '👥', title: 'Team Collaboration', description: 'Work together with your coaching staff in real-time' },
            { icon: '📱', title: 'Mobile Friendly', description: 'Access your plays anywhere with responsive design' }
        ];

        featureCards.forEach((card, index) => {
            const cardEditor = document.createElement('div');
            cardEditor.className = 'feature-card-editor';
            cardEditor.innerHTML = `
                <div class="feature-card-header">
                    <span class="feature-card-title">Feature Card ${index + 1}</span>
                    <button type="button" class="remove-feature-btn" onclick="adminPanel.removeFeatureCard(${index})">Remove</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Icon (emoji)</label>
                        <input type="text" id="card-icon-${index}" value="${card.icon}" maxlength="2" />
                    </div>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="card-title-${index}" value="${card.title}" />
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="card-description-${index}" rows="2">${card.description}</textarea>
                </div>
            `;
            container.appendChild(cardEditor);
        });
    }

    addFeatureCard() {
        if (!this.contentData.featureCards) {
            this.contentData.featureCards = [];
        }

        this.contentData.featureCards.push({
            icon: '⭐',
            title: 'New Feature',
            description: 'Description of this feature'
        });

        this.renderFeatureCardsEditor();
    }

    removeFeatureCard(index) {
        if (!this.contentData.featureCards) return;

        this.contentData.featureCards.splice(index, 1);
        this.renderFeatureCardsEditor();
    }

    async updateContent() {
        try {
            // Collect feature cards data
            const featureCards = [];
            const cardEditors = document.querySelectorAll('.feature-card-editor');

            cardEditors.forEach((editor, index) => {
                const icon = document.getElementById(`card-icon-${index}`).value;
                const title = document.getElementById(`card-title-${index}`).value;
                const description = document.getElementById(`card-description-${index}`).value;

                featureCards.push({ icon, title, description });
            });

            this.contentData = {
                heroTitle: document.getElementById('hero-title').value,
                heroSubtitle: document.getElementById('hero-subtitle').value,
                coachGreeting: document.getElementById('coach-greeting').value,
                seasonHighlights: document.getElementById('season-highlights').value,
                featureCards: featureCards,
                lastUpdated: new Date().toISOString()
            };

            if (this.firebaseService && this.firebaseService.isInitialized()) {
                const settings = await this.firebaseService.getSettings();
                settings.contentData = this.contentData;
                await this.firebaseService.saveSettings(settings);
            } else {
                localStorage.setItem('contentData', JSON.stringify(this.contentData));
            }

            this.showNotification('Content updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating content:', error);
            this.showNotification('Error updating content', 'error');
        }
    }

    // Settings Management
    async loadSettings() {
        try {
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                const data = await this.firebaseService.getSettings();
                this.settings = data.appSettings || {};
            } else {
                this.settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = {};
        }
    }

    populateSettingsForm() {
        document.getElementById('show-player-stats').checked = this.settings.showPlayerStats !== false;
        document.getElementById('show-schedule').checked = this.settings.showSchedule !== false;
        document.getElementById('public-scores').checked = this.settings.publicScores !== false;
    }

    async changePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (currentPassword !== this.adminPassword) {
            this.showNotification('Current password is incorrect', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showNotification('New password must be at least 8 characters long', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('Password confirmation does not match', 'error');
            return;
        }

        this.adminPassword = newPassword;
        localStorage.setItem('adminPassword', newPassword);

        // Clear form
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';

        this.showNotification('Password changed successfully!', 'success');
    }

    async saveSettings() {
        try {
            this.settings = {
                showPlayerStats: document.getElementById('show-player-stats').checked,
                showSchedule: document.getElementById('show-schedule').checked,
                publicScores: document.getElementById('public-scores').checked,
                lastUpdated: new Date().toISOString()
            };

            if (this.firebaseService && this.firebaseService.isInitialized()) {
                const data = await this.firebaseService.getSettings();
                data.appSettings = this.settings;
                await this.firebaseService.saveSettings(data);
            } else {
                localStorage.setItem('appSettings', JSON.stringify(this.settings));
            }

            this.showNotification('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings', 'error');
        }
    }

    async exportData() {
        try {
            const exportData = {
                season: JSON.parse(localStorage.getItem('seasonData') || '{}'),
                games: JSON.parse(localStorage.getItem('teamGames') || '[]'),
                players: JSON.parse(localStorage.getItem('teamPlayers') || '[]'),
                content: JSON.parse(localStorage.getItem('contentData') || '{}'),
                settings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
                plays: JSON.parse(localStorage.getItem('footballPlays') || '[]'),
                customLineups: JSON.parse(localStorage.getItem('customLineups') || '[]'),
                exportDate: new Date().toISOString()
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `steelers_gameplan_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Error exporting data', 'error');
        }
    }

    async createBackup() {
        try {
            // Same as export but save to a backup location or Firebase
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                const backupData = {
                    season: JSON.parse(localStorage.getItem('seasonData') || '{}'),
                    games: JSON.parse(localStorage.getItem('teamGames') || '[]'),
                    players: JSON.parse(localStorage.getItem('teamPlayers') || '[]'),
                    content: JSON.parse(localStorage.getItem('contentData') || '{}'),
                    settings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
                    backupDate: new Date().toISOString()
                };

                // Save backup to Firebase with timestamp
                const backupId = `backup_${Date.now()}`;
                // This would require extending FirebaseService to handle backups
                // For now, we'll just export locally
                this.exportData();
            } else {
                this.exportData();
            }
        } catch (error) {
            console.error('Error creating backup:', error);
            this.showNotification('Error creating backup', 'error');
        }
    }

    clearCache() {
        if (confirm('Are you sure you want to clear all cached data? This will not affect your saved data but may require reloading content.')) {
            // Clear browser cache for the app
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name);
                    });
                });
            }

            this.showNotification('Cache cleared successfully!', 'success');
        }
    }

    // Archive System
    async loadArchivedSeasons() {
        try {
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                const settings = await this.firebaseService.getSettings();
                this.archivedSeasons = settings.archivedSeasons || [];
            } else {
                this.archivedSeasons = JSON.parse(localStorage.getItem('archivedSeasons') || '[]');
            }
        } catch (error) {
            console.error('Error loading archived seasons:', error);
            this.archivedSeasons = [];
        }
    }

    updateArchiveStats() {
        const seasonData = JSON.parse(localStorage.getItem('seasonData') || '{}');
        const games = JSON.parse(localStorage.getItem('teamGames') || '[]');
        const players = JSON.parse(localStorage.getItem('teamPlayers') || '[]');
        const plays = JSON.parse(localStorage.getItem('footballPlays') || '[]');

        const wins = seasonData.wins || 0;
        const losses = seasonData.losses || 0;

        document.getElementById('archive-record').textContent = `${wins}-${losses}`;
        document.getElementById('archive-games').textContent = games.length;
        document.getElementById('archive-players').textContent = players.length;
        document.getElementById('archive-plays').textContent = plays.length;
    }

    renderArchivedSeasons() {
        const container = document.getElementById('archived-seasons');
        container.innerHTML = '';

        if (this.archivedSeasons.length === 0) {
            container.innerHTML = '<p class="no-data">No archived seasons yet.</p>';
            return;
        }

        this.archivedSeasons.forEach((season, index) => {
            const seasonDiv = document.createElement('div');
            seasonDiv.className = 'archived-season';
            seasonDiv.innerHTML = `
                <div class="archive-info">
                    <h4>${season.name}</h4>
                    <p><strong>Record:</strong> ${season.wins}-${season.losses}</p>
                    <p><strong>Archived:</strong> ${new Date(season.archiveDate).toLocaleDateString()}</p>
                    <p><strong>Games:</strong> ${season.gamesCount} • <strong>Players:</strong> ${season.playersCount}</p>
                </div>
                <div class="archive-actions">
                    <button class="btn btn-info btn-small" onclick="adminPanel.viewArchivedSeason(${index})">View</button>
                    <button class="btn btn-secondary btn-small" onclick="adminPanel.exportArchivedSeason(${index})">Export</button>
                    <button class="btn btn-danger btn-small" onclick="adminPanel.deleteArchivedSeason(${index})">Delete</button>
                </div>
            `;
            container.appendChild(seasonDiv);
        });
    }

    async archiveSeason() {
        const archiveName = document.getElementById('archive-name').value;

        if (!archiveName.trim()) {
            this.showNotification('Please enter an archive name', 'error');
            return;
        }

        if (!confirm('Are you sure you want to archive the current season? This will reset all current data for a new season.')) {
            return;
        }

        try {
            // Collect current season data
            const seasonData = JSON.parse(localStorage.getItem('seasonData') || '{}');
            const games = JSON.parse(localStorage.getItem('teamGames') || '[]');
            const players = JSON.parse(localStorage.getItem('teamPlayers') || '[]');

            const archivedSeason = {
                name: archiveName,
                year: seasonData.year || new Date().getFullYear(),
                wins: seasonData.wins || 0,
                losses: seasonData.losses || 0,
                standing: seasonData.standing || '',
                motto: seasonData.motto || '',
                games: games,
                players: players,
                gamesCount: games.length,
                playersCount: players.length,
                archiveDate: new Date().toISOString()
            };

            this.archivedSeasons.push(archivedSeason);
            await this.saveArchivedSeasons();

            // Reset current season data
            await this.resetSeasonData();

            // Update UI
            this.renderArchivedSeasons();
            this.updateArchiveStats();
            document.getElementById('archive-name').value = '';

            this.showNotification('Season archived successfully! Ready for new season.', 'success');
        } catch (error) {
            console.error('Error archiving season:', error);
            this.showNotification('Error archiving season', 'error');
        }
    }

    async resetSeasonData() {
        const newSeasonData = {
            year: new Date().getFullYear(),
            wins: 0,
            losses: 0,
            standing: '1st Place - Bayou Division',
            motto: 'Steel Strong, Houma Proud!'
        };

        // Reset players stats but keep roster
        const currentPlayers = JSON.parse(localStorage.getItem('teamPlayers') || '[]');
        const resetPlayers = currentPlayers.map(player => ({
            ...player,
            touchdowns: 0,
            yards: 0,
            tackles: 0,
            interceptions: 0
        }));

        localStorage.setItem('seasonData', JSON.stringify(newSeasonData));
        localStorage.setItem('teamGames', JSON.stringify([]));
        localStorage.setItem('teamPlayers', JSON.stringify(resetPlayers));

        if (this.firebaseService && this.firebaseService.isInitialized()) {
            const settings = await this.firebaseService.getSettings();
            settings.seasonData = newSeasonData;
            settings.games = [];
            settings.players = resetPlayers;
            await this.firebaseService.saveSettings(settings);
        }
    }

    async saveArchivedSeasons() {
        try {
            if (this.firebaseService && this.firebaseService.isInitialized()) {
                const settings = await this.firebaseService.getSettings();
                settings.archivedSeasons = this.archivedSeasons;
                await this.firebaseService.saveSettings(settings);
            } else {
                localStorage.setItem('archivedSeasons', JSON.stringify(this.archivedSeasons));
            }
        } catch (error) {
            console.error('Error saving archived seasons:', error);
            throw error;
        }
    }

    viewArchivedSeason(index) {
        const season = this.archivedSeasons[index];

        // Create a modal to display archived season data
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <h3>${season.name}</h3>
                <div class="archive-details">
                    <p><strong>Year:</strong> ${season.year}</p>
                    <p><strong>Record:</strong> ${season.wins}-${season.losses}</p>
                    <p><strong>Standing:</strong> ${season.standing}</p>
                    <p><strong>Games:</strong> ${season.gamesCount}</p>
                    <p><strong>Players:</strong> ${season.playersCount}</p>
                    <p><strong>Archived:</strong> ${new Date(season.archiveDate).toLocaleDateString()}</p>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    exportArchivedSeason(index) {
        const season = this.archivedSeasons[index];

        const dataStr = JSON.stringify(season, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${season.name.replace(/[^a-zA-Z0-9]/g, '_')}_archive.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Archived season exported successfully!', 'success');
    }

    async deleteArchivedSeason(index) {
        if (confirm('Are you sure you want to delete this archived season? This cannot be undone.')) {
            this.archivedSeasons.splice(index, 1);
            await this.saveArchivedSeasons();
            this.renderArchivedSeasons();
            this.showNotification('Archived season deleted successfully!', 'success');
        }
    }

    // Utility Methods
    updateUI() {
        // Update any UI elements that show data from multiple sources
        this.renderGames();
        this.renderPlayers();
        this.populateContentForm();
        this.populateSettingsForm();
        this.renderArchivedSeasons();
        this.updateArchiveStats();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'var(--admin-success)' :
                type === 'error' ? 'var(--admin-danger)' :
                    type === 'warning' ? 'var(--admin-warning)' : 'var(--admin-info)'};
            color: white;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Teams Management Methods
    async loadTeams() {
        try {
            const teams = await this.firebaseService.getTeams();
            this.teams = teams || [];
            console.log('Loaded teams from Firebase:', this.teams.length, this.teams);
        } catch (error) {
            console.warn('Failed to load teams from Firebase, using localStorage');
            this.teams = JSON.parse(localStorage.getItem('adminTeams')) || [];
            console.log('Loaded teams from localStorage:', this.teams.length, this.teams);
        }

        // If no teams exist, populate with some default teams for the league
        if (this.teams.length === 0) {
            this.teams = this.getDefaultTeams();
            console.log('Using default teams:', this.teams.length);
            // Save the default teams
            try {
                await this.firebaseService.saveTeams(this.teams);
            } catch (error) {
                console.warn('Failed to save default teams to Firebase');
            }
            localStorage.setItem('adminTeams', JSON.stringify(this.teams));
        }

        this.renderTeams();
    }

    getDefaultTeams() {
        return [
            // East Side Division
            {
                id: 'team_east_1',
                name: 'East Houma Steelers',
                division: 'East Side',
                primaryColor: '#000000',
                secondaryColor: '#FF6B35',
                location: 'East Houma Recreation Center',
                coach: 'Coach Staff',
                notes: 'Our team - defending champions!',
                createdAt: new Date().toISOString()
            },
            {
                id: 'team_east_2',
                name: 'Thibodaux Tigers',
                division: 'East Side',
                primaryColor: '#FF4500',
                secondaryColor: '#000000',
                location: 'Thibodaux Community Center',
                coach: 'Coach Johnson',
                notes: 'Strong running game',
                createdAt: new Date().toISOString()
            },
            {
                id: 'team_east_3',
                name: 'Bayou Bulldogs',
                division: 'East Side',
                primaryColor: '#8B4513',
                secondaryColor: '#FFFFFF',
                location: 'Bayou Stadium',
                coach: 'Coach Williams',
                notes: 'Tough defense',
                createdAt: new Date().toISOString()
            },
            // West Side Division
            {
                id: 'team_west_1',
                name: 'Morgan City Mariners',
                division: 'West Side',
                primaryColor: '#000080',
                secondaryColor: '#FFFFFF',
                location: 'Morgan City Sports Complex',
                coach: 'Coach Davis',
                notes: 'Fast offense',
                createdAt: new Date().toISOString()
            },
            {
                id: 'team_west_2',
                name: 'Raceland Rams',
                division: 'West Side',
                primaryColor: '#228B22',
                secondaryColor: '#FFD700',
                location: 'Raceland High School',
                coach: 'Coach Brown',
                notes: 'Balanced team',
                createdAt: new Date().toISOString()
            },
            {
                id: 'team_west_3',
                name: 'Lockport Lions',
                division: 'West Side',
                primaryColor: '#8B008B',
                secondaryColor: '#FFFFFF',
                location: 'Lockport Middle School',
                coach: 'Coach Wilson',
                notes: 'Young but determined',
                createdAt: new Date().toISOString()
            }
        ];
    }

    renderTeams() {
        const eastTeamsContainer = document.getElementById('east-teams');
        const westTeamsContainer = document.getElementById('west-teams');

        // Clear containers
        eastTeamsContainer.innerHTML = '';
        westTeamsContainer.innerHTML = '';

        const eastTeams = this.teams.filter(team => team.division === 'East Side');
        const westTeams = this.teams.filter(team => team.division === 'West Side');

        // Render East Side teams
        if (eastTeams.length === 0) {
            eastTeamsContainer.innerHTML = `
                <div class="empty-division">
                    <p>No teams in East Side Division yet</p>
                    <p>Add your first team to get started</p>
                    <button class="btn btn-primary" onclick="adminPanel.showTeamModal('East Side')">+ Add East Side Team</button>
                </div>
            `;
        } else {
            eastTeams.forEach(team => {
                eastTeamsContainer.appendChild(this.createTeamCard(team));
            });
        }

        // Render West Side teams
        if (westTeams.length === 0) {
            westTeamsContainer.innerHTML = `
                <div class="empty-division">
                    <p>No teams in West Side Division yet</p>
                    <p>Add your first team to get started</p>
                    <button class="btn btn-primary" onclick="adminPanel.showTeamModal('West Side')">+ Add West Side Team</button>
                </div>
            `;
        } else {
            westTeams.forEach(team => {
                westTeamsContainer.appendChild(this.createTeamCard(team));
            });
        }
    }

    createTeamCard(team) {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.style.setProperty('--team-primary', team.primaryColor || '#000000');
        card.style.setProperty('--team-secondary', team.secondaryColor || '#ffffff');

        console.log('Creating team card for:', team.name, 'with ID:', team.id);

        card.innerHTML = `
            <div class="team-header">
                <h4 class="team-name">${team.name}</h4>
                <div class="team-colors">
                    <div class="color-dot" style="background-color: ${team.primaryColor}"></div>
                    <div class="color-dot" style="background-color: ${team.secondaryColor}"></div>
                </div>
            </div>
            <div class="team-info">
                <p><strong>Division:</strong> ${team.division} Division</p>
                ${team.location ? `<p><strong>Home Field:</strong> ${team.location}</p>` : ''}
                ${team.coach ? `<p><strong>Coach:</strong> ${team.coach}</p>` : ''}
                ${team.notes ? `<p><strong>Notes:</strong> ${team.notes}</p>` : ''}
            </div>
            <div class="team-actions">
                <button class="btn btn-info btn-sm" onclick="adminPanel.editTeam('${team.id}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteTeam('${team.id}')">🗑️ Delete</button>
            </div>
        `;

        return card;
    }

    showTeamModal(presetDivision = '') {
        console.log('showTeamModal called with division:', presetDivision);
        const modal = document.getElementById('team-modal');
        const title = document.getElementById('team-modal-title');

        if (!modal) {
            console.error('Team modal not found!');
            return;
        }

        title.textContent = 'Add New Team';
        this.clearTeamForm();

        // Preset division if provided
        if (presetDivision) {
            console.log('Setting preset division:', presetDivision);
            document.getElementById('team-division').value = presetDivision;
        }

        console.log('Displaying modal');
        modal.style.display = 'flex';
        setTimeout(() => {
            document.getElementById('team-name').focus();
        }, 100);
    }

    hideTeamModal() {
        const modal = document.getElementById('team-modal');
        modal.style.display = 'none';
        this.clearTeamForm();
    }

    clearTeamForm() {
        console.log('clearTeamForm called');
        const form = document.getElementById('team-form');
        if (form) {
            form.reset();
            document.getElementById('team-primary-color').value = '#000000';
            document.getElementById('team-secondary-color').value = '#ffffff';
            // Remove edit mode data
            delete form.dataset.editingId;
            console.log('Team form cleared');
        } else {
            console.error('Team form not found!');
        }
    }

    async saveTeam() {
        console.log('saveTeam called');
        const form = document.getElementById('team-form');
        const editingId = form.dataset.editingId;

        console.log('Form editing ID:', editingId);

        // Validate required fields
        const teamName = document.getElementById('team-name').value;
        const teamDivision = document.getElementById('team-division').value;

        console.log('Team name:', teamName);
        console.log('Team division:', teamDivision);

        if (!teamName || !teamDivision) {
            console.log('Validation failed - missing required fields');
            this.showNotification('Please fill in all required fields (Team Name and Division)', 'error');
            return;
        }

        const teamData = {
            id: editingId || 'team_' + Date.now(),
            name: teamName,
            division: teamDivision,
            primaryColor: document.getElementById('team-primary-color').value,
            secondaryColor: document.getElementById('team-secondary-color').value,
            location: document.getElementById('team-location').value,
            coach: document.getElementById('team-coach').value,
            notes: document.getElementById('team-notes').value,
            createdAt: editingId ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        console.log('Team data to save:', teamData);

        console.log('Team data to save:', teamData);

        try {
            console.log('Teams before save:', this.teams.length);

            if (editingId) {
                // Update existing team
                console.log('Updating existing team with ID:', editingId);
                const index = this.teams.findIndex(t => t.id === editingId);
                console.log('Found team at index:', index);
                if (index !== -1) {
                    this.teams[index] = { ...this.teams[index], ...teamData };
                    console.log('Updated team:', this.teams[index]);
                }
            } else {
                // Add new team
                console.log('Adding new team');
                this.teams.push(teamData);
                console.log('New teams array length:', this.teams.length);
            }

            console.log('Attempting to save to Firebase...');
            // Save to Firebase
            if (this.firebaseService) {
                await this.firebaseService.saveTeams(this.teams);
                console.log('Firebase save successful');
            } else {
                console.warn('Firebase service not available');
            }

            // Save to localStorage as backup
            localStorage.setItem('adminTeams', JSON.stringify(this.teams));
            console.log('Saved to localStorage');

            this.renderTeams();
            console.log('Teams rendered');

            this.hideTeamModal();
            console.log('Modal hidden');

            this.showNotification(editingId ? 'Team updated successfully!' : 'Team added successfully!');

            // Update schedule opponent options
            this.updateOpponentOptions();

        } catch (error) {
            console.error('Failed to save team:', error);
            this.showNotification('Failed to save team. Please try again.', 'error');
        }
    }

    editTeam(teamId) {
        console.log('editTeam called with ID:', teamId);
        const team = this.teams.find(t => t.id === teamId);
        if (!team) {
            console.error('Team not found with ID:', teamId);
            this.showNotification('Team not found. Please refresh and try again.', 'error');
            return;
        }

        console.log('Found team to edit:', team.name);

        // Populate form with team data
        document.getElementById('team-name').value = team.name || '';
        document.getElementById('team-division').value = team.division || '';
        document.getElementById('team-primary-color').value = team.primaryColor || '#000000';
        document.getElementById('team-secondary-color').value = team.secondaryColor || '#ffffff';
        document.getElementById('team-location').value = team.location || '';
        document.getElementById('team-coach').value = team.coach || '';
        document.getElementById('team-notes').value = team.notes || '';

        console.log('Form populated with team data');

        // Set editing mode
        const form = document.getElementById('team-form');
        form.dataset.editingId = teamId;
        console.log('Set form editing ID to:', teamId);

        // Update modal title and show
        document.getElementById('team-modal-title').textContent = 'Edit Team';
        document.getElementById('team-modal').style.display = 'flex';
        console.log('Modal displayed for editing');
    }

    async deleteTeam(teamId) {
        console.log('Attempting to delete team with ID:', teamId);

        const team = this.teams.find(t => t.id === teamId);
        if (!team) {
            console.error('Team not found with ID:', teamId);
            this.showNotification('Team not found. Please refresh and try again.', 'error');
            return;
        }

        console.log('Found team to delete:', team.name);

        if (confirm(`Are you sure you want to delete ${team.name}? This action cannot be undone.`)) {
            try {
                console.log('Teams before deletion:', this.teams.length);

                // Remove from teams array
                this.teams = this.teams.filter(t => t.id !== teamId);

                console.log('Teams after deletion:', this.teams.length);

                // Save to Firebase
                if (this.firebaseService) {
                    try {
                        await this.firebaseService.saveTeams(this.teams);
                        console.log('Successfully saved to Firebase');
                    } catch (firebaseError) {
                        console.warn('Firebase save failed, continuing with localStorage:', firebaseError);
                    }
                }

                // Save to localStorage as backup
                localStorage.setItem('adminTeams', JSON.stringify(this.teams));
                console.log('Saved to localStorage');

                this.renderTeams();
                this.showNotification('Team deleted successfully!');

                // Update schedule opponent options
                this.updateOpponentOptions();

            } catch (error) {
                console.error('Failed to delete team:', error);
                this.showNotification('Failed to delete team. Please try again.', 'error');
            }
        }
    }

    updateOpponentOptions() {
        // Update the opponent dropdown in the schedule form
        const opponentSelect = document.getElementById('game-opponent');
        if (opponentSelect && opponentSelect.tagName === 'SELECT') {
            // Convert to select if it's still an input
            const currentValue = opponentSelect.value;
            opponentSelect.innerHTML = '<option value="">Select Opponent</option>';

            this.teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.name;
                option.textContent = `${team.name} (${team.division})`;
                opponentSelect.appendChild(option);
            });

            opponentSelect.value = currentValue;
        }
    }
}