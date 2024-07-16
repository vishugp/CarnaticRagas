import pyaudio
import numpy as np
import wave


CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100 

def generate_note(notes, duration):
  p = pyaudio.PyAudio()
  stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    output=True)
  for freq in notes:
    samples = [int(np.sin(2*np.pi*n*freq/RATE) * 32767) for n in range(int(RATE*duration))]
    packed_samples = wave.struct.pack('h'*len(samples), *samples)  # 'h' for signed short
    stream.write(packed_samples)
  stream.stop_stream()
  stream.close()

  p.terminate()

base = 260
freq_l = [1, 9/8, 81/64, 3/2, 27/16, 2]
freq_l = freq_l + [0] + freq_l[::-1]
generate_note([base*i for i in freq_l], 0.8)  


