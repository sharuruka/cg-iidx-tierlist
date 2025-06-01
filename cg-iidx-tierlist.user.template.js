// ==UserScript==
// @name        CG IIDX Tierlist
// @author      CharlisMadCut
// @description Load playlists from IIDX tierlists in CG webui
// @version     <%= it.version %>
// @grant       none
// @updateURL 

// @match       https://dev.cardinal-gate.net/iidx/playlists*
// @match       https://cgate.dev/iidx/playlists*
// @match       https://www.cgate.dev/iidx/playlists*
// @match       https://ganymede-cg.net/iidx/playlists*
// @match       https://www.ganymede-cg.net/iidx/playlists*
// @match       https://nageki-cg.net/iidx/playlists*
// @match       https://www.nageki-cg.net/iidx/playlists*
// ==/UserScript==

// This will be populated at build time, see TierListData interface in types/tierlist.ts
const TIERLISTS = <%= it.tierlistObject %>;
const SLEEP_TIME_BETWEEN_REQUESTS = 250;

function getCurrentGameVersion() {
    const gameSelect = document.getElementById('game-id');
    return gameSelect.value;
}

function arePlaylistSupported() {
    const callout = document.querySelector('div.callout');
    return getCurrentGameVersion() && !(callout && callout.innerHTML.includes("does not support Playlists"))
}

function getAvailablePlaylistCount() {
    const panel = document.querySelector('.grid-container .grid-x .panel');
    return panel ? panel.querySelectorAll(':scope > div').length : 0;
}

function getPlaylistMaxSize() {
    const maxSongCountInput = document.getElementById('max-song-count');
    return maxSongCountInput ? Number(maxSongCountInput.value) : 0;
}

function getTierListsByPlayStyle(playStyle) {
    if (!TIERLISTS[playStyle]) {
        return [];
    }
    
    return TIERLISTS[playStyle];
}

function getTiersByPlayStyleAndTierListName(playStyle, tierListName) {
    return getTierListsByPlayStyle(playStyle).find((tierList) => tierList.tierListName === tierListName);
}

function getSelectedPlayStyle() {
    const playStyleSelect = document.getElementById('tierlist-play-style-select');
    return playStyleSelect.value;
}

function getSelectedTierListName() {
    const tierlistSelect = document.getElementById('tierlist-tierlist-select');
    return tierlistSelect.value;
}

function getSelectedTier() {
    const tierSelect = document.getElementById('tierlist-tier-select');
    return tierSelect.value;
}

function getStartOffset() {
    const startOffsetInput = document.getElementById('tierlist-start-offset');
    return startOffsetInput ? Number(startOffsetInput.value) : 0;
}

function getFirstPlaylistIndex() {
    const firstPlaylistInput = document.getElementById('tierlist-first-playlist');
    return firstPlaylistInput ? Number(firstPlaylistInput.value) - 1 : 0;
}

