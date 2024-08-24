<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta http-equiv="Content-Style-Type" content="text/css">
  <title></title>
  <meta name="Generator" content="Cocoa HTML Writer">
  <meta name="CocoaVersion" content="2487.7">
  <style type="text/css">
    p.p1 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px Helvetica}
    p.p2 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px Helvetica; min-height: 14.0px}
  </style>
</head>
<body>
<p class="p1">let songs = JSON.parse(localStorage.getItem('songs')) || [];</p>
<p class="p1">let currentSong = null;</p>
<p class="p1">let mediaRecorder;</p>
<p class="p1">let audioChunks = [];</p>
<p class="p2"><br></p>
<p class="p1">document.getElementById('addSongBtn').addEventListener('click', addSong);</p>
<p class="p1">document.getElementById('recordBtn').addEventListener('click', toggleRecording);</p>
<p class="p1">document.getElementById('playBtn').addEventListener('click', playRecording);</p>
<p class="p2"><br></p>
<p class="p1">function addSong() {</p>
<p class="p1"><span class="Apple-converted-space">    </span>const title = prompt('Enter song title:');</p>
<p class="p1"><span class="Apple-converted-space">    </span>const lyrics = prompt('Enter song lyrics:');</p>
<p class="p1"><span class="Apple-converted-space">    </span>if (title &amp;&amp; lyrics) {</p>
<p class="p1"><span class="Apple-converted-space">        </span>const song = { id: Date.now(), title, lyrics, recordings: [] };</p>
<p class="p1"><span class="Apple-converted-space">        </span>songs.push(song);</p>
<p class="p1"><span class="Apple-converted-space">        </span>saveSongs();</p>
<p class="p1"><span class="Apple-converted-space">        </span>updateSongList();</p>
<p class="p1"><span class="Apple-converted-space">    </span>}</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function updateSongList() {</p>
<p class="p1"><span class="Apple-converted-space">    </span>const songList = document.getElementById('songList');</p>
<p class="p1"><span class="Apple-converted-space">    </span>songList.innerHTML = '';</p>
<p class="p1"><span class="Apple-converted-space">    </span>songs.forEach(song =&gt; {</p>
<p class="p1"><span class="Apple-converted-space">        </span>const li = document.createElement('li');</p>
<p class="p1"><span class="Apple-converted-space">        </span>li.textContent = song.title;</p>
<p class="p1"><span class="Apple-converted-space">        </span>li.addEventListener('click', () =&gt; selectSong(song));</p>
<p class="p1"><span class="Apple-converted-space">        </span>songList.appendChild(li);</p>
<p class="p1"><span class="Apple-converted-space">    </span>});</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function selectSong(song) {</p>
<p class="p1"><span class="Apple-converted-space">    </span>currentSong = song;</p>
<p class="p1"><span class="Apple-converted-space">    </span>document.getElementById('songTitle').textContent = song.title;</p>
<p class="p1"><span class="Apple-converted-space">    </span>document.getElementById('lyrics').textContent = song.lyrics;</p>
<p class="p1"><span class="Apple-converted-space">    </span>updateDates();</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function toggleRecording() {</p>
<p class="p1"><span class="Apple-converted-space">    </span>if (!currentSong) return;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>if (mediaRecorder &amp;&amp; mediaRecorder.state === 'recording') {</p>
<p class="p1"><span class="Apple-converted-space">        </span>mediaRecorder.stop();</p>
<p class="p1"><span class="Apple-converted-space">        </span>document.getElementById('recordBtn').textContent = 'Record';</p>
<p class="p1"><span class="Apple-converted-space">    </span>} else {</p>
<p class="p1"><span class="Apple-converted-space">        </span>navigator.mediaDevices.getUserMedia({ audio: true })</p>
<p class="p1"><span class="Apple-converted-space">            </span>.then(stream =&gt; {</p>
<p class="p1"><span class="Apple-converted-space">                </span>mediaRecorder = new MediaRecorder(stream);</p>
<p class="p1"><span class="Apple-converted-space">                </span>mediaRecorder.ondataavailable = event =&gt; {</p>
<p class="p1"><span class="Apple-converted-space">                    </span>audioChunks.push(event.data);</p>
<p class="p1"><span class="Apple-converted-space">                </span>};</p>
<p class="p1"><span class="Apple-converted-space">                </span>mediaRecorder.onstop = saveRecording;</p>
<p class="p1"><span class="Apple-converted-space">                </span>audioChunks = [];</p>
<p class="p1"><span class="Apple-converted-space">                </span>mediaRecorder.start();</p>
<p class="p1"><span class="Apple-converted-space">                </span>document.getElementById('recordBtn').textContent = 'Stop Recording';</p>
<p class="p1"><span class="Apple-converted-space">            </span>});</p>
<p class="p1"><span class="Apple-converted-space">    </span>}</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function saveRecording() {</p>
<p class="p1"><span class="Apple-converted-space">    </span>const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });</p>
<p class="p1"><span class="Apple-converted-space">    </span>const reader = new FileReader();</p>
<p class="p1"><span class="Apple-converted-space">    </span>reader.readAsDataURL(audioBlob);</p>
<p class="p1"><span class="Apple-converted-space">    </span>reader.onloadend = function() {</p>
<p class="p1"><span class="Apple-converted-space">        </span>const base64data = reader.result;</p>
<p class="p1"><span class="Apple-converted-space">        </span>currentSong.recordings.push({<span class="Apple-converted-space"> </span></p>
<p class="p1"><span class="Apple-converted-space">            </span>data: base64data,<span class="Apple-converted-space"> </span></p>
<p class="p1"><span class="Apple-converted-space">            </span>date: new Date().toISOString()</p>
<p class="p1"><span class="Apple-converted-space">        </span>});</p>
<p class="p1"><span class="Apple-converted-space">        </span>saveSongs();</p>
<p class="p1"><span class="Apple-converted-space">        </span>updateDates();</p>
<p class="p1"><span class="Apple-converted-space">    </span>}</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function playRecording() {</p>
<p class="p1"><span class="Apple-converted-space">    </span>if (currentSong &amp;&amp; currentSong.recordings.length &gt; 0) {</p>
<p class="p1"><span class="Apple-converted-space">        </span>const latestRecording = currentSong.recordings[currentSong.recordings.length - 1];</p>
<p class="p1"><span class="Apple-converted-space">        </span>const audio = new Audio(latestRecording.data);</p>
<p class="p1"><span class="Apple-converted-space">        </span>audio.play();</p>
<p class="p1"><span class="Apple-converted-space">    </span>}</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function updateDates() {</p>
<p class="p1"><span class="Apple-converted-space">    </span>const firstRecorded = currentSong.recordings[0]?.date || 'N/A';</p>
<p class="p1"><span class="Apple-converted-space">    </span>const lastRecorded = currentSong.recordings[currentSong.recordings.length - 1]?.date || 'N/A';</p>
<p class="p1"><span class="Apple-converted-space">    </span>document.getElementById('firstRecorded').textContent = firstRecorded;</p>
<p class="p1"><span class="Apple-converted-space">    </span>document.getElementById('lastRecorded').textContent = lastRecorded;</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function saveSongs() {</p>
<p class="p1"><span class="Apple-converted-space">    </span>localStorage.setItem('songs', JSON.stringify(songs));</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">// Initial load</p>
<p class="p1">updateSongList();</p>
</body>
</html>
