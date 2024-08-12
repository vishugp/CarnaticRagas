import numpy as np
import pandas as pd
import os

import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

# RealTime Mic Audio
import pyaudio

# Recorded Audio
import librosa

source = "recorded"
file = r"D:\GitHub\VoicePitchAnalyser\mohanam.mp3"
print(os.path.exists(file))

# CONSTANTS FOR PYAUDIO
BUFFER_SIZE = 4096  
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100



def detect_pitch(data, rate):
    windowed_data = data * np.hamming(len(data))
    fft_data = np.abs(np.fft.rfft(windowed_data))
    freq = np.fft.rfftfreq(len(windowed_data), 1.0 / rate)
    pitch = freq[np.argmax(fft_data)]

    return pitch

fig, ax = plt.subplots()
xdata, ydata = [], []
ln, = plt.plot([], [], 'ro', animated=True)
plt.xlabel('Time')
plt.ylabel('Pitch (Hz)')
plt.title('Real-Time Pitch Detection')

def init():
    ax.set_xlim(0, 10)  
    ax.set_ylim(0, 500)  
    return ln,

p = pyaudio.PyAudio()
stream = None 

def update(frame):
    if source == "recorded":
        # Load audio file (replace with your file path)
        y, sr = librosa.load(file)

        # Assuming you want to process in chunks
        chunk_size = 1024  # Adjust chunk size as needed
        start_index = frame * chunk_size
        end_index = start_index + chunk_size

        if end_index > len(y):
            return ln,  # End of audio

        chunk = y[start_index:end_index]
        pitch = detect_pitch(chunk, sr)
    else:
        stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=BUFFER_SIZE)

        audio_data = np.frombuffer(stream.read(BUFFER_SIZE), dtype=np.int16)
        pitch = detect_pitch(audio_data, RATE)
    
    if pitch<=500 and pitch>=90:
        xdata.append(frame / 10)
        ydata.append(pitch)
        ln.set_data(xdata, ydata)

    if frame / 10 >= 10:
        ax.set_xlim(frame / 10 - 10, frame / 10)

    return ln,


ani = FuncAnimation(fig, update, frames=np.arange(0, 1000), init_func=init, blit=True)

print("Listening...")
plt.show()

stream.stop_stream()
print("STOPPED")
stream.close()
p.terminate()

pd.DataFrame({'timestamp':xdata, 'freq':ydata}).to_csv("test.csv", index = False)