function logToFormConsole(message) {
    const consoleDiv = document.getElementById('tierlist-console');
    if (consoleDiv) {
        consoleDiv.innerHTML += `<p>${message}</p>`;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendForm(formData) {
    return fetch(window.location.href, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData.toString()
    });
}

async function deletePlaylist(playStyle, playlistIndex) {
    const formData = new URLSearchParams();
    formData.append('play_style', playStyle === 'sp' ? '0' : '1');
    formData.append('index', playlistIndex);
    formData.append('internal_ids_csv', '');
    formData.append('name', '');
    formData.append('action', 'delete');
    return sendForm(formData);
}

async function savePlaylist(playStyle, playlistIndex, songIDs, name) {
    const formData = new URLSearchParams();
    formData.append('play_style', playStyle === 'sp' ? '0' : '1');
    formData.append('index', playlistIndex);
    formData.append('internal_ids_csv', songIDs.join(','));
    formData.append('name', name);
    formData.append('action', 'save');
    return sendForm(formData);
}

async function deleteAllPlaylists() {
    const playlists = getAvailablePlaylistCount();
    let success = true;
    for (let i = 0; i < playlists; i++) {
        logToFormConsole(`Deleting playlist ${i + 1}...`);
        try {
            await deletePlaylist(getSelectedPlayStyle(), i);
            logToFormConsole('Delete successful');
            await sleep(SLEEP_TIME_BETWEEN_REQUESTS);
        } catch (error) {
            logToFormConsole(`Error: ${error.message}`);
            success = false;
        }
    }
    if (success) {
        window.location.reload();
    }
}

function formatTierName(tierName) {
    return tierName.replace('+', 'plus').replace('-', 'minus');
}

async function overwritePlaylists() {
    const selectedPlayStyle = getSelectedPlayStyle();
    const selectedTierListName = getSelectedTierListName();
    const selectedTier = getSelectedTier();
    const startOffset = getStartOffset();
    const firstPlaylistIndex = getFirstPlaylistIndex();

    logToFormConsole(`Selected playstyle: ${selectedPlayStyle}`);
    logToFormConsole(`Selected tierlist name: ${selectedTierListName}`);
    logToFormConsole(`Selected tier: ${selectedTier}`);

    const tier = getTiersByPlayStyleAndTierListName(selectedPlayStyle, selectedTierListName).tiers.find((tier) => tier.text == selectedTier);
    const maxPlaylists = getAvailablePlaylistCount();
    const maxSongsByPlaylist = getPlaylistMaxSize();

    const currentGameVersion = getCurrentGameVersion();
    const songs = tier.songs.filter((song) => song.versions.includes(currentGameVersion));

    if (songs.length === 0) {
        logToFormConsole('This tier contains no songs for the current game version');
        return;
    }
    let success = true;
    for (let i = 0; i < maxPlaylists - firstPlaylistIndex && i * maxSongsByPlaylist < songs.length - startOffset; ++i) {
        const songIDs = songs.slice(
            i * maxSongsByPlaylist + startOffset,
            (i + 1) * maxSongsByPlaylist + startOffset
        ).map((song) => song.songID);
        const playlistName = `${selectedTierListName} ${formatTierName(tier.text)} ${i + 1}`;
        const playlistIndex = i + firstPlaylistIndex;
        logToFormConsole(`Saving playlist ${playlistName}...`);
        try {
            await savePlaylist(selectedPlayStyle, playlistIndex, songIDs, playlistName);
            await sleep(SLEEP_TIME_BETWEEN_REQUESTS);
            logToFormConsole('Save successful');
        } catch (error) {
            logToFormConsole(`Error: ${error.message}`);
            success = false;
        }
    }
    if (success) {
        window.location.reload();
    }
}

function populateTierlistSelect() {
    const tierlistSelect = document.getElementById('tierlist-tierlist-select');
    tierlistSelect.innerHTML = '';
    getTierListsByPlayStyle(getSelectedPlayStyle()).forEach(tierlist => {
        const option = document.createElement('option');
        option.value = tierlist.tierListName;
        option.textContent = tierlist.tierListName;
        tierlistSelect.appendChild(option);
    });
}

function populateTierSelect() {
    const tierSelect = document.getElementById('tierlist-tier-select');
    tierSelect.innerHTML = '';
    const tiers = getTiersByPlayStyleAndTierListName(
        getSelectedPlayStyle(),
        getSelectedTierListName()
    ).tiers;
    const currentGameVersion = getCurrentGameVersion();
    for (const tier of tiers) {
        const songCount = tier.songs.filter((song) => song.versions.includes(currentGameVersion)).length;
        const option = document.createElement('option');
        option.value = tier.text;
        option.textContent = `${tier.text} (${tier.value}) ${songCount} songs`;
        tierSelect.appendChild(option);
    }
}

function insertTierlistForm() {
    const pageTitle = document.querySelector('h2.page-title');
    if (!pageTitle) return;

    // Create panel container
    const panel = document.createElement('div');
    panel.className = 'panel';

    // Create header
    const header = document.createElement('header');
    header.textContent = 'TIERLIST';

    // Create form
    const form = document.createElement('div');
    form.id = 'tierlist-form';

    // Create and populate play style select
    const playStyleSelect = document.createElement('select');
    playStyleSelect.id = 'tierlist-play-style-select';
    ['sp', 'dp'].forEach(playStyle => {
        const option = document.createElement('option');
        option.value = playStyle;
        option.textContent = playStyle.toUpperCase();
        playStyleSelect.appendChild(option);
    });

    // Create Tierlist select
    const tierlistSelect = document.createElement('select');
    tierlistSelect.id = 'tierlist-tierlist-select';

    // Create tier select
    const tierSelect = document.createElement('select');
    tierSelect.id = 'tierlist-tier-select';

    // Create start offset input
    const startOffsetInput = document.createElement('input');
    startOffsetInput.type = 'number';
    startOffsetInput.id = 'tierlist-start-offset';
    startOffsetInput.value = '0';
    startOffsetInput.min = '0';
    const startOffsetLabel = document.createElement('label');
    startOffsetLabel.textContent = 'Tierlist start offset';
    const startOffsetSmall = document.createElement('small');
    startOffsetSmall.textContent = '(Use this to skip the first songs if the whole tierlist doesn\'t fit in all the playlists.)';

    //Create first playlist input
    const firstPlaylistInput = document.createElement('input');
    firstPlaylistInput.type = 'number';
    firstPlaylistInput.id = 'tierlist-first-playlist';
    firstPlaylistInput.value = '1';
    firstPlaylistInput.min = '1';
    firstPlaylistInput.max = getAvailablePlaylistCount();
    const firstPlaylistLabel = document.createElement('label');
    firstPlaylistLabel.textContent = 'First playlist to overwrite';

    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'button';
    submitButton.textContent = 'Overwrite playlists with tierlist';
    submitButton.classList = 'button primary';
    submitButton.style.marginRight = '1rem';
    submitButton.addEventListener('click', overwritePlaylists);

    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete all playlists';
    deleteButton.classList = 'button alert';
    deleteButton.addEventListener('click', deleteAllPlaylists);

    // Create console div
    const consoleDiv = document.createElement('div');
    consoleDiv.id = 'tierlist-console';

    // Add elements to form
    form.appendChild(playStyleSelect);
    form.appendChild(tierlistSelect);
    form.appendChild(tierSelect);
    form.appendChild(startOffsetLabel);
    form.appendChild(startOffsetSmall);
    form.appendChild(startOffsetInput);
    form.appendChild(firstPlaylistLabel);
    form.appendChild(firstPlaylistInput);
    form.appendChild(submitButton);
    form.appendChild(deleteButton);
    form.appendChild(consoleDiv);

    // Add header to panel
    panel.appendChild(header);

    // Add form to panel
    panel.appendChild(form);

    // Insert panel after page title
    pageTitle.parentNode.insertBefore(panel, pageTitle.nextSibling);

    // Populate tierlist and tier select in form
    populateTierlistSelect();
    populateTierSelect();

    // Add event listeners to update tierlist and tier select when play style or tierlist changes
    playStyleSelect.addEventListener('change', () => {
        populateTierlistSelect();
        populateTierSelect();
    });
    tierlistSelect.addEventListener('change', populateTierSelect);
}

if (arePlaylistSupported()) {
    insertTierlistForm();
}
