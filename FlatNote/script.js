var jsmediatags = window.jsmediatags;
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
recordBtn.addEventListener('click', toggleRecording);
playBtn.addEventListener('click', playRecording);

// Initialize the song list on page load
updateSongList();
recordBtn.disabled = true;
playBtn.disabled = true;

document.getElementById('mp3File').addEventListener('change', function(event) {
    songs = [];
    const file = event.target.files[0];

    if (!file) {
        alert('No file selected.');
        return;
    }
    let song = {};

    jsmediatags.read(file, {
        onSuccess: function(tag) {
            const tags = tag.tags;
            song.title = tags.title || 'N/A';
            song.artist = tags.artist || 'N/A';
            song.album = tags.album || 'N/A';
            song.year = tags.year || 'N/A';
        },
        onError: function(error) {
            console.error('Error reading metadata:', error);
            alert('Failed to read metadata.');
        }
    });
    songs.push(song);
    saveSongs();
    updateSongList();
});

function updateSongList() {
    songListElement.innerHTML = '';
    for (let i = 0; i < songs.length; i++) {
        const li = document.createElement('li');
        setTimeout(() => {
            li.textContent = songs[i].title;
        }, 200);
        li.addEventListener('click', () => selectSong(songs[i]));
        songListElement.appendChild(li);
    }
}

async function fetchLyrics(artist, title) {
    try {
        const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
        if (!response.ok) {
            throw new Error('Lyrics not found');
        }
        const data = await response.json();
        return data.lyrics;
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        return 'Lyrics not found';
    }
}

function selectSong(song) {
    currentSong = song;
    songTitleElement.textContent = song.title;
    lyricsElement.textContent = fetchLyrics(song.artist, song.title);
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
                mediaRecorder = new MediaRecorder(stream); // Simplified initialization
                audioChunks = []; // Clear previous chunks

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    saveRecording();
                };

                mediaRecorder.start();
                recordBtn.textContent = 'Stop Recording';
                alert('Recording started!');
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                alert(`Failed to access microphone: ${error.name}. Please check your microphone permissions in the browser settings.`);
            });
    }
}

function saveRecording() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' });
    const reader = new FileReader();

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

    reader.readAsDataURL(audioBlob);
}

function playRecording() {
    if (currentSong && currentSong.recordings.length > 0) {
        const latestRecording = currentSong.recordings[currentSong.recordings.length - 1];
        const audio = new Audio(latestRecording.data);
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
            alert('Failed to play recording.');
        });
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
