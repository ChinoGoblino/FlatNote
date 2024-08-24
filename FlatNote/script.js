// Load songs from localStorage or initialize an empty array
let songs = JSON.parse(localStorage.getItem('songs')) || [];
let currentSong = null;
let mediaRecorder;
let audioChunks = [];

// DOM elements
const songListElement = document.getElementById('songList');
const songTitleElement = document.getElementById('songTitle');
const lyricsElement = document.getElementById('lyrics');
const recordBtn = document.getElementById('recordBtn');
const playBtn = document.getElementById('playBtn');
const firstRecordedElement = document.getElementById('firstRecorded');
const lastRecordedElement = document.getElementById('lastRecorded');

// Event listeners
document.getElementById('addSongBtn').addEventListener('click', addSong);
recordBtn.addEventListener('click', toggleRecording);
playBtn.addEventListener('click', playRecording);

// Initialize the song list on page load
updateSongList();
recordBtn.disabled = true;
playBtn.disabled = true;

function addSong() {
    const title = prompt('Enter song title:');
    const lyrics = prompt('Enter song lyrics:');
    
    if (title && lyrics) {
        const song = {
            id: Date.now(),
            title: title,
            lyrics: lyrics,
            recordings: []
        };
        songs.push(song);
        saveSongs();
        updateSongList();
        alert('Song added successfully!');
    } else {
        alert('Title and lyrics are required to add a song.');
    }
}

function updateSongList() {
    songListElement.innerHTML = '';
    songs.forEach(song => {
        const li = document.createElement('li');
        li.textContent = song.title;
        li.addEventListener('click', () => selectSong(song));
        songListElement.appendChild(li);
    });
}

function selectSong(song) {
    currentSong = song;
    songTitleElement.textContent = song.title;
    lyricsElement.textContent = song.lyrics;
    updateDates();
    recordBtn.disabled = false;
    playBtn.disabled = song.recordings.length === 0;
}

function toggleRecording() {
    if (!currentSong) return;

    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordBtn.textContent = 'Record';
    } else {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = saveRecording;
                audioChunks = [];
                mediaRecorder.start();
                recordBtn.textContent = 'Stop Recording';
                alert('Recording started!');
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                alert('Failed to access microphone. Please check your permissions.');
            });
    }
}

function saveRecording() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = function() {
        const base64data = reader.result;
        currentSong.recordings.push({
            data: base64data,
            date: new Date().toISOString()
        });
        saveSongs();
        updateDates();
        playBtn.disabled = false;
        alert('Recording saved!');
    };
}

function playRecording() {
    if (currentSong && currentSong.recordings.length > 0) {
        const latestRecording = currentSong.recordings[currentSong.recordings.length - 1];
        const audio = new Audio(latestRecording.data);
        audio.play();
    } else {
        alert('No recording available to play.');
    }
}

function updateDates() {
    const firstRecorded = currentSong.recordings[0]?.date || 'N/A';
    const lastRecorded = currentSong.recordings[currentSong.recordings.length - 1]?.date || 'N/A';
    firstRecordedElement.textContent = firstRecorded;
    lastRecordedElement.textContent = lastRecorded;
}

function saveSongs() {
    localStorage.setItem('songs', JSON.stringify(songs));
}
