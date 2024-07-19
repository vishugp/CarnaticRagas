import pyaudio
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import pandas as pd

BUFFER_SIZE = 4096  
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
p = pyaudio.PyAudio()
stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=BUFFER_SIZE)

def detect_pitch(data, rate):
    windowed_data = data * np.hamming(len(data))
    fft_data = np.abs(np.fft.rfft(windowed_data))
    freq = np.fft.rfftfreq(len(windowed_data), 1.0 / rate)
    pitch = freq[np.argmax(fft_data)]

    return pitch

# Function to convert pitch (Hz) to musical note
def pitch_to_note(pitch):
    # Note frequencies for reference (A4 = 440 Hz)
    A4 = 440.0
    C0 = A4 * 2 ** (-4.75)

    if pitch == 0:
        return "No pitch detected"

    # Calculate the note number and corresponding octave
    h = round(12 * np.log2(pitch / C0))
    octave = h // 12
    n = h % 12

    # Note names
    note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    note = note_names[n] + str(octave)

    return note


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

def update(frame):
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
