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
                this.loadContentData(),
                this.loadSettings(),
                this.loadArchivedSeasons()
            ]);

            this.updateUI();
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

            // Show score section if completed
            if (game.status === 'completed') {
                document.querySelector('.score-section').style.display = 'block';
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
        }
    }

    toggleScoreSection(status) {
        const scoreSection = document.querySelector('.score-section');
        scoreSection.style.display = status === 'completed' ? 'block' : 'none';
    }

    async saveGame() {
        try {
            const form = document.getElementById('game-form');
            const gameData = {
                week: document.getElementById('game-week').value,
                date: document.getElementById('game-date').value,
                opponent: document.getElementById('game-opponent').value,
                location: document.getElementById('game-location').value,
                time: document.getElementById('game-time').value,
                status: document.getElementById('game-status').value,
                highlights: document.getElementById('game-highlights').value,
                showScore: document.getElementById('show-score').checked
            };

            // Add scores if completed
            if (gameData.status === 'completed') {
                gameData.steelersScore = parseInt(document.getElementById('steelers-score').value) || 0;
                gameData.opponentScore = parseInt(document.getElementById('opponent-score').value) || 0;
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
}